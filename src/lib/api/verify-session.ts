import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { getSessionData } from "@/lib/api/get-session-data";

export const verifySession = cache(async () => {
	const session = await getSessionData();

	if (!session) {
		redirect("/sign-in");
	}

	return session;
});
