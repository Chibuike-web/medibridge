import { gateway, generateText, Output, wrapLanguageModel } from "ai";
import { NextResponse } from "next/server";
import { devToolsMiddleware } from "@ai-sdk/devtools";
import { createWorker } from "tesseract.js";
import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";

import path from "node:path";
import { existsSync, readFileSync } from "node:fs";
import { patientSchema } from "./utils/patient-schema";
import { ExtractionResult } from "@/types/upload";

const model = wrapLanguageModel({
	model: gateway("anthropic/claude-haiku-4.5"),
	middleware: devToolsMiddleware(),
});

const results: ExtractionResult[] = [];

export async function POST(req: Request) {
	const worker = await createWorker("eng");
	results.length = 0;

	try {
		const { filenames } = await req.json();
		if (!filenames) return NextResponse.json({ error: "Missing file" }, { status: 400 });

		let text = "";
		for (const filename of filenames) {
			const uploadDir = path.resolve("patient-uploads");
			if (!existsSync(uploadDir)) {
				throw new Error("Directory does not exist");
			}
			const filePath = path.join(uploadDir, filename);
			if (!filePath) {
				results.push({
					name: filename,
					path: filePath || "",
					status: "failed",
					error: "Missing or invalid path",
					text: "",
				});
				continue;
			}

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
				} else if ([".docx", ".doc"].includes(fileExt)) {
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
				results.push({
					name: filename,
					path: filePath,
					status: "failed",
					text: "",
					error: error instanceof Error ? error.message : "OCR failed.",
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
			messages: [
				{
					role: "system",
					content: systemPrompt,
				},
				{
					role: "user",
					content: [{ type: "text", text: prompt }],
				},
			],
			output: Output.object({ schema: patientSchema }),
		});
		console.log("Extracted object:", output);

		return NextResponse.json({
			ok: true,
			parsed: successful.length,
			failed: failed.length,
			failedDocuments: failed,
			result: results,
			extracted: output,
		});
	} catch (error) {
		return NextResponse.json(
			{ error: error instanceof Error ? error.message : "Internal Server error" },
			{ status: 400 },
		);
	} finally {
		await worker.terminate();
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
