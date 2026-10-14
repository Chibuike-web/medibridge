import "server-only";

import path from "node:path";
import { rm } from "node:fs/promises";
import { and, eq } from "drizzle-orm";
import { updateTag } from "next/cache";
import { patientExtraction } from "@/db/schemas/patient";
import { getOrganizationId } from "@/lib/api/get-organization-id";
import { getSessionData } from "@/lib/api/get-session-data";
import { db } from "@/lib/better-auth/auth";

type DiscardPatientExtractionResult =
	| { status: "success" }
	| { status: "failed" | "unauthorized"; error: string };

export async function discardPatientExtractionService(
	extractionId: string,
): Promise<DiscardPatientExtractionResult> {
	const session = await getSessionData();

	if (!session?.user?.id) {
		return { status: "unauthorized", error: "Sign in to leave this review." };
	}

	if (!session.user.emailVerified) {
		return { status: "failed", error: "Verify your email before leaving this review." };
	}

	const organizationId = await getOrganizationId();

	if (!organizationId) {
		return {
			status: "failed",
			error: "Your hospital must be verified before you can leave this review.",
		};
	}

	try {
		const discardedExtraction = await db.transaction(async (tx) => {
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
				return null;
			}

			const uploadRoot = path.resolve("patient-uploads", organizationId, extraction.createdBy);
			for (const document of extraction.extractedData) {
				const filePath = path.resolve(uploadRoot, document.documentId);
				if (path.dirname(filePath) !== uploadRoot) continue;
				await rm(filePath, { force: true });
			}

			await tx.delete(patientExtraction).where(eq(patientExtraction.id, extractionId));
			return extraction;
		});

		if (!discardedExtraction) {
			return { status: "success" };
		}

		updateTag(`patient-extraction-${organizationId}-${extractionId}`);

		return { status: "success" };
	} catch (error) {
		console.error("Discarding patient extraction failed:", error);
		return { status: "failed", error: "We couldn’t clear this review. Please try again." };
	}
}
