import { patientMedication } from "@/db/schemas";
import type { MedicationType } from "@/features/patients/types";
import { db } from "@/lib/better-auth/auth";
import { formatDateTime } from "@/lib/utils/format-date-time";
import { toSortValue } from "@/lib/utils/to-sort-value";
import { desc, eq } from "drizzle-orm";

function normalizeStatus(value: string): MedicationType["status"] {
	const normalizedValue = value.toLowerCase();

	if (normalizedValue === "completed") {
		return "Completed";
	}

	if (normalizedValue === "discontinued") {
		return "Discontinued";
	}

	return "Active";
}

export async function getPatientMedications(patientId: string): Promise<MedicationType[]> {
	const rows = await db
		.select({
			medication: patientMedication.medicationName,
			dose: patientMedication.dose,
			route: patientMedication.route,
			medicationId: patientMedication.medicationId,
			indication: patientMedication.indication,
			createdAt: patientMedication.createdAt,
			status: patientMedication.status,
		})
		.from(patientMedication)
		.where(eq(patientMedication.patientId, patientId))
		.orderBy(desc(patientMedication.createdAt));

	return rows.map((medication) => ({
		medication: medication.medication,
		dose: medication.dose ?? "-",
		route: medication.route ?? "-",
		medicationId: medication.medicationId,
		indication: medication.indication ?? "-",
		createdAtLabel: formatDateTime(medication.createdAt),
		createdAtSortValue: toSortValue(medication.createdAt),
		status: normalizeStatus(medication.status),
	}));
}
