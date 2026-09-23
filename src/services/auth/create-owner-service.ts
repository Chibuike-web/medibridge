"use server";

import { OwnerType } from "@/features/auth/schemas/owner-schema";
import { hospitalDetails } from "@/db/schemas";
import { auth, db } from "@/lib/better-auth/auth";
import { ENV } from "@/lib/utils/env";
import { and, eq } from "drizzle-orm";

export async function createOwnerService(data: OwnerType) {
	try {
		const existing = await db
			.select()
			.from(hospitalDetails)
			.where(
				and(
					eq(hospitalDetails.hospitalOwnerEmail, data.email),
					eq(hospitalDetails.hospitalOwnerName, data.name),
				),
			);

		if (existing.length > 0) {
			return {
				status: "failed",
				error: "A hospital is already registered to this owner email.",
			};
		}
	} catch (error) {
		console.error(error);
		return {
			status: "failed",
			error: error instanceof Error ? error.message : "Unknown error",
		};
	}

	try {
		await auth.api.signUpEmail({
			body: {
				name: data.name,
				email: data.email,
				password: data.password,
				callbackURL: new URL("/hospital-details", ENV.BETTER_AUTH_URL).toString(),
			},
		});

		return { status: "success", message: "Verification email sent" };
	} catch (error) {
		console.error(error);
		return {
			status: "failed",
			error: error instanceof Error ? error.message : "Unknown error",
		};
	}
}
