import { patientDiagnosis } from "@/db/schemas";
import type { DiagnosisType } from "@/features/patients/types";
import { db } from "@/lib/better-auth/auth";
import { formatDateTime } from "@/lib/utils/format-date-time";
import { toSortValue } from "@/lib/utils/to-sort-value";
import { desc, eq } from "drizzle-orm";

function formatDate(value: Date | string | null) {
	if (!value) return "-";

	const date = value instanceof Date ? value : new Date(value);

	if (Number.isNaN(date.getTime())) {
		return value instanceof Date ? "-" : value;
	}

	return new Intl.DateTimeFormat("en-US", {
		month: "long",
		year: "numeric",
	}).format(date);
}

function normalizeStatus(value: string): DiagnosisType["status"] {
	return value === "Resolved" ? "Resolved" : "Active";
}

export async function getPatientDiagnoses(patientId: string): Promise<DiagnosisType[]> {
	const rows = await db
		.select({
			id: patientDiagnosis.id,
			name: patientDiagnosis.diagnosisName,
			onsetDate: patientDiagnosis.onsetDate,
			updatedAt: patientDiagnosis.updatedAt,
			status: patientDiagnosis.status,
			createdAt: patientDiagnosis.createdAt,
		})
		.from(patientDiagnosis)
		.where(eq(patientDiagnosis.patientId, patientId))
		.orderBy(desc(patientDiagnosis.createdAt));

	return rows.map((diagnosis) => ({
		name: diagnosis.name,
		onsetLabel: formatDate(diagnosis.onsetDate),
		onsetSortValue: toSortValue(diagnosis.onsetDate),
		lastReviewedLabel: formatDateTime(diagnosis.updatedAt),
		lastReviewedSortValue: toSortValue(diagnosis.updatedAt),
		diagnosisId: diagnosis.id,
		createdAtLabel: formatDateTime(diagnosis.createdAt),
		createdAtSortValue: toSortValue(diagnosis.createdAt),
		status: normalizeStatus(diagnosis.status),
	}));
}
