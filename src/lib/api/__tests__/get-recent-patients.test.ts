import { beforeEach, describe, expect, test, vi } from "vitest";
import { getRecentPatientsForOrganization } from "../get-recent-patients";

const { selectMock } = vi.hoisted(() => ({
	selectMock: vi.fn(),
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

describe("getRecentPatientsForOrganization", () => {
	beforeEach(() => {
		selectMock.mockReset();
	});

	test("maps recent patient rows into dashboard records", async () => {
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

		const patients = await getRecentPatientsForOrganization("org-1");
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
