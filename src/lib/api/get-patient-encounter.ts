import { patientEncounter } from "@/db/schemas";
import { db } from "@/lib/better-auth/auth";
import { and, eq } from "drizzle-orm";

function formatDateTime(date: Date) {
	return new Intl.DateTimeFormat("en-US", {
		day: "numeric",
		month: "long",
		year: "numeric",
		hour: "numeric",
		minute: "2-digit",
	}).format(date);
}

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
		encounterDateSortValue: encounter.encounterDate.toISOString(),
		createdAtLabel: formatDateTime(encounter.createdAt),
		createdAtSortValue: encounter.createdAt.toISOString(),
		updatedAtLabel: formatDateTime(encounter.updatedAt),
		updatedAtSortValue: encounter.updatedAt.toISOString(),
	};
}
