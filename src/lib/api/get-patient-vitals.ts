import { cache } from "react";
import { cacheLife, cacheTag } from "next/cache";
import { and, count, desc, eq, gte, ilike, lte, or } from "drizzle-orm";
import { endOfDay, startOfDay } from "date-fns";
import { patient, patientEncounter, patientVital } from "@/db/schemas";
import type { VitalType } from "@/features/patients/types";
import { db } from "@/lib/better-auth/auth";
import { parseDateParam } from "@/lib/utils/parse-date-param";
import { getOrganizationId } from "./get-organization-id";

type VitalDateFilters = {
	recordedFrom?: string;
	recordedTo?: string;
	createdFrom?: string;
	createdTo?: string;
};

export function getPatientVitalsCacheTag(organizationId: string, patientId: string) {
	return `patient-vitals-${organizationId}-${patientId}`;
}

function normalizeEncounterType(encounterType: string): VitalType["encounterType"] {
	if (
		encounterType === "Emergency Visit" ||
		encounterType === "Routine Checkup" ||
		encounterType === "Follow-up Visit" ||
		encounterType === "Outpatient Visit"
	) {
		return encounterType;
	}

	return "Outpatient Visit";
}

export function toVitalType(
	row: typeof patientVital.$inferSelect,
	encounterType: string,
): VitalType {
	return {
		vitalId: row.id,
		encounterId: row.encounterId,
		encounterType: normalizeEncounterType(encounterType),
		createdBy: row.createdBy,
		recordedAt: row.recordedAt.getTime(),
		createdAt: row.createdAt.getTime(),
		systolic: row.systolic,
		diastolic: row.diastolic,
		heartRate: row.heartRate,
		respiratoryRate: row.respiratoryRate,
		temperature: row.temperature,
		oxygenSaturation: row.oxygenSaturation,
		weight: row.weight,
		bmi: row.bmi,
		notes: row.notes,
	};
}

export const getPatientVitals = cache(
	async (
		patientId: string,
		page = 1,
		limit = 14,
		query = "",
		dateFilters: VitalDateFilters = {},
	): Promise<{ vitals: VitalType[]; totalVitals: number }> => {
		const organizationId = await getOrganizationId();

		if (!organizationId) return { vitals: [], totalVitals: 0 };

		return getPatientVitalsForOrganization(
			patientId,
			organizationId,
			page,
			limit,
			query.trim(),
			dateFilters,
		);
	},
);

export async function getPatientVitalsForOrganization(
	patientId: string,
	organizationId: string,
	page: number,
	limit: number,
	normalizedQuery: string,
	dateFilters: VitalDateFilters,
): Promise<{ vitals: VitalType[]; totalVitals: number }> {
	"use cache";
	cacheLife("max");
	cacheTag(getPatientVitalsCacheTag(organizationId, patientId));

	const offset = (page - 1) * limit;
	const searchPattern = `%${normalizedQuery}%`;
	const recordedFromDate = parseDateParam(dateFilters.recordedFrom ?? "");
	const recordedToDate = parseDateParam(dateFilters.recordedTo ?? "");
	const createdFromDate = parseDateParam(dateFilters.createdFrom ?? "");
	const createdToDate = parseDateParam(dateFilters.createdTo ?? "");

	const vitalFilter = and(
		eq(patientVital.patientId, patientId),
		eq(patient.organizationId, organizationId),
		recordedFromDate ? gte(patientVital.recordedAt, startOfDay(recordedFromDate)) : undefined,
		recordedToDate ? lte(patientVital.recordedAt, endOfDay(recordedToDate)) : undefined,
		createdFromDate ? gte(patientVital.createdAt, startOfDay(createdFromDate)) : undefined,
		createdToDate ? lte(patientVital.createdAt, endOfDay(createdToDate)) : undefined,
		normalizedQuery
			? or(ilike(patientVital.id, searchPattern), ilike(patientVital.notes, searchPattern))
			: undefined,
	);
	const [countRows, rows] = await Promise.all([
		db
			.select({ value: count() })
			.from(patientVital)
			.innerJoin(patient, eq(patientVital.patientId, patient.id))
			.innerJoin(patientEncounter, eq(patientVital.encounterId, patientEncounter.id))
			.where(vitalFilter),
		db
			.select({ vital: patientVital, encounterType: patientEncounter.encounterType })
			.from(patientVital)
			.innerJoin(patient, eq(patientVital.patientId, patient.id))
			.innerJoin(patientEncounter, eq(patientVital.encounterId, patientEncounter.id))
			.where(vitalFilter)
			.orderBy(desc(patientVital.recordedAt), desc(patientVital.id))
			.limit(limit)
			.offset(offset),
	]);

	return {
		totalVitals: countRows[0]?.value ?? 0,
		vitals: rows.map(({ vital, encounterType }) => toVitalType(vital, encounterType)),
	};
}

export const getPatientVitalReadings = cache(async (patientId: string): Promise<VitalType[]> => {
	const organizationId = await getOrganizationId();

	if (!organizationId) return [];

	return getPatientVitalReadingsForOrganization(patientId, organizationId);
});

export async function getPatientVitalReadingsForOrganization(
	patientId: string,
	organizationId: string,
): Promise<VitalType[]> {
	"use cache";
	cacheLife("max");
	cacheTag(getPatientVitalsCacheTag(organizationId, patientId));

	const rows = await db
		.select({ vital: patientVital, encounterType: patientEncounter.encounterType })
		.from(patientVital)
		.innerJoin(patient, eq(patientVital.patientId, patient.id))
		.innerJoin(patientEncounter, eq(patientVital.encounterId, patientEncounter.id))
		.where(and(eq(patientVital.patientId, patientId), eq(patient.organizationId, organizationId)))
		.orderBy(desc(patientVital.recordedAt), desc(patientVital.id));

	return rows.map(({ vital, encounterType }) => toVitalType(vital, encounterType));
}
