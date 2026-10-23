import "server-only";

import { and, eq, inArray } from "drizzle-orm";
import { patientLabTest } from "@/db/schemas";
import { db } from "@/lib/better-auth/auth";
import { formatDate } from "@/lib/utils/format-date";
import { getSharedRecord } from "./get-shared-record";

function labTestStatus(value: string): "Pending" | "Completed" | "Cancelled" {
	if (value.toLowerCase() === "completed") return "Completed";
	if (value.toLowerCase() === "cancelled") return "Cancelled";
	return "Pending";
}

export async function getSharedLabTests(accessId: string) {
	const sharedRecord = await getSharedRecord(accessId);
	if (!sharedRecord) return [];

	const labTestIds = sharedRecord.selectedRecordIds
		.filter((record) => record.section === "lab-tests")
		.map((record) => record.recordId);
	const labTests = await db
		.select()
		.from(patientLabTest)
		.where(
			and(
				eq(patientLabTest.patientId, sharedRecord.patientId),
				inArray(patientLabTest.id, labTestIds),
			),
		);

	return labTests.map((record) => ({
		test: record.testName,
		result: record.result || "-",
		labId: record.id,
		referenceRange: record.referenceRange || "-",
		interpretation: (record.flag ?? record.interpretation) || "-",
		createdAt: formatDate(record.createdAt.toISOString()),
		createdAtValue: record.createdAt.toISOString(),
		status: labTestStatus(record.status),
	}));
}
