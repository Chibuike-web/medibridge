import { patientUploads } from "@/lib/storage/client";
import { and, eq } from "drizzle-orm";
import {
	patient,
	patientImaging,
	patientImagingFile,
	patientLabTest,
	patientLabTestFile,
} from "@/db/schemas";
import { recordFileExtensions } from "@/features/patients/server/schemas";
import { getOrganizationId } from "@/lib/api/get-organization-id";
import { getSessionData } from "@/lib/api/get-session-data";
import { db } from "@/lib/better-auth/auth";

export async function GET(
	request: Request,
	context: RouteContext<"/api/patient-record-files/[fileId]">,
) {
	const session = await getSessionData();

	if (!session?.user?.id) {
		return Response.json(
			{ status: "failed", error: "Sign in to view patient files." },
			{ status: 401 },
		);
	}

	if (!session.user.emailVerified) {
		return Response.json(
			{ status: "failed", error: "Verify your email before you can view patient files." },
			{ status: 403 },
		);
	}

	const organizationId = await getOrganizationId();

	if (!organizationId) {
		return Response.json(
			{
				status: "failed",
				error: "Your hospital must be verified before you can view patient files.",
			},
			{ status: 403 },
		);
	}

	const { fileId } = await context.params;
	const [labTestFile] = await db
		.select({
			name: patientLabTestFile.name,
			type: patientLabTestFile.type,
			recordId: patientLabTestFile.parentRecordId,
		})
		.from(patientLabTestFile)
		.innerJoin(patientLabTest, eq(patientLabTestFile.parentRecordId, patientLabTest.id))
		.innerJoin(patient, eq(patientLabTest.patientId, patient.id))
		.where(and(eq(patientLabTestFile.id, fileId), eq(patient.organizationId, organizationId)))
		.limit(1);
	const [imagingFile] = labTestFile
		? []
		: await db
				.select({
					name: patientImagingFile.name,
					type: patientImagingFile.type,
					recordId: patientImagingFile.parentRecordId,
				})
				.from(patientImagingFile)
				.innerJoin(patientImaging, eq(patientImagingFile.parentRecordId, patientImaging.id))
				.innerJoin(patient, eq(patientImaging.patientId, patient.id))
				.where(and(eq(patientImagingFile.id, fileId), eq(patient.organizationId, organizationId)))
				.limit(1);
	const recordFile = labTestFile ?? imagingFile;
	const extension = recordFileExtensions[recordFile?.type as keyof typeof recordFileExtensions];

	if (!recordFile || !extension) {
		return Response.json({ status: "failed", error: "File not found." }, { status: 404 });
	}

	const isDownload = new URL(request.url).searchParams.has("download");

	try {
		const key = `${organizationId}/record-files/${fileId}${extension}`;
		const { data: file, error: missingFile } = await patientUploads.info(key);
		if (missingFile || !file)
			return Response.json({ status: "failed", error: "File not found." }, { status: 404 });
		const { data, error } = await patientUploads.createSignedUrl(key, 60, {
			download: isDownload ? recordFile.name : false,
		});
		if (error) throw error;
		return new Response(null, {
			status: 302,
			headers: {
				Location: data.signedUrl,
				"Cache-Control": "private, no-store",
				"X-Content-Type-Options": "nosniff",
			},
		});
	} catch (error) {
		console.error("Reading patient record file failed:", error);
		return Response.json({ status: "failed", error: "File not found." }, { status: 404 });
	}
}
