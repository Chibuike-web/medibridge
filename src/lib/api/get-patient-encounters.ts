import { cache } from "react";
import { cacheLife, cacheTag } from "next/cache";
import { patient, patientEncounter } from "@/db/schemas";
import type {
	EncounterDepartmentFilter,
	EncounterType,
	EncounterTypeFilter,
} from "@/features/patients/types";
import { db } from "@/lib/better-auth/auth";
import { formatDateTime } from "@/lib/utils/format-date-time";
import { parseDateParam } from "@/lib/utils/parse-date-param";
import { toSortValue } from "@/lib/utils/to-sort-value";
import { and, count, desc, eq, gte, ilike, inArray, lte, or } from "drizzle-orm";
import { endOfDay, startOfDay } from "date-fns";
import { getOrganizationId } from "./get-organization-id";

type EncounterDateFilters = {
	encounterFrom?: string;
	encounterTo?: string;
	createdFrom?: string;
	createdTo?: string;
};

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

function toDatabaseEncounterTypeFilter(encounterTypeFilter: EncounterTypeFilter) {
	if (encounterTypeFilter === "emergency-visit") return "Emergency Visit";
	if (encounterTypeFilter === "routine-checkup") return "Routine Checkup";
	if (encounterTypeFilter === "follow-up-visit") return "Follow-up Visit";
	return "Outpatient Visit";
}

function toDatabaseEncounterDepartmentFilter(departmentFilter: EncounterDepartmentFilter) {
	if (departmentFilter === "emergency-medicine") return "Emergency Medicine";
	if (departmentFilter === "general-medicine") return "General Medicine";
	if (departmentFilter === "cardiology") return "Cardiology";
	if (departmentFilter === "endocrinology") return "Endocrinology";
	if (departmentFilter === "family-medicine") return "Family Medicine";
	return "Nephrology";
}

export const getPatientEncounters = cache(async (
	patientId: string,
	page = 1,
	limit = 14,
	query = "",
	dateFilters: EncounterDateFilters = {},
	encounterTypeFilters: EncounterTypeFilter[] = [],
	departmentFilters: EncounterDepartmentFilter[] = [],
): Promise<{ encounters: EncounterType[]; totalEncounters: number }> => {
	const organizationId = await getOrganizationId();

	if (!organizationId) return { encounters: [], totalEncounters: 0 };

	return getPatientEncountersForOrganization(
		patientId,
		organizationId,
		page,
		limit,
		query.trim(),
		dateFilters,
		encounterTypeFilters,
		departmentFilters,
	);
});

export async function getPatientEncountersForOrganization(
	patientId: string,
	organizationId: string,
	page: number,
	limit: number,
	normalizedQuery: string,
	dateFilters: EncounterDateFilters,
	encounterTypeFilters: EncounterTypeFilter[],
	departmentFilters: EncounterDepartmentFilter[],
): Promise<{ encounters: EncounterType[]; totalEncounters: number }> {
	"use cache";
	cacheLife("max");
	cacheTag(`patient-encounters-${organizationId}-${patientId}`);

	const offset = (page - 1) * limit;
	const searchPattern = `%${normalizedQuery}%`;
	const encounterFromDate = parseDateParam(dateFilters.encounterFrom ?? "");
	const encounterToDate = parseDateParam(dateFilters.encounterTo ?? "");
	const createdFromDate = parseDateParam(dateFilters.createdFrom ?? "");
	const createdToDate = parseDateParam(dateFilters.createdTo ?? "");
	const databaseEncounterTypeFilters = encounterTypeFilters.map(toDatabaseEncounterTypeFilter);
	const databaseDepartmentFilters = departmentFilters.map(toDatabaseEncounterDepartmentFilter);
	const encounterFilter = and(
		eq(patientEncounter.patientId, patientId),
		eq(patient.organizationId, organizationId),
		encounterFromDate
			? gte(patientEncounter.encounterDate, startOfDay(encounterFromDate))
			: undefined,
		encounterToDate ? lte(patientEncounter.encounterDate, endOfDay(encounterToDate)) : undefined,
		createdFromDate ? gte(patientEncounter.createdAt, startOfDay(createdFromDate)) : undefined,
		createdToDate ? lte(patientEncounter.createdAt, endOfDay(createdToDate)) : undefined,
		databaseEncounterTypeFilters.length > 0
			? inArray(patientEncounter.encounterType, databaseEncounterTypeFilters)
			: undefined,
		databaseDepartmentFilters.length > 0
			? inArray(patientEncounter.department, databaseDepartmentFilters)
			: undefined,
		or(
			ilike(patientEncounter.id, searchPattern),
			ilike(patientEncounter.encounterType, searchPattern),
			ilike(patientEncounter.department, searchPattern),
			ilike(patientEncounter.physician, searchPattern),
		),
	);

	const [countRows, rows] = await Promise.all([
		db
			.select({ value: count() })
			.from(patientEncounter)
			.innerJoin(patient, eq(patientEncounter.patientId, patient.id))
			.where(encounterFilter),
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
			.where(encounterFilter)
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
