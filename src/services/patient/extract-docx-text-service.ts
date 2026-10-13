import "server-only";

import mammoth from "mammoth";
import type { ExtractTextResult } from "./types";

export async function extractDocxText(filePath: string): Promise<ExtractTextResult> {
	try {
		const result = await mammoth.extractRawText({ path: filePath });
		return { status: "success", text: result.value };
	} catch (error) {
		console.error("DOCX text extraction failed:", error);
		return { status: "failed", error: "We couldn’t read this Word document. Please try again." };
	}
}
