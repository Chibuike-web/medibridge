import { PatientSchema } from "@/lib/schemas/patient-schema";
import { existsSync, readFileSync } from "fs";
import path from "path";
import z from "zod";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export async function POST(req: Request) {
	const { filename } = await req.json();
	if (!filename) return Response.json({ error: "Missing file" }, { status: 400 });
	const filePath = path.resolve("patient-uploads", filename);
	if (!existsSync(filePath)) {
		return Response.json({ error: "File not found" }, { status: 404 });
	}

	const fileBuffer = readFileSync(filePath);
	const base64Data = fileBuffer.toString("base64");

	const schemaString = JSON.stringify(PatientSchema.shape, null, 2);

	const payload = {
		contents: [
			{
				parts: [
					{
						text: `
Extract resume info and return *strictly valid JSON* matching this schema:
${schemaString}
- Do not use null. 
- Use empty string ("") for missing text values.
- Use 0 for unknown numeric values.
Return JSON only, no markdown formatting.
`,
					},
					{
						inlineData: {
							mimeType: "application/pdf",
							data: base64Data,
						},
					},
				],
			},
		],
	};

	const res = await fetch(
		`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
		{
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(payload),
		}
	);

	const data = await res.json();
	const textResponse = data?.candidates?.[0]?.content?.parts?.[0]?.text;
	const cleanedResponse = textResponse.replace(/```json|```/g, "").trim();
	console.log(cleanedResponse);

	try {
		const json = JSON.parse(cleanedResponse);
		const parsed = PatientSchema.safeParse(json);

		if (!parsed.success) {
			console.error("Schema validation failed:", z.treeifyError(parsed.error));
			return Response.json(
				{
					status: "error",
					message: "Schema validation failed",
					raw: json,
					errors: z.treeifyError(parsed.error),
				},
				{ status: 422 }
			);
		}

		return Response.json({ status: "success", data: parsed.data }, { status: 200 });
	} catch (err) {
		console.error("Invalid JSON output:", textResponse);
		return Response.json(
			{ status: "error", message: "Invalid JSON from model", raw: textResponse },
			{ status: 500 }
		);
	}
}
