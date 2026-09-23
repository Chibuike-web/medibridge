import { member, organization } from "@/db/schemas";
import { getOrganizationId } from "@/lib/api/get-organization-id";
import { auth, db } from "@/lib/better-auth/auth";
import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";

export async function GET(req: Request) {
	const session = await auth.api.getSession({
		headers: await headers(),
	});
	if (!session) {
		return Response.redirect(new URL("/sign-in", req.url), 303);
	}

	const organizationId = await getOrganizationId();

	if (!organizationId) {
		return Response.json({ status: "forbidden" }, { status: 403 });
	}

	const [organizationAccess] = await db
		.select({
			isOrganizationVerified: organization.isVerified,
			role: member.role,
		})
		.from(member)
		.innerJoin(organization, eq(member.organizationId, organization.id))
		.where(and(eq(member.organizationId, organizationId), eq(member.userId, session.user.id)))
		.limit(1);

	if (!organizationAccess) {
		return Response.json({ status: "forbidden" }, { status: 303 });
	}

	return Response.json(
		{
			status: "success" as const,
			emailVerified: session.user.emailVerified,
			isOrganizationVerified: organizationAccess.isOrganizationVerified,
			role: organizationAccess.role,
		},
		{ status: 200 },
	);
}
