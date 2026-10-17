"use server";

import { and, eq } from "drizzle-orm";
import { updateTag } from "next/cache";
import { patient, patientEncounter } from "@/db/schemas";
import { getOrganizationId } from "@/lib/api/get-organization-id";
import { getSessionData } from "@/lib/api/get-session-data";
import { db } from "@/lib/better-auth/auth";
import { patientEncounterSchema } from "./schemas";

type CreatePatientEncounterResult =
	| { status: "success"; encounterId: string }
	| { status: "failed" | "unauthorized"; error: string };

export async function createPatientEncounterAction(
	patientId: string,
	formData: FormData,
): Promise<CreatePatientEncounterResult> {
	const session = await getSessionData();

	if (!session?.user?.id) {
		return { status: "unauthorized", error: "You must be signed in to create encounters." };
	}

	if (!session.user.emailVerified) {
		return { status: "failed", error: "Verify your email before creating encounters." };
	}

	const organizationId = await getOrganizationId();

	if (!organizationId) {
		return {
			status: "failed",
			error: "Your hospital must be verified before you can create encounters.",
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

	const [patientRow] = await db
		.select({ id: patient.id })
		.from(patient)
		.where(and(eq(patient.id, patientId), eq(patient.organizationId, organizationId)))
		.limit(1);

	if (!patientRow) {
		return { status: "failed", error: "Patient could not be found." };
	}

	const createdBy = session.user.name || session.user.email;
	const encounterId = `ENC-${crypto.randomUUID()}`;
	const { reason, ...encounter } = parsedEncounter.data;

	try {
		await db.insert(patientEncounter).values({
			id: encounterId,
			patientId,
			...encounter,
			reason: reason || null,
			createdBy,
			updatedBy: createdBy,
		});
	} catch (error) {
		console.error("Creating patient encounter failed:", error);
		return { status: "failed", error: "We couldn’t create this encounter. Please try again." };
	}

	updateTag(`patient-encounters-${organizationId}-${patientId}`);
	updateTag(`overview-stats-${organizationId}`);

	return { status: "success", encounterId };
}
