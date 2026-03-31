"use server";

import { SignInType } from "@/features/auth/schemas/sign-in-schema";
import { auth } from "@/lib/better-auth/auth";

export async function signInService(data: SignInType) {
	try {
		const signInRes = await auth.api.signInEmail({
			body: {
				email: data.email,
				password: data.password,
			},
		});

		const userId = signInRes.user.id;
		if (!userId) {
			return {
				status: "failed",
				error: "User does not exist",
			};
		}

		return {
			status: "success",
		};
	} catch (error) {
		console.error(error);
		return {
			status: "failed",
			error: error instanceof Error ? error.message : "Unknown error",
		};
	}
}
