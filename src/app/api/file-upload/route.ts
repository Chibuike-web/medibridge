import { supabase } from "@/lib/utils/supabase";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
	try {
		const formData = await req.formData();
		const file = formData.get("file") as File | null;
		if (!file) return Response.json({ error: "No file" }, { status: 400 });

		const buffer = Buffer.from(await file.arrayBuffer());

		const { data: info, error } = await supabase.storage
			.from("patients-uploads")
			.upload(file.name, buffer, {
				contentType: file.type,
				upsert: true,
			});

		if (error) {
			console.log(error);
			return Response.json({ status: "failed", error: "upload failed" }, { status: 500 });
		}

		const { data: signed, error: signedError } = await supabase.storage
			.from("patients-uploads")
			.createSignedUrl(file.name, 60 * 60);

		if (signedError) console.log(signedError);

		return NextResponse.json(
			{
				status: "success",
				filename: file.name,
				mimetype: file.type,
				size: file.size,
				url: signed?.signedUrl,
			},
			{ status: 200 },
		);
	} catch (error) {
		console.log(error);
		return NextResponse.json({ status: "failed", error }, { status: 500 });
	}
}
