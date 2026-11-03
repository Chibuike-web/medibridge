import { patientUploads } from "@/lib/storage/client";
import { and, eq, inArray } from "drizzle-orm";
import { patientLabTest, patientLabTestFile } from "@/db/schemas";
import { recordFileExtensions } from "@/features/patients/server/schemas";
import { hasVerifiedExternalAccessSession } from "@/lib/api/external-access-session";
import { getSharedRecord } from "@/lib/api/get-shared-record";
import { db } from "@/lib/better-auth/auth";

export async function GET(
	request: Request,
	context: RouteContext<"/api/shared-record-files/[accessId]/lab/[fileId]">,
) {
	const { accessId, fileId } = await context.params;
	const hasVerifiedAccessSession = await hasVerifiedExternalAccessSession(accessId);

	if (!hasVerifiedAccessSession) {
		return Response.json(
			{ status: "failed", error: "Verify your access to view this shared file." },
			{ status: 401 },
		);
	}

	const sharedRecord = await getSharedRecord(accessId);

	if (!sharedRecord) {
		return Response.json({ status: "failed", error: "File not found." }, { status: 404 });
	}

	const sharedRecordIds = sharedRecord.selectedRecordIds
		.filter((record) => record.section === "lab-tests")
		.map((record) => record.recordId);
	const [recordFile] = await db
		.select({ name: patientLabTestFile.name, type: patientLabTestFile.type })
		.from(patientLabTestFile)
		.innerJoin(patientLabTest, eq(patientLabTestFile.parentRecordId, patientLabTest.id))
		.where(
			and(
				eq(patientLabTestFile.id, fileId),
				eq(patientLabTest.patientId, sharedRecord.patientId),
				inArray(patientLabTest.id, sharedRecordIds),
			),
		)
		.limit(1);
	const extension = recordFileExtensions[recordFile?.type as keyof typeof recordFileExtensions];

	if (!recordFile || !extension) {
		return Response.json({ status: "failed", error: "File not found." }, { status: 404 });
	}

	const isDownload = new URL(request.url).searchParams.has("download");

	try {
		const key = `${sharedRecord.organizationId}/record-files/${fileId}${extension}`;
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
		console.error("Reading shared record file failed:", error);
		return Response.json({ status: "failed", error: "File not found." }, { status: 404 });
	}
}
