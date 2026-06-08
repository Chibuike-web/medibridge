import { patientEncounter } from "@/db/schemas";
import type { EncounterType } from "@/features/patients/types";
import { db } from "@/lib/better-auth/auth";
import { formatDateTime } from "@/lib/utils/format-date-time";
import { toSortValue } from "@/lib/utils/to-sort-value";
import { desc, eq } from "drizzle-orm";

function normalizeEncounterType(value: string): EncounterType["encounterType"] {
	if (
		value === "Emergency Visit" ||
		value === "Routine Checkup" ||
		value === "Follow-up Visit" ||
		value === "Outpatient Visit"
	) {
		return value;
	}

	return "Outpatient Visit";
}

export async function getPatientEncounters(
	patientId: string,
): Promise<EncounterType[]> {
	const rows = await db
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
		.where(eq(patientEncounter.patientId, patientId))
		.orderBy(desc(patientEncounter.encounterDate));

	return rows.map((encounter) => ({
		patientId: encounter.patientId,
		encounterId: encounter.encounterId,
		encounterType: normalizeEncounterType(encounter.encounterType),
		department: encounter.department,
		physician: encounter.physician,
		createdBy: encounter.createdBy,
		updatedBy: encounter.updatedBy,
		encounterDateLabel: formatDateTime(encounter.encounterDate),
		encounterDateSortValue: toSortValue(encounter.encounterDate),
		createdAtLabel: formatDateTime(encounter.createdAt),
		createdAtSortValue: toSortValue(encounter.createdAt),
		updatedAtLabel: formatDateTime(encounter.updatedAt),
		updatedAtSortValue: toSortValue(encounter.updatedAt),
	}));
}
