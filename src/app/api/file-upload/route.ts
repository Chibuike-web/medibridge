import { mkdir } from "node:fs/promises";
import path from "node:path";
import { saveFile } from "../utils/save-file";

const uploadDir = path.resolve("patient-uploads");

export async function POST(req: Request) {
	try {
		const formData = await req.formData();
		const file = formData.get("file") as File | null;
		if (!file) return Response.json({ error: "No file" }, { status: 400 });

		const buffer = Buffer.from(await file.arrayBuffer());
		const filePath = path.join(uploadDir, file.name);

		await mkdir(uploadDir, { recursive: true });

		saveFile(filePath, buffer);
		return Response.json(
			{
				status: "success",
				filename: file.name,
				mimetype: file.type,
				size: file.size,
			},
			{ status: 200 }
		);
	} catch (error) {
		console.log(error);
		return Response.json({ status: "failed" }, { status: 500 });
	}
}
