import "server-only";

import { and, eq, inArray } from "drizzle-orm";
import { patientImaging } from "@/db/schemas";
import { db } from "@/lib/better-auth/auth";
import { formatDate } from "@/lib/utils/format-date";
import { getSharedRecord } from "./get-shared-record";

function imagingModality(value: string): "CT" | "MRI" | "Ultrasound" | "X-ray" {
	const normalizedValue = value.toLowerCase();
	if (normalizedValue === "ct") return "CT";
	if (normalizedValue === "mri") return "MRI";
	if (normalizedValue === "ultrasound") return "Ultrasound";
	return "X-ray";
}

function imagingStatus(value: string): "Pending" | "Completed" | "Cancelled" {
	if (value.toLowerCase() === "completed") return "Completed";
	if (value.toLowerCase() === "cancelled") return "Cancelled";
	return "Pending";
}

export async function getSharedImaging(accessId: string) {
	const sharedRecord = await getSharedRecord(accessId);
	if (!sharedRecord) return [];

	const imagingIds = sharedRecord.selectedRecordIds
		.filter((record) => record.section === "imaging")
		.map((record) => record.recordId);
	const imaging = await db
		.select()
		.from(patientImaging)
		.where(
			and(
				eq(patientImaging.patientId, sharedRecord.patientId),
				inArray(patientImaging.id, imagingIds),
			),
		);

	return imaging.map((record) => ({
		study: record.study,
		modality: imagingModality(record.modality),
		region: record.region,
		impression: record.impression || "-",
		orderedAt: record.orderedAt ? formatDate(record.orderedAt.toISOString()) : "-",
		orderedAtValue: record.orderedAt?.toISOString() ?? "",
		createdAt: formatDate(record.createdAt.toISOString()),
		createdAtValue: record.createdAt.toISOString(),
		imagingId: record.id,
		status: imagingStatus(record.status),
	}));
}
