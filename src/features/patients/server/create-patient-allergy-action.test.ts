// @vitest-environment node

import { beforeEach, describe, expect, test, vi } from "vitest";
import { createPatientAllergyAction } from "./create-patient-allergy-action";

const { getSessionDataMock, getOrganizationIdMock, updateTagMock, rows, savedAllergies } =
	vi.hoisted(() => ({
		getSessionDataMock: vi.fn(),
		getOrganizationIdMock: vi.fn(),
		updateTagMock: vi.fn(),
		rows: { patients: [] as { id: string }[], encounters: [] as { id: string }[] },
		savedAllergies: [] as Record<string, unknown>[],
	}));

vi.mock("@/lib/api/get-session-data", () => ({ getSessionData: getSessionDataMock }));
vi.mock("@/lib/api/get-organization-id", () => ({ getOrganizationId: getOrganizationIdMock }));
vi.mock("next/cache", () => ({ updateTag: updateTagMock }));
vi.mock("@/lib/better-auth/auth", async () => {
	const { patientEncounter } = await import("@/db/schemas");

	return {
		db: {
			select: () => ({
				from: (table: unknown) => ({
					where: () => ({
						limit: async () => (table === patientEncounter ? rows.encounters : rows.patients),
					}),
				}),
			}),
			insert: () => ({
				values: async (row: Record<string, unknown>) => {
					savedAllergies.push(row);
				},
			}),
		},
	};
});

function allergyForm(overrides: Record<string, string> = {}) {
	const formData = new FormData();
	for (const [field, value] of Object.entries({
		allergen: "Penicillin",
		severity: "Severe",
		status: "Active",
		reaction: "Generalised rash and facial swelling",
		clinicalNote: "Reported by the referring hospital.",
		...overrides,
	}))
		formData.set(field, value);
	return formData;
}

describe("adding a patient allergy", () => {
	beforeEach(() => {
		savedAllergies.length = 0;
		updateTagMock.mockClear();
		rows.patients = [{ id: "patient-1" }];
		rows.encounters = [{ id: "ENC-1" }];
		getSessionDataMock.mockResolvedValue({
			user: { id: "member-1", name: "Ada Obi", emailVerified: true },
		});
		getOrganizationIdMock.mockResolvedValue("hospital-1");
	});

	test("a verified hospital member can add an allergy without an encounter", async () => {
		const result = await createPatientAllergyAction("patient-1", allergyForm());

		expect(result).toEqual({ status: "success", allergyId: expect.stringMatching(/^ALLE-/) });
		expect(savedAllergies).toEqual([
			{
				id: result.status === "success" ? result.allergyId : "",
				patientId: "patient-1",
				encounterId: null,
				allergen: "Penicillin",
				severity: "Severe",
				status: "Active",
				reaction: "Generalised rash and facial swelling",
				clinicalNote: "Reported by the referring hospital.",
				createdBy: "Ada Obi",
				updatedBy: "Ada Obi",
			},
		]);
		expect(updateTagMock).toHaveBeenCalledWith("patient-allergies-hospital-1-patient-1");
	});

	test("links the allergy to the patient's encounter it was added from", async () => {
		await createPatientAllergyAction("patient-1", allergyForm({ encounterId: "ENC-1" }));

		expect(savedAllergies).toEqual([expect.objectContaining({ encounterId: "ENC-1" })]);
	});

	test("saves no clinical note when it is left blank", async () => {
		await createPatientAllergyAction("patient-1", allergyForm({ clinicalNote: "  " }));

		expect(savedAllergies).toEqual([expect.objectContaining({ clinicalNote: null })]);
	});

	test.each([
		{ field: "allergen", value: "  ", error: "Enter the allergen." },
		{ field: "severity", value: "Critical", error: "Select a severity." },
		{ field: "status", value: "Resolved", error: "Select a status." },
		{ field: "reaction", value: " ", error: "Describe the reaction." },
	])("rejects $field set to '$value' without saving", async ({ field, value, error }) => {
		expect(await createPatientAllergyAction("patient-1", allergyForm({ [field]: value }))).toEqual({
			status: "failed",
			error,
		});
		expect(savedAllergies).toEqual([]);
	});

	test("asks a signed-out user to sign in again without saving", async () => {
		getSessionDataMock.mockResolvedValue(null);

		expect(await createPatientAllergyAction("patient-1", allergyForm())).toEqual({
			status: "unauthorized",
			error: "You must be signed in to add allergies.",
		});
		expect(savedAllergies).toEqual([]);
	});

	test.each([
		{
			scenario: "their email is unverified",
			setup: () =>
				getSessionDataMock.mockResolvedValue({
					user: { id: "member-1", name: "Ada Obi", emailVerified: false },
				}),
			error: "Verify your email before adding allergies.",
		},
		{
			scenario: "their hospital is unverified",
			setup: () => getOrganizationIdMock.mockResolvedValue(null),
			error: "Your hospital must be verified before you can add allergies.",
		},
		{
			scenario: "the patient belongs to another hospital",
			setup: () => {
				rows.patients = [];
			},
			error: "Patient could not be found.",
		},
		{
			scenario: "the encounter belongs to another patient",
			setup: () => {
				rows.encounters = [];
			},
			error: "This encounter could not be found for the patient.",
		},
	])("cannot add an allergy when $scenario", async ({ setup, error }) => {
		setup();

		expect(
			await createPatientAllergyAction("patient-1", allergyForm({ encounterId: "ENC-1" })),
		).toEqual({ status: "failed", error });
		expect(savedAllergies).toEqual([]);
	});
});
