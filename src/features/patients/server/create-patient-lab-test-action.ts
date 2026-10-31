"use server";

import { verifyRecordUploadsService } from "@/services/patient/verify-record-uploads-service";
import { and, eq } from "drizzle-orm";
import { updateTag } from "next/cache";
import { patient, patientEncounter, patientLabTest, patientLabTestFile } from "@/db/schemas";
import { getOrganizationId } from "@/lib/api/get-organization-id";
import { getSessionData } from "@/lib/api/get-session-data";
import { db } from "@/lib/better-auth/auth";
import { patientLabTestSchema } from "./schemas";

type CreatePatientLabTestResult =
	| { status: "success"; labTestId: string }
	| { status: "failed" | "unauthorized"; error: string };

export async function createPatientLabTestAction(
	patientId: string,
	formData: FormData,
): Promise<CreatePatientLabTestResult> {
	const session = await getSessionData();

	if (!session?.user?.id) {
		return { status: "unauthorized", error: "You must be signed in to add lab tests." };
	}

	if (!session.user.emailVerified) {
		return { status: "failed", error: "Verify your email before adding lab tests." };
	}

	const organizationId = await getOrganizationId();

	if (!organizationId) {
		return {
			status: "failed",
			error: "Your hospital must be verified before you can add lab tests.",
		};
	}

	const parsedLabTest = patientLabTestSchema.safeParse({
		testName: formData.get("testName") ?? "",
		status: formData.get("status"),
		flag: formData.get("flag") || undefined,
		referenceRange: formData.get("referenceRange") ?? "",
		orderedBy: formData.get("orderedBy") ?? "",
		orderedAt: formData.get("orderedAt") ?? "",
		specimen: formData.get("specimen") ?? "",
		result: formData.get("result") ?? "",
		interpretation: formData.get("interpretation") ?? "",
		clinicalNote: formData.get("clinicalNote") ?? "",
	});

	if (!parsedLabTest.success) {
		return { status: "failed", error: parsedLabTest.error.issues[0].message };
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
		recordType: "lab",
	});

	if (verifiedUploads.status === "failed") {
		return { status: "failed", error: verifiedUploads.error };
	}

	const uploadedFiles = verifiedUploads.files;

	if (parsedLabTest.data.status === "Completed" && uploadedFiles.length === 0) {
		return { status: "failed", error: "Attach the report for a completed lab test." };
	}

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
	const labTestId = `LAB-${crypto.randomUUID()}`;
	const { flag, referenceRange, result, interpretation, clinicalNote, orderedAt, ...labTest } =
		parsedLabTest.data;

	try {
		await db.transaction(async (tx) => {
			await tx.insert(patientLabTest).values({
				id: labTestId,
				patientId,
				encounterId: encounterId || null,
				...labTest,
				flag: flag ?? null,
				referenceRange: referenceRange || null,
				result: result || null,
				interpretation: interpretation || null,
				clinicalNote: clinicalNote || null,
				orderedAt: new Date(orderedAt),
				createdBy,
				updatedBy: createdBy,
			});

			if (uploadedFiles.length > 0) {
				await tx.insert(patientLabTestFile).values(
					uploadedFiles.map((file) => ({
						id: file.id,
						parentRecordId: labTestId,
						name: file.name,
						url: `/api/patient-record-files/${file.id}`,
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
		console.error("Creating patient lab test failed:", error);
		return { status: "failed", error: "We couldn’t add this lab test. Please try again." };
	}

	updateTag(`patient-lab-tests-${organizationId}-${patientId}`);

	return { status: "success", labTestId };
}
