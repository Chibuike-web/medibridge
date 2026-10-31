import path from "node:path";
import { z } from "zod";
import { getOrganizationId } from "@/lib/api/get-organization-id";
import { getSessionData } from "@/lib/api/get-session-data";
import { patientUploads } from "@/lib/storage/client";
import { uploadMetadataSchema } from "@/lib/storage/schemas";

const contentTypes = new Map([
	["pdf", "application/pdf"],
	["png", "image/png"],
	["jpg", "image/jpeg"],
	["jpeg", "image/jpeg"],
	["docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
]);

export async function POST(req: Request) {
	try {
		const session = await getSessionData();
		if (!session?.user?.id) {
			return Response.json(
				{ status: "failed", error: "Sign in to upload patient records." },
				{ status: 401 },
			);
		}

		if (!session.user.emailVerified) {
			return Response.json(
				{ status: "failed", error: "Verify your email before uploading patient records." },
				{ status: 403 },
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

		const parsed = z
			.object({
				files: z
					.array(uploadMetadataSchema.extend({ clientId: z.string().min(1) }))
					.min(1)
					.max(20),
			})
			.safeParse(await req.json().catch(() => null));
		if (!parsed.success) {
			return Response.json(
				{ status: "failed", error: "Select up to 20 valid files, each up to 50 MB." },
				{ status: 400 },
			);
		}

		if (
			parsed.data.files.some(
				(file) => !contentTypes.has(path.extname(file.name).slice(1).toLowerCase()),
			)
		) {
			return Response.json(
				{ status: "failed", error: "Invalid file type. Only PDF, PNG, JPG, and DOCX are allowed." },
				{ status: 400 },
			);
		}

		const files = await Promise.all(
			parsed.data.files.map(async (file) => {
				const id = crypto.randomUUID();
				const extension = path.extname(file.name).slice(1).toLowerCase();
				const storedName = `${id}.${extension}`;
				const key = `${organizationId}/${session.user.id}/${storedName}`;
				try {
					const { data, error } = await patientUploads.createSignedUploadUrl(key, {
						upsert: false,
					});
					if (error) throw error;
					return {
						...file,
						id,
						storedName,
						type: contentTypes.get(extension),
						status: "upload-complete" as const,
						url: `patient-uploads/${key}`,
						signedUrl: data.signedUrl,
					};
				} catch (error) {
					console.error("Preparing patient upload failed:", error);
					return { clientId: file.clientId, name: file.name, status: "upload-failed" as const };
				}
			}),
		);
		return Response.json(
			{ status: "success", files },
			{ headers: { "Cache-Control": "no-store" } },
		);
	} catch (error) {
		console.error("Preparing patient uploads failed:", error);
		return Response.json(
			{ status: "failed", error: "We couldn’t upload your files. Please try again." },
			{ status: 500 },
		);
	}
}
