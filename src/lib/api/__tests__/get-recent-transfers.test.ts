import { beforeEach, describe, expect, test, vi } from "vitest";
import { getRecentTransfersForOrganization } from "../get-recent-transfers";

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

describe("getRecentTransfersForOrganization", () => {
	beforeEach(() => {
		selectMock.mockReset();
	});

	test("maps recent transfer rows and normalizes statuses", async () => {
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

		expect(await getRecentTransfersForOrganization("org-1")).toEqual([
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
