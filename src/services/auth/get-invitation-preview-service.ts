import "server-only";

import { invitation, organization, user } from "@/db/schemas/auth";
import { db } from "@/lib/better-auth/auth";
import { and, eq, gt } from "drizzle-orm";

export async function getInvitationPreviewService(invitationId: string) {
	if (!invitationId) {
		return { status: "invalid" as const };
	}

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
