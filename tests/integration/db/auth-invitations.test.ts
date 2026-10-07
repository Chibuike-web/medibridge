// @vitest-environment node

import { afterAll, beforeAll, beforeEach, describe, expect, test, vi } from "vitest";
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
type InvitationServiceModule = typeof import("@/services/auth/invite-admin-service");

const { requestHeaders, sendInvitationEmail, acceptanceBarrier } = vi.hoisted(() => ({
	requestHeaders: new Headers(),
	sendInvitationEmail: vi.fn(),
	acceptanceBarrier: vi.fn(),
}));

vi.mock("better-auth/plugins/organization", async (importOriginal) => {
	const { organization } =
		await importOriginal<typeof import("better-auth/plugins/organization")>();
	return {
		organization: (options: Parameters<typeof organization>[0]) =>
			organization({
				...options,
				organizationHooks: {
					...options?.organizationHooks,
					beforeAcceptInvitation: async (data) => {
						await options?.organizationHooks?.beforeAcceptInvitation?.(data);
						// Tests may hold concurrent requests after their real policy checks.
						await acceptanceBarrier(data.user.id);
					},
				},
			}),
	};
});

vi.mock("next/headers", () => ({
	headers: async () => requestHeaders,
	cookies: async () => ({ get: () => undefined, set: () => {} }),
}));

vi.mock("@/lib/utils/send-email", () => ({
	sendEmail: vi.fn(),
	sendPasswordResetEmail: vi.fn(),
	sendOrganizationInvitationEmail: sendInvitationEmail,
}));

