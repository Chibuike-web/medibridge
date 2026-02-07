"use server";

import { hospitalDetails } from "@/db/auth-schema";
import { auth, db } from "@/lib/better-auth/auth";
import { OwnerType } from "@/app/(auth)/schemas/owner-schema";
import { and, eq } from "drizzle-orm";

export async function createOwnerAction(data: OwnerType) {
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
			return { status: "success", message: "Owner already exists" };
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
			},
		});

		await auth.api.sendVerificationEmail({
			body: {
				email: data.email,
			},
		});

		return { status: "success", message: "User successfully created" };
	} catch (error) {
		console.error(error);
		return {
			status: "failed",
			error: error instanceof Error ? error.message : "Unknown error",
		};
	}
}
