import { unstable_cache } from "next/cache";
import { patient, patientImmunization } from "@/db/schemas";
import type { ImmunizationType } from "@/features/patients/types";
import { db } from "@/lib/better-auth/auth";
import { formatDateTime } from "@/lib/utils/format-date-time";
import { toSortValue } from "@/lib/utils/to-sort-value";
import { and, desc, eq } from "drizzle-orm";
import { getOrganizationId } from "./get-organization-id";

function normalizeStatus(value: string): ImmunizationType["status"] {
	const normalizedValue = value.toLowerCase();

	if (normalizedValue === "completed") {
		return "Completed";
	}

	if (normalizedValue === "discontinued") {
		return "Discontinued";
	}

	return "Active";
}

export async function getPatientImmunizations(
	patientId: string,
): Promise<ImmunizationType[]> {
	const organizationId = await getOrganizationId();

	if (!organizationId) return [];

	return unstable_cache(
		async () => {
			const rows = await db
				.select({
					vaccineName: patientImmunization.vaccineName,
					immunizationId: patientImmunization.immunizationId,
					currentDose: patientImmunization.currentDose,
					createdAt: patientImmunization.createdAt,
					status: patientImmunization.status,
				})
				.from(patientImmunization)
				.innerJoin(patient, eq(patientImmunization.patientId, patient.id))
				.where(
					and(
						eq(patientImmunization.patientId, patientId),
						eq(patient.organizationId, organizationId),
					),
				)
				.orderBy(desc(patientImmunization.createdAt));

			return rows.map((immunization) => ({
				vaccineName: immunization.vaccineName,
				immunizationId: immunization.immunizationId,
				dose: immunization.currentDose ?? "-",
				createdAtLabel: formatDateTime(immunization.createdAt),
				createdAtSortValue: toSortValue(immunization.createdAt),
				status: normalizeStatus(immunization.status),
			}));
		},
		[`patient-immunizations-${organizationId}-${patientId}`],
		{ tags: [`patient-immunizations-${organizationId}-${patientId}`] },
	)();
}