describe.skipIf(!testDatabaseUrl)("POST /api/auth/organization/invite-member", () => {
	let authModule: AuthModule;
	let invitationServiceModule: InvitationServiceModule;

	beforeAll(async () => {
		useTestDatabase();
		await migrateTestDatabase();
		authModule = await import("@/lib/better-auth/auth");
		invitationServiceModule = await import("@/services/auth/invite-admin-service");
	}, 60_000);

	beforeEach(async () => {
		await resetTestDatabase();
		requestHeaders.delete("cookie");
		acceptanceBarrier.mockReset().mockResolvedValue(undefined);
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
	async function signIn(userId: string, activeOrganizationId: string | null) {
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

	function acceptInvitation(sessionCookie: string, invitationId: string) {
		const baseUrl = process.env.BETTER_AUTH_URL!;

		return authModule.auth.handler(
			new Request(new URL("/api/auth/organization/accept-invitation", baseUrl), {
				method: "POST",
				headers: {
					cookie: sessionCookie,
					"content-type": "application/json",
					origin: new URL(baseUrl).origin,
				},
				body: JSON.stringify({ invitationId }),
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

		test("lets the owner invite an administrator whose email is on any domain", async () => {
			const hospitalId = await createHospital("Approved Hospital", { isVerified: true });
			const ownerId = await createHospitalMember(hospitalId, "owner@approved.org", "owner");
			const ownerCookie = await signIn(ownerId, hospitalId);

			const response = await inviteMember(ownerCookie, {
				email: "new-admin@gmail.com",
				role: "admin",
				organizationId: hospitalId,
			});

			expect(response.status).toBe(200);
			expect(await findInvitationsFor("new-admin@gmail.com")).toEqual([
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

		test("lets the owner renew an expired invitation after the recipient has created an account", async () => {
			const hospitalId = await createHospital("Approved Hospital", { isVerified: true });
			const ownerId = await createHospitalMember(hospitalId, "owner@approved.org", "owner");
			const ownerCookie = await signIn(ownerId, hospitalId);
			const invitedEmail = "pending-admin@approved.org";
			const { invitationId } = await createPendingInvitation({
				organizationId: hospitalId,
				inviterId: ownerId,
				email: invitedEmail,
				role: "admin",
			});
			await authModule.db.insert(schema.user).values({
				id: crypto.randomUUID(),
				name: "Invited Administrator",
				email: invitedEmail,
				emailVerified: true,
			});
			await authModule.db
				.update(schema.invitation)
				.set({ expiresAt: new Date(Date.now() - 60_000) })
				.where(eq(schema.invitation.id, invitationId));
			requestHeaders.set("cookie", ownerCookie);

			const result = await invitationServiceModule.inviteAdminService({
				name: "Invited Administrator",
				email: invitedEmail,
			});

			expect(result).toEqual({ status: "success" });
			expect(sendInvitationEmail).toHaveBeenCalledWith(
				expect.objectContaining({
					email: invitedEmail,
					invitationUrl: expect.any(String),
				}),
			);
			const emailedInvitationId = new URL(
				sendInvitationEmail.mock.calls[0][0].invitationUrl,
			).searchParams.get("invitationId")!;
			const [emailedInvitation] = await authModule.db
				.select({
					email: schema.invitation.email,
					role: schema.invitation.role,
					status: schema.invitation.status,
					expiresAt: schema.invitation.expiresAt,
				})
				.from(schema.invitation)
				.where(eq(schema.invitation.id, emailedInvitationId));
			expect(emailedInvitation).toMatchObject({
				email: invitedEmail,
				role: "admin",
				status: "pending",
			});
			expect(emailedInvitation.expiresAt.getTime()).toBeGreaterThan(Date.now());
			expect((await findInvitationExpiry(invitationId)).getTime()).toBeLessThanOrEqual(Date.now());
		});

		test("does not email a new invitation for a recipient who has already joined a hospital", async () => {
			const hospitalId = await createHospital("Approved Hospital", { isVerified: true });
			const ownerId = await createHospitalMember(hospitalId, "owner@approved.org", "owner");
			const ownerCookie = await signIn(ownerId, hospitalId);
			const otherHospitalId = await createHospital("Other Hospital", { isVerified: true });
			await createHospitalMember(otherHospitalId, "taken@other.org", "member");
			requestHeaders.set("cookie", ownerCookie);

			const result = await invitationServiceModule.inviteAdminService({
				name: "Existing Member",
				email: "taken@other.org",
			});

			expect(result).toEqual({
				status: "failed",
				error: "This person already belongs to a hospital and can't be invited to another.",
			});
			expect(await findInvitationsFor("taken@other.org")).toEqual([]);
			expect(sendInvitationEmail).not.toHaveBeenCalled();
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

	describe("accepting an invitation", () => {
		test("joins only one hospital when the same recipient accepts two invitations at the same time", async () => {
			const firstHospitalId = await createHospital("First Hospital", { isVerified: true });
			const secondHospitalId = await createHospital("Second Hospital", { isVerified: true });
			const firstOwnerId = await createHospitalMember(firstHospitalId, "owner@first.org", "owner");
			const secondOwnerId = await createHospitalMember(
				secondHospitalId,
				"owner@second.org",
				"owner",
			);
			const invitedEmail = "invited-admin@approved.org";
			const invitedUserId = crypto.randomUUID();
			await authModule.db.insert(schema.user).values({
				id: invitedUserId,
				name: "Invited Administrator",
				email: invitedEmail,
				emailVerified: true,
			});
			const sessionCookie = await signIn(invitedUserId, null);
			const firstInvitation = await createPendingInvitation({
				organizationId: firstHospitalId,
				inviterId: firstOwnerId,
				email: invitedEmail,
				role: "admin",
			});
			const secondInvitation = await createPendingInvitation({
				organizationId: secondHospitalId,
				inviterId: secondOwnerId,
				email: invitedEmail,
				role: "admin",
			});
			let releaseAcceptance!: () => void;
			const bothRequestsCheckedPolicy = new Promise<void>((resolve) => {
				releaseAcceptance = resolve;
			});
			let waitingRequests = 0;
			acceptanceBarrier.mockImplementation(async (userId: string) => {
				if (userId !== invitedUserId) return;
				waitingRequests += 1;
				if (waitingRequests === 2) releaseAcceptance();
				await bothRequestsCheckedPolicy;
			});

			const responses = await Promise.all([
				acceptInvitation(sessionCookie, firstInvitation.invitationId),
				acceptInvitation(sessionCookie, secondInvitation.invitationId),
			]);

			const memberships = await authModule.db
				.select({ organizationId: schema.member.organizationId, role: schema.member.role })
				.from(schema.member)
				.where(eq(schema.member.userId, invitedUserId));
			expect(memberships).toHaveLength(1);
			expect([firstHospitalId, secondHospitalId]).toContain(memberships[0].organizationId);
			expect(memberships[0].role).toBe("admin");
			expect(responses.filter((response) => response.ok)).toHaveLength(1);
			expect(
				(await findInvitationsFor(invitedEmail)).filter(
					(invitation) => invitation.status === "accepted",
				),
			).toHaveLength(1);
		});

		test("joins an approved hospital as the verified invited administrator and makes it active", async () => {
			const hospitalId = await createHospital("Approved Hospital", { isVerified: true });
			const ownerId = await createHospitalMember(hospitalId, "owner@approved.org", "owner");
			const invitedEmail = "invited-admin@approved.org";
			const invitedUserId = crypto.randomUUID();
			await authModule.db.insert(schema.user).values({
				id: invitedUserId,
				name: "Invited Administrator",
				email: invitedEmail,
				emailVerified: true,
			});
			const sessionCookie = await signIn(invitedUserId, null);
			const { invitationId } = await createPendingInvitation({
				organizationId: hospitalId,
				inviterId: ownerId,
				email: invitedEmail,
				role: "admin",
			});

			const response = await acceptInvitation(sessionCookie, invitationId);

			expect(response.status).toBe(200);
			expect(await findInvitationsFor(invitedEmail)).toEqual([
				expect.objectContaining({ role: "admin", status: "accepted" }),
			]);
			const memberships = await authModule.db
				.select({ organizationId: schema.member.organizationId, role: schema.member.role })
				.from(schema.member)
				.where(eq(schema.member.userId, invitedUserId));
			expect(memberships).toEqual([{ organizationId: hospitalId, role: "admin" }]);
			const [activeSession] = await authModule.db
				.select({ activeOrganizationId: schema.session.activeOrganizationId })
				.from(schema.session)
				.where(eq(schema.session.userId, invitedUserId));
			expect(activeSession.activeOrganizationId).toBe(hospitalId);
		});

		test.each([
			{
				reason: "the recipient has not verified their email",
				emailVerified: false,
				expectedStatus: 403,
			},
			{
				reason: "the signed-in account has a different email",
				differentEmail: true,
				expectedStatus: 403,
			},
			{
				reason: "hospital approval was withdrawn after the invitation was sent",
				withdrawApproval: true,
				expectedStatus: 403,
			},
			{ reason: "the invitation has expired", expireInvitation: true, expectedStatus: 400 },
			{ reason: "the recipient is signed out", signedOut: true, expectedStatus: 401 },
		])("does not join or consume the invitation when $reason", async (scenario) => {
			const hospitalId = await createHospital("Approved Hospital", { isVerified: true });
			const ownerId = await createHospitalMember(hospitalId, "owner@approved.org", "owner");
			const invitedEmail = "invited-admin@approved.org";
			const invitedUserId = crypto.randomUUID();
			await authModule.db.insert(schema.user).values({
				id: invitedUserId,
				name: "Invited Administrator",
				email: scenario.differentEmail ? "someone-else@approved.org" : invitedEmail,
				emailVerified: scenario.emailVerified ?? true,
			});
			const sessionCookie = await signIn(invitedUserId, null);
			const { invitationId } = await createPendingInvitation({
				organizationId: hospitalId,
				inviterId: ownerId,
				email: invitedEmail,
				role: "admin",
			});
			if (scenario.withdrawApproval) {
				await authModule.db
					.update(schema.organization)
					.set({ isVerified: false })
					.where(eq(schema.organization.id, hospitalId));
			}
			if (scenario.expireInvitation) {
				await authModule.db
					.update(schema.invitation)
					.set({ expiresAt: new Date(Date.now() - 60_000) })
					.where(eq(schema.invitation.id, invitationId));
			}
			expect(await findInvitationsFor(invitedEmail)).toEqual([
				expect.objectContaining({ role: "admin", status: "pending" }),
			]);

			const response = await acceptInvitation(
				scenario.signedOut ? "" : sessionCookie,
				invitationId,
			);

			expect(response.status).toBe(scenario.expectedStatus);
			expect(await findInvitationsFor(invitedEmail)).toEqual([
				expect.objectContaining({ role: "admin", status: "pending" }),
			]);
			const memberships = await authModule.db
				.select({ organizationId: schema.member.organizationId })
				.from(schema.member)
				.where(eq(schema.member.userId, invitedUserId));
			expect(memberships).toEqual([]);
		});
	});
});
