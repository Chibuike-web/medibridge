"use server";

import { deletePatientUploadService } from "@/services/patient/delete-patient-upload-service";
import { saveExtractedPatientsService } from "@/services/patient/save-extracted-patients-service";
import { eq } from "drizzle-orm";
import { db } from "@/lib/better-auth/auth";
import { patientContactInformation, patientPersonalInformation } from "@/db/schemas";

import { PatientType } from "../schemas/patient-schema";
import { getOrganizationId } from "@/lib/api/get-organization-id";

export async function deletePatientUploadAction(relativePath: string) {
	return deletePatientUploadService(relativePath);
}

export async function savePatientsAction(records: PatientType) {
	return saveExtractedPatientsService(records);
}

export async function getPatientById(patientId: string) {
	const organizationId = await getOrganizationId();

	if (!organizationId) {
		return null;
	}

	const rows = await db
		.select({
			patientId: patientPersonalInformation.patientId,
			firstName: patientPersonalInformation.firstName,
			lastName: patientPersonalInformation.lastName,
			email: patientContactInformation.emailAddress,
			phoneNumber: patientContactInformation.phoneNumber,
			address: patientContactInformation.residentialAddress,
		})
		.from(patientPersonalInformation)
		.leftJoin(
			patientContactInformation,
			eq(patientPersonalInformation.patientId, patientContactInformation.patientId),
		)
		.where(eq(patientPersonalInformation.patientId, patientId));

	return rows[0] ?? null;
}
