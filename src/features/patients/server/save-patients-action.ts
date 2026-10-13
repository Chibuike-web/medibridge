"use server";

import { saveExtractedPatientsService } from "@/services/patient/save-extracted-patients-service";
import type { PatientRecord } from "../schemas/patient-schema";

export async function savePatientsAction(
	extractionId: string,
	documentId: string,
	patient: PatientRecord,
) {
	return saveExtractedPatientsService(extractionId, documentId, patient);
}
