import { cache } from "react";
import { cacheLife, cacheTag } from "next/cache";
import { patient, patientEncounter } from "@/db/schemas";
import type { EncounterType } from "@/features/patients/types";
import { db } from "@/lib/better-auth/auth";
import { formatDateTime } from "@/lib/utils/format-date-time";
import { toSortValue } from "@/lib/utils/to-sort-value";
import { and, count, desc, eq, ilike, or } from "drizzle-orm";
import { getOrganizationId } from "./get-organization-id";

function normalizeEncounterType(value: string): EncounterType["encounterType"] {
	if (
		value === "Emergency Visit" ||
		value === "Routine Checkup" ||
		value === "Follow-up Visit" ||
		value === "Outpatient Visit"
	) {
		return value;
	}

	return "Outpatient Visit";
}

export const getPatientEncounters = cache(async (
	patientId: string,
	page = 1,
	limit = 14,
	query = "",
): Promise<{ encounters: EncounterType[]; totalEncounters: number }> => {
	const organizationId = await getOrganizationId();

	if (!organizationId) return { encounters: [], totalEncounters: 0 };

	return getPatientEncountersForOrganization(patientId, organizationId, page, limit, query.trim());
});

export async function getPatientEncountersForOrganization(
	patientId: string,
	organizationId: string,
	page: number,
	limit: number,
	normalizedQuery: string,
): Promise<{ encounters: EncounterType[]; totalEncounters: number }> {
	"use cache";
	cacheLife("max");
	cacheTag(`patient-encounters-${organizationId}-${patientId}`);

	const offset = (page - 1) * limit;
	const searchPattern = `%${normalizedQuery}%`;

	const [countRows, rows] = await Promise.all([
		db
			.select({ value: count() })
			.from(patientEncounter)
			.innerJoin(patient, eq(patientEncounter.patientId, patient.id))
			.where(
				and(
					eq(patientEncounter.patientId, patientId),
					eq(patient.organizationId, organizationId),
					or(
						ilike(patientEncounter.id, searchPattern),
						ilike(patientEncounter.encounterType, searchPattern),
						ilike(patientEncounter.department, searchPattern),
						ilike(patientEncounter.physician, searchPattern),
					),
				),
			),
		db
			.select({
				patientId: patientEncounter.patientId,
				encounterId: patientEncounter.id,
				encounterType: patientEncounter.encounterType,
				department: patientEncounter.department,
				physician: patientEncounter.physician,
				encounterDate: patientEncounter.encounterDate,
				createdAt: patientEncounter.createdAt,
				updatedAt: patientEncounter.updatedAt,
				createdBy: patientEncounter.createdBy,
				updatedBy: patientEncounter.updatedBy,
			})
			.from(patientEncounter)
			.innerJoin(patient, eq(patientEncounter.patientId, patient.id))
			.where(
				and(
					eq(patientEncounter.patientId, patientId),
					eq(patient.organizationId, organizationId),
					or(
						ilike(patientEncounter.id, searchPattern),
						ilike(patientEncounter.encounterType, searchPattern),
						ilike(patientEncounter.department, searchPattern),
						ilike(patientEncounter.physician, searchPattern),
					),
				),
			)
			.orderBy(desc(patientEncounter.encounterDate))
			.limit(limit)
			.offset(offset),
	]);

	return {
		totalEncounters: countRows[0]?.value ?? 0,
		encounters: rows.map((encounter) => ({
			patientId: encounter.patientId,
			encounterId: encounter.encounterId,
			encounterType: normalizeEncounterType(encounter.encounterType),
			department: encounter.department,
			physician: encounter.physician,
			createdBy: encounter.createdBy,
			updatedBy: encounter.updatedBy,
			encounterDateLabel: formatDateTime(encounter.encounterDate),
			encounterDateSortValue: toSortValue(encounter.encounterDate),
			createdAtLabel: formatDateTime(encounter.createdAt),
			createdAtSortValue: toSortValue(encounter.createdAt),
			updatedAtLabel: formatDateTime(encounter.updatedAt),
			updatedAtSortValue: toSortValue(encounter.updatedAt),
		})),
	};
}
