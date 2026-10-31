import { patientUploads } from "@/lib/storage/client";
import { and, eq } from "drizzle-orm";
import { patient, patientImaging, patientImagingFile } from "@/db/schemas";
import { recordFileExtensions } from "@/features/patients/server/schemas";
import { getOrganizationId } from "@/lib/api/get-organization-id";
import { getSessionData } from "@/lib/api/get-session-data";
import { db } from "@/lib/better-auth/auth";

export async function GET(
	request: Request,
	context: RouteContext<"/api/patient-record-files/imaging/[fileId]">,
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
	const [recordFile] = await db
		.select({ name: patientImagingFile.name, type: patientImagingFile.type })
		.from(patientImagingFile)
		.innerJoin(patientImaging, eq(patientImagingFile.parentRecordId, patientImaging.id))
		.innerJoin(patient, eq(patientImaging.patientId, patient.id))
		.where(and(eq(patientImagingFile.id, fileId), eq(patient.organizationId, organizationId)))
		.limit(1);
	const extension = recordFileExtensions[recordFile?.type as keyof typeof recordFileExtensions];

	if (!recordFile || !extension) {
		return Response.json({ status: "failed", error: "File not found." }, { status: 404 });
	}

	const isDownload = new URL(request.url).searchParams.has("download");

	try {
		const key = `${organizationId}/record-files/${fileId}${extension}`;
		const { data, error } = await patientUploads.createSignedUrl(key, 60);
		if (error) throw error;
		const range = request.headers.get("range");
		const storageHeaders = new Headers({ "Accept-Encoding": "identity" });
		if (range) storageHeaders.set("Range", range);
		const file = await fetch(data.signedUrl, { headers: storageHeaders });
		if (!file.ok) throw new Error(`Storage responded with ${file.status}.`);
		const headers = new Headers({
			"Content-Type": recordFile.type ?? "application/octet-stream",
			"Content-Disposition": `${isDownload ? "attachment" : "inline"}; filename*=UTF-8''${encodeURIComponent(recordFile.name)}`,
			"Accept-Ranges": "bytes",
			"Cache-Control": "private, no-store",
			"X-Content-Type-Options": "nosniff",
		});
		for (const name of ["Content-Length", "Content-Range"]) {
			const value = file.headers.get(name);
			if (value) headers.set(name, value);
		}
		return new Response(file.body, { status: file.status, headers });
	} catch (error) {
		console.error("Reading patient record file failed:", error);
		return Response.json({ status: "failed", error: "File not found." }, { status: 404 });
	}
}
