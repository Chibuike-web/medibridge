import "server-only";

import { and, desc, eq } from "drizzle-orm";
import { patientImaging, patientImagingFile, patientImagingHistory } from "@/db/schemas";
import type { ImagingDetailsHistoryEvent, ImagingType } from "@/features/patients/types";
import { db } from "@/lib/better-auth/auth";
import { formatDate } from "@/lib/utils/format-date";
import { toSortValue } from "@/lib/utils/to-sort-value";
import { getSharedRecord } from "./get-shared-record";

function normalizeModality(value: string): ImagingType["modality"] {
	const normalizedValue = value.toLowerCase();

	if (normalizedValue === "mri") {
		return "MRI";
	}

	if (normalizedValue === "ultrasound") {
		return "Ultrasound";
	}

	if (normalizedValue === "x-ray" || normalizedValue === "xray") {
		return "X-ray";
	}

	return "CT";
}

function normalizeStatus(value: string): ImagingType["status"] {
	const normalizedValue = value.toLowerCase();

	if (normalizedValue === "completed") {
		return "Completed";
	}

	if (normalizedValue === "cancelled") {
		return "Cancelled";
	}

	return "Pending";
}

function groupHistoryEvents(
	historyRows: {
		fieldName: string;
		oldValue: string | null;
		newValue: string | null;
		updatedBy: string | null;
		createdAt: Date;
	}[],
): ImagingDetailsHistoryEvent[] {
	return historyRows.reduce<ImagingDetailsHistoryEvent[]>((events, row) => {
		const id = `${row.updatedBy}-${row.createdAt.getTime()}`;
		const item = {
			label: row.fieldName.charAt(0).toUpperCase() + row.fieldName.slice(1).replaceAll("_", " "),
			previousValue: row.oldValue?.trim() ?? "",
			value: row.newValue?.trim() ?? "",
		};
		const event = events.find((historyEvent) => historyEvent.id === id);

		if (event) {
			event.items.push(item);
		} else {
			events.push({
				id,
				title: "Updated",
				actor: row.updatedBy || "-",
				timestamp: formatDate(row.createdAt.toISOString()),
				items: [item],
			});
		}

		return events;
	}, []);
}

export async function getSharedImagingDetails(
	accessId: string,
	imagingId: string,
): Promise<ImagingType | null> {
	const sharedRecord = await getSharedRecord(accessId);
	if (!sharedRecord) return null;

	const isSharedImaging = sharedRecord.selectedRecordIds.some(
		(record) => record.section === "imaging" && record.recordId === imagingId,
	);
	if (!isSharedImaging) return null;

	const [imaging] = await db
		.select()
		.from(patientImaging)
		.where(
			and(eq(patientImaging.id, imagingId), eq(patientImaging.patientId, sharedRecord.patientId)),
		);
	if (!imaging) return null;

	const [historyRows, files] = await Promise.all([
		db
			.select()
			.from(patientImagingHistory)
			.where(eq(patientImagingHistory.imagingId, imaging.id))
			.orderBy(desc(patientImagingHistory.createdAt)),
		db.select().from(patientImagingFile).where(eq(patientImagingFile.parentRecordId, imaging.id)),
	]);

	return {
		study: imaging.study,
		imagingId: imaging.id,
		encounterId: imaging.encounterId ?? "",
		modality: normalizeModality(imaging.modality),
		region: imaging.region,
		impression: imaging.impression ?? "",
		orderedAtLabel: imaging.orderedAt
			? new Intl.DateTimeFormat("en-US", { dateStyle: "long", timeZone: "UTC" }).format(
					imaging.orderedAt,
				)
			: "-",
		orderedAtValue: imaging.orderedAt ? imaging.orderedAt.toISOString() : "",
		orderedAtSortValue: toSortValue(imaging.orderedAt),
		orderedBy: imaging.orderedBy ?? "",
		reportedBy: imaging.reportedBy ?? imaging.orderedBy ?? "-",
		status: normalizeStatus(imaging.status),
		clinicalNote: imaging.clinicalNote ?? "",
		files: files.map((file) => ({
			id: file.id,
			name: file.name,
			type: file.type ?? "",
			url: `/api/shared-record-files/${accessId}/imaging/${file.id}`,
			size: file.size ?? "",
			uploadedAtLabel: formatDate(file.uploadedAt.toISOString()),
		})),
		createdBy: imaging.createdBy ?? imaging.orderedBy ?? "-",
		updatedBy: imaging.updatedBy ?? imaging.reportedBy ?? imaging.orderedBy ?? "-",
		createdAtLabel: formatDate(imaging.createdAt.toISOString()),
		updatedAtLabel: formatDate(imaging.updatedAt.toISOString()),
		updatedAtValue: imaging.updatedAt.toISOString(),
		history: groupHistoryEvents(historyRows),
	};
}
