"use server";

import path from "node:path";
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
	| { status: "failed" | "unauthorized"; error: string };

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

		if (
			!extraction ||
			documentIds.length === 0 ||
			!documentIds.every((documentId) =>
				extraction.extractedData.some(
					(document) => document.documentId === documentId && document.status === "failed",
				),
			)
		) {
			return { status: "failed", error: "These documents can’t be extracted again." };
		}

		const retriedDocuments = await extractPatientDocumentsService(
			path.resolve("patient-uploads", organizationId, extraction.createdBy),
			documentIds,
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
			return { status: "failed", error: "These documents can’t be extracted again." };
		}

		revalidateTag(`patient-extraction-${organizationId}-${extractionId}`, { expire: 0 });

		return { status: "success", documents: retriedDocuments };
	} catch (error) {
		console.error("Retrying patient extraction failed:", error);
		return { status: "failed", error: "We couldn’t extract these records. Please try again." };
	}
}
