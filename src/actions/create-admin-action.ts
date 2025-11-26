"use server";

import { auth } from "@/lib/better-auth/auth";
import { HospitalType } from "@/store/use-hospital-store";

export async function createAdminAction(data: HospitalType) {
	try {
		const res = await auth.api.signUpEmail({
			body: {
				name: data.adminName,
				email: data.adminEmail,
				password: data.adminPassword,
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
