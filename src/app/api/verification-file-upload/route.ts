import { mkdir, readdir, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { eq } from "drizzle-orm";
import { hospitalDetails } from "@/db/schemas";
import { getSessionData } from "@/lib/api/get-session-data";
import { db } from "@/lib/better-auth/auth";

const uploadDir = path.resolve("hospital-uploads");
const maxSizeInBytes = 50 * 1024 * 1024;
const allowedTypes = ["pdf", "png", "jpg", "doc"];

export async function POST(req: Request) {
	try {
		const session = await getSessionData();
		if (!session) {
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

		const formData = await req.formData();
		const file = formData.get("file");
		if (!(file instanceof File) || file.size === 0) {
			return Response.json({ status: "failed", error: "No file" }, { status: 400 });
		}

		const fileExtension = path.extname(file.name).slice(1).toLowerCase();
		if (!fileExtension || !allowedTypes.includes(fileExtension)) {
			return Response.json(
				{ status: "failed", error: "Invalid file type. Only PDF, PNG, JPG, and DOC are allowed." },
				{ status: 400 },
			);
		}

		if (file.size > maxSizeInBytes) {
			return Response.json(
				{ status: "failed", error: "File is too large. Maximum allowed size is 50MB." },
				{ status: 400 },
			);
		}

		const fileUploadId = crypto.randomUUID();
		const buffer = Buffer.from(await file.arrayBuffer());
		const userUploadDir = path.join(uploadDir, session.user.id);

		await mkdir(userUploadDir, { recursive: true });
		const previousFileNames = await readdir(userUploadDir);
		const filePath = path.join(userUploadDir, `${fileUploadId}.${fileExtension}`);
		const temporaryFilePath = path.join(uploadDir, `${fileUploadId}.tmp`);

		// Hospital submission must only see complete documents in the owner's folder.
		try {
			await writeFile(temporaryFilePath, buffer);
			await rename(temporaryFilePath, filePath);
			for (const previousFileName of previousFileNames) {
				await rm(path.join(userUploadDir, previousFileName), { force: true });
			}
		} finally {
			await rm(temporaryFilePath, { force: true });
		}
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
		return Response.json(
			{ status: "failed", error: "We couldn’t upload your file. Please try again." },
			{ status: 500 },
		);
	}
}
