import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { getOrganizationId } from "@/lib/api/get-organization-id";
import { getSessionData } from "@/lib/api/get-session-data";
import type { SavedFileTypes } from "@/lib/types/upload";

const maxSizeInBytes = 50 * 1024 * 1024;
const allowedTypes = ["pdf", "png", "jpg", "jpeg", "docx"];

export async function POST(req: Request) {
	try {
		const session = await getSessionData();
		if (!session?.user?.id) {
			return Response.json(
				{ status: "failed", error: "Sign in to upload patient records." },
				{ status: 401 },
			);
		}

		const organizationId = await getOrganizationId();
		if (!organizationId) {
			return Response.json(
				{
					status: "failed",
					error: "Your hospital must be verified before you can upload patient records.",
				},
				{ status: 403 },
			);
		}
		const formData = await req.formData();

		const files = formData.getAll("file");

		if (files.length === 0) {
			return Response.json({ status: "failed", error: "No file" }, { status: 400 });
		}
		for (const file of files) {
			if (!(file instanceof File) || file.size === 0) {
				return Response.json({ status: "failed", error: "No file" }, { status: 400 });
			}
			const fileExtension = path.extname(file.name).slice(1).toLowerCase();
			if (!fileExtension || !allowedTypes.includes(fileExtension)) {
				return Response.json(
					{
						status: "failed",
						error: "Invalid file type. Only PDF, PNG, JPG, and DOCX are allowed.",
					},
					{ status: 400 },
				);
			}
			if (file.size > maxSizeInBytes) {
				return Response.json(
					{ status: "failed", error: "File is too large. Maximum allowed size is 50MB." },
					{ status: 400 },
				);
			}
		}
		const uploadDir = path.resolve("patient-uploads", organizationId, session.user.id);

		await mkdir(uploadDir, { recursive: true });

		const uploadedFiles: SavedFileTypes[] = [];

		for (const file of files) {
			if (!(file instanceof File)) {
				return Response.json({ status: "failed", error: "Invalid upload." }, { status: 400 });
			}
			const fileUploadId = crypto.randomUUID();
			const fileExtension = path.extname(file.name).slice(1).toLowerCase();
			const storedName = `${fileUploadId}.${fileExtension}`;
			const arrayBuffer = await file.arrayBuffer();
			const buffer = Buffer.from(arrayBuffer);
			const savePath = path.join(uploadDir, storedName);
			await writeFile(savePath, buffer);

			uploadedFiles.push({
				id: fileUploadId,
				name: file.name,
				storedName,
				type: file.type,
				size: file.size,
				url: `patient-uploads/${organizationId}/${session.user.id}/${storedName}`,
			});
		}

		return Response.json(
			{ status: "success", message: "Files successfully uploaded", files: uploadedFiles },
			{ status: 200 },
		);
	} catch (error) {
		console.error(error);
		return Response.json(
			{ status: "failed", error: "We couldn’t upload your files. Please try again." },
			{ status: 500 },
		);
	}
}
