"use server";

import { and, eq, gte, lt } from "drizzle-orm";
import { updateTag } from "next/cache";
import { patient, patientEncounter } from "@/db/schemas";
import { getOrganizationId } from "@/lib/api/get-organization-id";
import { getPatientVitalsCacheTag } from "@/lib/api/get-patient-vitals";
import { getSessionData } from "@/lib/api/get-session-data";
import { db } from "@/lib/better-auth/auth";
import { patientEncounterSchema } from "./schemas";

type UpdatePatientEncounterResult =
	| { status: "success" }
	| { status: "failed" | "unauthorized"; error: string };

export async function updatePatientEncounterAction(
	encounterId: string,
	formData: FormData,
): Promise<UpdatePatientEncounterResult> {
	const session = await getSessionData();

	if (!session?.user?.id) {
		return { status: "unauthorized", error: "You must be signed in to edit encounters." };
	}

	if (!session.user.emailVerified) {
		return { status: "failed", error: "Verify your email before editing encounters." };
	}

	const organizationId = await getOrganizationId();

	if (!organizationId) {
		return {
			status: "failed",
			error: "Your hospital must be verified before you can edit encounters.",
		};
	}

	const parsedEncounter = patientEncounterSchema.safeParse({
		encounterType: formData.get("encounterType"),
		department: formData.get("department"),
		physician: formData.get("physician") ?? "",
		encounterDate: formData.get("encounterDate") ?? "",
		reason: formData.get("reason") ?? "",
	});

	if (!parsedEncounter.success) {
		return { status: "failed", error: parsedEncounter.error.issues[0].message };
	}

	const [currentEncounter] = await db
		.select({
			patientId: patientEncounter.patientId,
			encounterType: patientEncounter.encounterType,
			department: patientEncounter.department,
			physician: patientEncounter.physician,
			encounterDate: patientEncounter.encounterDate,
			reason: patientEncounter.reason,
			updatedAt: patientEncounter.updatedAt,
		})
		.from(patientEncounter)
		.innerJoin(patient, eq(patientEncounter.patientId, patient.id))
		.where(and(eq(patientEncounter.id, encounterId), eq(patient.organizationId, organizationId)))
		.limit(1);

	if (!currentEncounter) {
		return { status: "failed", error: "Encounter could not be found." };
	}

	const { patientId, updatedAt: lastSavedAt, ...previousEncounter } = currentEncounter;

	const staleRecordResult = {
		status: "failed" as const,
		error:
			"This encounter was changed after you opened it. Close it and open it again to see the latest version.",
	};
	if (lastSavedAt.toISOString() !== formData.get("updatedAt")) {
		return staleRecordResult;
	}
	const { reason, ...encounter } = parsedEncounter.data;
	const nextEncounter = { ...encounter, reason: reason || null };
	const hasChanges =
		nextEncounter.encounterType !== previousEncounter.encounterType ||
		nextEncounter.department !== previousEncounter.department ||
		nextEncounter.physician !== previousEncounter.physician ||
		nextEncounter.encounterDate.getTime() !== previousEncounter.encounterDate.getTime() ||
		nextEncounter.reason !== previousEncounter.reason;

	if (!hasChanges) {
		return { status: "success" };
	}

	const updatedBy = session.user.name || session.user.email;
	const updatedAt = new Date(Math.max(Date.now(), lastSavedAt.getTime() + 1));

	try {
		const [updatedEncounter] = await db
			.update(patientEncounter)
			.set({ ...nextEncounter, updatedBy, updatedAt })
			.where(
				and(
					eq(patientEncounter.id, encounterId),
					// The form's timestamp has millisecond precision; database defaults can include microseconds.
					gte(patientEncounter.updatedAt, lastSavedAt),
					lt(patientEncounter.updatedAt, new Date(lastSavedAt.getTime() + 1)),
				),
			)
			.returning({ id: patientEncounter.id });
		if (!updatedEncounter) return staleRecordResult;
	} catch (error) {
		console.error("Updating patient encounter failed:", error);
		return { status: "failed", error: "We couldn’t save these changes. Please try again." };
	}

	updateTag(`patient-encounter-${organizationId}-${patientId}-${encounterId}`);
	updateTag(`patient-encounters-${organizationId}-${patientId}`);
	updateTag(getPatientVitalsCacheTag(organizationId, patientId));

	return { status: "success" };
}
