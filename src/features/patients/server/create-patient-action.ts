"use server";

import { updateTag } from "next/cache";
import {
	patient,
	patientContactInformation,
	patientEmergencyContact,
	patientPersonalInformation,
	patientPhysicalInformation,
} from "@/db/schemas";
import { getOrganizationId } from "@/lib/api/get-organization-id";
import { getSessionData } from "@/lib/api/get-session-data";
import { db } from "@/lib/better-auth/auth";
import { manualPatientSchema, type ManualPatientType } from "../schemas/manual-patient-schema";

type CreatePatientResult =
	| { status: "success"; patientId: string }
	| { status: "failed" | "unauthorized"; error: string };

export async function createPatientAction(data: ManualPatientType): Promise<CreatePatientResult> {
	const session = await getSessionData();

	if (!session?.user?.id) {
		return { status: "unauthorized", error: "You must be signed in to add patients." };
	}

	if (!session.user.emailVerified) {
		return { status: "failed", error: "Verify your email before adding patients." };
	}

	const organizationId = await getOrganizationId();

	if (!organizationId) {
		return {
			status: "failed",
			error: "Your hospital must be verified before you can add patients.",
		};
	}

	const parsedPatient = manualPatientSchema.safeParse(data);

	if (!parsedPatient.success) {
		return { status: "failed", error: parsedPatient.error.issues[0].message };
	}

	const { personalInformation, contactInformation, emergencyContact, physicalInformation } =
		parsedPatient.data;
	const patientId = crypto.randomUUID();

	try {
		await db.transaction(async (tx) => {
			await tx.insert(patient).values({ id: patientId, organizationId });
			await tx.insert(patientPersonalInformation).values({
				id: crypto.randomUUID(),
				patientId,
				firstName: personalInformation.firstName,
				middleName: personalInformation.middleName || null,
				lastName: personalInformation.lastName,
				dateOfBirth: personalInformation.dateOfBirth,
				age: personalInformation.age ?? null,
				sex: personalInformation.sex || null,
				maritalStatus: personalInformation.maritalStatus || null,
				nationalId: personalInformation.nationalId || null,
			});
			await tx.insert(patientContactInformation).values({
				id: crypto.randomUUID(),
				patientId,
				phoneNumber: contactInformation.phoneNumber || null,
				emailAddress: contactInformation.emailAddress ?? null,
				residentialAddress: contactInformation.residentialAddress || null,
				stateOfOrigin: contactInformation.stateOfOrigin || null,
				countryOfOrigin: contactInformation.countryOfOrigin || null,
			});
			await tx.insert(patientEmergencyContact).values({
				id: crypto.randomUUID(),
				patientId,
				firstName: emergencyContact.firstName,
				middleName: emergencyContact.middleName || null,
				lastName: emergencyContact.lastName,
				relationship: emergencyContact.relationship || null,
				phoneNumber: emergencyContact.phoneNumber || null,
			});
			await tx.insert(patientPhysicalInformation).values({
				id: crypto.randomUUID(),
				patientId,
				height: physicalInformation.height || null,
				weight: physicalInformation.weight || null,
				bloodGroup: physicalInformation.bloodGroup || null,
				genotype: physicalInformation.genotype || null,
			});
		});
	} catch (error) {
		console.error("Creating patient failed:", error);
		return { status: "failed", error: "We couldn’t save this patient. Please try again." };
	}

	updateTag(`patients-list-${organizationId}`);
	updateTag(`recent-patients-${organizationId}`);
	updateTag(`overview-stats-${organizationId}`);
	updateTag(`patient-profile-${organizationId}-${patientId}`);
	updateTag(`patient-by-id-${organizationId}-${patientId}`);

	return { status: "success", patientId };
}
