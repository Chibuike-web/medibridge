"use server";

import { and, eq } from "drizzle-orm";
import { updateTag } from "next/cache";
import { patient, patientAllergy, patientAllergyHistory } from "@/db/schemas";
import { getOrganizationId } from "@/lib/api/get-organization-id";
import { getSessionData } from "@/lib/api/get-session-data";
import { db } from "@/lib/better-auth/auth";
import { patientAllergySchema } from "./schemas";

type UpdatePatientAllergyResult =
	| { status: "success" }
	| { status: "failed" | "unauthorized"; error: string };

export async function updatePatientAllergyAction(
	allergyId: string,
	formData: FormData,
): Promise<UpdatePatientAllergyResult> {
	const session = await getSessionData();

	if (!session?.user?.id) {
		return { status: "unauthorized", error: "You must be signed in to edit allergies." };
	}

	if (!session.user.emailVerified) {
		return { status: "failed", error: "Verify your email before editing allergies." };
	}

	const organizationId = await getOrganizationId();

	if (!organizationId) {
		return {
			status: "failed",
			error: "Your hospital must be verified before you can edit allergies.",
		};
	}

	const parsedAllergy = patientAllergySchema.safeParse({
		allergen: formData.get("allergen") ?? "",
		severity: formData.get("severity"),
		status: formData.get("status"),
		reaction: formData.get("reaction") ?? "",
		clinicalNote: formData.get("clinicalNote") ?? "",
	});

	if (!parsedAllergy.success) {
		return { status: "failed", error: parsedAllergy.error.issues[0].message };
	}

	const [currentAllergy] = await db
		.select({
			patientId: patientAllergy.patientId,
			allergen: patientAllergy.allergen,
			severity: patientAllergy.severity,
			status: patientAllergy.status,
			reaction: patientAllergy.reaction,
			clinicalNote: patientAllergy.clinicalNote,
		})
		.from(patientAllergy)
		.innerJoin(patient, eq(patientAllergy.patientId, patient.id))
		.where(and(eq(patientAllergy.id, allergyId), eq(patient.organizationId, organizationId)))
		.limit(1);

	if (!currentAllergy) {
		return { status: "failed", error: "Allergy could not be found." };
	}

	const { patientId, ...previousAllergy } = currentAllergy;
	const { clinicalNote, ...allergy } = parsedAllergy.data;
	const nextAllergy = { ...allergy, clinicalNote: clinicalNote || null };
	const changedFields = (Object.keys(nextAllergy) as (keyof typeof nextAllergy)[]).filter(
		(field) => nextAllergy[field] !== previousAllergy[field],
	);

	if (changedFields.length === 0) {
		return { status: "success" };
	}

	const updatedBy = session.user.name || session.user.email;
	const updatedAt = new Date();

	try {
		await db.transaction(async (tx) => {
			await tx
				.update(patientAllergy)
				.set({ ...nextAllergy, updatedBy, updatedAt })
				.where(eq(patientAllergy.id, allergyId));
			await tx.insert(patientAllergyHistory).values(
				changedFields.map((field) => ({
					id: crypto.randomUUID(),
					allergyId,
					fieldName: field.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`),
					oldValue: previousAllergy[field],
					newValue: nextAllergy[field],
					updatedBy,
					createdAt: updatedAt,
				})),
			);
		});
	} catch (error) {
		console.error("Updating patient allergy failed:", error);
		return { status: "failed", error: "We couldn’t save these changes. Please try again." };
	}

	updateTag(`patient-allergies-${organizationId}-${patientId}`);
	updateTag(`patient-allergy-details-${organizationId}-${allergyId}`);
	updateTag(`patient-profile-${organizationId}-${patientId}`);

	return { status: "success" };
}
