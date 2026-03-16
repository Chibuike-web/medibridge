"use server";

import { PatientType } from "@/app/api/extract-file/schemas/patient-schema";
import { saveExtractedPatientRecordsService } from "@/services/patient/save-extracted-patient-records-service";
import { deletePatientUploadService } from "@/services/patient/delete-patient-upload-service";

export async function deletePatientUploadAction(relativePath: string) {
	return deletePatientUploadService(relativePath);
}

export async function savePatientRecordsAction(records: PatientType) {
	return saveExtractedPatientRecordsService(records);
}
