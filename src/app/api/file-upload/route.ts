import { writeFileSync } from "fs";
import { mkdir } from "fs/promises";
import path from "path";

const uploadDir = path.resolve("uploads");

export async function POST(req: Request) {
	try {
		const formData = await req.formData();
		const file = formData.get("file") as File | null;
		if (!file) return Response.json({ error: "No file" }, { status: 400 });

		const buffer = Buffer.from(await file.arrayBuffer());
		const filePath = path.join(uploadDir, file.name);

		await mkdir(uploadDir, { recursive: true });

		saveFile(filePath, buffer);
		return Response.json({
			status: "success",
			filename: file.name,
			mimetype: file.type,
			size: file.size,
		});
	} catch (error) {
		console.log(error);
		return Response.json({ error: "Upload failed" }, { status: 500 });
	}
}

const saveFile = (filePath: string, buffer: Buffer) => {
	try {
		writeFileSync(filePath, buffer);
		console.log("File written successfully");
	} catch (err) {
		console.error("Failed to write file:", err);
	}
};
