import { gateway, generateText, Output, wrapLanguageModel } from "ai";
import { devToolsMiddleware } from "@ai-sdk/devtools";
import { createWorker } from "tesseract.js";
import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";
import path from "node:path";
import { existsSync, readFileSync } from "node:fs";
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

		let text = "";
		for (const filename of filenames) {
			const filePath = path.join(uploadDir, filename);

			const fileExt = path.extname(filePath).toLowerCase();

			try {
				if ([".png", ".jpg", ".jpeg", ".webp"].includes(fileExt)) {
					const { data } = await worker.recognize(filePath);
					text = data.text.trim();

					results.push({
						name: filename,
						path: filePath,
						status: "success",
						text,
					});
				} else if (fileExt === ".docx") {
					const result = await mammoth.extractRawText({ path: filePath });
					const text = result.value;

					results.push({
						name: filename,
						path: filePath,
						status: "success",
						text,
					});
				} else if (fileExt === ".pdf") {
					const buffer = readFileSync(filePath);
					const parser = new PDFParse({ data: buffer });
					const info = await parser.getInfo({ parsePageInfo: true });
					const totalPages = info.total;
					const pageTexts = [];

					for (let i = 0; i < totalPages; i++) {
						const pageResult = await parser.getText({ partial: [i + 1] });
						const cleaned = pageResult.text;
						const textLength = cleaned.length;
						const validChars = cleaned.replace(/[^a-zA-Z0-9\s.,:/()-]/g, "").length;
						const validityRatio = textLength ? validChars / textLength : 0;
						const isGoodText = textLength > 120 && validityRatio > 0.7;

						if (isGoodText) {
							pageTexts.push(cleaned);
							continue;
						}

						const screenshot = await parser.getScreenshot({
							partial: [i + 1],
							scale: 2.5,
							imageBuffer: true,
							imageDataUrl: false,
						});

						const pageBuffer = Buffer.from(screenshot.pages[0].data);
						const { data } = await worker.recognize(pageBuffer);
						pageTexts.push(data.text.trim());
					}

					text = pageTexts.join("\n\n");
					results.push({
						name: filename,
						path: filePath,
						status: "success",
						text,
					});
					await parser.destroy();
				}
			} catch (error) {
				console.error(error);
				results.push({
					name: filename,
					path: filePath,
					status: "failed",
					text: "",
					error: "We couldn’t read this uploaded file. Please try again.",
				});
			}
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
			output: Output.array({ element: PatientRecordSchema }),
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
	} finally {
		await worker?.terminate();
	}
}

const systemPrompt = `You extract patient data per document.

Rules:
- Each document has an id.
- You MUST return extracted data grouped by document id.
- Never merge documents.
- Never lose document ids.
- Never return null.
Use empty string "" for missing text.
Use 0 for unknown numeric values.`;
