// @vitest-environment node

import { afterAll, beforeAll, beforeEach, describe, expect, test } from "vitest";
import { eq } from "drizzle-orm";
import { makeSignature } from "better-auth/crypto";
import * as schema from "@/db/schemas/auth";
import {
	migrateTestDatabase,
	resetTestDatabase,
	testDatabaseUrl,
	useTestDatabase,
} from "../../helpers/test-database";

type AuthModule = typeof import("@/lib/better-auth/auth");

describe.skipIf(!testDatabaseUrl)("POST /api/auth/organization/invite-member", () => {
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

	async function createHospital(name: string, { isVerified }: { isVerified: boolean }) {
		const organizationId = crypto.randomUUID();

		await authModule.db.insert(schema.organization).values({
			id: organizationId,
			name,
			slug: `${name.toLowerCase().replace(/\s+/g, "-")}-${organizationId}`,
			createdAt: new Date(),
			isVerified,
		});

		return organizationId;
	}

	async function createHospitalMember(
		organizationId: string,
		email: string,
		role: "owner" | "admin" | "member",
	) {
		const userId = crypto.randomUUID();

		await authModule.db.insert(schema.user).values({
			id: userId,
			name: email,
			email,
			emailVerified: true,
		});
		await authModule.db.insert(schema.member).values({
			id: crypto.randomUUID(),
			organizationId,
			userId,
			role,
			createdAt: new Date(),
		});

		return userId;
	}

	// Signs the user in the same way Better Auth's own test utilities build a session cookie.
	async function signIn(userId: string, activeOrganizationId: string) {
		const authContext = await authModule.auth.$context;
		const sessionToken = crypto.randomUUID();

		await authModule.db.insert(schema.session).values({
			id: crypto.randomUUID(),
			token: sessionToken,
			userId,
			activeOrganizationId,
			expiresAt: new Date(Date.now() + 60 * 60 * 1000),
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		const signature = await makeSignature(sessionToken, authContext.secret);
		return `${authContext.authCookies.sessionToken.name}=${sessionToken}.${signature}`;
	}

	async function createPendingInvitation({
		organizationId,
		inviterId,
		email,
		role,
	}: {
		organizationId: string;
		inviterId: string;
		email: string;
		role: string;
	}) {
		const invitationId = crypto.randomUUID();
		const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

		await authModule.db.insert(schema.invitation).values({
			id: invitationId,
			organizationId,
			inviterId,
			email,
			role,
			status: "pending",
			expiresAt,
		});

		return { invitationId, expiresAt };
	}

	function inviteMember(
		sessionCookie: string,
		body: { email: string; role: string; organizationId: string; resend?: boolean },
	) {
		const baseUrl = process.env.BETTER_AUTH_URL!;

		return authModule.auth.handler(
			new Request(new URL("/api/auth/organization/invite-member", baseUrl), {
				method: "POST",
				headers: {
					cookie: sessionCookie,
					"content-type": "application/json",
					origin: new URL(baseUrl).origin,
				},
				body: JSON.stringify(body),
			}),
		);
	}

	async function findInvitationsFor(email: string) {
		return authModule.db
			.select({
				role: schema.invitation.role,
				status: schema.invitation.status,
				expiresAt: schema.invitation.expiresAt,
			})
			.from(schema.invitation)
			.where(eq(schema.invitation.email, email));
	}

	async function findInvitationExpiry(invitationId: string) {
		const [invitation] = await authModule.db
			.select({ expiresAt: schema.invitation.expiresAt })
			.from(schema.invitation)
			.where(eq(schema.invitation.id, invitationId));

		return invitation.expiresAt;
	}

	describe("in an approved hospital", () => {
		test("lets the owner invite an administrator", async () => {
			const hospitalId = await createHospital("Approved Hospital", { isVerified: true });
			const ownerId = await createHospitalMember(hospitalId, "owner@approved.org", "owner");
			const ownerCookie = await signIn(ownerId, hospitalId);

			const response = await inviteMember(ownerCookie, {
				email: "new-admin@approved.org",
				role: "admin",
				organizationId: hospitalId,
			});

			expect(response.status).toBe(200);
			expect(await findInvitationsFor("new-admin@approved.org")).toEqual([
				expect.objectContaining({ role: "admin", status: "pending" }),
			]);
		});

		test("lets the owner renew a pending administrator invitation", async () => {
			const hospitalId = await createHospital("Approved Hospital", { isVerified: true });
			const ownerId = await createHospitalMember(hospitalId, "owner@approved.org", "owner");
			const ownerCookie = await signIn(ownerId, hospitalId);
			const { invitationId, expiresAt } = await createPendingInvitation({
				organizationId: hospitalId,
				inviterId: ownerId,
				email: "pending-admin@approved.org",
				role: "admin",
			});

			const response = await inviteMember(ownerCookie, {
				email: "pending-admin@approved.org",
				role: "admin",
				organizationId: hospitalId,
				resend: true,
			});

			expect(response.status).toBe(200);
			expect((await findInvitationExpiry(invitationId)).getTime()).toBeGreaterThan(
				expiresAt.getTime(),
			);
		});

		test("lets an administrator invite a member", async () => {
			const hospitalId = await createHospital("Approved Hospital", { isVerified: true });
			const adminId = await createHospitalMember(hospitalId, "admin@approved.org", "admin");
			const adminCookie = await signIn(adminId, hospitalId);

			const response = await inviteMember(adminCookie, {
				email: "new-member@approved.org",
				role: "member",
				organizationId: hospitalId,
			});

			expect(response.status).toBe(200);
			expect(await findInvitationsFor("new-member@approved.org")).toEqual([
				expect.objectContaining({ role: "member", status: "pending" }),
			]);
		});

		test("does not let an administrator invite another administrator", async () => {
			const hospitalId = await createHospital("Approved Hospital", { isVerified: true });
			const adminId = await createHospitalMember(hospitalId, "admin@approved.org", "admin");
			const adminCookie = await signIn(adminId, hospitalId);

			const response = await inviteMember(adminCookie, {
				email: "second-admin@approved.org",
				role: "admin",
				organizationId: hospitalId,
			});

			expect(response.status).toBe(403);
			expect(await findInvitationsFor("second-admin@approved.org")).toEqual([]);
		});

		test("does not let an administrator renew an administrator invitation by requesting the member role", async () => {
			const hospitalId = await createHospital("Approved Hospital", { isVerified: true });
			const ownerId = await createHospitalMember(hospitalId, "owner@approved.org", "owner");
			const adminId = await createHospitalMember(hospitalId, "admin@approved.org", "admin");
			const adminCookie = await signIn(adminId, hospitalId);
			const { invitationId, expiresAt } = await createPendingInvitation({
				organizationId: hospitalId,
				inviterId: ownerId,
				email: "pending-admin@approved.org",
				role: "admin",
			});

			const response = await inviteMember(adminCookie, {
				email: "pending-admin@approved.org",
				role: "member",
				organizationId: hospitalId,
				resend: true,
			});

			expect(response.status).toBe(403);
			expect(await findInvitationExpiry(invitationId)).toEqual(expiresAt);
		});

		test("does not let the owner invite someone who already belongs to another hospital", async () => {
			const hospitalId = await createHospital("Approved Hospital", { isVerified: true });
			const ownerId = await createHospitalMember(hospitalId, "owner@approved.org", "owner");
			const ownerCookie = await signIn(ownerId, hospitalId);
			const otherHospitalId = await createHospital("Other Hospital", { isVerified: true });
			await createHospitalMember(otherHospitalId, "taken@other.org", "member");

			const response = await inviteMember(ownerCookie, {
				email: "taken@other.org",
				role: "admin",
				organizationId: hospitalId,
			});

			expect(response.status).toBe(403);
			expect(await findInvitationsFor("taken@other.org")).toEqual([]);
		});
	});

	describe("in a hospital that is not approved yet", () => {
		test("does not let the owner invite an administrator", async () => {
			const hospitalId = await createHospital("Pending Hospital", { isVerified: false });
			const ownerId = await createHospitalMember(hospitalId, "owner@pending.org", "owner");
			const ownerCookie = await signIn(ownerId, hospitalId);

			const response = await inviteMember(ownerCookie, {
				email: "new-admin@pending.org",
				role: "admin",
				organizationId: hospitalId,
			});

			expect(response.status).toBe(403);
			expect(await findInvitationsFor("new-admin@pending.org")).toEqual([]);
		});

		test("does not let the owner renew a pending invitation", async () => {
			const hospitalId = await createHospital("Pending Hospital", { isVerified: false });
			const ownerId = await createHospitalMember(hospitalId, "owner@pending.org", "owner");
			const ownerCookie = await signIn(ownerId, hospitalId);
			const { invitationId, expiresAt } = await createPendingInvitation({
				organizationId: hospitalId,
				inviterId: ownerId,
				email: "pending-admin@pending.org",
				role: "admin",
			});

			const response = await inviteMember(ownerCookie, {
				email: "pending-admin@pending.org",
				role: "admin",
				organizationId: hospitalId,
				resend: true,
			});

			expect(response.status).toBe(403);
			expect(await findInvitationExpiry(invitationId)).toEqual(expiresAt);
		});
	});
});
