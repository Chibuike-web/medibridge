import { FilePart, gateway, generateText, Output, wrapLanguageModel } from "ai";
import { PatientSchema } from "@/app/(auth)/schemas/patient-schema";
import { NextResponse } from "next/server";
import { devToolsMiddleware } from "@ai-sdk/devtools";
import path from "node:path";
import { existsSync, readFileSync } from "node:fs";

const model = wrapLanguageModel({
	model: gateway("anthropic/claude-haiku-4.5"),
	middleware: devToolsMiddleware(),
});

export async function POST(req: Request) {
	try {
		const { filenames } = await req.json();
		if (!filenames) return NextResponse.json({ error: "Missing file" }, { status: 400 });

		// const fileContent: FilePart = {
		// 	type: "file",
		// 	mediaType,
		// 	data: buffer,
		// };
		for (const filename of filenames) {
			const uploadDir = path.resolve("patient-uploads");
			if (!existsSync(uploadDir)) {
				throw new Error("Directory does not exist");
			}
			const filePath = path.join(uploadDir, filename);
			const fileBuffer = readFileSync(filePath);
		}

		const prompt = `
		Extract resume info matching the schema:
		Do not use null.
		Use empty string ("") for missing text values.
		Use 0 for unknown numeric values.`;

		const { output } = await generateText({
			model,
			messages: [
				{
					role: "user",
					content: [{ type: "text", text: prompt }, fileContent],
				},
			],
			output: Output.object({ schema: PatientSchema }),
		});
		console.log("✅ Extracted object:", output);

		return NextResponse.json(output);
	} catch (error) {
		console.error("Error extracting resume", error);
		return NextResponse.json(
			{ status: "error", message: "Error extracting resume" },
			{ status: 500 },
		);
	}
}
