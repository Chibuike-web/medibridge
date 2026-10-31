import "server-only";

import { eq } from "drizzle-orm";
import { revalidateTag } from "next/cache";
import { patientExtraction, type PatientExtractionDocument } from "@/db/schemas/patient";
import { getOrganizationId } from "@/lib/api/get-organization-id";
import { getPatientExtractionById } from "@/lib/api/get-patient-extraction-by-id";
import { getSessionData } from "@/lib/api/get-session-data";
import { db } from "@/lib/better-auth/auth";
import { extractPatientDocumentsService } from "./extract-patient-documents-service";

type RetryPatientExtractionResult =
	| { status: "success"; documents: PatientExtractionDocument[] }
	| { status: "failed" | "unauthorized" | "invalid"; error: string };

export async function retryPatientExtractionService(
	extractionId: string,
	documentIds: string[],
): Promise<RetryPatientExtractionResult> {
	const session = await getSessionData();

	if (!session?.user?.id) {
		return { status: "unauthorized", error: "Sign in to extract patient records." };
	}

	if (!session.user.emailVerified) {
		return { status: "failed", error: "Verify your email before extracting patient records." };
	}

	const organizationId = await getOrganizationId();

	if (!organizationId) {
		return {
			status: "failed",
			error: "Your hospital must be verified before you can extract patient records.",
		};
	}

	try {
		const extraction = await getPatientExtractionById(extractionId);

		if (!extraction) {
			return { status: "invalid", error: "This review was already cleared." };
		}

		const requestedDocuments = extraction.extractedData.filter((document) =>
			documentIds.includes(document.documentId),
		);
		if (requestedDocuments.length !== documentIds.length) {
			return { status: "invalid", error: "This document was already removed." };
		}

		const failedDocumentIds = requestedDocuments
			.filter((document) => document.status === "failed")
			.map((document) => document.documentId);
		if (failedDocumentIds.length === 0) {
			return { status: "success", documents: requestedDocuments };
		}

		const retriedDocuments = await extractPatientDocumentsService(
			`${organizationId}/${extraction.createdBy}`,
			failedDocumentIds,
		);

		const isUpdated = await db.transaction(async (tx) => {
			const [lockedExtraction] = await tx
				.select({ extractedData: patientExtraction.extractedData })
				.from(patientExtraction)
				.where(eq(patientExtraction.id, extractionId))
				.for("update");

			if (!lockedExtraction) return false;

			await tx
				.update(patientExtraction)
				.set({
					extractedData: lockedExtraction.extractedData.map((document) =>
						document.status === "failed"
							? (retriedDocuments.find(
									(retriedDocument) => retriedDocument.documentId === document.documentId,
								) ?? document)
							: document,
					),
				})
				.where(eq(patientExtraction.id, extractionId));
			return true;
		});

		if (!isUpdated) {
			return { status: "invalid", error: "This review was already cleared." };
		}

		revalidateTag(`patient-extraction-${organizationId}-${extractionId}`, { expire: 0 });

		return {
			status: "success",
			documents: requestedDocuments.map(
				(document) =>
					retriedDocuments.find(
						(retriedDocument) => retriedDocument.documentId === document.documentId,
					) ?? document,
			),
		};
	} catch (error) {
		console.error("Retrying patient extraction failed:", error);
		return { status: "failed", error: "We couldn’t extract these records. Please try again." };
	}
}
