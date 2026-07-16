import { cache } from "react";
import { cacheLife, cacheTag } from "next/cache";
import { patient, patientProcedure } from "@/db/schemas";
import type { ProcedureStatusFilter, ProcedureType } from "@/features/patients/types";
import { db } from "@/lib/better-auth/auth";
import { formatDateTime } from "@/lib/utils/format-date-time";
import { parseDateParam } from "@/lib/utils/parse-date-param";
import { toSortValue } from "@/lib/utils/to-sort-value";
import { endOfDay, startOfDay } from "date-fns";
import { and, count, desc, eq, gte, ilike, inArray, lte, or } from "drizzle-orm";
import { getOrganizationId } from "./get-organization-id";

function normalizeStatus(value: string): ProcedureType["status"] {
	const normalizedValue = value.toLowerCase();

	if (normalizedValue === "completed") {
		return "Completed";
	}

	if (normalizedValue === "cancelled") {
		return "Cancelled";
	}

	return "Pending";
}

export const getPatientProcedures = cache(async (
	patientId: string,
	page = 1,
	limit = 14,
	query = "",
	createdAtFilter: { createdFrom?: string; createdTo?: string } = {},
	statusFilters: ProcedureStatusFilter[] = [],
): Promise<{ procedures: ProcedureType[]; totalProcedures: number }> => {
	const organizationId = await getOrganizationId();

	if (!organizationId) return { procedures: [], totalProcedures: 0 };

	return getPatientProceduresForOrganization(
		patientId,
		organizationId,
		page,
		limit,
		query.trim(),
		createdAtFilter,
		statusFilters,
	);
});

export async function getPatientProceduresForOrganization(
	patientId: string,
	organizationId: string,
	page: number,
	limit: number,
	normalizedQuery: string,
	createdAtFilter: { createdFrom?: string; createdTo?: string },
	statusFilters: ProcedureStatusFilter[],
): Promise<{ procedures: ProcedureType[]; totalProcedures: number }> {
	"use cache";
	cacheLife("max");
	cacheTag(`patient-procedures-${organizationId}-${patientId}`);

	const offset = (page - 1) * limit;
	const searchPattern = `%${normalizedQuery}%`;
	const createdFromDate = parseDateParam(createdAtFilter.createdFrom ?? "");
	const createdToDate = parseDateParam(createdAtFilter.createdTo ?? "");
	const createdAtConditions = [
		createdFromDate ? gte(patientProcedure.createdAt, startOfDay(createdFromDate)) : undefined,
		createdToDate ? lte(patientProcedure.createdAt, endOfDay(createdToDate)) : undefined,
	].filter((condition) => condition !== undefined);
	const procedureFilter = and(
		eq(patientProcedure.patientId, patientId),
		eq(patient.organizationId, organizationId),
		...createdAtConditions,
		...(statusFilters.length > 0 ? [inArray(patientProcedure.status, statusFilters)] : []),
		or(
			ilike(patientProcedure.procedureName, searchPattern),
			ilike(patientProcedure.id, searchPattern),
			ilike(patientProcedure.encounterId, searchPattern),
			ilike(patientProcedure.indication, searchPattern),
			ilike(patientProcedure.facility, searchPattern),
			ilike(patientProcedure.status, searchPattern),
		),
	);

	const [countRows, rows] = await Promise.all([
		db
			.select({ value: count() })
			.from(patientProcedure)
			.innerJoin(patient, eq(patientProcedure.patientId, patient.id))
			.where(procedureFilter),
		db
			.select({
				procedure: patientProcedure.procedureName,
				procedureId: patientProcedure.id,
				createdAt: patientProcedure.createdAt,
				indication: patientProcedure.indication,
				facility: patientProcedure.facility,
				status: patientProcedure.status,
			})
			.from(patientProcedure)
			.innerJoin(patient, eq(patientProcedure.patientId, patient.id))
			.where(procedureFilter)
			.orderBy(desc(patientProcedure.createdAt))
			.limit(limit)
			.offset(offset),
	]);

	return {
		totalProcedures: countRows[0]?.value ?? 0,
		procedures: rows.map((procedure) => ({
			procedure: procedure.procedure,
			procedureId: procedure.procedureId,
			createdAtLabel: formatDateTime(procedure.createdAt),
			createdAtSortValue: toSortValue(procedure.createdAt),
			indication: procedure.indication ?? "-",
			facility: procedure.facility ?? "-",
			status: normalizeStatus(procedure.status),
		})),
	};
}
