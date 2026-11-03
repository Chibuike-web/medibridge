import "server-only";

import { and, desc, eq } from "drizzle-orm";
import { patientLabTest, patientLabTestFile, patientLabTestHistory } from "@/db/schemas";
import type { LabTestDetailsHistoryEvent, LabTestType } from "@/features/patients/types";
import { db } from "@/lib/better-auth/auth";
import { formatDateTime } from "@/lib/utils/format-date-time";
import { toSortValue } from "@/lib/utils/to-sort-value";
import { getSharedRecord } from "./get-shared-record";

function normalizeStatus(value: string): LabTestType["status"] {
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
): LabTestDetailsHistoryEvent[] {
	return historyRows.reduce<LabTestDetailsHistoryEvent[]>((events, row) => {
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
				timestamp: formatDateTime(row.createdAt),
				items: [item],
			});
		}

		return events;
	}, []);
}

export async function getSharedLabTestDetails(
	accessId: string,
	labTestId: string,
): Promise<LabTestType | null> {
	const sharedRecord = await getSharedRecord(accessId);
	if (!sharedRecord) return null;

	const isSharedLabTest = sharedRecord.selectedRecordIds.some(
		(record) => record.section === "lab-tests" && record.recordId === labTestId,
	);
	if (!isSharedLabTest) return null;

	const [labTest] = await db
		.select()
		.from(patientLabTest)
		.where(
			and(eq(patientLabTest.id, labTestId), eq(patientLabTest.patientId, sharedRecord.patientId)),
		);
	if (!labTest) return null;

	const [historyRows, files] = await Promise.all([
		db
			.select()
			.from(patientLabTestHistory)
			.where(eq(patientLabTestHistory.labTestId, labTest.id))
			.orderBy(desc(patientLabTestHistory.createdAt)),
		db.select().from(patientLabTestFile).where(eq(patientLabTestFile.parentRecordId, labTest.id)),
	]);

	return {
		test: labTest.result ? `${labTest.testName} - ${labTest.result}` : labTest.testName,
		testName: labTest.testName,
		labId: labTest.id,
		encounterId: labTest.encounterId,
		result: labTest.result ?? "",
		specimen: labTest.specimen ?? "",
		referenceRange: labTest.referenceRange ?? "",
		interpretation: labTest.interpretation ?? "",
		flag: labTest.flag ?? "",
		orderedAtValue: labTest.orderedAt?.toISOString() ?? "",
		orderedAtLabel: labTest.orderedAt
			? new Intl.DateTimeFormat("en-US", { dateStyle: "long", timeZone: "UTC" }).format(
					labTest.orderedAt,
				)
			: "-",
		orderedAtSortValue: toSortValue(labTest.orderedAt),
		orderedBy: labTest.orderedBy ?? "",
		createdAtLabel: formatDateTime(labTest.createdAt),
		createdAtSortValue: toSortValue(labTest.createdAt),
		updatedAtLabel: formatDateTime(labTest.updatedAt),
		updatedAtValue: labTest.updatedAt.toISOString(),
		updatedAtSortValue: toSortValue(labTest.updatedAt),
		createdBy: labTest.createdBy ?? "",
		updatedBy: labTest.updatedBy ?? "",
		status: normalizeStatus(labTest.status),
		clinicalNote: labTest.clinicalNote ?? "",
		files: files.map((file) => ({
			id: file.id,
			name: file.name,
			url: `/api/shared-record-files/${accessId}/lab/${file.id}`,
			type: file.type ?? "",
			size: file.size ?? "",
			uploadedAtLabel: formatDateTime(file.uploadedAt),
		})),
		history: groupHistoryEvents(historyRows),
	};
}
