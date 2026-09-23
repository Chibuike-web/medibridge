"use server";

import { SignInType } from "@/features/auth/schemas/sign-in-schema";
import { auth } from "@/lib/better-auth/auth";
import { APIError } from "better-auth";
import { headers } from "next/headers";

export async function signInService(data: SignInType) {
	try {
		await auth.api.signInEmail({
			body: {
				email: data.email,
				password: data.password,
				rememberMe: data.rememberMe,
			},
			headers: await headers(),
		});

		return { status: "success" };
	} catch (error) {
		if (error instanceof APIError && error.body?.code === "EMAIL_NOT_VERIFIED") {
			return { status: "email-unverified", error: "Email address is not verified." };
		}

		console.error(error);
		return {
			status: "failed",
			error: error instanceof Error ? error.message : "Unknown error",
		};
	}
}
