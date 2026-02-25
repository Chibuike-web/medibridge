import { SavedFileTypes } from "@/store/use-upload-store";
import { NextResponse } from "next/server";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

export async function POST(req: Request) {
	try {
		const formData = await req.formData();

		const files = formData.getAll("file");

		if (files.length === 0) {
			return NextResponse.json({ error: "No file" }, { status: 400 });
		}
		const uploadDir = path.resolve("patient-uploads");

		if (!existsSync(uploadDir)) {
			mkdirSync(uploadDir, { recursive: true });
		}

		const uploadedFiles: SavedFileTypes[] = [];

		for (const file of files) {
			if (!(file instanceof File)) {
				throw new Error("Invalid upload");
			}
			const arrayBuffer = await file.arrayBuffer();
			const buffer = Buffer.from(arrayBuffer);
			const savePath = path.join(uploadDir, file.name);
			writeFileSync(savePath, buffer);

			uploadedFiles.push({
				id: crypto.randomUUID(),
				name: file.name,
				type: file.type,
				size: file.size,
				url: `patient-uploads/${file.name}`,
			});
		}

		return NextResponse.json(
			{ status: "success", message: "Files successfully uploaded", files: uploadedFiles },
			{ status: 200 },
		);
	} catch (error) {
		if (Error.isError(error)) {
			console.log(error.message);
			return NextResponse.json({ status: "failed", error: error.message }, { status: 500 });
		}
	}
}
