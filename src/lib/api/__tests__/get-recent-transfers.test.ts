import { beforeEach, describe, expect, test, vi } from "vitest";
import { getRecentTransfer } from "../get-recent-transfers";

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

describe("getRecentTransfer", () => {
	beforeEach(() => {
		getOrganizationIdMock.mockReset();
		selectMock.mockReset();
	});

	test("returns no recent transfers without an active organization", async () => {
		getOrganizationIdMock.mockResolvedValue(null);

		expect(await getRecentTransfer()).toEqual([]);
		expect(selectMock).not.toHaveBeenCalled();
	});

	test("maps recent transfer rows and normalizes statuses", async () => {
		getOrganizationIdMock.mockResolvedValue("org-1");
		const requestedAt = new Date("2026-02-05T00:00:00.000Z");
		const limitMock = vi.fn().mockResolvedValue([
			{
				id: "transfer-1",
				status: "sent",
				patientId: "patient-1",
				requestedAt,
				requestedBy: "user-1",
				createdBy: "user-1",
				updatedBy: null,
				targetHospitalName: "General Hospital",
				targetHospitalEmail: "hospital@example.com",
				firstName: "Ada",
				middleName: null,
				lastName: "Lovelace",
			},
			{
				id: "transfer-2",
				status: "unknown",
				patientId: "patient-2",
				requestedAt,
				requestedBy: null,
				createdBy: "user-2",
				updatedBy: "user-3",
				targetHospitalName: "City Hospital",
				targetHospitalEmail: "city@example.com",
				firstName: "Grace",
				middleName: "B.",
				lastName: "Hopper",
			},
		]);
		selectMock.mockReturnValue({
			from: vi.fn(() => ({
				innerJoin: vi.fn(() => ({
					where: vi.fn(() => ({
						orderBy: vi.fn(() => ({
							limit: limitMock,
						})),
					})),
				})),
			})),
		});

		expect(await getRecentTransfer()).toEqual([
			{
				id: "transfer-1",
				patientName: "Ada Lovelace",
				patientFirstName: "Ada",
				patientMiddleName: null,
				patientLastName: "Lovelace",
				patientId: "patient-1",
				status: "completed",
				requestedAt: requestedAt.toISOString(),
				requestedBy: "user-1",
				createdBy: "user-1",
				updatedBy: null,
				targetHospitalName: "General Hospital",
				targetHospitalEmail: "hospital@example.com",
				transferContent: [],
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
				requestedBy: null,
				createdBy: "user-2",
				updatedBy: "user-3",
				targetHospitalName: "City Hospital",
				targetHospitalEmail: "city@example.com",
				transferContent: [],
			},
		]);
		expect(limitMock).toHaveBeenCalledWith(10);
	});
});
