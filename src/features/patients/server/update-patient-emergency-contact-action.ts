"use server";

import { and, eq } from "drizzle-orm";
import { updateTag } from "next/cache";
import { patient, patientEmergencyContact } from "@/db/schemas";
import { getOrganizationId } from "@/lib/api/get-organization-id";
import { db } from "@/lib/better-auth/auth";
import { updatePatientEmergencyContactSchema } from "./schemas";

export async function updatePatientEmergencyContactAction(
	patientId: string,
	formData: FormData,
) {
	const organizationId = await getOrganizationId();

	if (!organizationId) {
		return { ok: false, message: "Unable to verify your hospital." };
	}

	const parsedEmergencyContact = updatePatientEmergencyContactSchema.safeParse({
		firstName: formData.get("firstName"),
		middleName: formData.get("middleName"),
		lastName: formData.get("lastName"),
		relationship: formData.get("relationship"),
		phoneNumber: formData.get("phoneNumber"),
	});

	if (!parsedEmergencyContact.success) {
		return {
			ok: false,
			message:
				parsedEmergencyContact.error.issues[0]?.message ??
				"Please check the emergency contact fields.",
		};
	}

	const [patientRow] = await db
		.select({ id: patient.id })
		.from(patient)
		.where(and(eq(patient.id, patientId), eq(patient.organizationId, organizationId)))
		.limit(1);

	if (!patientRow) {
		return { ok: false, message: "Patient record was not found." };
	}

	const emergencyContact = parsedEmergencyContact.data;

	await db
		.insert(patientEmergencyContact)
		.values({
			id: crypto.randomUUID(),
			patientId,
			firstName: emergencyContact.firstName,
			middleName: emergencyContact.middleName || null,
			lastName: emergencyContact.lastName,
			relationship: emergencyContact.relationship || null,
			phoneNumber: emergencyContact.phoneNumber || null,
			updatedAt: new Date(),
		})
		.onConflictDoUpdate({
			target: patientEmergencyContact.patientId,
			set: {
				firstName: emergencyContact.firstName,
				middleName: emergencyContact.middleName || null,
				lastName: emergencyContact.lastName,
				relationship: emergencyContact.relationship || null,
				phoneNumber: emergencyContact.phoneNumber || null,
				updatedAt: new Date(),
			},
		});

	updateTag(`patient-profile-${organizationId}-${patientId}`);
	updateTag(`patient-by-id-${organizationId}-${patientId}`);
	updateTag(`patients-list-${organizationId}`);
	updateTag(`recent-patients-${organizationId}`);
	updateTag(`recent-transfers-${organizationId}`);

	return { ok: true, message: "" };
}
