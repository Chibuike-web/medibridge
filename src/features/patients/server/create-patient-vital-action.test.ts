// @vitest-environment node

import { beforeEach, describe, expect, test, vi } from "vitest";
import { createPatientVitalAction } from "./create-patient-vital-action";

const { getSessionDataMock, getOrganizationIdMock, selectMock, savedVitals } = vi.hoisted(() => ({
	getSessionDataMock: vi.fn(),
	getOrganizationIdMock: vi.fn(),
	selectMock: vi.fn(),
	savedVitals: [] as Record<string, unknown>[],
}));

vi.mock("@/lib/api/get-session-data", () => ({ getSessionData: getSessionDataMock }));
vi.mock("@/lib/api/get-organization-id", () => ({ getOrganizationId: getOrganizationIdMock }));
vi.mock("next/cache", () => ({ updateTag: vi.fn(), cacheLife: vi.fn(), cacheTag: vi.fn() }));
vi.mock("@/lib/better-auth/auth", () => ({
	db: {
		select: selectMock,
		insert: () => ({
			values: (row: Record<string, unknown>) => ({
				returning: async () => {
					savedVitals.push(row);
					return [{ ...row, createdAt: new Date("2026-10-10T09:00:00Z") }];
				},
			}),
		}),
	},
}));

function validVitals() {
	const formData = new FormData();
	for (const [field, value] of Object.entries({
		encounterId: "encounter-1",
		bloodPressure: "120/80",
		heartRate: "75",
		respiratoryRate: "16",
		temperature: "37",
		oxygenSaturation: "98",
		weight: "65",
		bmi: "22",
	}))
		formData.set(field, value);
	return formData;
}

describe("adding patient vitals", () => {
	beforeEach(() => {
		savedVitals.length = 0;
		getSessionDataMock.mockResolvedValue({
			user: { id: "member-1", name: "Ada", emailVerified: true },
		});
		getOrganizationIdMock.mockResolvedValue("hospital-1");
		selectMock.mockImplementation((fields: Record<string, unknown>) => ({
			from: () => ({
				where: () => ({
					limit: async () =>
						fields.encounterType ? [{ encounterType: "Routine Checkup" }] : [{ id: "patient-1" }],
				}),
			}),
		}));
	});

	test("a verified hospital member can save vitals for their patient's encounter", async () => {
		const result = await createPatientVitalAction("patient-1", validVitals());
		expect(result).toMatchObject({
			status: "success",
			vital: {
				encounterId: "encounter-1",
				encounterType: "Routine Checkup",
				systolic: 120,
				diastolic: 80,
				createdBy: "Ada",
			},
		});
		expect(savedVitals).toEqual([
			expect.objectContaining({
				patientId: "patient-1",
				encounterId: "encounter-1",
				heartRate: 75,
			}),
		]);
	});

	test.each([
		{ scenario: "signed out", session: null, error: "You need to be signed in to add vitals." },
		{
			scenario: "without a user ID",
			session: { user: { name: "Ada", emailVerified: true } },
			error: "You need to be signed in to add vitals.",
		},
		{
			scenario: "unverified",
			session: { user: { id: "member-1", emailVerified: false } },
			error: "Verify your email before adding vitals.",
		},
	])("cannot save vitals when $scenario", async ({ session, error }) => {
		getSessionDataMock.mockResolvedValue(session);
		expect(await createPatientVitalAction("patient-1", validVitals())).toEqual({
			status: "failed",
			error,
		});
		expect(savedVitals).toEqual([]);
	});

	test("cannot save vitals without verified hospital access", async () => {
		getOrganizationIdMock.mockResolvedValue(null);
		expect(await createPatientVitalAction("patient-1", validVitals())).toEqual({
			status: "failed",
			error: "You need an active organization to add vitals.",
		});
		expect(savedVitals).toEqual([]);
	});
});
