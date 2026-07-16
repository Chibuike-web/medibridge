import { cache } from "react";
import { cacheLife, cacheTag } from "next/cache";
import { patient, patientImmunization } from "@/db/schemas";
import type { ImmunizationStatusFilter, ImmunizationType } from "@/features/patients/types";
import { db } from "@/lib/better-auth/auth";
import { formatDateTime } from "@/lib/utils/format-date-time";
import { parseDateParam } from "@/lib/utils/parse-date-param";
import { toSortValue } from "@/lib/utils/to-sort-value";
import { and, count, desc, eq, gte, ilike, inArray, lte, or } from "drizzle-orm";
import { endOfDay, startOfDay } from "date-fns";
import { getOrganizationId } from "./get-organization-id";

type ImmunizationDateFilters = {
	createdFrom?: string;
	createdTo?: string;
};

function normalizeStatus(value: string): ImmunizationType["status"] {
	const normalizedValue = value.toLowerCase();

	if (normalizedValue === "completed") {
		return "Completed";
	}

	if (normalizedValue === "cancelled") {
		return "Cancelled";
	}

	if (normalizedValue === "discontinued") {
		return "Discontinued";
	}

	return "Active";
}

export const getPatientImmunizations = cache(async (
	patientId: string,
	page = 1,
	limit = 14,
	query = "",
	dateFilters: ImmunizationDateFilters = {},
	statusFilters: ImmunizationStatusFilter[] = [],
): Promise<{ immunizations: ImmunizationType[]; totalImmunizations: number }> => {
	const organizationId = await getOrganizationId();

	if (!organizationId) return { immunizations: [], totalImmunizations: 0 };

	return getPatientImmunizationsForOrganization(
		patientId,
		organizationId,
		page,
		limit,
		query.trim(),
		dateFilters,
		statusFilters,
	);
});

export async function getPatientImmunizationsForOrganization(
	patientId: string,
	organizationId: string,
	page: number,
	limit: number,
	normalizedQuery: string,
	dateFilters: ImmunizationDateFilters,
	statusFilters: ImmunizationStatusFilter[],
): Promise<{ immunizations: ImmunizationType[]; totalImmunizations: number }> {
	"use cache";
	cacheLife("max");
	cacheTag(`patient-immunizations-${organizationId}-${patientId}`);

	const offset = (page - 1) * limit;
	const searchPattern = `%${normalizedQuery}%`;
	const createdFromDate = parseDateParam(dateFilters.createdFrom ?? "");
	const createdToDate = parseDateParam(dateFilters.createdTo ?? "");
	const databaseStatusFilters = statusFilters.map(toTitleCase);
	const immunizationFilter = and(
		eq(patientImmunization.patientId, patientId),
		eq(patient.organizationId, organizationId),
		createdFromDate ? gte(patientImmunization.createdAt, startOfDay(createdFromDate)) : undefined,
		createdToDate ? lte(patientImmunization.createdAt, endOfDay(createdToDate)) : undefined,
		databaseStatusFilters.length > 0
			? inArray(patientImmunization.status, databaseStatusFilters)
			: undefined,
		or(
			ilike(patientImmunization.vaccineName, searchPattern),
			ilike(patientImmunization.id, searchPattern),
			ilike(patientImmunization.encounterId, searchPattern),
			ilike(patientImmunization.status, searchPattern),
		),
	);

	const [countRows, rows] = await Promise.all([
		db
			.select({ value: count() })
			.from(patientImmunization)
			.innerJoin(patient, eq(patientImmunization.patientId, patient.id))
			.where(immunizationFilter),
		db
			.select({
				vaccineName: patientImmunization.vaccineName,
				immunizationId: patientImmunization.id,
				currentDose: patientImmunization.currentDose,
				createdAt: patientImmunization.createdAt,
				status: patientImmunization.status,
			})
			.from(patientImmunization)
			.innerJoin(patient, eq(patientImmunization.patientId, patient.id))
			.where(immunizationFilter)
			.orderBy(desc(patientImmunization.createdAt))
			.limit(limit)
			.offset(offset),
	]);

	return {
		totalImmunizations: countRows[0]?.value ?? 0,
		immunizations: rows.map((immunization) => ({
			vaccineName: immunization.vaccineName,
			immunizationId: immunization.immunizationId,
			dose: immunization.currentDose ?? "-",
			createdAtLabel: formatDateTime(immunization.createdAt),
			createdAtSortValue: toSortValue(immunization.createdAt),
			status: normalizeStatus(immunization.status),
		})),
	};
}

function toTitleCase(value: string) {
	return value.charAt(0).toUpperCase() + value.slice(1);
}
