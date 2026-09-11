import { beforeEach, describe, expect, test, vi } from "vitest";
import { getRecentPatients } from "../get-recent-patients";

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

describe("getRecentPatients", () => {
	beforeEach(() => {
		getOrganizationIdMock.mockReset();
		selectMock.mockReset();
	});

	test("returns no recent patients without an active organization", async () => {
		getOrganizationIdMock.mockResolvedValue(null);

		expect(await getRecentPatients()).toEqual([]);
		expect(selectMock).not.toHaveBeenCalled();
	});

	test("maps recent patient rows into dashboard records", async () => {
		getOrganizationIdMock.mockResolvedValue("org-1");
		const createdAt = new Date("2026-02-01T00:00:00.000Z");
		const limitMock = vi.fn().mockResolvedValue([
			{
				name: "Ada",
				lastName: "Lovelace",
				createdAt,
				patientId: "patient-1",
				gender: "female",
				age: 36,
			},
			{
				name: "Alan",
				lastName: "Turing",
				createdAt,
				patientId: "patient-2",
				gender: null,
				age: null,
			},
		]);
		selectMock.mockReturnValue({
			from: vi.fn(() => ({
				leftJoin: vi.fn(() => ({
					where: vi.fn(() => ({
						orderBy: vi.fn(() => ({
							limit: limitMock,
						})),
					})),
				})),
			})),
		});

		const patients = await getRecentPatients();
		expect(patients).toMatchObject([
			{
				name: "Ada Lovelace",
				createdAt: createdAt.toISOString(),
				patientId: "patient-1",
				gender: "Female",
				age: 36,
			},
			{
				name: "Alan Turing",
				createdAt: createdAt.toISOString(),
				patientId: "patient-2",
			},
		]);
		expect(limitMock).toHaveBeenCalledWith(10);
	});
});
