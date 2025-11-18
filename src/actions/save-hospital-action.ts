"use server";

import { hospitalDetails, organization } from "@/db/auth-schema";
import { auth, db } from "@/lib/better-auth/auth";
import { HospitalType } from "@/store/use-hospital-store";

export default async function saveHospital(data: HospitalType) {
	try {
		console.log(data);
		const signUpRes = await auth.api.signUpEmail({
			body: {
				name: data.adminName,
				email: data.adminEmail,
				password: data.adminPassword,
			},
		});
		const userId = signUpRes.user.id;
		if (!userId) {
			return {
				status: "failed",
				message: "User creation fialed",
			};
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
			isVerified: false,
			documentPath: null,
			createdAt: new Date(),
		});

		return {
			status: "success",
			message: "Data successfully saved",
		};
	} catch (error) {
		return {
			status: "failed",
			error: error instanceof Error ? error.message : "Unknown error",
		};
	}
}
