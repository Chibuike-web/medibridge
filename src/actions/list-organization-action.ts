"use server";

import { auth } from "@/lib/better-auth/auth";
import { headers } from "next/headers";

export async function listOrganizationAction() {
	try {
		await auth.api.listOrganizations({
			headers: await headers(),
		});

		return {
			status: "success",
			message: "Sign in successful",
		};
	} catch (error) {
		console.error(error);
		return {
			status: "failed",
			error: error instanceof Error ? error.message : "Unknown error",
		};
	}
}
