"use server";

import { HospitalDetailsType } from "@/features/auth/schemas/hospital-details-schema";
import { hospitalDetails } from "@/db/schemas";
import { auth, db } from "@/lib/better-auth/auth";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";

export async function createHospitalService(data: HospitalDetailsType) {
	try {
		const session = await auth.api.getSession({ headers: await headers() });
		if (!session) return { status: "failed", message: "You must sign in to submit hospital details." };
		if (!session.user.emailVerified) {
			return { status: "failed", message: "Verify your email before submitting hospital details." };
		}

		const [existingHospital] = await db
			.select({ id: hospitalDetails.id })
			.from(hospitalDetails)
			.where(eq(hospitalDetails.hospitalOwnerEmail, session.user.email))
			.limit(1);
		if (existingHospital) {
			return { status: "failed", message: "Hospital details have already been submitted." };
		}

		const userId = session.user.id;

		const orgRes = await auth.api.createOrganization({
			body: {
				name: data.hospitalName,
				slug: data.hospitalName.toLowerCase().replace(/\s+/g, "-"),
				userId,
				keepCurrentActiveOrganization: false,
			},
			headers: await headers(),
		});

		if (!orgRes) return { status: "failed", message: "Organization creation failed" };

		const organizationId = orgRes.id;

		await db.insert(hospitalDetails).values({
			id: crypto.randomUUID(),
			organizationId,
			hospitalName: data.hospitalName,
			hospitalAddress: data.hospitalAddress,
			hospitalOwnerName: session.user.name,
			hospitalOwnerEmail: session.user.email,
			documentPath: null,
			createdAt: new Date(),
		});

		return { status: "success", message: "Hospital data successfully saved" };
	} catch (error) {
		console.error(error);
		return {
			status: "failed",
			error: error instanceof Error ? error.message : "Unknown error",
		};
	}
}
