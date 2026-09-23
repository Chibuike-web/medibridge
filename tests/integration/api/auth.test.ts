// @vitest-environment node

import { beforeEach, describe, expect, test, vi } from "vitest";
import { NextRequest } from "next/server";

const {
	authHandlerMock,
	authGetHandlerMock,
	authPostHandlerMock,
	getSessionMock,
	verifyEmailMock,
	headersMock,
	toNextJsHandlerMock,
} = vi.hoisted(() => {
	process.env.NEXT_PUBLIC_URL = "http://localhost:4300";

	return {
		authHandlerMock: vi.fn(),
		authGetHandlerMock: vi.fn(),
		authPostHandlerMock: vi.fn(),
		getSessionMock: vi.fn(),
		verifyEmailMock: vi.fn(),
		headersMock: vi.fn(),
		toNextJsHandlerMock: vi.fn(() => ({
			GET: authGetHandlerMock,
			POST: authPostHandlerMock,
		})),
	};
});

vi.mock("@/lib/better-auth/auth", () => ({
	auth: {
		handler: authHandlerMock,
		api: {
			getSession: getSessionMock,
			verifyEmail: verifyEmailMock,
		},
	},
}));

vi.mock("better-auth/next-js", () => ({ toNextJsHandler: toNextJsHandlerMock }));
vi.mock("next/headers", () => ({ headers: headersMock }));

import { GET as authGET, POST as authPOST } from "@/app/api/auth/[...all]/route";
import { GET as verifyEmailGET } from "@/app/api/auth/verify-email/route";

describe("Auth API", () => {
	beforeEach(() => {
		authGetHandlerMock.mockClear();
		authPostHandlerMock.mockClear();
		authHandlerMock.mockClear();
		getSessionMock.mockClear();
		verifyEmailMock.mockClear();
		headersMock.mockClear();
		headersMock.mockResolvedValue(new Headers());
	});

	describe("/api/auth/[...all]", () => {
		test("passes GET requests to Better Auth", async () => {
			const response = Response.json(
				{ user: { id: "user-1" } },
				{ headers: { "cache-control": "no-store" } },
			);
			authGetHandlerMock.mockResolvedValue(response);
			const request = new Request("http://localhost:4300/api/auth/session", {
				headers: { cookie: "session=test-session" },
			});
			const result = await authGET(request);
			expect(authGetHandlerMock).toHaveBeenCalledWith(request);
			expect(result.status).toBe(200);
			expect(result.headers.get("cache-control")).toBe("no-store");
			expect(await result.json()).toEqual({ user: { id: "user-1" } });
		});

		test("passes POST requests to Better Auth", async () => {
			const response = Response.json(
				{ ok: true },
				{ headers: { "set-cookie": "session=new-session; HttpOnly" } },
			);
			authPostHandlerMock.mockResolvedValue(response);
			const request = new Request("http://localhost:4300/api/auth/sign-in", {
				method: "POST",
				body: JSON.stringify({ email: "user@example.com" }),
			});
			const result = await authPOST(request);
			expect(authPostHandlerMock).toHaveBeenCalledWith(request);
			expect(result.status).toBe(200);
			expect(result.headers.get("set-cookie")).toBe("session=new-session; HttpOnly");
			expect(await result.json()).toEqual({ ok: true });
		});
	});

	describe("GET /api/auth/verify-email", () => {
		test("delegates signed-out verification and preserves Better Auth's session cookie and redirect", async () => {
			const request = new NextRequest(
				"http://localhost:4300/api/auth/verify-email?token=token-1&callbackURL=http%3A%2F%2Flocalhost%3A4300%2Fhospital-details",
			);
			const response = new Response(null, {
				status: 302,
				headers: {
					location: "http://localhost:4300/hospital-details",
					"set-cookie": "better-auth.session_token=verified-session; HttpOnly",
				},
			});
			authHandlerMock.mockResolvedValue(response);

			const result = await verifyEmailGET(request);

			expect(authHandlerMock).toHaveBeenCalledWith(request);
			expect(result.status).toBe(302);
			expect(result.headers.get("location")).toBe("http://localhost:4300/hospital-details");
			expect(result.headers.get("set-cookie")).toContain("verified-session");
			expect(getSessionMock).not.toHaveBeenCalled();
			expect(verifyEmailMock).not.toHaveBeenCalled();
		});
	});
});
