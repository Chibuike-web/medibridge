"use server";

import { and, eq } from "drizzle-orm";
import { updateTag } from "next/cache";
import { patient, patientPersonalInformation } from "@/db/schemas";
import { getOrganizationId } from "@/lib/api/get-organization-id";
import { db } from "@/lib/better-auth/auth";
import { updatePatientPersonalInformationSchema } from "./schemas";

type UpdatePatientPersonalInformationResult =
	| { status: "success" }
	| { status: "failed"; error: string };

export async function updatePatientPersonalInformationAction(
	patientId: string,
	formData: FormData,
): Promise<UpdatePatientPersonalInformationResult> {
	const organizationId = await getOrganizationId();

	if (!organizationId) {
		return { status: "failed", error: "Unable to verify your hospital." };
	}

	const parsedPersonalInformation = updatePatientPersonalInformationSchema.safeParse({
		firstName: formData.get("firstName"),
		middleName: formData.get("middleName"),
		lastName: formData.get("lastName"),
		age: formData.get("age"),
		dateOfBirth: formData.get("dateOfBirth"),
		sex: formData.get("sex"),
		maritalStatus: formData.get("maritalStatus"),
		nationalId: formData.get("nationalId"),
	});

	if (!parsedPersonalInformation.success) {
		return {
			status: "failed",
			error:
				parsedPersonalInformation.error.issues[0]?.message ??
				"Please check the personal information fields.",
		};
	}

	const [patientRow] = await db
		.select({ id: patient.id })
		.from(patient)
		.where(and(eq(patient.id, patientId), eq(patient.organizationId, organizationId)))
		.limit(1);

	if (!patientRow) {
		return { status: "failed", error: "Patient record was not found." };
	}

	const personalInformation = parsedPersonalInformation.data;
	const normalizedAge = personalInformation.age ?? null;

	await db
		.update(patientPersonalInformation)
		.set({
			firstName: personalInformation.firstName,
			middleName: personalInformation.middleName || null,
			lastName: personalInformation.lastName,
			age: normalizedAge,
			dateOfBirth: personalInformation.dateOfBirth || null,
			sex: personalInformation.sex || null,
			maritalStatus: personalInformation.maritalStatus || null,
			nationalId: personalInformation.nationalId || null,
			updatedAt: new Date(),
		})
		.where(eq(patientPersonalInformation.patientId, patientId));

	updateTag(`patient-profile-${organizationId}-${patientId}`);
	updateTag(`patient-by-id-${organizationId}-${patientId}`);
	updateTag(`patients-list-${organizationId}`);
	updateTag(`recent-patients-${organizationId}`);
	updateTag(`recent-transfers-${organizationId}`);
	updateTag(`transfers-list-${organizationId}`);

	return { status: "success" };
}
