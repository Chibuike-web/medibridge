"use server";

import { retryPatientExtractionService } from "@/services/patient/retry-patient-extraction-service";

export async function retryPatientExtractionAction(extractionId: string, documentIds: string[]) {
	return retryPatientExtractionService(extractionId, documentIds);
}
