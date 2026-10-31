import "server-only";

import mammoth from "mammoth";
import type { ExtractTextResult } from "./types";

export async function extractDocxText(buffer: Buffer): Promise<ExtractTextResult> {
	try {
		const result = await mammoth.extractRawText({ buffer });
		return { status: "success", text: result.value };
	} catch (error) {
		console.error("DOCX text extraction failed:", error);
		return { status: "failed", error: "We couldn’t read this Word document. Please try again." };
	}
}
