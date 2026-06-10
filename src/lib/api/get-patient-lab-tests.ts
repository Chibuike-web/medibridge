import { unstable_cache } from "next/cache";
import { patient, patientLabTest } from "@/db/schemas";
import type { LabTestType } from "@/features/patients/types";
import { db } from "@/lib/better-auth/auth";
import { formatDateTime } from "@/lib/utils/format-date-time";
import { toSortValue } from "@/lib/utils/to-sort-value";
import { and, count, desc, eq, ilike, or } from "drizzle-orm";
import { getOrganizationId } from "./get-organization-id";

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

function formatTestName(testName: string, result: string | null) {
	return result ? `${testName} - ${result}` : testName;
}

export async function getPatientLabTests(
	patientId: string,
	page = 1,
	limit = 14,
	query = "",
): Promise<{ labTests: LabTestType[]; totalLabTests: number }> {
	const organizationId = await getOrganizationId();
	const offset = (page - 1) * limit;
	const normalizedQuery = query.trim();
	const searchPattern = `%${normalizedQuery}%`;

	if (!organizationId) return { labTests: [], totalLabTests: 0 };

	return unstable_cache(
		async () => {
			const [countRows, rows] = await Promise.all([
				db
					.select({ value: count() })
					.from(patientLabTest)
					.innerJoin(patient, eq(patientLabTest.patientId, patient.id))
					.where(
						and(
							or(eq(patient.id, patientId), eq(patient.patientId, patientId)),
							eq(patient.organizationId, organizationId),
							or(
								ilike(patientLabTest.testName, searchPattern),
								ilike(patientLabTest.result, searchPattern),
								ilike(patientLabTest.labId, searchPattern),
								ilike(patientLabTest.referenceRange, searchPattern),
								ilike(patientLabTest.interpretation, searchPattern),
								ilike(patientLabTest.status, searchPattern),
							),
						),
					),
				db
					.select({
						testName: patientLabTest.testName,
						result: patientLabTest.result,
						labId: patientLabTest.labId,
						referenceRange: patientLabTest.referenceRange,
						interpretation: patientLabTest.interpretation,
						createdAt: patientLabTest.createdAt,
						status: patientLabTest.status,
					})
					.from(patientLabTest)
					.innerJoin(patient, eq(patientLabTest.patientId, patient.id))
					.where(
						and(
							or(eq(patient.id, patientId), eq(patient.patientId, patientId)),
							eq(patient.organizationId, organizationId),
							or(
								ilike(patientLabTest.testName, searchPattern),
								ilike(patientLabTest.result, searchPattern),
								ilike(patientLabTest.labId, searchPattern),
								ilike(patientLabTest.referenceRange, searchPattern),
								ilike(patientLabTest.interpretation, searchPattern),
								ilike(patientLabTest.status, searchPattern),
							),
						),
					)
					.orderBy(desc(patientLabTest.createdAt))
					.limit(limit)
					.offset(offset),
			]);

			return {
				totalLabTests: countRows[0]?.value ?? 0,
				labTests: rows.map((labTest) => ({
					test: formatTestName(labTest.testName, labTest.result),
					labId: labTest.labId,
					referenceRange: labTest.referenceRange ?? "-",
					interpretation: labTest.interpretation ?? "-",
					createdAtLabel: formatDateTime(labTest.createdAt),
					createdAtSortValue: toSortValue(labTest.createdAt),
					status: normalizeStatus(labTest.status),
				})),
			};
		},
		[`patient-lab-tests-${organizationId}-${patientId}-${page}-${limit}-${normalizedQuery}`],
		{ tags: [`patient-lab-tests-${organizationId}-${patientId}`] },
	)();
}
