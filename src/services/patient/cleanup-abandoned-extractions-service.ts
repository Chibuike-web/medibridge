import "server-only";

import path from "node:path";
import { eq, lt } from "drizzle-orm";
import { revalidateTag } from "next/cache";
import { patientExtraction } from "@/db/schemas/patient";
import { db } from "@/lib/better-auth/auth";
import { patientUploads } from "@/lib/storage/client";

const retentionInMilliseconds = 24 * 60 * 60 * 1000;

type CleanupAbandonedExtractionsResult =
	| { status: "success"; removedCount: number }
	| { status: "failed"; error: string };

export async function cleanupAbandonedExtractionsService(): Promise<CleanupAbandonedExtractionsResult> {
	try {
		const abandonedExtractions = await db
			.select({ id: patientExtraction.id })
			.from(patientExtraction)
			.where(lt(patientExtraction.createdAt, new Date(Date.now() - retentionInMilliseconds)));

		let removedCount = 0;

		for (const { id } of abandonedExtractions) {
			const removedExtraction = await db.transaction(async (tx) => {
				const [extraction] = await tx
					.select({
						organizationId: patientExtraction.organizationId,
						createdBy: patientExtraction.createdBy,
						extractedData: patientExtraction.extractedData,
					})
					.from(patientExtraction)
					.where(eq(patientExtraction.id, id))
					.for("update");

				if (!extraction) {
					return null;
				}

				await tx.delete(patientExtraction).where(eq(patientExtraction.id, id));
				return extraction;
			});

			if (!removedExtraction) {
				continue;
			}

			removedCount += 1;
			revalidateTag(`patient-extraction-${removedExtraction.organizationId}-${id}`, { expire: 0 });

			const keys = removedExtraction.extractedData
				.filter(
					(document) =>
						document.documentId === path.posix.basename(document.documentId) &&
						!/[\\:]/.test(document.documentId) &&
						document.documentId !== "." &&
						document.documentId !== "..",
				)
				.map(
					(document) =>
						`${removedExtraction.organizationId}/${removedExtraction.createdBy}/${document.documentId}`,
				);

			if (keys.length > 0) {
				const { error } = await patientUploads.remove(keys);
				if (error) console.error("Removing abandoned patient uploads failed:", error);
			}
		}

		return { status: "success", removedCount };
	} catch (error) {
		console.error("Cleaning up abandoned extractions failed:", error);
		return { status: "failed", error: "We couldn’t clean up abandoned reviews." };
	}
}
