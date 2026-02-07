"use server";

import { auth } from "@/lib/better-auth/auth";
import { SignInType } from "@/app/(auth)/schemas/sign-in-schema";

export async function signInAction(data: SignInType) {
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
