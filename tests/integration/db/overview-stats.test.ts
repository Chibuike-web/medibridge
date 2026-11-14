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
		const stats = await getOverviewStatsForOrganization(
			hospitalId,
			new Date("2026-10-01T00:00:00.000Z"),
		);

		expect(stats.completedTransfers).toEqual({ total: 1, thisMonth: 1, lastMonth: 0 });
		expect(stats.pendingTransfers.total).toBe(2);
	});

	test("counts this month from its first instant and last month as the whole previous month, across the new year", async () => {
		await authModule.db.insert(schema.organization).values({
			id: "hospital-c",
			name: "Hospital C",
			slug: "hospital-c",
			createdAt: new Date(),
			isVerified: true,
		});
		await authModule.db.insert(schema.patient).values([
			{
				id: "c-new-year",
				organizationId: "hospital-c",
				createdAt: new Date("2026-01-01T00:00:00.000Z"),
			},
			{
				id: "c-january",
				organizationId: "hospital-c",
				createdAt: new Date("2026-01-20T08:00:00.000Z"),
			},
			{
				id: "c-new-years-eve",
				organizationId: "hospital-c",
				createdAt: new Date("2025-12-31T23:59:59.000Z"),
			},
			{
				id: "c-december",
				organizationId: "hospital-c",
				createdAt: new Date("2025-12-01T00:00:00.000Z"),
			},
			{
				id: "c-november",
				organizationId: "hospital-c",
				createdAt: new Date("2025-11-30T23:59:59.000Z"),
			},
			{
				id: "b-january",
				organizationId: otherHospitalId,
				createdAt: new Date("2026-01-05T08:00:00.000Z"),
			},
		]);

		const stats = await getOverviewStatsForOrganization(
			"hospital-c",
			new Date("2026-01-01T00:00:00.000Z"),
		);

		expect(stats.patients).toEqual({ total: 5, thisMonth: 2, lastMonth: 2 });
		expect(stats.hasPatients).toBe(true);
	});
});
