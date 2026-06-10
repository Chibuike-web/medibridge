import { patient, patientLabTest } from "@/db/schemas";
import type { LabTestType } from "@/features/patients/types";
import { db } from "@/lib/better-auth/auth";
import { formatDateTime } from "@/lib/utils/format-date-time";
import { toSortValue } from "@/lib/utils/to-sort-value";
import { and, desc, eq, or } from "drizzle-orm";
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

export async function getPatientLabTests(patientId: string): Promise<LabTestType[]> {
	const organizationId = await getOrganizationId();

	if (!organizationId) return [];

	const rows = await db
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
			),
		)
		.orderBy(desc(patientLabTest.createdAt));

	return rows.map((labTest) => ({
		test: formatTestName(labTest.testName, labTest.result),
		labId: labTest.labId,
		referenceRange: labTest.referenceRange ?? "-",
		interpretation: labTest.interpretation ?? "-",
		createdAtLabel: formatDateTime(labTest.createdAt),
		createdAtSortValue: toSortValue(labTest.createdAt),
		status: normalizeStatus(labTest.status),
	}));
}
