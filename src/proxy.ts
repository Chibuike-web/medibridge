import { NextResponse, type NextRequest } from "next/server";
import { parseDateParam } from "@/lib/utils/parse-date-param";

const sessionCookieNames = [
	"better-auth.session_token",
	"__Secure-better-auth.session_token",
	"better-auth-session_token",
	"__Secure-better-auth-session_token",
];

export function proxy(request: NextRequest) {
	const hasSessionCookie = sessionCookieNames.some((name) => request.cookies.has(name));

	if (!hasSessionCookie && !request.headers.has("next-action")) {
		const signInUrl = new URL("/sign-in", request.url);
		signInUrl.searchParams.set("callbackUrl", request.nextUrl.pathname + request.nextUrl.search);

		return NextResponse.redirect(signInUrl);
	}

	const url = request.nextUrl.clone();
	for (const [name, value] of request.nextUrl.searchParams) {
		const isBadLimit =
			(name === "limit" || name.endsWith("Limit")) && !["14", "28", "42"].includes(value);
		const isBadDate = /(From|To)$/.test(name) && name !== "returnTo" && !parseDateParam(value);
		if (isBadLimit || isBadDate) {
			url.searchParams.delete(name);
		}
	}
	if (url.search !== request.nextUrl.search) return NextResponse.redirect(url);

	return NextResponse.next();
}

export const config = {
	matcher: ["/dashboard/:path*"],
};
