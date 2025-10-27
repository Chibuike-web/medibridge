import { writeFileSync } from "fs";

export const saveFile = (filePath: string, buffer: Buffer) => {
	try {
		writeFileSync(filePath, buffer);
		console.log("File written successfully");
	} catch (err) {
		console.error("Failed to write file:", err);
	}
};
