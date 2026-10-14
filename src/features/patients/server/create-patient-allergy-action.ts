"use server";

import { and, eq } from "drizzle-orm";
import { updateTag } from "next/cache";
import { patient, patientAllergy, patientEncounter } from "@/db/schemas";
import { getOrganizationId } from "@/lib/api/get-organization-id";
import { getSessionData } from "@/lib/api/get-session-data";
import { db } from "@/lib/better-auth/auth";
import { createPatientAllergySchema } from "./schemas";

type CreatePatientAllergyResult =
	| { status: "success"; allergyId: string }
	| { status: "failed" | "unauthorized"; error: string };

export async function createPatientAllergyAction(
	patientId: string,
	formData: FormData,
): Promise<CreatePatientAllergyResult> {
	const session = await getSessionData();

	if (!session?.user?.id) {
		return { status: "unauthorized", error: "You must be signed in to add allergies." };
	}

	if (!session.user.emailVerified) {
		return { status: "failed", error: "Verify your email before adding allergies." };
	}

	const organizationId = await getOrganizationId();

	if (!organizationId) {
		return {
			status: "failed",
			error: "Your hospital must be verified before you can add allergies.",
		};
	}

	const parsedAllergy = createPatientAllergySchema.safeParse({
		allergen: formData.get("allergen") ?? "",
		severity: formData.get("severity"),
		status: formData.get("status"),
		reaction: formData.get("reaction") ?? "",
		clinicalNote: formData.get("clinicalNote") ?? "",
	});

	if (!parsedAllergy.success) {
		return { status: "failed", error: parsedAllergy.error.issues[0].message };
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
	const allergyId = `ALLE-${crypto.randomUUID()}`;
	const { clinicalNote, ...allergy } = parsedAllergy.data;

	try {
		await db.insert(patientAllergy).values({
			id: allergyId,
			patientId,
			encounterId: encounterId || null,
			...allergy,
			clinicalNote: clinicalNote || null,
			createdBy,
			updatedBy: createdBy,
		});
	} catch (error) {
		console.error("Creating patient allergy failed:", error);
		return { status: "failed", error: "We couldn’t add this allergy. Please try again." };
	}

	updateTag(`patient-allergies-${organizationId}-${patientId}`);

	return { status: "success", allergyId };
}
