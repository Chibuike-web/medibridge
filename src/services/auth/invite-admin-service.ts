"use server";

import { headers } from "next/headers";
import { user } from "@/db/schemas/auth";
import { auth, db } from "@/lib/better-auth/auth";
import { ENV } from "@/lib/utils/env";
import { sendOrganizationInvitationEmail } from "@/lib/utils/send-email";
import { getOrganizationAccessService } from "./get-organization-access-service";
import { inviteSchema, InviteType } from "@/features/auth/schemas/invite-schema";
import { eq } from "drizzle-orm";

export async function inviteAdminService(data: InviteType) {
	const validatedInvitation = inviteSchema.safeParse(data);

	if (!validatedInvitation.success) {
		return { status: "failed" as const, error: "Enter valid administrator details." };
	}

	const session = await auth.api.getSession({ headers: await headers() });

	if (!session) {
		return { status: "unauthorized" as const };
	}

	const organizationId = session.session.activeOrganizationId;

	if (!organizationId) {
		return { status: "forbidden" as const, error: "No active hospital organization." };
	}

	const organizationAccess = await getOrganizationAccessService(organizationId);

	if (organizationAccess.status === "unauthorized") {
		return { status: "unauthorized" as const };
	}

	if (organizationAccess.status === "forbidden" || organizationAccess.role !== "owner") {
		return {
			status: "forbidden" as const,
			error: "Only the hospital owner can invite an administrator.",
		};
	}

	if (!organizationAccess.isOrganizationVerified) {
		return {
			status: "forbidden" as const,
			error: "Your hospital must be verified before inviting an administrator.",
		};
	}

	try {
		const [existingUser] = await db
			.select({ id: user.id })
			.from(user)
			.where(eq(user.email, validatedInvitation.data.email))
			.limit(1);

		if (existingUser) {
			return {
				status: "failed" as const,
				error: "This email already belongs to a MediBridge account.",
			};
		}

		const invitation = await auth.api.createInvitation({
			body: {
				email: validatedInvitation.data.email,
				role: "admin",
				organizationId,
				resend: true,
			},
			headers: await headers(),
		});

		const invitationUrl = new URL("/accept-invite", ENV.BETTER_AUTH_URL);
		invitationUrl.searchParams.set("invitationId", invitation.id);

		await sendOrganizationInvitationEmail({
			email: validatedInvitation.data.email,
			invitationUrl: invitationUrl.toString(),
			inviterName: session.user.name,
			organizationName: organizationAccess.organizationName,
			recipientName: validatedInvitation.data.name,
		});

		return { status: "success" as const };
	} catch (error) {
		return {
			status: "failed" as const,
			error: error instanceof Error ? error.message : "Unable to send the invitation.",
		};
	}
}
