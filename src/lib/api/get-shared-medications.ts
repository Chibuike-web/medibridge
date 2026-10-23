import "server-only";

import { and, eq, inArray } from "drizzle-orm";
import { patientMedication } from "@/db/schemas";
import { db } from "@/lib/better-auth/auth";
import { formatDate } from "@/lib/utils/format-date";
import { getSharedRecord } from "./get-shared-record";

function medicationStatus(value: string): "Active" | "Completed" | "Discontinued" {
	if (value.toLowerCase() === "completed") return "Completed";
	if (value.toLowerCase() === "discontinued") return "Discontinued";
	return "Active";
}

export async function getSharedMedications(accessId: string) {
	const sharedRecord = await getSharedRecord(accessId);
	if (!sharedRecord) return [];

	const medicationIds = sharedRecord.selectedRecordIds
		.filter((record) => record.section === "medications")
		.map((record) => record.recordId);
	const medications = await db
		.select()
		.from(patientMedication)
		.where(
			and(
				eq(patientMedication.patientId, sharedRecord.patientId),
				inArray(patientMedication.id, medicationIds),
			),
		);

	return medications.map((record) => ({
		medication: record.medicationName,
		dose: record.dose || "-",
		frequency: record.frequency || "-",
		duration: record.duration || "-",
		route: record.route || "-",
		indication: record.indication || "-",
		medicationId: record.id,
		createdAt: formatDate(record.createdAt.toISOString()),
		createdAtValue: record.createdAt.toISOString(),
		status: medicationStatus(record.status),
	}));
}
