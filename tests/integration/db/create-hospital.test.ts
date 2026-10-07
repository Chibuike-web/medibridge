// @vitest-environment node

import { afterAll, beforeAll, beforeEach, describe, expect, test, vi } from "vitest";
import { eq } from "drizzle-orm";
import { makeSignature } from "better-auth/crypto";
import { hospitalDetails, member, organization, session, user } from "@/db/schemas";
import {
	migrateTestDatabase,
	resetTestDatabase,
	testDatabaseUrl,
	useTestDatabase,
} from "../../helpers/test-database";

const { requestHeaders, creatorMembershipBarrier } = vi.hoisted(() => ({
	requestHeaders: new Headers(),
	creatorMembershipBarrier: vi.fn(),
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
					beforeAddMember: async (data) => {
						const result = await options?.organizationHooks?.beforeAddMember?.(data);
						await creatorMembershipBarrier(data.user.id);
						return result;
					},
				},
			}),
	};
});

vi.mock("next/headers", () => ({
	headers: async () => requestHeaders,
	cookies: async () => ({ get: () => undefined, set: () => {} }),
}));

vi.mock("node:fs/promises", async (importOriginal) => ({
	...(await importOriginal<typeof import("node:fs/promises")>()),
	readdir: async () => ["accreditation.pdf"],
}));

type AuthModule = typeof import("@/lib/better-auth/auth");
type HospitalServiceModule = typeof import("@/services/hospital/create-hospital-service");

