import { cache } from "react";
import { cacheLife, cacheTag } from "next/cache";
import { patient, patientProcedure } from "@/db/schemas";
import type { ProcedureType } from "@/features/patients/types";
import { db } from "@/lib/better-auth/auth";
import { formatDateTime } from "@/lib/utils/format-date-time";
import { toSortValue } from "@/lib/utils/to-sort-value";
import { and, count, desc, eq, ilike, or } from "drizzle-orm";
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
): Promise<{ procedures: ProcedureType[]; totalProcedures: number }> => {
	const organizationId = await getOrganizationId();

	if (!organizationId) return { procedures: [], totalProcedures: 0 };

	return getPatientProceduresForOrganization(patientId, organizationId, page, limit, query.trim());
});

export async function getPatientProceduresForOrganization(
	patientId: string,
	organizationId: string,
	page: number,
	limit: number,
	normalizedQuery: string,
): Promise<{ procedures: ProcedureType[]; totalProcedures: number }> {
	"use cache";
	cacheLife("max");
	cacheTag(`patient-procedures-${organizationId}-${patientId}`);

	const offset = (page - 1) * limit;
	const searchPattern = `%${normalizedQuery}%`;

	const [countRows, rows] = await Promise.all([
		db
			.select({ value: count() })
			.from(patientProcedure)
			.innerJoin(patient, eq(patientProcedure.patientId, patient.id))
			.where(
				and(
					eq(patientProcedure.patientId, patientId),
					eq(patient.organizationId, organizationId),
					or(
						ilike(patientProcedure.procedureName, searchPattern),
						ilike(patientProcedure.id, searchPattern),
						ilike(patientProcedure.indication, searchPattern),
						ilike(patientProcedure.facility, searchPattern),
						ilike(patientProcedure.status, searchPattern),
					),
				),
			),
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
			.where(
				and(
					eq(patientProcedure.patientId, patientId),
					eq(patient.organizationId, organizationId),
					or(
						ilike(patientProcedure.procedureName, searchPattern),
						ilike(patientProcedure.id, searchPattern),
						ilike(patientProcedure.indication, searchPattern),
						ilike(patientProcedure.facility, searchPattern),
						ilike(patientProcedure.status, searchPattern),
					),
				),
			)
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
