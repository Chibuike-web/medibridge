"use server";

import { auth } from "@/lib/better-auth/auth";
import { OwnerType } from "@/lib/schemas/owner-schema";

export async function createOwnerAction(data: OwnerType) {
	try {
		const res = await auth.api.signUpEmail({
			body: {
				name: data.name,
				email: data.email,
				password: data.password,
			},
		});

		const userId = res.user.id;
		console.log("user Id:" + userId);
		if (!userId) {
			return { status: "failed", message: "User creation failed" };
		}
	} catch (error) {
		console.error(error);
		return {
			status: "failed",
			error: error instanceof Error ? error.message : "Unknown error",
		};
	}

	return { status: "success", message: "Admin successfully saved" };
}
