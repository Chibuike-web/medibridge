"use server";

import { existsSync, unlinkSync } from "node:fs";
import path from "node:path";

export async function deletePatientUploadAction(relativePath: string) {
	try {
		if (!relativePath) {
			return { status: "failed", error: "Missing file path" };
		}

		const uploadRoot = path.resolve("patient-uploads");
		const absolutePath = path.resolve(relativePath);
		const isInsideUploadRoot =
			absolutePath === uploadRoot || absolutePath.startsWith(`${uploadRoot}${path.sep}`);

		if (!isInsideUploadRoot) {
			return { status: "failed", error: "Invalid file path" };
		}

		if (!existsSync(absolutePath)) {
			return { status: "failed", error: "File does not exist" };
		}

		unlinkSync(absolutePath);

		return { status: "success" };
	} catch (error) {
		return {
			status: "failed",
			error: error instanceof Error ? error.message : "Unable to delete file",
		};
	}
}
