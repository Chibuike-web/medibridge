import path from "node:path";
import { eq } from "drizzle-orm";
import { hospitalDetails } from "@/db/schemas";
import { getSessionData } from "@/lib/api/get-session-data";
import { db } from "@/lib/better-auth/auth";
import { hospitalUploads } from "@/lib/storage/client";
import { uploadMetadataSchema } from "@/lib/storage/schemas";

const contentTypes = new Map([
	["pdf", "application/pdf"],
	["png", "image/png"],
	["jpg", "image/jpeg"],
	["doc", "application/msword"],
]);

export async function POST(req: Request) {
	try {
		const session = await getSessionData();
		if (!session?.user?.id) {
			return Response.json(
				{ status: "failed", error: "Sign in to upload a file." },
				{ status: 401 },
			);
		}
		if (!session.user.emailVerified) {
			return Response.json(
				{ status: "failed", error: "Verify your email before uploading a file." },
				{ status: 403 },
			);
		}

		const [existingHospital] = await db
			.select({ id: hospitalDetails.id })
			.from(hospitalDetails)
			.where(eq(hospitalDetails.hospitalOwnerEmail, session.user.email))
			.limit(1);
		if (existingHospital) {
			return Response.json(
				{ status: "failed", error: "Hospital details have already been submitted." },
				{ status: 409 },
			);
		}

		const parsed = uploadMetadataSchema.safeParse(await req.json().catch(() => null));
		if (!parsed.success) {
			return Response.json(
				{ status: "failed", error: "Choose a valid accreditation file up to 50 MB." },
				{ status: 400 },
			);
		}

		const extension = path.extname(parsed.data.name).slice(1).toLowerCase();
		const type = contentTypes.get(extension);
		if (!type) {
			return Response.json(
				{ status: "failed", error: "Invalid file type. Only PDF, PNG, JPG, and DOC are allowed." },
				{ status: 400 },
			);
		}

		const { data: previousFiles, error: listError } = await hospitalUploads.list(session.user.id, {
			limit: 100,
		});
		if (listError) throw listError;

		const key = `${session.user.id}/${crypto.randomUUID()}.${extension}`;
		const { data, error } = await hospitalUploads.createSignedUploadUrl(key, { upsert: false });
		if (error) throw error;

		if (previousFiles.length > 0) {
			const { error: removeError } = await hospitalUploads.remove(
				previousFiles.map((file) => `${session.user.id}/${file.name}`),
			);
			if (removeError) console.error("Removing replaced accreditation files failed:", removeError);
		}

		return Response.json(
			{ status: "success", signedUrl: data.signedUrl, key, type },
			{ headers: { "Cache-Control": "no-store" } },
		);
	} catch (error) {
		console.error("Preparing accreditation upload failed:", error);
		return Response.json(
			{ status: "failed", error: "We couldn’t upload your file. Please try again." },
			{ status: 500 },
		);
	}
}
