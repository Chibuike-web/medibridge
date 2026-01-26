import { cacheLife } from "next/cache";
import { cookies } from "next/headers";
import { auth } from "../better-auth/auth";

export async function getSessionData() {
	"use cache: private";

	const cookieStore = await cookies();
	const token = cookieStore.get("better-auth.session_token")?.value ?? "";

	return cachedSession(token);
}

async function cachedSession(token: string) {
	"use cache";

	if (token) cacheLife("weeks");
	else cacheLife("seconds");

	const cookieHeader = `better-auth.session_token=${token}`;

	return await auth.api.getSession({
		headers: { cookie: cookieHeader },
	});
}
