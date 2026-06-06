import { NextResponse, type NextRequest } from "next/server";

const sessionCookieNames = [
	"better-auth.session_token",
	"__Secure-better-auth.session_token",
	"better-auth-session_token",
	"__Secure-better-auth-session_token",
];

export function proxy(request: NextRequest) {
	const hasSessionCookie = sessionCookieNames.some((name) => request.cookies.has(name));

	if (!hasSessionCookie) {
		const signInUrl = new URL("/sign-in", request.url);
		signInUrl.searchParams.set("callbackUrl", request.nextUrl.pathname + request.nextUrl.search);

		return NextResponse.redirect(signInUrl);
	}

	return NextResponse.next();
}

export const config = {
	matcher: ["/dashboard/:path*"],
};
