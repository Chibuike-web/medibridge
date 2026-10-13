"use server";

import { removeExtractionDocumentService } from "@/services/patient/remove-extraction-document-service";

export async function removeExtractionDocumentAction(extractionId: string, documentId: string) {
	return removeExtractionDocumentService(extractionId, documentId);
}
