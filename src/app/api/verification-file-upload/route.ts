import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { eq } from "drizzle-orm";
import { hospitalDetails } from "@/db/schemas";
import { getSessionData } from "@/lib/api/get-session-data";
import { db } from "@/lib/better-auth/auth";

const uploadDir = path.resolve("hospital-uploads");
const MAXSIZEINBYTES = 50 * 1024 * 1024;
const allowedTypes = ["pdf", "png", "jpg", "doc"];

export async function POST(req: Request) {
	try {
		const session = await getSessionData();
		if (!session) {
			return Response.json({ error: "Sign in to upload a file." }, { status: 401 });
		}
		if (!session.user.emailVerified) {
			return Response.json(
				{ error: "Verify your email before uploading a file." },
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
				{ error: "Hospital details have already been submitted." },
				{ status: 409 },
			);
		}

		const formData = await req.formData();
		const file = formData.get("file");
		if (!(file instanceof File) || file.size === 0) {
			return Response.json({ error: "No file" }, { status: 400 });
		}

		const fileExtension = file.name.split(".").pop()?.toLowerCase();
		if (!fileExtension || !allowedTypes.includes(fileExtension)) {
			return Response.json(
				{ error: "Invalid file type. Only PDF, PNG, JPG, and DOC are allowed." },
				{ status: 400 },
			);
		}

		if (file.size > MAXSIZEINBYTES) {
			return Response.json(
				{ error: "File is too large. Maximum allowed size is 50MB." },
				{ status: 400 },
			);
		}

		const fileUploadId = crypto.randomUUID();
		const buffer = Buffer.from(await file.arrayBuffer());
		const userUploadDir = path.join(uploadDir, session.user.id);

		// Keep only the latest upload so hospital creation can link a single document.
		await rm(userUploadDir, { recursive: true, force: true });
		await mkdir(userUploadDir, { recursive: true });

		const filePath = path.join(userUploadDir, `${fileUploadId}.${fileExtension}`);

		await writeFile(filePath, buffer);
		return Response.json(
			{
				status: "success",
				filename: file.name,
				mimetype: file.type,
				size: file.size,
			},
			{ status: 200 },
		);
	} catch (error) {
		console.error(error);
		return Response.json({ status: "failed" }, { status: 500 });
	}
}
