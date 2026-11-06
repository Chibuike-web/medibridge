import { getSessionData } from "@/lib/api/get-session-data";
import { getOrganizationId } from "@/lib/api/get-organization-id";
import { extractPatientDocumentsService } from "@/services/patient/extract-patient-documents-service";
import { retryPatientExtractionService } from "@/services/patient/retry-patient-extraction-service";
import { savePatientExtractionService } from "@/services/patient/save-patient-extraction-service";

export async function POST(req: Request) {
	const session = await getSessionData();

	if (!session?.user?.id) {
		return Response.json(
			{ status: "failed", error: "Sign in to extract patient records." },
			{ status: 401 },
		);
	}

	if (!session.user.emailVerified) {
		return Response.json(
			{ status: "failed", error: "Verify your email before extracting patient records." },
			{ status: 403 },
		);
	}

	const organizationId = await getOrganizationId();

	if (!organizationId) {
		return Response.json(
			{
				status: "failed",
				error: "Your hospital must be verified before you can extract patient records.",
			},
			{ status: 403 },
		);
	}
	try {
		const { files, extractionId } = await req.json();
		if (!Array.isArray(files) || files.length === 0)
			return Response.json({ status: "failed", error: "Missing file" }, { status: 400 });
		if (
			files.some(
				(file) =>
					typeof file?.storedName !== "string" ||
					!file.storedName ||
					/[\\/:*?"<>|%#]|[^\u0020-\uffff]/.test(file.storedName) ||
					/[. ]$/.test(file.storedName) ||
					typeof file.name !== "string" ||
					!file.name ||
					file.name.length > 255,
			)
		) {
			return Response.json(
				{ status: "failed", error: "Invalid upload filename." },
				{ status: 400 },
			);
		}
		const uploadPrefix = `${organizationId}/${session.user.id}`;
		if (typeof extractionId === "string") {
			const retriedExtraction = await retryPatientExtractionService(
				extractionId,
				files.map((file) => file.storedName),
			);

			if (retriedExtraction.status !== "success") {
				return Response.json(retriedExtraction, { status: 400 });
			}

			return Response.json({
				status: "success",
				extractionId,
				hasReadyDocument: retriedExtraction.documents.some(
					(document) => document.status === "ready",
				),
			});
		}

		const documents = await extractPatientDocumentsService(uploadPrefix, files);
		const savedExtraction = await savePatientExtractionService(documents);

		if (savedExtraction.status === "failed") {
			return Response.json(savedExtraction, { status: 500 });
		}

		return Response.json({
			status: "success",
			extractionId: savedExtraction.extractionId,
			hasReadyDocument: documents.some((document) => document.status === "ready"),
		});
	} catch (error) {
		console.error(error);
		return Response.json(
			{ status: "failed", error: "We couldn’t extract patient information. Please try again." },
			{ status: 400 },
		);
	}
}
