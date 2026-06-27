import { cache } from "react";
import { headers } from "next/headers";
import { auth } from "../better-auth/auth";

export const getSessionData = cache(async () => {
	try {
		return await auth.api.getSession({
			headers: await headers(),
		});
	} catch {
		return null;
	}
});
