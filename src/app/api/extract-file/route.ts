import { gateway, generateText, Output, wrapLanguageModel } from "ai";
import { devToolsMiddleware } from "@ai-sdk/devtools";
import { createWorker } from "tesseract.js";
import path from "node:path";
import { existsSync } from "node:fs";
import { z } from "zod";
import { PatientRecordSchema } from "@/features/patients/schemas/patient-schema";
import { ExtractionResult } from "@/lib/types/upload";
import { getSessionData } from "@/lib/api/get-session-data";
import { getOrganizationId } from "@/lib/api/get-organization-id";
import {
	extractImageText,
	extractDocxText,
	extractPdfText,
	type ExtractTextResult,
} from "@/services/patient/extract-file-text-service";
import { savePatientExtractionService } from "@/services/patient/save-patient-extraction-service";

const model =
	process.env.NODE_ENV === "development"
		? wrapLanguageModel({
				model: gateway("openai/gpt-5.6-luna"),
				middleware: devToolsMiddleware(),
			})
		: gateway("openai/gpt-5.6-luna");

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
	const results: ExtractionResult[] = [];
	let worker: Awaited<ReturnType<typeof createWorker>> | undefined;

	try {
		const { filenames } = await req.json();
		if (!Array.isArray(filenames) || filenames.length === 0)
			return Response.json({ status: "failed", error: "Missing file" }, { status: 400 });
		if (
			filenames.some(
				(filename) =>
					typeof filename !== "string" ||
					!filename ||
					/[\\/:*?"<>|]|[^\u0020-\uffff]/.test(filename) ||
					/[. ]$/.test(filename),
			)
		) {
			return Response.json(
				{ status: "failed", error: "Invalid upload filename." },
				{ status: 400 },
			);
		}
		const uploadDir = path.resolve("patient-uploads", organizationId, session.user.id);
		if (!existsSync(uploadDir)) {
			return Response.json(
				{ status: "failed", error: "No uploaded files were found." },
				{ status: 400 },
			);
		}
		worker = await createWorker("eng");

		for (const filename of filenames) {
			const filePath = path.join(uploadDir, filename);
			const fileExtension = path.extname(filePath).toLowerCase();
			let extractionResult: ExtractTextResult;

			if ([".png", ".jpg", ".jpeg", ".webp"].includes(fileExtension)) {
				extractionResult = await extractImageText(filePath, worker);
			} else if (fileExtension === ".docx") {
				extractionResult = await extractDocxText(filePath);
			} else if (fileExtension === ".pdf") {
				extractionResult = await extractPdfText(filePath, worker);
			} else {
				extractionResult = { status: "failed", error: "Unsupported file type." };
			}

			if (extractionResult.status === "failed") {
				results.push({
					name: filename,
					path: filePath,
					status: "failed",
					text: "",
					error: extractionResult.error,
				});
				continue;
			}

			results.push({
				name: filename,
				path: filePath,
				status: "success",
				text: extractionResult.text,
			});
		}

		const successful = results.filter((result) => result.status === "success");
		const failed = results.filter((result) => result.status === "failed");
		const documents = successful.map((r) => ({
			id: r.name,
			filename: r.name,
			content: r.text,
		}));

		const prompt = `
			Documents:
${JSON.stringify(documents, null, 2)}

Extract patient data per document.`;

		const { output } = await generateText({
			model,
			instructions: systemPrompt,
			messages: [
				{
					role: "user",
					content: [{ type: "text", text: prompt }],
				},
			],
			output: Output.array({
				element: PatientRecordSchema.extend({ documentId: z.string() }),
			}),
		});

		const savedExtraction = await savePatientExtractionService(output);

		if (savedExtraction.status === "failed") {
			return Response.json(savedExtraction, { status: 500 });
		}

		return Response.json({
			status: "success",
			extractionId: savedExtraction.extractionId,
			parsed: successful.length,
			failed: failed.length,
			failedDocuments: failed,
			result: results,
		});
	} catch (error) {
		console.error(error);
		return Response.json(
			{ status: "failed", error: "We couldn’t extract patient information. Please try again." },
			{ status: 400 },
		);
	} finally {
		await worker?.terminate();
	}
}

const systemPrompt = `You extract patient data per document.

Rules:
- Each document has an id.
- Set documentId on every record to the id of the document it came from.
- Never merge documents.
- Never lose document ids.
- Use null for any value the document does not state.
- Never use "" or 0 as a placeholder.`;
