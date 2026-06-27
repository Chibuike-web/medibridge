import { cache } from "react";
import { cacheLife, cacheTag } from "next/cache";
import { patient, patientEncounter } from "@/db/schemas";
import { db } from "@/lib/better-auth/auth";
import { formatDateTime } from "@/lib/utils/format-date-time";
import { toSortValue } from "@/lib/utils/to-sort-value";
import { and, eq } from "drizzle-orm";
import { getOrganizationId } from "./get-organization-id";

export const getPatientEncounter = cache(async (patientId: string, encounterId: string) => {
	const organizationId = await getOrganizationId();

	if (!organizationId) return null;

	return getPatientEncounterForOrganization(patientId, encounterId, organizationId);
});

export async function getPatientEncounterForOrganization(
	patientId: string,
	encounterId: string,
	organizationId: string,
) {
	"use cache";
	cacheLife("max");
	cacheTag(`patient-encounter-${organizationId}-${patientId}-${encounterId}`);

	const [encounter] = await db
		.select({
			patientId: patientEncounter.patientId,
			encounterId: patientEncounter.id,
			encounterType: patientEncounter.encounterType,
			department: patientEncounter.department,
			physician: patientEncounter.physician,
			encounterDate: patientEncounter.encounterDate,
			createdAt: patientEncounter.createdAt,
			updatedAt: patientEncounter.updatedAt,
			createdBy: patientEncounter.createdBy,
			updatedBy: patientEncounter.updatedBy,
		})
		.from(patientEncounter)
		.innerJoin(patient, eq(patientEncounter.patientId, patient.id))
		.where(
			and(
				eq(patientEncounter.patientId, patientId),
				eq(patientEncounter.id, encounterId),
				eq(patient.organizationId, organizationId),
			),
		)
		.limit(1);

	if (!encounter) return null;

	return {
		...encounter,
		encounterDateLabel: formatDateTime(encounter.encounterDate),
		encounterDateSortValue: toSortValue(encounter.encounterDate),
		createdAtLabel: formatDateTime(encounter.createdAt),
		createdAtSortValue: toSortValue(encounter.createdAt),
		updatedAtLabel: formatDateTime(encounter.updatedAt),
		updatedAtSortValue: toSortValue(encounter.updatedAt),
	};
}
