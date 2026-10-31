import "server-only";

import { jwtVerify } from "jose";
import { inArray } from "drizzle-orm";
import type { z } from "zod";
import { patientImagingFile, patientLabTestFile } from "@/db/schemas";
import { recordFileExtensions } from "@/features/patients/server/schemas";
import { db } from "@/lib/better-auth/auth";
import { patientUploads } from "@/lib/storage/client";
import { recordUploadSchema } from "@/lib/storage/schemas";
import { ENV } from "@/lib/utils/env";

type VerifyRecordUploadsResult =
	| { status: "success"; files: z.infer<typeof recordUploadSchema>[] }
	| { status: "failed"; error: string };

export async function verifyRecordUploadsService(
	receipts: FormDataEntryValue[],
	expected: {
		organizationId: string;
		userId: string;
		patientId: string;
		recordType: "lab" | "imaging";
	},
): Promise<VerifyRecordUploadsResult> {
	try {
		const files: z.infer<typeof recordUploadSchema>[] = [];

		for (const receipt of receipts) {
			if (typeof receipt !== "string") {
				return { status: "failed", error: "Upload each report before saving." };
			}

			const { payload } = await jwtVerify(
				receipt,
				new TextEncoder().encode(ENV.BETTER_AUTH_SECRET),
				{ algorithms: ["HS256"], audience: "patient-record-upload" },
			);
			const file = recordUploadSchema.parse(payload);

			if (
				file.organizationId !== expected.organizationId ||
				file.userId !== expected.userId ||
				file.patientId !== expected.patientId ||
				file.recordType !== expected.recordType
			) {
				return { status: "failed", error: "This report does not belong to this patient." };
			}

			const { data, error } = await patientUploads.info(
				`${expected.organizationId}/record-files/${file.id}${recordFileExtensions[file.type]}`,
			);
			if (error || data.size !== file.size || data.contentType !== file.type) {
				return { status: "failed", error: "Upload the complete report before saving." };
			}

			files.push(file);
		}

		if (files.reduce((size, file) => size + file.size, 0) > 100 * 1024 * 1024) {
			return { status: "failed", error: "Files can add up to 100 MB per save." };
		}

		const fileIds = files.map((file) => file.id);
		if (new Set(fileIds).size !== fileIds.length) {
			return { status: "failed", error: "Each report can only be attached once." };
		}

		if (fileIds.length > 0) {
			const savedFiles =
				expected.recordType === "lab"
					? await db
							.select({ id: patientLabTestFile.id })
							.from(patientLabTestFile)
							.where(inArray(patientLabTestFile.id, fileIds))
					: await db
							.select({ id: patientImagingFile.id })
							.from(patientImagingFile)
							.where(inArray(patientImagingFile.id, fileIds));

			if (savedFiles.length > 0) {
				return { status: "failed", error: "This report was already saved. Upload it again." };
			}
		}

		return { status: "success", files };
	} catch (error) {
		console.error("Validating report uploads failed:", error);
		return {
			status: "failed",
			error: "We couldn’t verify these uploads. Upload the reports again.",
		};
	}
}
