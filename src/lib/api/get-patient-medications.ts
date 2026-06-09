import { unstable_cache } from "next/cache";
import { patient, patientMedication } from "@/db/schemas";
import type { MedicationType } from "@/features/patients/types";
import { db } from "@/lib/better-auth/auth";
import { formatDateTime } from "@/lib/utils/format-date-time";
import { toSortValue } from "@/lib/utils/to-sort-value";
import { and, desc, eq } from "drizzle-orm";
import { getOrganizationId } from "./get-organization-id";

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
	const organizationId = await getOrganizationId();

	if (!organizationId) return [];

	return unstable_cache(
		async () => {
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
				.innerJoin(patient, eq(patientMedication.patientId, patient.id))
				.where(
					and(
						eq(patientMedication.patientId, patientId),
						eq(patient.organizationId, organizationId),
					),
				)
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
		},
		[`patient-medications-${organizationId}-${patientId}`],
		{ tags: [`patient-medications-${organizationId}-${patientId}`] },
	)();
}
