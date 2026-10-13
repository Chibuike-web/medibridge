import "server-only";

import { invitation, organization, user } from "@/db/schemas/auth";
import { db } from "@/lib/better-auth/auth";
import { and, eq, gt } from "drizzle-orm";

export async function findPendingInvitation(invitationId: string) {
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
