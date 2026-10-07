"use server";

import { getOrganizationId } from "@/lib/api/get-organization-id";
import { getSessionData } from "@/lib/api/get-session-data";
import { existsSync, unlinkSync } from "node:fs";
import path from "node:path";

type DeletePatientUploadResult = { status: "success" } | { status: "failed"; error: string };

export async function deletePatientUploadService(
	relativePath: string,
): Promise<DeletePatientUploadResult> {
	const session = await getSessionData();
	if (!session) return { status: "failed", error: "You must sign in to delete patient upload." };

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

		const uploadRoot = path.resolve("patient-uploads", organizationId, session.user.id);
		const absolutePath = path.resolve(relativePath);
		const isInsideUploadRoot = path.dirname(absolutePath) === uploadRoot;

		if (!isInsideUploadRoot) {
			return { status: "failed", error: "Invalid file path" };
		}

		if (!existsSync(absolutePath)) {
			return { status: "failed", error: "File does not exist" };
		}

		unlinkSync(absolutePath);

		return { status: "success" };
	} catch (error) {
		console.error(error);
		return {
			status: "failed",
			error: "We couldn’t delete this upload. Please try again.",
		};
	}
}
