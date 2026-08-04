"use server";

import { saveExtractedPatientsService } from "@/services/patient/save-extracted-patients-service";
import type { PatientType } from "../schemas/patient-schema";

export async function savePatientsAction(records: PatientType) {
	return saveExtractedPatientsService(records);
}
