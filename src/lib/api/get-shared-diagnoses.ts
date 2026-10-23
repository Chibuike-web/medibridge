import "server-only";

import { and, eq, inArray } from "drizzle-orm";
import { patientDiagnosis } from "@/db/schemas";
import { db } from "@/lib/better-auth/auth";
import { formatDate } from "@/lib/utils/format-date";
import { getSharedRecord } from "./get-shared-record";

function toDateFilterValue(value: string | null) {
	if (!value) return "";
	const date = new Date(value);
	return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

function activeOrResolved(value: string): "Active" | "Resolved" {
	return value.toLowerCase() === "active" ? "Active" : "Resolved";
}

export async function getSharedDiagnoses(accessId: string) {
	const sharedRecord = await getSharedRecord(accessId);
	if (!sharedRecord) return [];

	const diagnosisIds = sharedRecord.selectedRecordIds
		.filter((record) => record.section === "diagnoses")
		.map((record) => record.recordId);
	const diagnoses = await db
		.select()
		.from(patientDiagnosis)
		.where(
			and(
				eq(patientDiagnosis.patientId, sharedRecord.patientId),
				inArray(patientDiagnosis.id, diagnosisIds),
			),
		);

	return diagnoses.map((record) => ({
		name: record.diagnosisName,
		diagnosedAt: record.diagnosedAt || "-",
		diagnosedAtValue: toDateFilterValue(record.diagnosedAt),
		lastReviewed: record.lastReviewedAt || "-",
		lastReviewedValue: toDateFilterValue(record.lastReviewedAt),
		diagnosisId: record.id,
		createdAt: formatDate(record.createdAt.toISOString()),
		createdAtValue: record.createdAt.toISOString(),
		status: activeOrResolved(record.status),
	}));
}
