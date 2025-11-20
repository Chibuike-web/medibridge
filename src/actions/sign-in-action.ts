"use server";

import { hospitalDetails, organization } from "@/db/auth-schema";
import { auth, db } from "@/lib/better-auth/auth";
import { HospitalAdminSignInType } from "@/lib/schemas/hospital-admin-sign-in-schema";
import { eq } from "drizzle-orm";

export async function signInAction(data: HospitalAdminSignInType) {
	try {
		const signInRes = await auth.api.signInEmail({
			body: {
				email: data.adminEmail,
				password: data.adminPassword,
			},
		});

		const userId = signInRes.user.id;
		if (!userId) {
			return {
				status: "failed",
				error: "User does not exist",
			};
		}

		const hospitalRecord = await db
			.select()
			.from(hospitalDetails)
			.where(eq(hospitalDetails.primaryContactEmail, data.adminEmail))
			.limit(1);

		if (!hospitalRecord.length) {
			return {
				status: "failed",
				error: "No organization found for this administrator",
			};
		}

		const record = hospitalRecord[0];

		const orgRecord = await db
			.select()
			.from(organization)
			.where(eq(organization.id, record.organizationId))
			.limit(1);

		if (!orgRecord.length) {
			return {
				status: "failed",
				error: "Organization not found",
			};
		}

		const org = orgRecord[0];

		if (!org.isVerified) {
			return {
				status: "failed",
				error: "This organization is not yet verified. Contact support.",
			};
		}

		return {
			status: "success",
			message: "Sign in successful",
			organizationId: org.id,
		};
	} catch (error) {
		console.error(error);
		return {
			status: "failed",
			error: error instanceof Error ? error.message : "Unknown error",
		};
	}
}
