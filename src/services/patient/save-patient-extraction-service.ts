import "server-only";

import { z } from "zod";
import { patientExtraction } from "@/db/schemas/patient";
import { PatientRecordSchema } from "@/features/patients/schemas/patient-schema";
import { getOrganizationId } from "@/lib/api/get-organization-id";
import { getSessionData } from "@/lib/api/get-session-data";
import { db } from "@/lib/better-auth/auth";

type SavePatientExtractionResult =
	| { status: "success"; extractionId: string }
	| { status: "failed"; error: string };

export async function savePatientExtractionService(
	input: unknown,
): Promise<SavePatientExtractionResult> {
	try {
		const session = await getSessionData();

		if (!session?.user?.id) {
			return {
				status: "failed",
				error: "Sign in to save extracted patient information.",
			};
		}

		if (!session.user.emailVerified) {
			return {
				status: "failed",
				error: "Verify your email before saving extracted patient information.",
			};
		}

		const organizationId = await getOrganizationId();

		if (!organizationId) {
			return {
				status: "failed",
				error: "Your hospital must be verified before you can save an extraction.",
			};
		}

		const parsedExtraction = z
			.array(
				z.discriminatedUnion("status", [
					z.object({
						documentId: z.string(),
						status: z.literal("ready"),
						patient: PatientRecordSchema,
					}),
					z.object({ documentId: z.string(), status: z.literal("failed"), patient: z.null() }),
				]),
			)
			.min(1)
			.safeParse(input);

		if (!parsedExtraction.success) {
			return {
				status: "failed",
				error: "Provide valid extracted patient information.",
			};
		}

		const extractionId = crypto.randomUUID();

		await db.insert(patientExtraction).values({
			id: extractionId,
			organizationId,
			createdBy: session.user.id,
			extractedData: parsedExtraction.data,
		});

		return { status: "success", extractionId };
	} catch (error) {
		console.error("Saving patient extraction failed:", error);
		return {
			status: "failed",
			error: "We couldn’t save the extracted information. Please try again.",
		};
	}
}
