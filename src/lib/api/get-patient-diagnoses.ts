import { unstable_cache } from "next/cache";
import { patient, patientDiagnosis } from "@/db/schemas";
import type { DiagnosisType } from "@/features/patients/types";
import { db } from "@/lib/better-auth/auth";
import { formatDateTime } from "@/lib/utils/format-date-time";
import { toSortValue } from "@/lib/utils/to-sort-value";
import { and, count, desc, eq, ilike, or } from "drizzle-orm";
import { getOrganizationId } from "./get-organization-id";

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

export async function getPatientDiagnoses(
	patientId: string,
	page = 1,
	limit = 14,
	query = "",
): Promise<{ diagnoses: DiagnosisType[]; totalDiagnoses: number }> {
	const organizationId = await getOrganizationId();
	const offset = (page - 1) * limit;
	const normalizedQuery = query.trim();
	const searchPattern = `%${normalizedQuery}%`;

	if (!organizationId) return { diagnoses: [], totalDiagnoses: 0 };

	return unstable_cache(
		async () => {
			const [countRows, rows] = await Promise.all([
				db
					.select({ value: count() })
					.from(patientDiagnosis)
					.innerJoin(patient, eq(patientDiagnosis.patientId, patient.id))
					.where(
						and(
							eq(patientDiagnosis.patientId, patientId),
							eq(patient.organizationId, organizationId),
							or(
								ilike(patientDiagnosis.id, searchPattern),
								ilike(patientDiagnosis.diagnosisName, searchPattern),
								ilike(patientDiagnosis.status, searchPattern),
							),
						),
					),
				db
					.select({
						id: patientDiagnosis.id,
						name: patientDiagnosis.diagnosisName,
						onsetDate: patientDiagnosis.onsetDate,
						updatedAt: patientDiagnosis.updatedAt,
						status: patientDiagnosis.status,
						createdAt: patientDiagnosis.createdAt,
					})
					.from(patientDiagnosis)
					.innerJoin(patient, eq(patientDiagnosis.patientId, patient.id))
					.where(
						and(
							eq(patientDiagnosis.patientId, patientId),
							eq(patient.organizationId, organizationId),
							or(
								ilike(patientDiagnosis.id, searchPattern),
								ilike(patientDiagnosis.diagnosisName, searchPattern),
								ilike(patientDiagnosis.status, searchPattern),
							),
						),
					)
					.orderBy(desc(patientDiagnosis.createdAt))
					.limit(limit)
					.offset(offset),
			]);

			return {
				totalDiagnoses: countRows[0]?.value ?? 0,
				diagnoses: rows.map((diagnosis) => ({
					name: diagnosis.name,
					onsetLabel: formatDate(diagnosis.onsetDate),
					onsetSortValue: toSortValue(diagnosis.onsetDate),
					lastReviewedLabel: formatDateTime(diagnosis.updatedAt),
					lastReviewedSortValue: toSortValue(diagnosis.updatedAt),
					diagnosisId: diagnosis.id,
					createdAtLabel: formatDateTime(diagnosis.createdAt),
					createdAtSortValue: toSortValue(diagnosis.createdAt),
					status: normalizeStatus(diagnosis.status),
				})),
			};
		},
		[`patient-diagnoses-${organizationId}-${patientId}-${page}-${limit}-${normalizedQuery}`],
		{ tags: [`patient-diagnoses-${organizationId}-${patientId}`] },
	)();
}
