import "server-only";
import path from "node:path";
import { tmpdir } from "node:os";
import { patientUploads } from "@/lib/storage/client";
import { gateway, generateText, Output, wrapLanguageModel } from "ai";
import { devToolsMiddleware } from "@ai-sdk/devtools";
import { createWorker } from "tesseract.js";
import { z } from "zod";
import type { PatientExtractionDocument } from "@/db/schemas/patient";
import {
	PatientRecordSchema,
	type PatientRecord,
} from "@/features/patients/schemas/patient-schema";
import { extractImageText } from "./extract-image-text-service";
import { extractDocxText } from "./extract-docx-text-service";
import { extractPdfText } from "./extract-pdf-text-service";
import type { ExtractTextResult } from "./types";

const model =
	process.env.NODE_ENV === "development"
		? wrapLanguageModel({
				model: gateway("openai/gpt-5.2"),
				middleware: devToolsMiddleware(),
			})
		: gateway("openai/gpt-5.2");

export async function extractPatientDocumentsService(
	uploadPrefix: string,
	filenames: string[],
): Promise<PatientExtractionDocument[]> {
	const worker = await createWorker("eng", 1, { cachePath: tmpdir() });
	const documents: { id: string; filename: string; content: string }[] = [];

	try {
		for (const filename of filenames) {
			const key = `${uploadPrefix}/${filename}`;
			const { data: storedFile, error: infoError } = await patientUploads.info(key);
			if (infoError || !storedFile.size || storedFile.size > 50 * 1024 * 1024) {
				console.error("Patient document is missing or too large:", infoError);
				continue;
			}
			const { data, error } = await patientUploads.download(key);
			if (error) {
				console.error("Reading patient document failed:", error);
				continue;
			}
			const buffer = Buffer.from(await data.arrayBuffer());
			const fileExtension = path.extname(filename).toLowerCase();
			let extractionResult: ExtractTextResult;

			if ([".png", ".jpg", ".jpeg", ".webp"].includes(fileExtension)) {
				extractionResult = await extractImageText(buffer, worker);
			} else if (fileExtension === ".docx") {
				extractionResult = await extractDocxText(buffer);
			} else if (fileExtension === ".pdf") {
				extractionResult = await extractPdfText(buffer, worker);
			} else {
				extractionResult = { status: "failed", error: "Unsupported file type." };
			}

			if (extractionResult.status === "success") {
				documents.push({ id: filename, filename, content: extractionResult.text });
			}
		}
	} finally {
		await worker.terminate();
	}

	let records: (PatientRecord & { documentId: string })[] = [];

	if (documents.length > 0) {
		try {
			const { output } = await generateText({
				model,
				instructions: systemPrompt,
				messages: [
					{
						role: "user",
						content: [
							{
								type: "text",
								text: `Documents:\n${JSON.stringify(documents, null, 2)}\n\nExtract patient data per document.`,
							},
						],
					},
				],
				output: Output.array({
					element: PatientRecordSchema.extend({ documentId: z.string() }),
				}),
			});
			records = output;
		} catch (error) {
			console.error("Patient record extraction failed:", error);
		}
	}

	return filenames.map((filename) => {
		const record = records.find((record) => record.documentId === filename);
		if (!record) {
			return { documentId: filename, status: "failed", patient: null };
		}
		const { documentId, ...patient } = record;
		return { documentId, status: "ready", patient };
	});
}

const systemPrompt = `You extract patient data per document.

Rules:
- Each document has an id.
- Set documentId on every record to the id of the document it came from.
- Never merge documents.
- Never lose document ids.
- Use null for any value the document does not state.
- Never use "" or 0 as a placeholder.`;
