"use server";

import { verifyRecordUploadsService } from "@/services/patient/verify-record-uploads-service";
import { and, eq } from "drizzle-orm";
import { updateTag } from "next/cache";
import { patient, patientEncounter, patientImaging, patientImagingFile } from "@/db/schemas";
import { getOrganizationId } from "@/lib/api/get-organization-id";
import { getSessionData } from "@/lib/api/get-session-data";
import { db } from "@/lib/better-auth/auth";
import { patientImagingSchema } from "./schemas";

type CreatePatientImagingResult =
	| { status: "success"; imagingId: string }
	| { status: "failed" | "unauthorized"; error: string };

export async function createPatientImagingAction(
	patientId: string,
	formData: FormData,
): Promise<CreatePatientImagingResult> {
	const session = await getSessionData();

	if (!session?.user?.id) {
		return { status: "unauthorized", error: "You must be signed in to add imaging." };
	}

	if (!session.user.emailVerified) {
		return { status: "failed", error: "Verify your email before adding imaging." };
	}

	const organizationId = await getOrganizationId();

	if (!organizationId) {
		return {
			status: "failed",
			error: "Your hospital must be verified before you can add imaging.",
		};
	}

	const parsedImaging = patientImagingSchema.safeParse({
		study: formData.get("study") ?? "",
		region: formData.get("region") ?? "",
		modality: formData.get("modality"),
		orderedAt: formData.get("orderedAt") ?? "",
		orderedBy: formData.get("orderedBy") ?? "",
		status: formData.get("status"),
		impression: formData.get("impression") ?? "",
		clinicalNote: formData.get("clinicalNote") ?? "",
	});

	if (!parsedImaging.success) {
		return { status: "failed", error: parsedImaging.error.issues[0].message };
	}

	const [patientRow] = await db
		.select({ id: patient.id })
		.from(patient)
		.where(and(eq(patient.id, patientId), eq(patient.organizationId, organizationId)))
		.limit(1);

	if (!patientRow) {
		return { status: "failed", error: "Patient could not be found." };
	}

	const verifiedUploads = await verifyRecordUploadsService(formData.getAll("files"), {
		organizationId,
		userId: session.user.id,
		patientId: patientId,
		recordType: "imaging",
	});

	if (verifiedUploads.status === "failed") {
		return { status: "failed", error: verifiedUploads.error };
	}

	const uploadedFiles = verifiedUploads.files;

	const encounterId = String(formData.get("encounterId") ?? "").trim();

	if (encounterId) {
		const [encounter] = await db
			.select({ id: patientEncounter.id })
			.from(patientEncounter)
			.where(and(eq(patientEncounter.id, encounterId), eq(patientEncounter.patientId, patientId)))
			.limit(1);

		if (!encounter) {
			return { status: "failed", error: "This encounter could not be found for the patient." };
		}
	}

	const createdBy = session.user.name || session.user.email;
	const imagingId = `IMG-${crypto.randomUUID()}`;
	const { impression, clinicalNote, orderedAt, ...imaging } = parsedImaging.data;

	try {
		await db.transaction(async (tx) => {
			await tx.insert(patientImaging).values({
				id: imagingId,
				patientId,
				encounterId: encounterId || null,
				...imaging,
				impression: impression || null,
				clinicalNote: clinicalNote || null,
				orderedAt: new Date(orderedAt),
				createdBy,
				updatedBy: createdBy,
			});

			if (uploadedFiles.length > 0) {
				await tx.insert(patientImagingFile).values(
					uploadedFiles.map((file) => ({
						id: file.id,
						parentRecordId: imagingId,
						name: file.name,
						url: `/api/patient-record-files/imaging/${file.id}`,
						type: file.type,
						size:
							file.size >= 1024 * 1024
								? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
								: `${Math.ceil(file.size / 1024)} KB`,
						uploadedBy: createdBy,
					})),
				);
			}
		});
	} catch (error) {
		console.error("Creating patient imaging failed:", error);
		return { status: "failed", error: "We couldn’t add this imaging study. Please try again." };
	}

	updateTag(`patient-imaging-${organizationId}-${patientId}`);

	return { status: "success", imagingId };
}
