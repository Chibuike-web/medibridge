import { gateway, generateText, Output, wrapLanguageModel } from "ai";
import type { FilePart, TextPart } from "ai";
import { devToolsMiddleware } from "@ai-sdk/devtools";
import mammoth from "mammoth";
import path from "node:path";
import { existsSync, readFileSync } from "node:fs";
import { z } from "zod";
import { PatientRecordSchema } from "@/features/patients/schemas/patient-schema";
import { ExtractionResult } from "@/lib/types/upload";
import { getSessionData } from "@/lib/api/get-session-data";
import { getOrganizationId } from "@/lib/api/get-organization-id";

const model =
	process.env.NODE_ENV === "development"
		? wrapLanguageModel({
				model: gateway("openai/gpt-5.6-luna"),
				middleware: devToolsMiddleware(),
			})
		: gateway("openai/gpt-5.6-luna");

const mediaTypes: Record<string, string> = {
	".png": "image/png",
	".jpg": "image/jpeg",
	".jpeg": "image/jpeg",
	".webp": "image/webp",
	".pdf": "application/pdf",
};

export async function POST(req: Request) {
	const session = await getSessionData();

	if (!session?.user?.id) {
		return Response.json(
			{ status: "failed", error: "Sign in to extract patient records." },
			{ status: 401 },
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
		const content: Array<TextPart | FilePart> = [
			{ type: "text", text: "Extract patient data per document." },
		];

		for (const filename of filenames) {
			const filePath = path.join(uploadDir, filename);

			const fileExt = path.extname(filePath).toLowerCase();

			try {
				if (fileExt === ".docx") {
					// Models don't accept Word files as file input, so DOCX is sent as text.
					const result = await mammoth.extractRawText({ path: filePath });

					content.push({ type: "text", text: `Document id: ${filename}\n\n${result.value}` });
					results.push({ name: filename, path: filePath, status: "success" });
				} else if (mediaTypes[fileExt]) {
					content.push(
						{ type: "text", text: `Document id: ${filename}` },
						{
							type: "file",
							data: readFileSync(filePath),
							mediaType: mediaTypes[fileExt],
							filename,
						},
					);
					results.push({ name: filename, path: filePath, status: "success" });
				}
			} catch (error) {
				console.error(error);
				results.push({
					name: filename,
					path: filePath,
					status: "failed",
					error: "We couldn’t read this uploaded file. Please try again.",
				});
			}
		}

		const successful = results.filter((result) => result.status === "success");
		const failed = results.filter((result) => result.status === "failed");

		const { output } = await generateText({
			model,
			instructions: systemPrompt,
			messages: [{ role: "user", content }],
			output: Output.array({
				element: PatientRecordSchema.extend({ documentId: z.string() }),
			}),
		});

		return Response.json({
			status: "success",
			parsed: successful.length,
			failed: failed.length,
			failedDocuments: failed,
			result: results,
			extracted: output,
		});
	} catch (error) {
		console.error(error);
		return Response.json(
			{ status: "failed", error: "We couldn’t extract patient information. Please try again." },
			{ status: 400 },
		);
	}
}

const systemPrompt = `You extract patient data per document.

Rules:
- Each document is introduced by its id.
- Set documentId on every record to the id of the document it came from.
- Never merge documents.
- Never lose document ids.
- Use null for any value the document does not state.
- Never use "" or 0 as a placeholder.`;
