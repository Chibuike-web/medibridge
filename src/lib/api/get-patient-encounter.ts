import { patientEncounter } from "@/db/schemas";
import { db } from "@/lib/better-auth/auth";
import { formatDateTime } from "@/lib/utils/format-date-time";
import { toSortValue } from "@/lib/utils/to-sort-value";
import { and, eq } from "drizzle-orm";

export async function getPatientEncounter(patientId: string, encounterId: string) {
	const [encounter] = await db
		.select({
			patientId: patientEncounter.patientId,
			encounterId: patientEncounter.encounterId,
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
		.where(
			and(eq(patientEncounter.patientId, patientId), eq(patientEncounter.encounterId, encounterId)),
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
