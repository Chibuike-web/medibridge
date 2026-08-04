import { describe, expect, test, vi, beforeEach } from "vitest";
import { getPatients } from "../get-patients";

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

describe("getPatients", () => {
	beforeEach(() => {
		getOrganizationIdMock.mockReset();
		selectMock.mockReset();
	});
	test("returns an empty result when there is no active organization", async () => {
		getOrganizationIdMock.mockResolvedValue(null);
		const result = await getPatients(1, 14);
		expect(getOrganizationIdMock).toHaveBeenCalledOnce();
		expect(result).toEqual({
			totalPatients: 0,
			patientCreatedAt: [],
			patients: [],
			hasPatients: false,
		});
	});
	test("returns an empty result when the organization has no patients", async () => {
		getOrganizationIdMock.mockResolvedValue("org-1");

		const allPatientsCountQuery = {
			from: vi.fn(() => ({
				where: vi.fn().mockResolvedValue([{ value: 0 }]),
			})),
		};

		const filteredPatientsCountQuery = {
			from: vi.fn(() => ({
				leftJoin: vi.fn(() => ({
					where: vi.fn().mockResolvedValue([{ value: 0 }]),
				})),
			})),
		};

		const patientRowsQuery = {
			from: vi.fn(() => ({
				leftJoin: vi.fn(() => ({
					where: vi.fn(() => ({
						orderBy: vi.fn(() => ({
							limit: vi.fn(() => ({
								offset: vi.fn().mockResolvedValue([]),
							})),
						})),
					})),
				})),
			})),
		};

		selectMock
			.mockReturnValueOnce(allPatientsCountQuery)
			.mockReturnValueOnce(filteredPatientsCountQuery)
			.mockReturnValueOnce(patientRowsQuery);

		const result = await getPatients(1, 14);

		expect(getOrganizationIdMock).toHaveBeenCalledOnce();
		expect(selectMock).toHaveBeenCalledTimes(3);

		expect(result).toEqual({
			totalPatients: 0,
			patientCreatedAt: [],
			patients: [],
			hasPatients: false,
		});
	});
	test("returns patients for the active organization", async () => {
		getOrganizationIdMock.mockResolvedValue("org-1");

		const createdAt = new Date("2026-01-10T10:00:00.000Z");

		const allPatientsCountQuery = {
			from: vi.fn(() => ({
				where: vi.fn().mockResolvedValue([{ value: 1 }]),
			})),
		};

		const filteredPatientsCountQuery = {
			from: vi.fn(() => ({
				leftJoin: vi.fn(() => ({
					where: vi.fn().mockResolvedValue([{ value: 1 }]),
				})),
			})),
		};

		const patientRowsQuery = {
			from: vi.fn(() => ({
				leftJoin: vi.fn(() => ({
					where: vi.fn(() => ({
						orderBy: vi.fn(() => ({
							limit: vi.fn(() => ({
								offset: vi.fn().mockResolvedValue([
									{
										name: "Ada",
										lastName: "Lovelace",
										createdAt,
										patientId: "patient-1",
										gender: "female",
										age: 36,
									},
								]),
							})),
						})),
					})),
				})),
			})),
		};

		selectMock
			.mockReturnValueOnce(allPatientsCountQuery)
			.mockReturnValueOnce(filteredPatientsCountQuery)
			.mockReturnValueOnce(patientRowsQuery);

		const result = await getPatients(1, 14);

		expect(result).toEqual({
			totalPatients: 1,
			patientCreatedAt: [createdAt.toISOString()],
			patients: [
				{
					name: "Ada Lovelace",
					createdAt: createdAt.toISOString(),
					patientId: "patient-1",
					gender: "Female",
					age: 36,
				},
			],
			hasPatients: true,
		});
	});
});
