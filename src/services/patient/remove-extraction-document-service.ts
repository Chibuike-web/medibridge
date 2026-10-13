"use server";

import path from "node:path";
import { rm } from "node:fs/promises";
import { and, eq } from "drizzle-orm";
import { updateTag } from "next/cache";
import { patientExtraction } from "@/db/schemas/patient";
import { getOrganizationId } from "@/lib/api/get-organization-id";
import { getSessionData } from "@/lib/api/get-session-data";
import { db } from "@/lib/better-auth/auth";

type RemoveExtractionDocumentResult =
	| { status: "success" }
	| { status: "failed" | "unauthorized"; error: string };

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
		const uploadedBy = await db.transaction(async (tx) => {
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

			if (
				!extraction?.extractedData.some(
					(document) => document.documentId === documentId && document.status !== "saved",
				)
			) {
				return null;
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

			return extraction.createdBy;
		});

		if (!uploadedBy) {
			return { status: "failed", error: "This document can’t be removed." };
		}

		updateTag(`patient-extraction-${organizationId}-${extractionId}`);

		const uploadRoot = path.resolve("patient-uploads", organizationId, uploadedBy);
		const filePath = path.resolve(uploadRoot, documentId);

		if (path.dirname(filePath) === uploadRoot) {
			await rm(filePath, { force: true }).catch((error) => {
				console.error("Removing patient upload failed:", error);
			});
		}

		return { status: "success" };
	} catch (error) {
		console.error("Removing extraction document failed:", error);
		return { status: "failed", error: "We couldn’t remove this document. Please try again." };
	}
}
