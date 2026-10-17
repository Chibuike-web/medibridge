// @vitest-environment node

import { beforeEach, describe, expect, test, vi } from "vitest";
import { createPatientEncounterAction } from "./create-patient-encounter-action";

const { getSessionDataMock, getOrganizationIdMock, patientRows, savedEncounters } = vi.hoisted(
	() => ({
		getSessionDataMock: vi.fn(),
		getOrganizationIdMock: vi.fn(),
		patientRows: [] as { id: string }[],
		savedEncounters: [] as Record<string, unknown>[],
	}),
);

vi.mock("@/lib/api/get-session-data", () => ({ getSessionData: getSessionDataMock }));
vi.mock("@/lib/api/get-organization-id", () => ({ getOrganizationId: getOrganizationIdMock }));
vi.mock("next/cache", () => ({ updateTag: vi.fn() }));
vi.mock("@/lib/better-auth/auth", () => ({
	db: {
		select: () => ({ from: () => ({ where: () => ({ limit: async () => patientRows }) }) }),
		insert: () => ({
			values: async (row: Record<string, unknown>) => {
				savedEncounters.push(row);
			},
		}),
	},
}));

function encounterForm(overrides: Record<string, string> = {}) {
	const formData = new FormData();
	for (const [field, value] of Object.entries({
		encounterType: "Follow-up Visit",
		department: "Family Medicine",
		physician: "Dr. Ada Obi",
		encounterDate: "2026-10-14T08:45:00.000Z",
		reason: "Review of blood pressure medication",
		...overrides,
	}))
		formData.set(field, value);
	return formData;
}

describe("creating a patient encounter", () => {
	beforeEach(() => {
		vi.useFakeTimers({ now: new Date("2026-10-14T10:00:00Z"), toFake: ["Date"] });
		savedEncounters.length = 0;
		patientRows.splice(0, patientRows.length, { id: "patient-1" });
		getSessionDataMock.mockResolvedValue({
			user: { id: "member-1", name: "Ada Obi", emailVerified: true },
		});
		getOrganizationIdMock.mockResolvedValue("hospital-1");
	});

	test("a verified hospital member can open an encounter for their patient", async () => {
		const result = await createPatientEncounterAction("patient-1", encounterForm());

		expect(result).toEqual({ status: "success", encounterId: expect.stringMatching(/^ENC-/) });
		expect(savedEncounters).toEqual([
			{
				id: result.status === "success" ? result.encounterId : "",
				patientId: "patient-1",
				encounterType: "Follow-up Visit",
				department: "Family Medicine",
				physician: "Dr. Ada Obi",
				encounterDate: new Date("2026-10-14T08:45:00.000Z"),
				reason: "Review of blood pressure medication",
				createdBy: "Ada Obi",
				updatedBy: "Ada Obi",
			},
		]);
	});

	test("saves no reason when the reason for encounter is left blank", async () => {
		await createPatientEncounterAction("patient-1", encounterForm({ reason: "  " }));

		expect(savedEncounters).toEqual([expect.objectContaining({ reason: null })]);
	});

	test.each([
		{ field: "encounterType", value: "Home Visit", error: "Select an encounter type." },
		{ field: "department", value: "Dermatology", error: "Select a department." },
		{ field: "physician", value: "   ", error: "Enter the physician." },
		{ field: "encounterDate", value: "", error: "Enter the encounter date." },
		{
			field: "encounterDate",
			value: "2026-10-15T09:00:00.000Z",
			error: "The encounter date can’t be in the future.",
		},
	])("rejects $field set to '$value' without saving", async ({ field, value, error }) => {
		expect(
			await createPatientEncounterAction("patient-1", encounterForm({ [field]: value })),
		).toEqual({ status: "failed", error });
		expect(savedEncounters).toEqual([]);
	});

	test("asks a signed-out user to sign in again without saving", async () => {
		getSessionDataMock.mockResolvedValue(null);

		expect(await createPatientEncounterAction("patient-1", encounterForm())).toEqual({
			status: "unauthorized",
			error: "You must be signed in to create encounters.",
		});
		expect(savedEncounters).toEqual([]);
	});

	test.each([
		{
			scenario: "their email is unverified",
			setup: () =>
				getSessionDataMock.mockResolvedValue({
					user: { id: "member-1", name: "Ada Obi", emailVerified: false },
				}),
			error: "Verify your email before creating encounters.",
		},
		{
			scenario: "their hospital is unverified",
			setup: () => getOrganizationIdMock.mockResolvedValue(null),
			error: "Your hospital must be verified before you can create encounters.",
		},
		{
			scenario: "the patient belongs to another hospital",
			setup: () => patientRows.splice(0),
			error: "Patient could not be found.",
		},
	])("cannot create an encounter when $scenario", async ({ setup, error }) => {
		setup();

		expect(await createPatientEncounterAction("patient-1", encounterForm())).toEqual({
			status: "failed",
			error,
		});
		expect(savedEncounters).toEqual([]);
	});
});
