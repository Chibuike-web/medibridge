// @vitest-environment node

import { afterAll, beforeAll, beforeEach, describe, expect, test, vi } from "vitest";
import * as schema from "@/db/schemas";
import {
	migrateTestDatabase,
	resetTestDatabase,
	testDatabaseUrl,
	useTestDatabase,
} from "../../helpers/test-database";

vi.mock("next/cache", () => ({ cacheLife: vi.fn(), cacheTag: vi.fn() }));

describe.skipIf(!testDatabaseUrl)("Overview transfer cards", () => {
	let authModule: typeof import("@/lib/better-auth/auth");
	let getOverviewStatsForOrganization: typeof import("@/lib/api/get-overview-stats").getOverviewStatsForOrganization;
	const hospitalId = "hospital-a";
	const otherHospitalId = "hospital-b";
	const completedAt = new Date("2026-10-10T09:30:00.000Z");

	beforeAll(async () => {
		useTestDatabase();
		await migrateTestDatabase();
		authModule = await import("@/lib/better-auth/auth");
		getOverviewStatsForOrganization = (await import("@/lib/api/get-overview-stats"))
			.getOverviewStatsForOrganization;
	}, 60_000);

	beforeEach(async () => {
		await resetTestDatabase();
		await authModule.db.insert(schema.organization).values([
			{
				id: hospitalId,
				name: "Hospital A",
				slug: hospitalId,
				createdAt: new Date(),
				isVerified: true,
			},
			{
				id: otherHospitalId,
				name: "Hospital B",
				slug: otherHospitalId,
				createdAt: new Date(),
				isVerified: true,
			},
		]);
		await authModule.db.insert(schema.patient).values([
			{ id: "patient-a", organizationId: hospitalId },
			{ id: "patient-b", organizationId: otherHospitalId },
		]);

		const transfer = (
			id: string,
			sourceOrganizationId: string,
			status: string,
			targetOrganizationId = "TGT-receiving",
		) => ({
			id,
			patientId: sourceOrganizationId === hospitalId ? "patient-a" : "patient-b",
			sourceOrganizationId,
			targetOrganizationId,
			targetHospitalName: "Receiving Hospital",
			targetHospitalEmail: "records@receiving.org",
			status,
			completedAt: status === "completed" ? completedAt : null,
		});

		await authModule.db
			.insert(schema.patientTransfer)
			.values([
				transfer("a-completed", hospitalId, "completed"),
				transfer("a-pending-1", hospitalId, "pending"),
				transfer("a-pending-2", hospitalId, "pending"),
				transfer("a-rejected", hospitalId, "rejected"),
				transfer("a-failed", hospitalId, "failed"),
				transfer("b-completed", otherHospitalId, "completed"),
				transfer("b-pending-to-a", otherHospitalId, "pending", hospitalId),
			]);
	});

	afterAll(async () => {
		await authModule?.sql.end();
	});

	test("count only the hospital's own outgoing transfers that were sent or are waiting on the patient", async () => {
		const stats = await getOverviewStatsForOrganization(hospitalId);

		expect(stats.completedTransfers).toBe(1);
		expect(stats.patientTransferredAt).toEqual([completedAt.toISOString()]);
		expect(stats.pendingTransfers).toBe(2);
		expect(stats.pendingTransferredAt).toHaveLength(2);
	});
});
