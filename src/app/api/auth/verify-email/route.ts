import { auth } from "@/lib/better-auth/auth";
import { APIError } from "better-auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

const base = process.env.NEXT_PUBLIC_URL;
export async function GET(req: Request) {
	const { searchParams } = new URL(req.url);
	const token = searchParams.get("token");
	if (!token) {
		return NextResponse.redirect(`${base}/email-verified?error=invalid_token}`);
	}
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session) {
		return NextResponse.redirect(`${base}/email-verified?error=no_session`);
	}
	try {
		await auth.api.verifyEmail({ query: { token } });
		return NextResponse.redirect(`${base}/email-verified`);
	} catch (error) {
		if (error instanceof APIError) {
			console.log("verification failed:", error.statusCode, error.status);

			const errorType =
				error.status === "UNAUTHORIZED" || error.statusCode === 401
					? "expired_token"
					: "invalid_token";

			return NextResponse.redirect(`${base}/email-verified?error=${errorType}}`);
		} else {
			console.error(error);
			return NextResponse.redirect(`${base}/email-verified?error=invalid_token}`);
		}
	}
}
