"use server";

import { hospitalDetails, member, organization, user } from "@/db/auth-schema";
import { auth, db } from "@/lib/better-auth/auth";
import { HospitalType } from "@/store/use-hospital-store";
import { eq } from "drizzle-orm";

export default async function saveHospitalAction(data: HospitalType) {
	try {
		const existingHospital = await db
			.select()
			.from(hospitalDetails)
			.where(eq(hospitalDetails.hospitalName, data.hospitalName));

		if (existingHospital.length > 0) {
			return {
				status: "failed",
				message: "This hospital already exists. Please contact the admin for an invitation.",
			};
		}
		const signUpRes = await auth.api.signUpEmail({
			body: {
				name: data.adminName,
				email: data.adminEmail,
				password: data.adminPassword,
			},
		});
		const userId = signUpRes.user.id;
		if (!userId) {
			return { status: "failed", message: "User creation failed" };
		}

		const organizationId = crypto.randomUUID();

		await db.insert(organization).values({
			id: organizationId,
			name: data.hospitalName,
			slug: data.hospitalName.toLowerCase().replace(/\s+/g, "-"),
			createdAt: new Date(),
		});

		await db.insert(hospitalDetails).values({
			id: crypto.randomUUID(),
			organizationId,
			hospitalName: data.hospitalName,
			hospitalAddress: data.hospitalAddress,
			primaryContactName: data.primaryContactName,
			primaryContactEmail: data.primaryContactEmail,
			primaryContactPhoneNumber: data.primaryContactPhoneNumber,
			documentPath: null,
			createdAt: new Date(),
		});

		await db.insert(member).values({
			id: crypto.randomUUID(),
			organizationId,
			userId,
			role: "admin",
			createdAt: new Date(),
		});

		await db.update(user).set({ role: "admin" }).where(eq(user.id, userId));

		return { status: "success", message: "Data successfully saved" };
	} catch (error) {
		return {
			status: "failed",
			error: error instanceof Error ? error.message : "Unknown error",
		};
	}
}
