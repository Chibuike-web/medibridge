"use server";

import { deletePatientUploadService } from "@/services/patient/delete-patient-upload-service";

export async function deletePatientUploadAction(relativePath: string) {
	return deletePatientUploadService(relativePath);
}
