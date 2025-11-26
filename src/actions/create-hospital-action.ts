"use server";

import { auth, db } from "@/lib/better-auth/auth";
import { hospitalDetails } from "@/db/auth-schema";
import { headers } from "next/headers";
import { HospitalType } from "@/store/use-hospital-store";

export async function createHospitalAction(data: HospitalType) {
	try {
		const session = await auth.api.getSession({ headers: await headers() });
		const userId = session?.user?.id;
		console.log(userId);

		const orgRes = await auth.api.createOrganization({
			body: {
				name: data.hospitalName,
				slug: data.hospitalName.toLowerCase().replace(/\s+/g, "-"),
				userId,
			},
		});

		if (!orgRes) return { status: "failed", message: "Organization creation failed" };

		const organizationId = orgRes?.id;

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

		const invite = await auth.api.createInvitation({
			body: {
				email: "ebube@gmail.com",
				role: "member",
				organizationId,
				resend: true,
			},
		});

		console.log(`inviteId: ${invite.id}`);

		return { status: "success", message: "Hospital data successfully saved" };
	} catch (error) {
		console.error(error);
		return {
			status: "failed",
			error: error instanceof Error ? error.message : "Unknown error",
		};
	}
}
