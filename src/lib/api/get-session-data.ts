import { cookies } from "next/headers";
import { auth } from "../better-auth/auth";

export async function getSessionData() {
	const cookieStore = await cookies();
	const token = cookieStore.get("better-auth.session_token")?.value ?? "";
	const cookieHeader = `better-auth.session_token=${token}`;

	return auth.api.getSession({
		headers: { cookie: cookieHeader },
	});
}
