// @vitest-environment node

import { afterAll, beforeEach, describe, expect, test, vi } from "vitest";
import { NextRequest } from "next/server";

const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

afterAll(() => consoleErrorSpy.mockRestore());

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
		test("redirects to an invalid-token error when the token is missing", async () => {
			const response = await verifyEmailGET(
				new NextRequest("http://localhost:4300/api/auth/verify-email"),
			);

			expect(response.status).toBe(307);
			expect(new URL(response.headers.get("location")!).searchParams.get("error")).toBe(
				"invalid_token",
			);
			expect(getSessionMock).not.toHaveBeenCalled();
		});

		test("redirects to a no-session error when the user is not signed in", async () => {
			getSessionMock.mockResolvedValue(null);

			const response = await verifyEmailGET(
				new NextRequest("http://localhost:4300/api/auth/verify-email?token=token-1"),
			);

			expect(response.status).toBe(307);
			expect(response.headers.get("location")).toContain("/email-verified?error=no_session");
			expect(verifyEmailMock).not.toHaveBeenCalled();
		});

		test("verifies the token and redirects to the verified page", async () => {
			getSessionMock.mockResolvedValue({ user: { id: "user-1" } });
			verifyEmailMock.mockResolvedValue(undefined);

			const response = await verifyEmailGET(
				new NextRequest("http://localhost:4300/api/auth/verify-email?token=token-1"),
			);

			expect(response.status).toBe(307);
			expect(response.headers.get("location")).toBe("http://localhost:4300/email-verified");
			expect(getSessionMock).toHaveBeenCalledWith({ headers: expect.any(Headers) });
			expect(verifyEmailMock).toHaveBeenCalledWith({ query: { token: "token-1" } });
		});

		test("redirects to an invalid-token error when verification fails unexpectedly", async () => {
			getSessionMock.mockResolvedValue({ user: { id: "user-1" } });
			verifyEmailMock.mockRejectedValue(new Error("verification failed"));

			const response = await verifyEmailGET(
				new NextRequest("http://localhost:4300/api/auth/verify-email?token=token-1"),
			);

			expect(response.status).toBe(307);
			expect(new URL(response.headers.get("location")!).searchParams.get("error")).toBe(
				"invalid_token",
			);
		});
	});
});
