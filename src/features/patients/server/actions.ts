"use server";

import { deletePatientUploadService } from "@/services/patient/delete-patient-upload-service";
import { saveExtractedPatientsService } from "@/services/patient/save-extracted-patients-service";
import { PatientType } from "../schemas/patient-schema";

export async function deletePatientUploadAction(relativePath: string) {
	return deletePatientUploadService(relativePath);
}

export async function savePatientsAction(records: PatientType) {
	return saveExtractedPatientsService(records);
}
