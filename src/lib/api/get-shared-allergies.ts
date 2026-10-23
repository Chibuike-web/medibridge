import "server-only";

import { and, eq, inArray } from "drizzle-orm";
import { patientAllergy } from "@/db/schemas";
import { db } from "@/lib/better-auth/auth";
import { formatDate } from "@/lib/utils/format-date";
import { getSharedRecord } from "./get-shared-record";

function activeOrInactive(value: string): "Active" | "Inactive" {
	return value.toLowerCase() === "active" ? "Active" : "Inactive";
}

function allergySeverity(value: string): "Mild" | "Moderate" | "Severe" {
	if (value.toLowerCase() === "severe") return "Severe";
	if (value.toLowerCase() === "moderate") return "Moderate";
	return "Mild";
}

export async function getSharedAllergies(accessId: string) {
	const sharedRecord = await getSharedRecord(accessId);
	if (!sharedRecord) return [];

	const allergyIds = sharedRecord.selectedRecordIds
		.filter((record) => record.section === "allergies")
		.map((record) => record.recordId);
	const allergies = await db
		.select()
		.from(patientAllergy)
		.where(
			and(
				eq(patientAllergy.patientId, sharedRecord.patientId),
				inArray(patientAllergy.id, allergyIds),
			),
		);

	return allergies.map((record) => ({
		allergen: record.allergen,
		allergyId: record.id,
		reaction: record.reaction,
		createdAt: formatDate(record.createdAt.toISOString()),
		createdAtValue: record.createdAt.toISOString(),
		severity: allergySeverity(record.severity),
		status: activeOrInactive(record.status),
	}));
}
