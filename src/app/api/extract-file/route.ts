import { gateway, generateText, Output, wrapLanguageModel } from "ai";
import { PatientSchema } from "@/app/(auth)/schemas/patient-schema";
import { NextResponse } from "next/server";
import { devToolsMiddleware } from "@ai-sdk/devtools";
import { createWorker } from "tesseract.js";
import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";

import path from "node:path";
import { existsSync, readFileSync } from "node:fs";

const model = wrapLanguageModel({
	model: gateway("anthropic/claude-haiku-4.5"),
	middleware: devToolsMiddleware(),
});

const results = [];

export async function POST(req: Request) {
	const worker = await createWorker("eng");

	try {
		const { filenames } = await req.json();
		if (!filenames) return NextResponse.json({ error: "Missing file" }, { status: 400 });

		// const fileContent: FilePart = {
		// 	type: "file",
		// 	mediaType,
		// 	data: buffer,
		// };

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
						text,
					});
				} else if ([".docx", ".doc"].includes(fileExt)) {
					const result = await mammoth.extractRawText({ path: filePath });

					const text = result.value;

					results.push({
						name: filename,
						path: filePath,
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
						text,
						hasText: text.trim().length > 0,
					});
					await parser.destroy();
				}
			} catch (error) {
				results.push({
					name: filename,
					path: filePath,
					text: "",
					error: error instanceof Error ? error.message : "OCR failed.",
				});
			}
		}

		const prompt = `
		Extract resume info matching the schema:
		Do not use null.
		Use empty string ("") for missing text values.
		Use 0 for unknown numeric values.`;

		const { output } = await generateText({
			model,
			messages: [
				{
					role: "user",
					content: [{ type: "text", text: prompt }],
				},
			],
			output: Output.object({ schema: PatientSchema }),
		});
		console.log("Extracted object:", output);

		return NextResponse.json(output);
	} catch (error) {
		return NextResponse.json(
			{ error: error instanceof Error ? error.message : "Internal Server error" },
			{ status: 400 },
		);
	} finally {
		await worker.terminate();
	}
}
