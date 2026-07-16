import { cache } from "react";
import { cacheLife, cacheTag } from "next/cache";
import { patient, patientAllergy } from "@/db/schemas";
import type {
	AllergySeverityFilter,
	AllergyStatusFilter,
	AllergyType,
} from "@/features/patients/types";
import { db } from "@/lib/better-auth/auth";
import { formatDateTime } from "@/lib/utils/format-date-time";
import { parseDateParam } from "@/lib/utils/parse-date-param";
import { toSortValue } from "@/lib/utils/to-sort-value";
import { and, count, desc, eq, gte, ilike, inArray, lte, or } from "drizzle-orm";
import { endOfDay, startOfDay } from "date-fns";
import { getOrganizationId } from "./get-organization-id";

type AllergyDateFilters = {
	createdFrom?: string;
	createdTo?: string;
};

function normalizeSeverity(value: string): AllergyType["severity"] {
	if (value === "Mild" || value === "Moderate" || value === "Severe") {
		return value;
	}

	return "Mild";
}

function normalizeStatus(value: string): AllergyType["status"] {
	return value === "Inactive" ? "Inactive" : "Active";
}

export const getPatientAllergies = cache(async (
	patientId: string,
	page = 1,
	limit = 14,
	query = "",
	dateFilters: AllergyDateFilters = {},
	statusFilters: AllergyStatusFilter[] = [],
	severityFilters: AllergySeverityFilter[] = [],
): Promise<{ allergies: AllergyType[]; totalAllergies: number }> => {
	const organizationId = await getOrganizationId();

	if (!organizationId) return { allergies: [], totalAllergies: 0 };

	return getPatientAllergiesForOrganization(
		patientId,
		organizationId,
		page,
		limit,
		query.trim(),
		dateFilters,
		statusFilters,
		severityFilters,
	);
});

export async function getPatientAllergiesForOrganization(
	patientId: string,
	organizationId: string,
	page: number,
	limit: number,
	normalizedQuery: string,
	dateFilters: AllergyDateFilters,
	statusFilters: AllergyStatusFilter[],
	severityFilters: AllergySeverityFilter[],
): Promise<{ allergies: AllergyType[]; totalAllergies: number }> {
	"use cache";
	cacheLife("max");
	cacheTag(`patient-allergies-${organizationId}-${patientId}`);

	const offset = (page - 1) * limit;
	const searchPattern = `%${normalizedQuery}%`;
	const createdFromDate = parseDateParam(dateFilters.createdFrom ?? "");
	const createdToDate = parseDateParam(dateFilters.createdTo ?? "");
	const databaseSeverityFilters = severityFilters.map(toTitleCase);
	const databaseStatusFilters = statusFilters.map(toTitleCase);

	const allergyFilter = and(
		eq(patientAllergy.patientId, patientId),
		eq(patient.organizationId, organizationId),
		createdFromDate ? gte(patientAllergy.createdAt, startOfDay(createdFromDate)) : undefined,
		createdToDate ? lte(patientAllergy.createdAt, endOfDay(createdToDate)) : undefined,
		databaseStatusFilters.length > 0
			? inArray(patientAllergy.status, databaseStatusFilters)
			: undefined,
		databaseSeverityFilters.length > 0
			? inArray(patientAllergy.severity, databaseSeverityFilters)
			: undefined,
		or(
			ilike(patientAllergy.allergen, searchPattern),
			ilike(patientAllergy.id, searchPattern),
			ilike(patientAllergy.encounterId, searchPattern),
			ilike(patientAllergy.reaction, searchPattern),
			ilike(patientAllergy.severity, searchPattern),
			ilike(patientAllergy.status, searchPattern),
		),
	);
	const [countRows, rows] = await Promise.all([
		db
			.select({ value: count() })
			.from(patientAllergy)
			.innerJoin(patient, eq(patientAllergy.patientId, patient.id))
			.where(allergyFilter),
		db
			.select({
				allergen: patientAllergy.allergen,
				allergyId: patientAllergy.id,
				reaction: patientAllergy.reaction,
				createdAt: patientAllergy.createdAt,
				severity: patientAllergy.severity,
				status: patientAllergy.status,
			})
			.from(patientAllergy)
			.innerJoin(patient, eq(patientAllergy.patientId, patient.id))
			.where(allergyFilter)
			.orderBy(desc(patientAllergy.createdAt))
			.limit(limit)
			.offset(offset),
	]);

	return {
		totalAllergies: countRows[0]?.value ?? 0,
		allergies: rows.map((allergy) => ({
			allergen: allergy.allergen,
			allergyId: allergy.allergyId,
			reaction: allergy.reaction,
			createdAtLabel: formatDateTime(allergy.createdAt),
			createdAtSortValue: toSortValue(allergy.createdAt),
			severity: normalizeSeverity(allergy.severity),
			status: normalizeStatus(allergy.status),
		})),
	};
}

function toTitleCase(value: string) {
	return value.charAt(0).toUpperCase() + value.slice(1);
}
