// @vitest-environment node

import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, test, vi } from "vitest";
import * as schema from "@/db/schemas";
import {
	migrateTestDatabase,
	resetTestDatabase,
	testDatabaseUrl,
	useTestDatabase,
} from "../../helpers/test-database";

const { createExternalAccessSessionMock } = vi.hoisted(() => ({
	createExternalAccessSessionMock: vi.fn(),
}));
vi.mock("@/lib/api/external-access-session", () => ({
	createExternalAccessSession: createExternalAccessSessionMock,
}));
vi.mock("@/lib/utils/send-access-code-email", () => ({ sendAccessCodeEmail: vi.fn() }));
vi.mock("next/server", async (importOriginal) => ({
	...(await importOriginal<typeof import("next/server")>()),
	after: vi.fn(),
}));

describe.skipIf(!testDatabaseUrl)("Shared patient record authentication", () => {
	let authModule: typeof import("@/lib/better-auth/auth");
	let verifyCode: typeof import("@/app/(app)/verify-access/[accessId]/actions").verifyAccessCodeAction;
	let accessId: string;
	let verificationId: string;

	beforeAll(async () => {
		useTestDatabase();
		await migrateTestDatabase();
		authModule = await import("@/lib/better-auth/auth");
		verifyCode = (await import("@/app/(app)/verify-access/[accessId]/actions"))
			.verifyAccessCodeAction;
	}, 60_000);

	beforeEach(async () => {
		await resetTestDatabase();
		const organizationId = crypto.randomUUID();
		const ownerId = crypto.randomUUID();
		const patientId = crypto.randomUUID();
		const transferId = crypto.randomUUID();
		accessId = crypto.randomUUID();
		verificationId = crypto.randomUUID();
		await authModule.db.insert(schema.organization).values({
			id: organizationId,
			name: "Source Hospital",
			slug: organizationId,
			createdAt: new Date(),
			isVerified: true,
		});
		await authModule.db
			.insert(schema.user)
			.values({ id: ownerId, name: "Owner", email: "owner@source.org", emailVerified: true });
		await authModule.db.insert(schema.patient).values({ id: patientId, organizationId });
		await authModule.db.insert(schema.patientTransfer).values({
			id: transferId,
			patientId,
			sourceOrganizationId: organizationId,
			targetOrganizationId: "external-hospital",
			targetHospitalName: "Receiving Hospital",
			targetHospitalEmail: "records@receiving.org",
			status: "completed",
			patientApprovalStatus: "approved",
		});
		await authModule.db.insert(schema.patientRecordAccess).values({
			id: accessId,
			patientId,
			patientTransferId: transferId,
			createdByOrganizationId: organizationId,
			createdByUserId: ownerId,
			status: "pending",
			expiresAt: new Date(Date.now() + 60 * 60 * 1000),
			permissions: { diagnoses: true },
			selectedRecordIds: [{ section: "diagnoses", recordId: "diagnosis-1" }],
		});
		await authModule.db.insert(schema.patientRecordAccessVerification).values({
			id: verificationId,
			accessId,
			codeHash: await bcrypt.hash("123456", 4),
			codeExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
			targetHospitalEmail: "records@receiving.org",
			targetHospitalName: "Receiving Hospital",
		});
	});

	afterAll(async () => {
		await authModule?.sql.end();
	});

	test("a correct unused code activates the scoped record and cannot be reused", async () => {
		expect(await verifyCode({ accessId, verificationCode: "123456" })).toEqual({
			status: "success",
		});
		const [access] = await authModule.db
			.select()
			.from(schema.patientRecordAccess)
			.where(eq(schema.patientRecordAccess.id, accessId));
		expect(access.status).toBe("active");
		expect(access.verifiedAt).toBeInstanceOf(Date);
		expect(createExternalAccessSessionMock).toHaveBeenCalledWith({
			accessId,
			expiresAt: access.expiresAt,
		});
		expect((await verifyCode({ accessId, verificationCode: "123456" })).status).toBe("failed");
	});

	test("five wrong guesses exhaust a code even when the next guess is correct", async () => {
		for (let attempt = 0; attempt < 5; attempt++) {
			expect((await verifyCode({ accessId, verificationCode: "654321" })).status).toBe("failed");
		}
		expect((await verifyCode({ accessId, verificationCode: "123456" })).status).toBe("failed");
		const [access] = await authModule.db
			.select()
			.from(schema.patientRecordAccess)
			.where(eq(schema.patientRecordAccess.id, accessId));
		const [verification] = await authModule.db
			.select()
			.from(schema.patientRecordAccessVerification)
			.where(eq(schema.patientRecordAccessVerification.id, verificationId));
		expect(access.status).toBe("pending");
		expect(verification.attempts).toBe(5);
		expect(createExternalAccessSessionMock).not.toHaveBeenCalled();
	});

	test("parallel guesses share the same five-attempt limit", async () => {
		const results = await Promise.all(
			Array.from({ length: 8 }, () => verifyCode({ accessId, verificationCode: "654321" })),
		);
		expect(results.every((result) => result.status === "failed")).toBe(true);
		const [verification] = await authModule.db
			.select()
			.from(schema.patientRecordAccessVerification)
			.where(eq(schema.patientRecordAccessVerification.id, verificationId));
		expect(verification.attempts).toBe(5);
		expect(createExternalAccessSessionMock).not.toHaveBeenCalled();
	});

	test("parallel submissions cannot redeem the same correct code twice", async () => {
		const results = await Promise.all([
			verifyCode({ accessId, verificationCode: "123456" }),
			verifyCode({ accessId, verificationCode: "123456" }),
		]);
		expect(results.filter((result) => result.status === "success")).toHaveLength(1);
		expect(results.filter((result) => result.status === "failed")).toHaveLength(1);
		expect(createExternalAccessSessionMock).toHaveBeenCalledTimes(1);
	});

	test("a correct code cannot reactivate a revoked record", async () => {
		await authModule.db
			.update(schema.patientRecordAccess)
			.set({ status: "revoked", revokedAt: new Date() })
			.where(eq(schema.patientRecordAccess.id, accessId));
		expect((await verifyCode({ accessId, verificationCode: "123456" })).status).toBe("failed");
		const [access] = await authModule.db
			.select()
			.from(schema.patientRecordAccess)
			.where(eq(schema.patientRecordAccess.id, accessId));
		expect(access.status).toBe("revoked");
		expect(createExternalAccessSessionMock).not.toHaveBeenCalled();
	});

	test.each(["revoked", "expired"])(
		"a record that becomes %s while a correct code is checked stays unavailable",
		async (status) => {
			const [availableAccess] = await authModule.db
				.select()
				.from(schema.patientRecordAccess)
				.where(eq(schema.patientRecordAccess.id, accessId));
			expect(availableAccess.status).toBe("pending");
			expect(availableAccess.expiresAt.getTime()).toBeGreaterThan(Date.now());
			const compareCode = vi.spyOn(bcrypt, "compare").mockImplementation(async () => {
				await authModule.db
					.update(schema.patientRecordAccess)
					.set(
						status === "revoked"
							? { status: "revoked", revokedAt: new Date() }
							: { status: "expired", expiresAt: new Date(Date.now() - 1000) },
					)
					.where(eq(schema.patientRecordAccess.id, accessId));
				return true;
			});
			try {
				expect((await verifyCode({ accessId, verificationCode: "123456" })).status).toBe("failed");
				const [access] = await authModule.db
					.select()
					.from(schema.patientRecordAccess)
					.where(eq(schema.patientRecordAccess.id, accessId));
				expect(access.status).toBe(status);
				expect(createExternalAccessSessionMock).not.toHaveBeenCalled();
			} finally {
				compareCode.mockRestore();
			}
		},
	);
});
