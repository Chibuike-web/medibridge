"use server";

import { auth, db } from "@/lib/better-auth/auth";
import { headers } from "next/headers";
import { HospitalDetailsType } from "@/lib/schemas/hospital-details-schema";
import { hospitalDetails } from "@/db/auth-schema";

export async function createHospitalAction(data: HospitalDetailsType) {
	try {
		const session = await auth.api.getSession({ headers: await headers() });
		if (!session) return;
		const userId = session?.user?.id;

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

		const organizationId = orgRes?.id;

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
