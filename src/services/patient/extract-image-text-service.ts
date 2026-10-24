import "server-only";

import type { ExtractTextResult, OcrWorker } from "./types";

export async function extractImageText(
	buffer: Buffer,
	worker: OcrWorker,
): Promise<ExtractTextResult> {
	try {
		const { data } = await worker.recognize(buffer);
		return { status: "success", text: data.text.trim() };
	} catch (error) {
		console.error("Image text extraction failed:", error);
		return { status: "failed", error: "We couldn’t read this image. Please try again." };
	}
}
