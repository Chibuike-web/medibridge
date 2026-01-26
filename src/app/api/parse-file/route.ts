import { FilePart, generateText, Output } from "ai";
import { PatientSchema } from "@/lib/schemas/patient-schema";
import { supabase } from "../utils/supabase";

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

		const { data: meta } = await supabase.storage
			.from("patients-uploads")
			.list("", { search: filename });
		console.log(meta);

		const mediaType = meta?.[0]?.metadata?.mimetype;

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

		const { output } = await generateText({
			model: "gpt-5",
			messages: [
				{
					role: "user",
					content: [{ type: "text", text: prompt }, fileContent],
				},
			],
			output: Output.object({ schema: PatientSchema }),
		});
		console.log("✅ Extracted object:", output);

		return Response.json(output);
	} catch (error) {
		console.error("Error extracting resume", error);
		return Response.json({ status: "error", message: "Error extracting resume" }, { status: 500 });
	}
}
