"use server";

import { SignInType } from "@/features/auth/schemas/sign-in-schema";
import { auth } from "@/lib/better-auth/auth";
import { headers } from "next/headers";

export async function signInService(data: SignInType) {
	try {
		const signInRes = await auth.api.signInEmail({
			body: {
				email: data.email,
				password: data.password,
				rememberMe: data.rememberMe,
			},
			headers: await headers(),
		});

		const userId = signInRes.user.id;

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
