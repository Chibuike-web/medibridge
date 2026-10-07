// @vitest-environment node

import { beforeEach, describe, expect, test, vi } from "vitest";

const { authDatabase, sendEmailMock, sendPasswordResetEmailMock, selectRowsMock } = vi.hoisted(
	() => ({
		authDatabase: {
			user: [],
			account: [],
			session: [],
			verification: [],
			organization: [],
			member: [],
			invitation: [],
		} as Record<string, Record<string, unknown>[]>,
		sendEmailMock: vi.fn(),
		sendPasswordResetEmailMock: vi.fn(),
		selectRowsMock: vi.fn(),
	}),
);

// Keep the configured auth endpoint and its validation, tokens, passwords, and
// cookies real; replace only PostgreSQL and the outbound email boundary.
vi.mock("better-auth/adapters/drizzle", async () => {
	const { memoryAdapter } = await import("better-auth/adapters/memory");
	return { drizzleAdapter: () => memoryAdapter(authDatabase) };
});
vi.mock("postgres", () => ({ default: () => ({}) }));
vi.mock("drizzle-orm/postgres-js", () => ({
	drizzle: () => ({
		select: () => {
			const query = {
				from: () => query,
				innerJoin: () => query,
				where: () => query,
				limit: () => selectRowsMock(),
				then: (resolve: (value: unknown) => unknown) => selectRowsMock().then(resolve),
			};
			return query;
		},
	}),
}));
vi.mock("next/server", async (importOriginal) => ({
	...(await importOriginal<typeof import("next/server")>()),
	after: (callback: () => Promise<void>) => callback(),
}));
vi.mock("@/lib/utils/send-email", () => ({
	sendEmail: sendEmailMock,
	sendPasswordResetEmail: sendPasswordResetEmailMock,
}));

import { auth } from "./auth";

let clientIp = 1;

function requestAuth(path: string, { body, cookie }: { body?: unknown; cookie?: string } = {}) {
	const baseUrl = process.env.BETTER_AUTH_URL!;
	return auth.handler(
		new Request(new URL(`/api/auth${path}`, baseUrl), {
			method: body ? "POST" : "GET",
			headers: {
				origin: new URL(baseUrl).origin,
				"content-type": "application/json",
				"x-forwarded-for": `203.0.113.${clientIp++}`,
				...(cookie ? { cookie } : {}),
			},
			...(body ? { body: JSON.stringify(body) } : {}),
		}),
	);
}

function responseCookies(response: Response) {
	return response.headers
		.getSetCookie()
		.map((cookie) => cookie.split(";")[0])
		.join("; ");
}

async function registerAccount(email = "ada@hospital.org", callbackURL = "/hospital-details") {
	const response = await requestAuth("/sign-up/email", {
		body: {
			name: "Ada Obi",
			email,
			password: "password-before-verification",
			callbackURL,
		},
	});
	expect(response.status).toBe(200);
	return (await response.json()).user as { id: string; email: string };
}

async function signIn(email: string, password: string) {
	return requestAuth("/sign-in/email", { body: { email, password } });
}

