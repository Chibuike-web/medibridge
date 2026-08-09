import { describe, expect, test, vi, beforeEach } from "vitest";
import { getPatientById } from "../get-patient-by-id";

const { getOrganizationIdMock, selectMock } = vi.hoisted(() => ({
	getOrganizationIdMock: vi.fn(),
	selectMock: vi.fn(),
}));

vi.mock("../get-organization-id", () => ({
	getOrganizationId: getOrganizationIdMock,
}));

vi.mock("next/cache", () => ({
	cacheLife: vi.fn(),
	cacheTag: vi.fn(),
}));

vi.mock("@/lib/better-auth/auth", () => ({
	db: {
		select: selectMock,
	},
}));

describe("getPatientById", () => {
	beforeEach(() => {
		getOrganizationIdMock.mockReset();
		selectMock.mockReset();
	});
	test("returns an empty result when there is no active organization", async () => {
		getOrganizationIdMock.mockResolvedValue(null);
		const result = await getPatientById("org-1");
		expect(getOrganizationIdMock).toHaveBeenCalledOnce();
		expect(result).toBeNull();
	});
	test("return a patient when there is an active organization", async () => {
		getOrganizationIdMock.mockResolvedValue("org-1");
		selectMock.mockReturnValueOnce({
			from: vi.fn(() => ({
				innerJoin: vi.fn(() => ({
					leftJoin: vi.fn(() => ({
						where: vi.fn(() => ({
							limit: vi.fn().mockResolvedValue([
								{
									patientId: "PAT-01",
									firstName: "Chibuike",
									lastName: "Maduabuchi",
									sex: "Male",
									email: "obinnatc@gmail.com",
									phoneNumber: "0708444545",
									address: "Okpara Avenue",
								},
							]),
						})),
					})),
				})),
			})),
		});
		const patient = await getPatientById("PAT-01");
		expect(patient).toMatchObject({
			patientId: "PAT-01",
			firstName: "Chibuike",
			lastName: "Maduabuchi",
			sex: "Male",
			email: "obinnatc@gmail.com",
			phoneNumber: "0708444545",
			address: "Okpara Avenue",
		});
	});

	test("returns null when the patient is not found", async () => {
		getOrganizationIdMock.mockResolvedValue("org-1");

		selectMock.mockReturnValueOnce({
			from: vi.fn(() => ({
				innerJoin: vi.fn(() => ({
					leftJoin: vi.fn(() => ({
						where: vi.fn(() => ({
							limit: vi.fn().mockResolvedValue([]),
						})),
					})),
				})),
			})),
		});

		const patient = await getPatientById("missing-patient");

		expect(patient).toBeNull();
	});

	test("returns null for patient from another organization", async () => {
		getOrganizationIdMock.mockResolvedValue("org-1");
		selectMock.mockReturnValueOnce({
			from: vi.fn(() => ({
				innerJoin: vi.fn(() => ({
					leftJoin: vi.fn(() => ({
						where: vi.fn(() => ({
							limit: vi.fn().mockResolvedValue([]),
						})),
					})),
				})),
			})),
		});
		const patient = await getPatientById("patient-from-org-2");
		expect(patient).toBeNull();
		expect(getOrganizationIdMock).toHaveBeenCalledOnce();
	});

	test("return - when sex is null", async () => {
		getOrganizationIdMock.mockResolvedValue("org-1");
		selectMock.mockReturnValueOnce({
			from: vi.fn(() => ({
				innerJoin: vi.fn(() => ({
					leftJoin: vi.fn(() => ({
						where: vi.fn(() => ({
							limit: vi.fn().mockResolvedValue([
								{
									patientId: "PAT-01",
									firstName: "Chibuike",
									lastName: "Maduabuchi",
									sex: null,
									email: "obinnatc@gmail.com",
									phoneNumber: "0708444545",
									address: "Okpara Avenue",
								},
							]),
						})),
					})),
				})),
			})),
		});
		const patient = await getPatientById("PAT-01");
		expect(patient?.sex).toBe("-");
	});
});