describe.skipIf(!testDatabaseUrl)("createHospitalService", () => {
	let authModule: AuthModule;
	let hospitalServiceModule: HospitalServiceModule;

	beforeAll(async () => {
		useTestDatabase();
		await migrateTestDatabase();
		authModule = await import("@/lib/better-auth/auth");
		hospitalServiceModule = await import("@/services/hospital/create-hospital-service");
	}, 60_000);

	beforeEach(async () => {
		await resetTestDatabase();
		requestHeaders.delete("cookie");
		creatorMembershipBarrier.mockReset().mockResolvedValue(undefined);
	});

	afterAll(async () => {
		await authModule?.sql.end();
	});

	async function signInVerifiedOwner(email = "sarah@stmary.org") {
		const ownerId = crypto.randomUUID();
		const sessionToken = crypto.randomUUID();

		await authModule.db.insert(user).values({
			id: ownerId,
			name: "Sarah Thompson",
			email,
			emailVerified: true,
		});
		await authModule.db.insert(session).values({
			id: crypto.randomUUID(),
			token: sessionToken,
			userId: ownerId,
			expiresAt: new Date(Date.now() + 60 * 60 * 1000),
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		const authContext = await authModule.auth.$context;
		const signature = await makeSignature(sessionToken, authContext.secret);
		requestHeaders.set(
			"cookie",
			`${authContext.authCookies.sessionToken.name}=${sessionToken}.${signature}`,
		);

		return ownerId;
	}

	function submitHospitalDetails() {
		return hospitalServiceModule.createHospitalService({
			hospitalName: "St Mary's Hospital",
			hospitalAddress: "12 Health Street",
		});
	}

	function failHospitalDetailsInsert() {
		const insert = authModule.db.insert.bind(authModule.db);

		return vi
			.spyOn(authModule.db, "insert")
			.mockImplementation(((table: unknown) =>
				table === hospitalDetails
					? { values: () => Promise.reject(new Error("Connection lost")) }
					: insert(table as never)) as never);
	}

	async function findOwnerHospital(ownerId: string) {
		const organizations = await authModule.db
			.select({ id: organization.id, name: organization.name })
			.from(organization);
		const memberships = await authModule.db
			.select({ organizationId: member.organizationId, role: member.role })
			.from(member)
			.where(eq(member.userId, ownerId));
		const details = await authModule.db
			.select({
				organizationId: hospitalDetails.organizationId,
				documentPath: hospitalDetails.documentPath,
			})
			.from(hospitalDetails);
		const [ownerSession] = await authModule.db
			.select({ activeOrganizationId: session.activeOrganizationId })
			.from(session)
			.where(eq(session.userId, ownerId));

		return {
			organizations,
			memberships,
			details,
			activeOrganizationId: ownerSession.activeOrganizationId,
		};
	}

	test("saves the hospital, the owner's membership and the hospital details, and makes it the active hospital", async () => {
		const ownerId = await signInVerifiedOwner();

		const result = await submitHospitalDetails();

		const { organizations, memberships, details, activeOrganizationId } =
			await findOwnerHospital(ownerId);
		expect(result).toEqual({ status: "success", message: "Hospital data successfully saved" });
		expect(organizations).toEqual([{ id: expect.any(String), name: "St Mary's Hospital" }]);
		expect(memberships).toEqual([{ organizationId: organizations[0].id, role: "owner" }]);
		expect(details).toEqual([
			{ organizationId: organizations[0].id, documentPath: `${ownerId}/accreditation.pdf` },
		]);
		expect(activeOrganizationId).toBe(organizations[0].id);
	});

	test("creates only one complete hospital when the owner submits onboarding twice at the same time", async () => {
		const ownerId = await signInVerifiedOwner();
		let releaseMembership!: () => void;
		const bothRequestsCheckedPolicy = new Promise<void>((resolve) => {
			releaseMembership = resolve;
		});
		let waitingRequests = 0;
		creatorMembershipBarrier.mockImplementation(async (userId: string) => {
			if (userId !== ownerId) return;
			waitingRequests += 1;
			if (waitingRequests === 2) releaseMembership();
			await bothRequestsCheckedPolicy;
		});

		const results = await Promise.all([submitHospitalDetails(), submitHospitalDetails()]);

		expect(results.filter((result) => result.status === "success")).toHaveLength(1);
		expect(results.filter((result) => result.status === "failed")).toHaveLength(1);
		const { organizations, memberships, details, activeOrganizationId } =
			await findOwnerHospital(ownerId);
		expect(organizations).toHaveLength(1);
		expect(memberships).toEqual([{ organizationId: organizations[0].id, role: "owner" }]);
		expect(details).toEqual([
			{ organizationId: organizations[0].id, documentPath: `${ownerId}/accreditation.pdf` },
		]);
		expect(activeOrganizationId).toBe(organizations[0].id);
	});

	test("does not let a verified account outside .org create any hospital records", async () => {
		const invitedUserId = await signInVerifiedOwner("invited-admin@gmail.com");

		const result = await submitHospitalDetails();

		expect(result).toEqual({
			status: "failed",
			error: "Use your official hospital email address (.org).",
		});
		expect(await findOwnerHospital(invitedUserId)).toEqual({
			organizations: [],
			memberships: [],
			details: [],
			activeOrganizationId: null,
		});
	});

	test("removes the new hospital when its details can't be saved, so the owner can submit again", async () => {
		const ownerId = await signInVerifiedOwner();
		vi.spyOn(console, "error").mockImplementation(() => {});
		const failingInsert = failHospitalDetailsInsert();

		const failedResult = await submitHospitalDetails();

		expect(failedResult).toEqual({
			status: "failed",
			error: "We couldn’t save your hospital. Please try again.",
		});
		expect(await findOwnerHospital(ownerId)).toEqual({
			organizations: [],
			memberships: [],
			details: [],
			activeOrganizationId: null,
		});

		failingInsert.mockRestore();
		const retriedResult = await submitHospitalDetails();

		const { organizations, details } = await findOwnerHospital(ownerId);
		expect(retriedResult).toEqual({
			status: "success",
			message: "Hospital data successfully saved",
		});
		expect(organizations).toHaveLength(1);
		expect(details).toEqual([
			{ organizationId: organizations[0].id, documentPath: `${ownerId}/accreditation.pdf` },
		]);
	});

	test("does not create an orphan hospital when an existing administrator submits onboarding again", async () => {
		const adminId = await signInVerifiedOwner();
		const existingHospitalId = crypto.randomUUID();
		await authModule.db.insert(organization).values({
			id: existingHospitalId,
			name: "Existing Hospital",
			slug: "existing-hospital",
			createdAt: new Date(),
			isVerified: true,
		});
		await authModule.db.insert(member).values({
			id: crypto.randomUUID(),
			organizationId: existingHospitalId,
			userId: adminId,
			role: "admin",
			createdAt: new Date(),
		});

		const result = await submitHospitalDetails();

		expect(result).toEqual({
			status: "failed",
			error: "Your account already belongs to a hospital. An account can only join one hospital.",
		});
		const { organizations, memberships, details } = await findOwnerHospital(adminId);
		expect(organizations).toEqual([{ id: existingHospitalId, name: "Existing Hospital" }]);
		expect(memberships).toEqual([{ organizationId: existingHospitalId, role: "admin" }]);
		expect(details).toEqual([]);
	});
});
