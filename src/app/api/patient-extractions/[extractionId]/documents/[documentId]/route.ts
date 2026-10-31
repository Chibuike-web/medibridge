import { patientUploads } from "@/lib/storage/client";
import path from "node:path";
import { getPatientExtractionById } from "@/lib/api/get-patient-extraction-by-id";
import { getSessionData } from "@/lib/api/get-session-data";
import { getOrganizationId } from "@/lib/api/get-organization-id";

const documentContentTypes: Record<string, string> = {
	".pdf": "application/pdf",
	".png": "image/png",
	".jpg": "image/jpeg",
	".jpeg": "image/jpeg",
	".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

export async function GET(
	request: Request,
	context: RouteContext<"/api/patient-extractions/[extractionId]/documents/[documentId]">,
) {
	const session = await getSessionData();

	if (!session?.user?.id) {
		return Response.json(
			{ status: "failed", error: "Sign in to view patient documents." },
			{ status: 401 },
		);
	}

	if (!session.user.emailVerified) {
		return Response.json(
			{ status: "failed", error: "Verify your email before you can view patient documents." },
			{ status: 403 },
		);
	}

	const organizationId = await getOrganizationId();

	if (!organizationId) {
		return Response.json(
			{
				status: "failed",
				error: "Your hospital must be verified before you can view patient documents.",
			},
			{ status: 403 },
		);
	}

	const { extractionId, documentId } = await context.params;
	const extraction = await getPatientExtractionById(extractionId);
	const fileExtension = path.extname(documentId).toLowerCase();
	const contentType = documentContentTypes[fileExtension];

	if (
		!extraction ||
		!contentType ||
		documentId !== path.posix.basename(documentId) ||
		/[\\:]/.test(documentId) ||
		!extraction.extractedData.some((record) => record.documentId === documentId)
	) {
		return Response.json({ status: "failed", error: "Document not found." }, { status: 404 });
	}

	try {
		const key = `${organizationId}/${extraction.createdBy}/${documentId}`;
		const { data, error } = await patientUploads.createSignedUrl(key, 60);
		if (error) throw error;
		const range = request.headers.get("range");
		const file = await fetch(data.signedUrl, {
			headers: { "Accept-Encoding": "identity", ...(range && { Range: range }) },
		});
		if (!file.ok) throw new Error(`Storage responded with ${file.status}.`);
		const headers = new Headers({
			"Content-Type": contentType,
			"Content-Disposition": fileExtension === ".docx" ? "attachment" : "inline",
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
		console.error(error);
		return Response.json({ status: "failed", error: "Document not found." }, { status: 404 });
	}
}
