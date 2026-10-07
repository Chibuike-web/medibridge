"use server";

import {
	hospitalDetailsSchema,
	HospitalDetailsType,
} from "@/features/auth/schemas/hospital-details-schema";
import { hospitalDetails, member, organization } from "@/db/schemas";
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

	return `${nameSlug}-${crypto.randomUUID()}`;
}

type CreateHospitalResult =
	| { status: "success"; message: string }
	| { status: "failed"; error: string };

export async function createHospitalService(
	data: HospitalDetailsType,
): Promise<CreateHospitalResult> {
	try {
		const session = await auth.api.getSession({ headers: await headers() });
		if (!session)
			return { status: "failed", error: "You must sign in to submit hospital details." };
		if (!session.user.emailVerified) {
			return { status: "failed", error: "Verify your email before submitting hospital details." };
		}
		if (!session.user.email.toLowerCase().endsWith(".org")) {
			return { status: "failed", error: "Use your official hospital email address (.org)." };
		}

		const [existingHospital] = await db
			.select({ id: hospitalDetails.id })
			.from(hospitalDetails)
			.where(eq(hospitalDetails.hospitalOwnerEmail, session.user.email))
			.limit(1);
		if (existingHospital) {
			return { status: "failed", error: "Hospital details have already been submitted." };
		}

		const [existingMembership] = await db
			.select({ id: member.id })
			.from(member)
			.where(eq(member.userId, session.user.id))
			.limit(1);
		if (existingMembership) {
			return {
				status: "failed",
				error: "Your account already belongs to a hospital. An account can only join one hospital.",
			};
		}

		const userId = session.user.id;
		const parsed = hospitalDetailsSchema.safeParse(data);
		if (parsed.error) {
			return { status: "failed", error: "Enter the correct details" };
		}

		const [uploadedFileName] = await readdir(path.join(uploadDir, userId)).catch(() => []);
		if (!uploadedFileName) {
			return {
				status: "failed",
				error: "Upload your accreditation document before submitting.",
			};
		}

		const organizationSlug = hospitalSlug(parsed.data.hospitalName);
		const orgRes = await auth.api
			.createOrganization({
				body: {
					name: parsed.data.hospitalName,
					slug: organizationSlug,
					userId,
					keepCurrentActiveOrganization: false,
				},
			})
			.catch(async (error) => {
				console.error(error);
				await db.delete(organization).where(eq(organization.slug, organizationSlug));
				return null;
			});

		if (!orgRes) return { status: "failed", error: "Organization creation failed" };

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
			return { status: "failed", error: "We couldn’t save your hospital. Please try again." };
		}

		await auth.api.setActiveOrganization({
			body: { organizationId: orgRes.id },
			headers: await headers(),
		});

		return { status: "success", message: "Hospital data successfully saved" };
	} catch (error) {
		console.error(error);
		return { status: "failed", error: "We couldn’t save your hospital. Please try again." };
	}
}
