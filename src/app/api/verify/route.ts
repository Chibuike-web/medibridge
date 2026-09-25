import { getOrganizationContext } from "@/lib/api/get-organization-id";
import { auth } from "@/lib/better-auth/auth";
import { headers } from "next/headers";

export async function GET(req: Request) {
	const session = await auth.api.getSession({
		headers: await headers(),
	});
	if (!session) {
		return Response.json({ status: "unauthorized" }, { status: 401 });
	}

	const organizationContext = await getOrganizationContext();

	if (!organizationContext) {
		return Response.json({ status: "forbidden" }, { status: 403 });
	}

	return Response.json({
		status: "success",
		emailVerified: session.user.emailVerified,
		isOrganizationVerified: organizationContext.isOrganizationVerified,
		role: organizationContext.role,
	});
}
