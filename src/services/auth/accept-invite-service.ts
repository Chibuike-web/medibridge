"use server";

import { invitation, organization, user } from "@/db/schemas/auth";
import { auth, db } from "@/lib/better-auth/auth";
import { and, eq, gt } from "drizzle-orm";
import { headers } from "next/headers";

async function findPendingInvitation(invitationId: string) {
	const [pendingInvitation] = await db
		.select({
			email: invitation.email,
			hasAccount: user.id,
			organizationName: organization.name,
		})
		.from(invitation)
		.innerJoin(organization, eq(invitation.organizationId, organization.id))
		.leftJoin(user, eq(user.email, invitation.email))
		.where(
			and(
				eq(invitation.id, invitationId),
				eq(invitation.status, "pending"),
				gt(invitation.expiresAt, new Date()),
			),
		)
		.limit(1);

	return pendingInvitation ?? null;
}

export async function getInvitationPreviewService(invitationId: string) {
	if (!invitationId) {
		return { status: "invalid" as const };
	}

	const pendingInvitation = await findPendingInvitation(invitationId);

	if (!pendingInvitation) {
		return { status: "invalid" as const };
	}

	return {
		status: "success" as const,
		email: pendingInvitation.email,
		hasAccount: Boolean(pendingInvitation.hasAccount),
		organizationName: pendingInvitation.organizationName,
	};
}

export async function acceptInvitationService(invitationId: string) {
	if (!invitationId) {
		return { status: "invalid" as const, error: "This invitation is invalid or has expired." };
	}

	const session = await auth.api.getSession({ headers: await headers() });

	if (!session) {
		return { status: "unauthorized" as const };
	}

	try {
		await auth.api.acceptInvitation({
			body: { invitationId },
			headers: await headers(),
		});

		return { status: "success" as const };
	} catch (error) {
		return {
			status: "failed" as const,
			error: error instanceof Error ? error.message : "Unable to accept the invitation.",
		};
	}
}
