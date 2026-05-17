import { headers } from "next/headers";
import { auth } from "../better-auth/auth";

export async function getSessionData() {
	try {
		return await auth.api.getSession({
			headers: await headers(),
		});
	} catch {
		return null;
	}
}
