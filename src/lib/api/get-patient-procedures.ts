import { unstable_cache } from "next/cache";
import { patient, patientProcedure } from "@/db/schemas";
import type { ProcedureType } from "@/features/patients/types";
import { db } from "@/lib/better-auth/auth";
import { formatDateTime } from "@/lib/utils/format-date-time";
import { toSortValue } from "@/lib/utils/to-sort-value";
import { and, desc, eq } from "drizzle-orm";
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

export async function getPatientProcedures(patientId: string): Promise<ProcedureType[]> {
	const organizationId = await getOrganizationId();

	if (!organizationId) return [];

	return unstable_cache(
		async () => {
			const rows = await db
				.select({
					procedure: patientProcedure.procedureName,
					procedureId: patientProcedure.procedureId,
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
					),
				)
				.orderBy(desc(patientProcedure.createdAt));

			return rows.map((procedure) => ({
				procedure: procedure.procedure,
				procedureId: procedure.procedureId,
				createdAtLabel: formatDateTime(procedure.createdAt),
				createdAtSortValue: toSortValue(procedure.createdAt),
				indication: procedure.indication ?? "-",
				facility: procedure.facility ?? "-",
				status: normalizeStatus(procedure.status),
			}));
		},
		[`patient-procedures-${organizationId}-${patientId}`],
		{ tags: [`patient-procedures-${organizationId}-${patientId}`] },
	)();
}
