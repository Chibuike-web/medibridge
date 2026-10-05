// @vitest-environment node

import { afterAll, beforeAll, beforeEach, describe, expect, test, vi } from "vitest";
import { eq } from "drizzle-orm";
import * as schema from "@/db/schemas/auth";
import {
	migrateTestDatabase,
	resetTestDatabase,
	testDatabaseUrl,
	useTestDatabase,
} from "../../helpers/test-database";

// Verification emails are sent with `after`, which only runs inside a Next.js request.
vi.mock("next/server", async (importOriginal) => ({
	...(await importOriginal<typeof import("next/server")>()),
	after: vi.fn(),
}));

type AuthModule = typeof import("@/lib/better-auth/auth");

describe.skipIf(!testDatabaseUrl)("POST /api/auth/sign-up/email", () => {
	let authModule: AuthModule;

	beforeAll(async () => {
		useTestDatabase();
		await migrateTestDatabase();
		authModule = await import("@/lib/better-auth/auth");
	}, 60_000);

	beforeEach(async () => {
		await resetTestDatabase();
	});

	afterAll(async () => {
		await authModule?.sql.end();
	});

	async function createHospitalWithOwner() {
		const organizationId = crypto.randomUUID();
		const ownerId = crypto.randomUUID();

		await authModule.db.insert(schema.organization).values({
			id: organizationId,
			name: "Approved Hospital",
			slug: `approved-hospital-${organizationId}`,
			createdAt: new Date(),
			isVerified: true,
		});
		await authModule.db.insert(schema.user).values({
			id: ownerId,
			name: "Hospital Owner",
			email: "owner@approved.org",
			emailVerified: true,
		});
		await authModule.db.insert(schema.member).values({
			id: crypto.randomUUID(),
			organizationId,
			userId: ownerId,
			role: "owner",
			createdAt: new Date(),
		});

		return { organizationId, ownerId };
	}

	async function createInvitation({ email, expiresAt }: { email: string; expiresAt: Date }) {
		const { organizationId, ownerId } = await createHospitalWithOwner();

		await authModule.db.insert(schema.invitation).values({
			id: crypto.randomUUID(),
			organizationId,
			inviterId: ownerId,
			email,
			role: "admin",
			status: "pending",
			expiresAt,
		});
	}

	function signUp(email: string) {
		const baseUrl = process.env.BETTER_AUTH_URL!;

		return authModule.auth.handler(
			new Request(new URL("/api/auth/sign-up/email", baseUrl), {
				method: "POST",
				headers: {
					"content-type": "application/json",
					origin: new URL(baseUrl).origin,
					// A new client IP per request avoids the sign-up rate limit.
					"x-forwarded-for": `203.0.113.${Math.floor(Math.random() * 254) + 1}`,
				},
				body: JSON.stringify({ name: "Ada Obi", email, password: "correct-horse-battery" }),
			}),
		);
	}

	async function findAccountEmails(email: string) {
		const accounts = await authModule.db
			.select({ email: schema.user.email })
			.from(schema.user)
			.where(eq(schema.user.email, email));

		return accounts.map((account) => account.email);
	}

	test("lets a hospital owner create an account with an official .org email", async () => {
		const response = await signUp("ada@stmaryhospital.org");

		expect(response.status).toBe(200);
		expect(await findAccountEmails("ada@stmaryhospital.org")).toEqual(["ada@stmaryhospital.org"]);
	});

	test("tells someone signing up with an existing email, in any letter case, that it already has an account", async () => {
		await createHospitalWithOwner();

		for (const email of ["owner@approved.org", "OWNER@APPROVED.ORG"]) {
			const response = await signUp(email);

			expect(response.status).toBe(422);
			expect(await response.json()).toEqual(
				expect.objectContaining({
					code: "USER_ALREADY_EXISTS",
					message: "This email already has an account.",
				}),
			);
		}
		expect(await findAccountEmails("owner@approved.org")).toEqual(["owner@approved.org"]);
	});

	test("does not create an account outside .org for someone without an invitation", async () => {
		const response = await signUp("ada@gmail.com");

		expect(response.status).toBe(400);
		expect(await findAccountEmails("ada@gmail.com")).toEqual([]);
	});

	test("lets an invited administrator create an account with an email on any domain", async () => {
		await createInvitation({
			email: "ada@gmail.com",
			expiresAt: new Date(Date.now() + 60 * 60 * 1000),
		});

		const response = await signUp("ada@gmail.com");

		expect(response.status).toBe(200);
		expect(await findAccountEmails("ada@gmail.com")).toEqual(["ada@gmail.com"]);
	});

	test("does not treat an expired invitation as permission to sign up outside .org", async () => {
		await createInvitation({
			email: "ada@gmail.com",
			expiresAt: new Date(Date.now() - 60 * 1000),
		});

		const response = await signUp("ada@gmail.com");

		expect(response.status).toBe(400);
		expect(await findAccountEmails("ada@gmail.com")).toEqual([]);
	});
});
