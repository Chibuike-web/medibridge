"use server";

import { jwtVerify } from "jose";
import type { z } from "zod";
import { patientUploads } from "@/lib/storage/client";
import { recordUploadSchema } from "@/lib/storage/schemas";
import { ENV } from "@/lib/utils/env";
import { and, eq } from "drizzle-orm";
import { updateTag } from "next/cache";
import { patient, patientEncounter, patientLabTest, patientLabTestFile } from "@/db/schemas";
import { getOrganizationId } from "@/lib/api/get-organization-id";
import { getSessionData } from "@/lib/api/get-session-data";
import { db } from "@/lib/better-auth/auth";
import { patientLabTestSchema, recordFileExtensions } from "./schemas";

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

	const uploadedFiles: z.infer<typeof recordUploadSchema>[] = [];
	try {
		const receipts = formData.getAll("files");
		for (const receipt of receipts) {
			if (typeof receipt !== "string")
				return { status: "failed", error: "Upload each report before saving." };
			const { payload } = await jwtVerify(
				receipt,
				new TextEncoder().encode(ENV.BETTER_AUTH_SECRET),
				{ algorithms: ["HS256"], audience: "patient-record-upload" },
			);
			const file = recordUploadSchema.parse(payload);
			if (
				file.organizationId !== organizationId ||
				file.userId !== session.user.id ||
				file.patientId !== patientId ||
				file.recordType !== "lab"
			)
				return { status: "failed", error: "This report does not belong to this patient." };
			const { data, error } = await patientUploads.info(
				`${organizationId}/record-files/${file.id}${recordFileExtensions[file.type]}`,
			);
			if (error || data.size !== file.size || data.contentType !== file.type)
				return { status: "failed", error: "Upload the complete report before saving." };
			uploadedFiles.push(file);
		}
		if (uploadedFiles.reduce((size, file) => size + file.size, 0) > 100 * 1024 * 1024)
			return { status: "failed", error: "Files can add up to 100 MB per save." };
	} catch (error) {
		console.error("Validating report uploads failed:", error);
		return {
			status: "failed",
			error: "We couldn’t verify these uploads. Upload the reports again.",
		};
	}

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
	const files = uploadedFiles.map((file) => ({
		id: file.id,
		file,
	}));

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

			if (files.length > 0) {
				await tx.insert(patientLabTestFile).values(
					files.map(({ id, file }) => ({
						id,
						parentRecordId: labTestId,
						name: file.name,
						url: `/api/patient-record-files/${id}`,
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
