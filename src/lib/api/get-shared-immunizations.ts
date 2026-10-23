import "server-only";

import { and, eq, inArray } from "drizzle-orm";
import { patientImmunization } from "@/db/schemas";
import { db } from "@/lib/better-auth/auth";
import { formatDate } from "@/lib/utils/format-date";
import { getSharedRecord } from "./get-shared-record";

function immunizationStatus(value: string): "Active" | "Completed" | "Cancelled" | "Discontinued" {
	if (value.toLowerCase() === "completed") return "Completed";
	if (value.toLowerCase() === "cancelled") return "Cancelled";
	if (value.toLowerCase() === "discontinued") return "Discontinued";
	return "Active";
}

export async function getSharedImmunizations(accessId: string) {
	const sharedRecord = await getSharedRecord(accessId);
	if (!sharedRecord) return [];

	const immunizationIds = sharedRecord.selectedRecordIds
		.filter((record) => record.section === "immunizations")
		.map((record) => record.recordId);
	const immunizations = await db
		.select()
		.from(patientImmunization)
		.where(
			and(
				eq(patientImmunization.patientId, sharedRecord.patientId),
				inArray(patientImmunization.id, immunizationIds),
			),
		);

	return immunizations.map((record) => ({
		vaccineName: record.vaccineName,
		dose: record.currentDose || "-",
		immunizationId: record.id,
		createdAt: formatDate(record.createdAt.toISOString()),
		createdAtValue: record.createdAt.toISOString(),
		status: immunizationStatus(record.status),
	}));
}
