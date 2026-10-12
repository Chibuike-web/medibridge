import { readFile } from "node:fs/promises";
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
	_request: Request,
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
	const uploadRoot = path.resolve("patient-uploads", organizationId, extraction?.createdBy ?? "");
	const filePath = path.resolve(uploadRoot, documentId);

	if (
		!extraction ||
		!contentType ||
		path.dirname(filePath) !== uploadRoot ||
		!extraction.extractedData.some((record) => record.documentId === documentId)
	) {
		return Response.json({ status: "failed", error: "Document not found." }, { status: 404 });
	}

	try {
		const file = await readFile(filePath);
		return new Response(new Uint8Array(file), {
			headers: {
				"Content-Type": contentType,
				"Content-Disposition": fileExtension === ".docx" ? "attachment" : "inline",
				"Cache-Control": "private, no-store",
				"X-Content-Type-Options": "nosniff",
			},
		});
	} catch (error) {
		console.error(error);
		return Response.json({ status: "failed", error: "Document not found." }, { status: 404 });
	}
}
