"use server";

import { invitation, member, organization, user } from "@/db/schemas/auth";
import { auth, db } from "@/lib/better-auth/auth";
import { and, eq, gt } from "drizzle-orm";
import { headers } from "next/headers";

async function findPendingInvitation(invitationId: string) {
	const [pendingInvitation] = await db
		.select({
			email: invitation.email,
			hasAccount: user.id,
			isOrganizationVerified: organization.isVerified,
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

type AcceptInvitationResult =
	| { status: "success" }
	| { status: "failed" | "invalid" | "unauthorized"; error: string };

export async function acceptInvitationService(
	invitationId: string,
): Promise<AcceptInvitationResult> {
	if (!invitationId) {
		return { status: "invalid", error: "This invitation is invalid or has expired." };
	}

	const session = await auth.api.getSession({ headers: await headers() });

	if (!session) {
		return { status: "unauthorized", error: "Sign in before accepting the invitation." };
	}

	try {
		const pendingInvitation = await findPendingInvitation(invitationId);

		if (!pendingInvitation) {
			return { status: "invalid", error: "This invitation is invalid or has expired." };
		}

		if (!pendingInvitation.isOrganizationVerified) {
			return { status: "failed", error: "This hospital must be verified before you can join it." };
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

		await auth.api.acceptInvitation({
			body: { invitationId },
			headers: await headers(),
		});

		return { status: "success" };
	} catch (error) {
		console.error(error);
		return {
			status: "failed",
			error: "We couldn't accept the invitation. Please try again.",
		};
	}
}
