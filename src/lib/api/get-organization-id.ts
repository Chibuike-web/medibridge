import { headers } from "next/headers";
import { cache } from "react";
import { auth } from "../better-auth/auth";

export const getOrganizationId = cache(async () => {
	const organizations = await auth.api.listOrganizations({
		headers: await headers(),
	});

	return organizations[0]?.id ?? null;
});
