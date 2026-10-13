"use server";

import { discardPatientExtractionService } from "@/services/patient/discard-patient-extraction-service";

export async function discardPatientExtractionAction(extractionId: string) {
	return discardPatientExtractionService(extractionId);
}
