import { describe, expect, test, vi, beforeEach } from "vitest";
import { getPatientById } from "../get-patient-by-id";
import { PgDialect } from "drizzle-orm/pg-core";

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
		const result = await getPatientById("patient-1");
		expect(selectMock).not.toHaveBeenCalled();
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

	test("restricts the lookup to both the requested patient and active organization", async () => {
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
		const from = selectMock.mock.results[0].value.from;
		const innerJoin = from.mock.results[0].value.innerJoin;
		const leftJoin = innerJoin.mock.results[0].value.leftJoin;
		const where = leftJoin.mock.results[0].value.where;
		const query = new PgDialect().sqlToQuery(where.mock.calls[0][0]);
		expect(query.params).toEqual(["patient-from-org-2", "org-1"]);
		expect(query.sql).toContain('"patient"."id" = $1');
		expect(query.sql).toContain('"patient"."organization_id" = $2');
		expect(query.sql).toContain(" and ");
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