describe("Configured authentication endpoints", () => {
	beforeEach(() => {
		for (const table of Object.keys(authDatabase)) authDatabase[table] = [];
		sendEmailMock.mockReset();
		sendPasswordResetEmailMock.mockReset();
		selectRowsMock.mockReset().mockResolvedValue([]);
	});

	test("keeps the password chosen at sign-up and signs the owner in when they verify their email", async () => {
		const registeredUser = await registerAccount("ada@hospital.org", "/email-verified");
		expect((await signIn(registeredUser.email, "password-before-verification")).status).toBe(403);
		const verificationUrl = sendEmailMock.mock.calls[0][1] as string;

		const verifiedResponse = await auth.handler(new Request(verificationUrl));

		expect(verifiedResponse.status).toBe(302);
		expect(new URL(verifiedResponse.headers.get("location")!, verificationUrl).pathname).toBe(
			"/email-verified",
		);
		const sessionResponse = await requestAuth("/get-session", {
			cookie: responseCookies(verifiedResponse),
		});
		expect((await sessionResponse.json()).user.emailVerified).toBe(true);
		expect((await signIn(registeredUser.email, "password-before-verification")).status).toBe(200);
	});

	test("returns an invited person to their invitation, signed in, when they verify their email", async () => {
		await registerAccount("ada@hospital.org", "/accept-invite?invitationId=recipient-invitation");
		const verificationUrl = sendEmailMock.mock.calls[0][1] as string;

		const verifiedResponse = await auth.handler(new Request(verificationUrl));

		expect(verifiedResponse.status).toBe(302);
		const location = new URL(verifiedResponse.headers.get("location")!, verificationUrl);
		expect(`${location.pathname}${location.search}`).toBe(
			"/accept-invite?invitationId=recipient-invitation",
		);
		const sessionResponse = await requestAuth("/get-session", {
			cookie: responseCookies(verifiedResponse),
		});
		expect((await sessionResponse.json()).user.email).toBe("ada@hospital.org");
	});

	test("does not create an account outside .org unless it has a current invitation", async () => {
		const deniedResponse = await requestAuth("/sign-up/email", {
			body: { name: "Ada Obi", email: "ada@gmail.com", password: "recipient-password" },
		});
		expect(deniedResponse.status).toBe(400);
		expect(await (await auth.$context).internalAdapter.findUserByEmail("ada@gmail.com")).toBeNull();
		selectRowsMock.mockResolvedValue([{ id: "current-invitation" }]);
		const allowedResponse = await requestAuth("/sign-up/email", {
			body: { name: "Ada Obi", email: "ada@gmail.com", password: "recipient-password" },
		});
		expect(allowedResponse.status).toBe(200);
		expect((await allowedResponse.json()).user.email).toBe("ada@gmail.com");
	});

	test("prevents hospital owners from deleting their account and lets a member delete theirs", async () => {
		const registeredUser = await registerAccount();
		await (
			await auth.$context
		).internalAdapter.updateUser(registeredUser.id, { emailVerified: true });
		const signedInResponse = await signIn(registeredUser.email, "password-before-verification");
		expect(signedInResponse.status).toBe(200);
		const cookie = responseCookies(signedInResponse);
		selectRowsMock.mockResolvedValue([{ role: "owner" }]);

		const deniedResponse = await requestAuth("/delete-user", { body: {}, cookie });
		expect(deniedResponse.status).toBe(403);
		expect(await deniedResponse.json()).toEqual(
			expect.objectContaining({
				message: "Transfer ownership of your hospital before deleting your account.",
			}),
		);
		expect((await (await requestAuth("/get-session", { cookie })).json()).user.id).toBe(
			registeredUser.id,
		);
		selectRowsMock.mockResolvedValue([{ role: "member" }]);
		const allowedResponse = await requestAuth("/delete-user", { body: {}, cookie });
		expect(allowedResponse.status).toBe(200);
		expect(await (await requestAuth("/get-session", { cookie })).json()).toBeNull();
	});

	test("revokes an already-read browser session immediately when the password is reset", async () => {
		const registeredUser = await registerAccount();
		const context = await auth.$context;
		await context.internalAdapter.updateUser(registeredUser.id, { emailVerified: true });
		const signedInResponse = await signIn(registeredUser.email, "password-before-verification");
		expect(signedInResponse.status).toBe(200);
		const cookie = responseCookies(signedInResponse);
		const sessionResponse = await requestAuth("/get-session", { cookie });
		expect((await sessionResponse.json()).user.id).toBe(registeredUser.id);
		const readSessionCookie = `${cookie}; ${responseCookies(sessionResponse)}`;

		await context.internalAdapter.createVerificationValue({
			identifier: "reset-password:recipient-reset-token",
			value: registeredUser.id,
			expiresAt: new Date(Date.now() + 60_000),
		});
		const resetResponse = await requestAuth("/reset-password", {
			body: { token: "recipient-reset-token", newPassword: "password-after-reset" },
		});
		expect(resetResponse.status).toBe(200);

		const revokedSessionResponse = await requestAuth("/get-session", { cookie: readSessionCookie });
		expect(await revokedSessionResponse.json()).toBeNull();
		expect((await signIn(registeredUser.email, "password-before-verification")).status).toBe(401);
		expect((await signIn(registeredUser.email, "password-after-reset")).status).toBe(200);
	});
});
