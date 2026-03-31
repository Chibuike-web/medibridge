"use server";

import { deletePatientUploadService } from "@/services/patient/delete-patient-upload-service";
import { saveExtractedPatientRecordsService } from "@/services/patient/save-extracted-patient-records-service";
import { PatientType } from "../schemas/patient-schema";

export async function deletePatientUploadAction(relativePath: string) {
	return deletePatientUploadService(relativePath);
}

export async function savePatientRecordsAction(records: PatientType) {
	return saveExtractedPatientRecordsService(records);
}
