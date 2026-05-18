import { headers } from "next/headers";
import { auth } from "../better-auth/auth";

export async function getOrganizationId() {
	const organizations = await auth.api.listOrganizations({
		headers: await headers(),
	});

	return organizations[0]?.id ?? null;
}
