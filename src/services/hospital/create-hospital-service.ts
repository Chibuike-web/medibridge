"use server";

import {
	hospitalDetailsSchema,
	HospitalDetailsType,
} from "@/features/auth/schemas/hospital-details-schema";
import { hospitalDetails, organization } from "@/db/schemas";
import { auth, db } from "@/lib/better-auth/auth";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { readdir } from "node:fs/promises";
import path from "node:path";

const uploadDir = path.resolve("hospital-uploads");

function hospitalSlug(name: string) {
	const nameSlug = name
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-|-$/g, "");

	return `${nameSlug}-${crypto.randomUUID().slice(0, 6)}`;
}

export async function createHospitalService(data: HospitalDetailsType) {
	try {
		const session = await auth.api.getSession({ headers: await headers() });
		if (!session)
			return { status: "failed", message: "You must sign in to submit hospital details." };
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
		const parsed = hospitalDetailsSchema.safeParse(data);
		if (parsed.error) {
			return { status: "failed", message: "Enter the correct details" };
		}

		const [uploadedFileName] = await readdir(path.join(uploadDir, userId)).catch(() => []);
		if (!uploadedFileName) {
			return {
				status: "failed",
				message: "Upload your accreditation document before submitting.",
			};
		}

		const orgRes = await auth.api.createOrganization({
			body: {
				name: parsed.data.hospitalName,
				slug: hospitalSlug(parsed.data.hospitalName),
				userId,
				keepCurrentActiveOrganization: false,
			},
		});

		if (!orgRes) return { status: "failed", message: "Organization creation failed" };

		const organizationId = orgRes.id;
		try {
			await db.insert(hospitalDetails).values({
				id: crypto.randomUUID(),
				organizationId,
				hospitalName: parsed.data.hospitalName,
				hospitalAddress: parsed.data.hospitalAddress,
				hospitalOwnerName: session.user.name,
				hospitalOwnerEmail: session.user.email,
				documentPath: `${userId}/${uploadedFileName}`,
				createdAt: new Date(),
			});
		} catch (error) {
			console.error(error);
			await db.delete(organization).where(eq(organization.id, organizationId));
			return { status: "failed", message: "We couldn’t save your hospital. Please try again." };
		}

		await auth.api.setActiveOrganization({
			body: { organizationId: orgRes.id },
			headers: await headers(),
		});

		return { status: "success", message: "Hospital data successfully saved" };
	} catch (error) {
		console.error(error);
		return { status: "failed", message: "We couldn’t save your hospital. Please try again." };
	}
}
