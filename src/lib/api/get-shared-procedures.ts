import "server-only";

import { and, eq, inArray } from "drizzle-orm";
import { patientProcedure } from "@/db/schemas";
import { db } from "@/lib/better-auth/auth";
import { formatDate } from "@/lib/utils/format-date";
import { getSharedRecord } from "./get-shared-record";

function procedureStatus(value: string): "Pending" | "Completed" | "Cancelled" {
	if (value.toLowerCase() === "completed") return "Completed";
	if (value.toLowerCase() === "cancelled") return "Cancelled";
	return "Pending";
}

export async function getSharedProcedures(accessId: string) {
	const sharedRecord = await getSharedRecord(accessId);
	if (!sharedRecord) return [];

	const procedureIds = sharedRecord.selectedRecordIds
		.filter((record) => record.section === "procedures")
		.map((record) => record.recordId);
	const procedures = await db
		.select()
		.from(patientProcedure)
		.where(
			and(
				eq(patientProcedure.patientId, sharedRecord.patientId),
				inArray(patientProcedure.id, procedureIds),
			),
		);

	return procedures.map((record) => ({
		procedure: record.procedureName,
		indication: record.indication || "-",
		facility: (record.facility ?? record.plannedFacility) || "-",
		procedureId: record.id,
		createdAt: formatDate(record.createdAt.toISOString()),
		createdAtValue: record.createdAt.toISOString(),
		status: procedureStatus(record.status),
	}));
}
