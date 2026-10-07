"use server";

import { headers } from "next/headers";
import { member, user } from "@/db/schemas/auth";
import { auth, db } from "@/lib/better-auth/auth";
import { ENV } from "@/lib/utils/env";
import { sendOrganizationInvitationEmail } from "@/lib/utils/send-email";
import { getOrganizationAccessService } from "./get-organization-access-service";
import { inviteSchema, InviteType } from "@/features/auth/schemas/invite-schema";
import { eq } from "drizzle-orm";

type InviteAdminResult =
	| { status: "success" }
	| { status: "failed" | "unauthorized" | "forbidden"; error: string };

export async function inviteAdminService(data: InviteType): Promise<InviteAdminResult> {
	const validatedInvitation = inviteSchema.safeParse(data);

	if (!validatedInvitation.success) {
		return { status: "failed", error: "Enter valid administrator details." };
	}

	const session = await auth.api.getSession({ headers: await headers() });

	if (!session) {
		return { status: "unauthorized", error: "Sign in before sending an invitation." };
	}

	const organizationId = session.session.activeOrganizationId;

	if (!organizationId) {
		return { status: "forbidden", error: "No active hospital organization." };
	}

	const organizationAccess = await getOrganizationAccessService(organizationId);

	if (organizationAccess.status === "unauthorized") {
		return { status: "unauthorized", error: "Sign in before sending an invitation." };
	}

	if (organizationAccess.status === "forbidden" || organizationAccess.role !== "owner") {
		return {
			status: "forbidden",
			error: "Only the hospital owner can invite an administrator.",
		};
	}

	if (!organizationAccess.isOrganizationVerified) {
		return {
			status: "forbidden",
			error: "Your hospital must be verified before inviting an administrator.",
		};
	}

	try {
		const [existingMembership] = await db
			.select({ id: member.id })
			.from(member)
			.innerJoin(user, eq(member.userId, user.id))
			.where(eq(user.email, validatedInvitation.data.email))
			.limit(1);

		if (existingMembership) {
			return {
				status: "failed",
				error: "This person already belongs to a hospital and can't be invited to another.",
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

		return { status: "success" };
	} catch (error) {
		console.error(error);
		return {
			status: "failed",
			error: "We couldn't send the invitation. Please try again.",
		};
	}
}
