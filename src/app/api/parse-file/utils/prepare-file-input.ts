import { readFileSync } from "fs";
import { inferMime } from "./infer-mime";
import { FilePart } from "ai";

export async function prepareFileInput(filePathOrUrl: string): Promise<FilePart> {
	const isUrl = filePathOrUrl.startsWith("https");
	if (isUrl) {
		return {
			type: "file",
			mediaType: inferMime(filePathOrUrl),
			data: filePathOrUrl,
		};
	}

	const fileBuffer = readFileSync(filePathOrUrl);
	return {
		type: "file",
		mediaType: inferMime(filePathOrUrl),
		data: fileBuffer,
	};
}
