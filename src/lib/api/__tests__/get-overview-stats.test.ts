import { beforeEach, describe, expect, test, vi } from "vitest";
import { getOverviewStats } from "../get-overview-stats";

const { getOrganizationIdMock, selectMock } = vi.hoisted(() => ({
	getOrganizationIdMock: vi.fn(),
	selectMock: vi.fn(),
}));

vi.mock("../get-organization-id", () => ({
	getOrganizationId: getOrganizationIdMock,
}));

vi.mock("@/lib/better-auth/auth", () => ({
	db: {
		select: selectMock,
	},
}));

vi.mock("next/cache", () => ({
	cacheLife: vi.fn(),
	cacheTag: vi.fn(),
}));

function whereQuery(rows: unknown[]) {
	return {
		from: vi.fn(() => ({
			where: vi.fn().mockResolvedValue(rows),
		})),
	};
}

function joinedWhereQuery(rows: unknown[]) {
	return {
		from: vi.fn(() => ({
			innerJoin: vi.fn(() => ({
				where: vi.fn().mockResolvedValue(rows),
			})),
		})),
	};
}

describe("getOverviewStats", () => {
	beforeEach(() => {
		getOrganizationIdMock.mockReset();
		selectMock.mockReset();
	});

	test("returns empty dashboard stats without an active organization", async () => {
		getOrganizationIdMock.mockResolvedValue(null);

		const result = await getOverviewStats();

		expect(result).toEqual({
			totalPatients: 0,
			transferredRecords: 0,
			pendingTransfers: 0,
			patientCreatedAt: [],
			patientTransferredAt: [],
			pendingTransferredAt: [],
			encounterCreatedAt: [],
			hasPatients: false,
		});
		expect(selectMock).not.toHaveBeenCalled();
	});

	test("combines counts and date rows into dashboard stats", async () => {
		getOrganizationIdMock.mockResolvedValue("org-1");
		const patientCreatedAt = new Date("2026-01-01T00:00:00.000Z");
		const transferredAt = new Date("2026-01-02T00:00:00.000Z");
		const pendingAt = new Date("2026-01-03T00:00:00.000Z");
		const encounterCreatedAt = new Date("2026-01-04T00:00:00.000Z");

		selectMock
			.mockReturnValueOnce(whereQuery([{ value: 4 }]))
			.mockReturnValueOnce(whereQuery([{ value: 2 }]))
			.mockReturnValueOnce(whereQuery([{ value: 1 }]))
			.mockReturnValueOnce(whereQuery([{ createdAt: patientCreatedAt }]))
			.mockReturnValueOnce(whereQuery([{ createdAt: transferredAt }]))
			.mockReturnValueOnce(whereQuery([{ createdAt: pendingAt }]))
			.mockReturnValueOnce(joinedWhereQuery([{ createdAt: encounterCreatedAt }]));

		const result = await getOverviewStats();

		expect(result).toEqual({
			totalPatients: 4,
			transferredRecords: 2,
			pendingTransfers: 1,
			patientCreatedAt: [patientCreatedAt.toISOString()],
			patientTransferredAt: [transferredAt.toISOString()],
			pendingTransferredAt: [pendingAt.toISOString()],
			encounterCreatedAt: [encounterCreatedAt.toISOString()],
			hasPatients: true,
		});
	});
});
