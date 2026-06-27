import { cache } from "react";
import { headers } from "next/headers";
import { auth } from "../better-auth/auth";
import { verifySession } from "./verify-session";

export const getOrganizationId = cache(async () => {
	await verifySession();

	const organizations = await auth.api.listOrganizations({
		headers: await headers(),
	});

	return organizations[0]?.id ?? null;
});
