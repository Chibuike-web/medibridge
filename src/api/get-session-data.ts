import { auth } from "@/lib/better-auth/auth";
import { headers } from "next/headers";

export async function getSessionData() {
	const session = await auth.api.getSession({
		headers: await headers(),
	});
	return session;
}
