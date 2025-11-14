import { writeFileSync } from "fs";

export async function saveFile(filePath: string, buffer: Buffer) {
	try {
		writeFileSync(filePath, buffer);
	} catch (error) {
		console.error("Failed to save file:", error);
	}
}
