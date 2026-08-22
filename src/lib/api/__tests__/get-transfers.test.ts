import { beforeEach, describe, expect, test, vi } from "vitest";
import { getTransfers } from "../get-transfers";

const { getOrganizationIdMock, selectMock } = vi.hoisted(() => ({
	getOrganizationIdMock: vi.fn(),
	selectMock: vi.fn(),
}));

vi.mock("../get-organization-id", () => ({
	getOrganizationId: getOrganizationIdMock,
}));

vi.mock("@/lib/better-auth/auth", () => ({
	db: { select: selectMock },
}));

vi.mock("next/cache", () => ({
	cacheLife: vi.fn(),
	cacheTag: vi.fn(),
}));

function countQuery(rows: { value: number }[]) {
	return {
		from: vi.fn(() => ({
			where: vi.fn().mockResolvedValue(rows),
		})),
	};
}

function filteredCountQuery(rows: { value: number }[]) {
	return {
		from: vi.fn(() => ({
			innerJoin: vi.fn(() => ({
				innerJoin: vi.fn(() => ({
					where: vi.fn().mockResolvedValue(rows),
				})),
			})),
		})),
	};
}

function transferRowsQuery(rows: unknown[]) {
	const limitMock = vi.fn(() => ({
		offset: vi.fn().mockResolvedValue(rows),
	}));

	const query = {
		from: vi.fn(() => ({
			innerJoin: vi.fn(() => ({
				innerJoin: vi.fn(() => ({
					where: vi.fn(() => ({
						orderBy: vi.fn(() => ({
							limit: limitMock,
						})),
					})),
				})),
			})),
		})),
	};

	return { query, limitMock };
}

describe("getTransfers", () => {
	beforeEach(() => {
		getOrganizationIdMock.mockReset();
		selectMock.mockReset();
	});

	test("returns an empty result without querying when there is no active organization", async () => {
		getOrganizationIdMock.mockResolvedValue(null);

		const result = await getTransfers(1, 14);

		expect(result).toEqual({
			transfers: [],
			totalTransfers: 0,
			hasTransfers: false,
		});
		expect(selectMock).not.toHaveBeenCalled();
	});

	test("normalizes invalid pagination and maps database rows", async () => {
		getOrganizationIdMock.mockResolvedValue("org-1");
		const requestedAt = new Date("2026-02-03T12:00:00.000Z");
		const rowsQuery = transferRowsQuery([
			{
				id: "transfer-1",
				status: "approved",
				patientId: "patient-1",
				requestedAt,
				targetHospitalName: "General Hospital",
				targetHospitalEmail: "hospital@example.com",
				firstName: "Ada",
				middleName: null,
				lastName: "Lovelace",
			},
			{
				id: "transfer-2",
				status: "unexpected-status",
				patientId: "patient-2",
				requestedAt,
				targetHospitalName: "City Hospital",
				targetHospitalEmail: "city@example.com",
				firstName: "Grace",
				middleName: "B.",
				lastName: "Hopper",
			},
		]);

		selectMock
			.mockReturnValueOnce(countQuery([{ value: 3 }]))
			.mockReturnValueOnce(filteredCountQuery([{ value: 2 }]))
			.mockReturnValueOnce(rowsQuery.query);

		const result = await getTransfers(0, 0, "  patient  ");

		expect(result).toEqual({
			totalTransfers: 2,
			hasTransfers: true,
			transfers: [
				{
					id: "transfer-1",
					patientName: "Ada Lovelace",
					patientFirstName: "Ada",
					patientMiddleName: null,
					patientLastName: "Lovelace",
					patientId: "patient-1",
					status: "completed",
					requestedAt: requestedAt.toISOString(),
					targetHospitalName: "General Hospital",
					targetHospitalEmail: "hospital@example.com",
				},
				{
					id: "transfer-2",
					patientName: "Grace B. Hopper",
					patientFirstName: "Grace",
					patientMiddleName: "B.",
					patientLastName: "Hopper",
					patientId: "patient-2",
					status: "pending",
					requestedAt: requestedAt.toISOString(),
					targetHospitalName: "City Hospital",
					targetHospitalEmail: "city@example.com",
				},
			],
		});
		expect(rowsQuery.limitMock).toHaveBeenCalledWith(14);
	});

	test("returns empty transfers when the organization has no matching rows", async () => {
		getOrganizationIdMock.mockResolvedValue("org-1");
		const rowsQuery = transferRowsQuery([]);

		selectMock
			.mockReturnValueOnce(countQuery([{ value: 0 }]))
			.mockReturnValueOnce(filteredCountQuery([]))
			.mockReturnValueOnce(rowsQuery.query);

		const result = await getTransfers(1, 10);

		expect(result).toEqual({
			transfers: [],
			totalTransfers: 0,
			hasTransfers: false,
		});
	});
});
