import { auth } from "@/lib/better-auth/auth";

export async function GET(request: Request) {
	return auth.handler(request);
}
