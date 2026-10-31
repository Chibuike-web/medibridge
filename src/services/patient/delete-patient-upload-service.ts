import "server-only";

import { getOrganizationId } from "@/lib/api/get-organization-id";
import { getSessionData } from "@/lib/api/get-session-data";
import { patientUploads } from "@/lib/storage/client";
import path from "node:path";

type DeletePatientUploadResult = { status: "success" } | { status: "failed"; error: string };

export async function deletePatientUploadService(
	relativePath: string,
): Promise<DeletePatientUploadResult> {
	const session = await getSessionData();
	if (!session?.user?.id)
		return { status: "failed", error: "You must sign in to delete patient upload." };

	if (!session.user.emailVerified) {
		return { status: "failed", error: "Verify your email before deleting this upload." };
	}

	const organizationId = await getOrganizationId();

	if (!organizationId) {
		return {
			status: "failed",
			error: "Your hospital must be verified before you can delete this upload.",
		};
	}
	try {
		if (!relativePath) {
			return { status: "failed", error: "Missing file path" };
		}

		const prefix = `patient-uploads/${organizationId}/${session.user.id}/`;
		if (!relativePath.startsWith(prefix)) {
			return { status: "failed", error: "Invalid file path" };
		}

		const filename = relativePath.slice(prefix.length);
		if (
			!filename ||
			filename !== path.posix.basename(filename) ||
			/[\:]/.test(filename) ||
			filename === "." ||
			filename === ".."
		) {
			return { status: "failed", error: "Invalid file path" };
		}

		const key = `${organizationId}/${session.user.id}/${filename}`;
		const { error } = await patientUploads.remove([key]);
		if (error) throw error;

		return { status: "success" };
	} catch (error) {
		console.error(error);
		return {
			status: "failed",
			error: "We couldn’t delete this upload. Please try again.",
		};
	}
}
