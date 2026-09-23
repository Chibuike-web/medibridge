"use server";

import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { member, organization } from "@/db/schemas/auth";
import { auth, db } from "@/lib/better-auth/auth";

export async function getOrganizationAccessService(organizationId: string) {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session) {
		return { status: "unauthorized" as const };
	}

	const [organizationAccess] = await db
		.select({
			isOrganizationVerified: organization.isVerified,
			organizationName: organization.name,
			role: member.role,
		})
		.from(member)
		.innerJoin(organization, eq(member.organizationId, organization.id))
		.where(and(eq(member.organizationId, organizationId), eq(member.userId, session.user.id)))
		.limit(1);

	if (!organizationAccess) {
		return { status: "forbidden" as const };
	}

	return {
		status: "success" as const,
		emailVerified: session.user.emailVerified,
		isOrganizationVerified: organizationAccess.isOrganizationVerified,
		organizationName: organizationAccess.organizationName,
		role: organizationAccess.role,
	};
}
