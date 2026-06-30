import { cache } from "react";
import { cacheLife, cacheTag } from "next/cache";
import { patient, patientMedication } from "@/db/schemas";
import type { MedicationStatusFilter, MedicationType } from "@/features/patients/types";
import { db } from "@/lib/better-auth/auth";
import { formatDateTime } from "@/lib/utils/format-date-time";
import { toSortValue } from "@/lib/utils/to-sort-value";
import { and, count, desc, eq, gte, ilike, inArray, lte, or } from "drizzle-orm";
import { getOrganizationId } from "./get-organization-id";

type MedicationDateFilters = {
	createdFrom?: string;
	createdTo?: string;
};

function normalizeStatus(value: string): MedicationType["status"] {
	const normalizedValue = value.toLowerCase();

	if (normalizedValue === "completed") {
		return "Completed";
	}

	if (normalizedValue === "discontinued") {
		return "Discontinued";
	}

	return "Active";
}

export const getPatientMedications = cache(async (
	patientId: string,
	page = 1,
	limit = 14,
	query = "",
	dateFilters: MedicationDateFilters = {},
	statusFilters: MedicationStatusFilter[] = [],
): Promise<{ medications: MedicationType[]; totalMedications: number }> => {
	const organizationId = await getOrganizationId();

	if (!organizationId) return { medications: [], totalMedications: 0 };

	return getPatientMedicationsForOrganization(
		patientId,
		organizationId,
		page,
		limit,
		query.trim(),
		dateFilters,
		statusFilters,
	);
});

export async function getPatientMedicationsForOrganization(
	patientId: string,
	organizationId: string,
	page: number,
	limit: number,
	normalizedQuery: string,
	dateFilters: MedicationDateFilters,
	statusFilters: MedicationStatusFilter[],
): Promise<{ medications: MedicationType[]; totalMedications: number }> {
	"use cache";
	cacheLife("max");
	cacheTag(`patient-medications-${organizationId}-${patientId}`);

	const offset = (page - 1) * limit;
	const searchPattern = `%${normalizedQuery}%`;
	const createdFromDate = parseDateFilter(dateFilters.createdFrom);
	const createdToDate = parseDateFilter(dateFilters.createdTo);
	const databaseStatusFilters = statusFilters.map((statusFilter) => statusFilter.toLowerCase());
	const filters = and(
		eq(patientMedication.patientId, patientId),
		eq(patient.organizationId, organizationId),
		createdFromDate ? gte(patientMedication.createdAt, startOfDay(createdFromDate)) : undefined,
		createdToDate ? lte(patientMedication.createdAt, endOfDay(createdToDate)) : undefined,
		databaseStatusFilters.length > 0
			? inArray(patientMedication.status, databaseStatusFilters)
			: undefined,
		or(
			ilike(patientMedication.medicationName, searchPattern),
			ilike(patientMedication.id, searchPattern),
			ilike(patientMedication.dose, searchPattern),
			ilike(patientMedication.route, searchPattern),
			ilike(patientMedication.indication, searchPattern),
			ilike(patientMedication.status, searchPattern),
		),
	);

	const [countRows, rows] = await Promise.all([
		db
			.select({ value: count() })
			.from(patientMedication)
			.innerJoin(patient, eq(patientMedication.patientId, patient.id))
			.where(filters),
		db
			.select({
				medication: patientMedication.medicationName,
				dose: patientMedication.dose,
				route: patientMedication.route,
				medicationId: patientMedication.id,
				indication: patientMedication.indication,
				createdAt: patientMedication.createdAt,
				status: patientMedication.status,
			})
			.from(patientMedication)
			.innerJoin(patient, eq(patientMedication.patientId, patient.id))
			.where(filters)
			.orderBy(desc(patientMedication.createdAt))
			.limit(limit)
			.offset(offset),
	]);

	return {
		totalMedications: countRows[0]?.value ?? 0,
		medications: rows.map((medication) => ({
			medication: medication.medication,
			dose: medication.dose ?? "-",
			route: medication.route ?? "-",
			medicationId: medication.medicationId,
			indication: medication.indication ?? "-",
			createdAtLabel: formatDateTime(medication.createdAt),
			createdAtSortValue: toSortValue(medication.createdAt),
			status: normalizeStatus(medication.status),
		})),
	};
}

function parseDateFilter(value: string | undefined) {
	if (!value) return null;

	const date = new Date(value);
	return Number.isNaN(date.getTime()) ? null : date;
}

function startOfDay(date: Date) {
	const nextDate = new Date(date);
	nextDate.setHours(0, 0, 0, 0);
	return nextDate;
}

function endOfDay(date: Date) {
	const nextDate = new Date(date);
	nextDate.setHours(23, 59, 59, 999);
	return nextDate;
}
