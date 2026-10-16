"use server";

import { and, eq } from "drizzle-orm";
import { updateTag } from "next/cache";
import { patient, patientEncounter, patientMedication } from "@/db/schemas";
import { getOrganizationId } from "@/lib/api/get-organization-id";
import { getSessionData } from "@/lib/api/get-session-data";
import { db } from "@/lib/better-auth/auth";
import { patientMedicationSchema } from "./schemas";

type CreatePatientMedicationResult =
	| { status: "success"; medicationId: string }
	| { status: "failed" | "unauthorized"; error: string };

export async function createPatientMedicationAction(
	patientId: string,
	formData: FormData,
): Promise<CreatePatientMedicationResult> {
	const session = await getSessionData();

	if (!session?.user?.id) {
		return { status: "unauthorized", error: "You must be signed in to add medications." };
	}

	if (!session.user.emailVerified) {
		return { status: "failed", error: "Verify your email before adding medications." };
	}

	const organizationId = await getOrganizationId();

	if (!organizationId) {
		return {
			status: "failed",
			error: "Your hospital must be verified before you can add medications.",
		};
	}

	const parsedMedication = patientMedicationSchema.safeParse({
		medicationName: formData.get("medicationName") ?? "",
		indication: formData.get("indication") ?? "",
		status: formData.get("status"),
		dose: formData.get("dose") ?? "",
		route: formData.get("route"),
		prescribedBy: formData.get("prescribedBy") ?? "",
		frequency: formData.get("frequency") ?? "",
		duration: formData.get("duration") ?? "",
		startedAt: formData.get("startedAt") ?? "",
		clinicalNote: formData.get("clinicalNote") ?? "",
	});

	if (!parsedMedication.success) {
		return { status: "failed", error: parsedMedication.error.issues[0].message };
	}

	const [patientRow] = await db
		.select({ id: patient.id })
		.from(patient)
		.where(and(eq(patient.id, patientId), eq(patient.organizationId, organizationId)))
		.limit(1);

	if (!patientRow) {
		return { status: "failed", error: "Patient could not be found." };
	}

	const encounterId = String(formData.get("encounterId") ?? "").trim();

	if (encounterId) {
		const [encounter] = await db
			.select({ id: patientEncounter.id })
			.from(patientEncounter)
			.where(and(eq(patientEncounter.id, encounterId), eq(patientEncounter.patientId, patientId)))
			.limit(1);

		if (!encounter) {
			return { status: "failed", error: "This encounter could not be found for the patient." };
		}
	}

	const createdBy = session.user.name || session.user.email;
	const medicationId = `MED-${crypto.randomUUID()}`;
	const { clinicalNote, ...medication } = parsedMedication.data;

	try {
		await db.insert(patientMedication).values({
			id: medicationId,
			patientId,
			encounterId: encounterId || null,
			...medication,
			clinicalNote: clinicalNote || null,
			createdBy,
			updatedBy: createdBy,
		});
	} catch (error) {
		console.error("Creating patient medication failed:", error);
		return { status: "failed", error: "We couldn’t add this medication. Please try again." };
	}

	updateTag(`patient-medications-${organizationId}-${patientId}`);

	return { status: "success", medicationId };
}
