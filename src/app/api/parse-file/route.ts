import { generateObject } from "ai";
import { PatientSchema } from "@/lib/schemas/patient-schema";
import path from "path";
import { existsSync } from "fs";
import { prepareFileInput } from "./utils/prepare-file-input";

export async function POST(req: Request) {
	try {
		const { filename } = await req.json();
		if (!filename) return Response.json({ error: "Missing file" }, { status: 400 });
		const filePath = path.resolve("patient-uploads", filename);
		if (!existsSync(filePath)) {
			return Response.json({ error: "File not found" }, { status: 404 });
		}

		const fileContent = await prepareFileInput(filePath);

		const prompt = `
	Extract resume info matching the schema:
  Do not use null.
  Use empty string ("") for missing text values.
  Use 0 for unknown numeric values.`;

		const result = await generateObject({
			model: "gpt-5",
			schema: PatientSchema,
			messages: [
				{
					role: "user",
					content: [{ type: "text", text: prompt }, fileContent],
				},
			],
		});
		console.log("✅ Extracted object:", result.object);

		return Response.json(result.object);
	} catch (error) {
		console.error("Error extracting resume", error);
		return Response.json({ status: "error", message: "Error extracting resume" }, { status: 500 });
	}
}
