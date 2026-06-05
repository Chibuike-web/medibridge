import { patientEncounter } from "@/db/schemas";
import type { EncounterType } from "@/features/patients/types";
import { db } from "@/lib/better-auth/auth";
import { desc, eq } from "drizzle-orm";

function formatDateTime(date: Date) {
	return new Intl.DateTimeFormat("en-US", {
		day: "numeric",
		month: "long",
		year: "numeric",
		hour: "numeric",
		minute: "2-digit",
	}).format(date);
}

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
		encounterDateSortValue: encounter.encounterDate.toISOString(),
		createdAtLabel: formatDateTime(encounter.createdAt),
		createdAtSortValue: encounter.createdAt.toISOString(),
		updatedAtLabel: formatDateTime(encounter.updatedAt),
		updatedAtSortValue: encounter.updatedAt.toISOString(),
	}));
}
