import { FilePart, generateObject } from "ai";
import { PatientSchema } from "@/lib/schemas/patient-schema";
import { supabase } from "../file-upload/utils/supabase";

export async function POST(req: Request) {
	try {
		const { filename } = await req.json();
		if (!filename) return Response.json({ error: "Missing file" }, { status: 400 });

		const { data, error } = await supabase.storage.from("patients-uploads").download(filename);

		if (error || !data) {
			console.error(error);
			return Response.json(
				{ status: "failed", error: "File not found in storage" },
				{ status: 404 }
			);
		}
		const mediaType = data.type;

		const buffer = Buffer.from(await data.arrayBuffer());

		const fileContent: FilePart = {
			type: "file",
			mediaType,
			data: buffer,
		};

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
