import "server-only";

import path from "node:path";
import { patientUploads } from "@/lib/storage/client";
import { and, eq } from "drizzle-orm";
import { updateTag } from "next/cache";
import { patientExtraction } from "@/db/schemas/patient";
import { getOrganizationId } from "@/lib/api/get-organization-id";
import { getSessionData } from "@/lib/api/get-session-data";
import { db } from "@/lib/better-auth/auth";

type RemoveExtractionDocumentResult =
	| { status: "success" }
	| { status: "failed" | "unauthorized" | "invalid"; error: string };

export async function removeExtractionDocumentService(
	extractionId: string,
	documentId: string,
): Promise<RemoveExtractionDocumentResult> {
	const session = await getSessionData();

	if (!session?.user?.id) {
		return { status: "unauthorized", error: "Sign in to remove patient documents." };
	}

	if (!session.user.emailVerified) {
		return { status: "failed", error: "Verify your email before removing patient documents." };
	}

	const organizationId = await getOrganizationId();

	if (!organizationId) {
		return {
			status: "failed",
			error: "Your hospital must be verified before you can remove patient documents.",
		};
	}

	try {
		const removal = await db.transaction(async (tx) => {
			const [extraction] = await tx
				.select({
					createdBy: patientExtraction.createdBy,
					extractedData: patientExtraction.extractedData,
				})
				.from(patientExtraction)
				.where(
					and(
						eq(patientExtraction.id, extractionId),
						eq(patientExtraction.organizationId, organizationId),
					),
				)
				.for("update");

			if (!extraction) {
				return { status: "invalid", error: "This review was already cleared." } as const;
			}

			const document = extraction.extractedData.find(
				(document) => document.documentId === documentId,
			);
			if (!document) {
				return { status: "invalid", error: "This document was already removed." } as const;
			}
			if (document.status !== "failed") {
				return { status: "failed", error: "This document can’t be removed." } as const;
			}

			const remainingDocuments = extraction.extractedData.filter(
				(document) => document.documentId !== documentId,
			);

			if (remainingDocuments.length === 0) {
				await tx.delete(patientExtraction).where(eq(patientExtraction.id, extractionId));
			} else {
				await tx
					.update(patientExtraction)
					.set({ extractedData: remainingDocuments })
					.where(eq(patientExtraction.id, extractionId));
			}

			return { status: "success", uploadedBy: extraction.createdBy } as const;
		});

		if (removal.status !== "success") {
			return removal;
		}

		updateTag(`patient-extraction-${organizationId}-${extractionId}`);

		if (
			documentId === path.posix.basename(documentId) &&
			!/[\\:]/.test(documentId) &&
			documentId !== "." &&
			documentId !== ".."
		) {
			const { error } = await patientUploads.remove([
				`${organizationId}/${removal.uploadedBy}/${documentId}`,
			]);
			if (error) console.error("Removing patient upload failed:", error);
		}

		return { status: "success" };
	} catch (error) {
		console.error("Removing extraction document failed:", error);
		return { status: "failed", error: "We couldn’t remove this document. Please try again." };
	}
}
