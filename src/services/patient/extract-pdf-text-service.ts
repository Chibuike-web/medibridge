import "server-only";

import { PDFParse } from "pdf-parse";
import type { ExtractTextResult, OcrWorker } from "./types";

export async function extractPdfText(
	buffer: Buffer,
	worker: OcrWorker,
): Promise<ExtractTextResult> {
	try {
		const parser = new PDFParse({ data: buffer });

		try {
			const info = await parser.getInfo({ parsePageInfo: true });
			const pageTexts: string[] = [];

			for (let pageNumber = 1; pageNumber <= info.total; pageNumber++) {
				const pageResult = await parser.getText({ partial: [pageNumber] });
				const text = pageResult.text;
				const validCharacters = text.replace(/[^a-zA-Z0-9\s.,:/()-]/g, "").length;
				const validityRatio = text.length ? validCharacters / text.length : 0;
				const isGoodText = text.length > 120 && validityRatio > 0.7;

				if (isGoodText) {
					pageTexts.push(text);
					continue;
				}

				const screenshot = await parser.getScreenshot({
					partial: [pageNumber],
					scale: 2.5,
					imageBuffer: true,
					imageDataUrl: false,
				});
				const pageBuffer = Buffer.from(screenshot.pages[0].data);
				const { data } = await worker.recognize(pageBuffer);
				pageTexts.push(data.text.trim());
			}

			return { status: "success", text: pageTexts.join("\n\n") };
		} finally {
			await parser.destroy();
		}
	} catch (error) {
		console.error("PDF text extraction failed:", error);
		return { status: "failed", error: "We couldn’t read this PDF. Please try again." };
	}
}
