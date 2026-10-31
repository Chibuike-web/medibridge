import "server-only";

import {
	hospitalDetailsSchema,
	HospitalDetailsType,
} from "@/features/auth/schemas/hospital-details-schema";
import { hospitalDetails, member, organization } from "@/db/schemas";
import { auth, db } from "@/lib/better-auth/auth";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";

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
		if (!session?.user?.id)
			return { status: "failed", error: "You must sign in to submit hospital details." };
		if (!session.user.emailVerified) {
			return { status: "failed", error: "Verify your email before submitting hospital details." };
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

		// WARNING: keep this import dynamic. Sign-in shares this module, and a static import would
		// make a missing Supabase env break sign-in as well.
		const { hospitalUploads } = await import("@/lib/storage/client");
		const { data: files, error: listError } = await hospitalUploads.list(userId, {
			limit: 100,
			sortBy: { column: "created_at", order: "desc" },
		});
		if (listError) throw listError;
		const uploadedFileName = files.find(
			(file) =>
				file.id &&
				file.metadata &&
				file.metadata.size > 0 &&
				file.metadata.size <= 50 * 1024 * 1024 &&
				["application/pdf", "image/png", "image/jpeg", "application/msword"].includes(
					file.metadata.mimetype,
				),
		)?.name;
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
