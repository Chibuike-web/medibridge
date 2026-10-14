// @vitest-environment node

import { beforeEach, describe, expect, test, vi } from "vitest";
import { createPatientMedicationAction } from "./create-patient-medication-action";

const { getSessionDataMock, getOrganizationIdMock, updateTagMock, rows, savedMedications } =
	vi.hoisted(() => ({
		getSessionDataMock: vi.fn(),
		getOrganizationIdMock: vi.fn(),
		updateTagMock: vi.fn(),
		rows: { patients: [] as { id: string }[], encounters: [] as { id: string }[] },
		savedMedications: [] as Record<string, unknown>[],
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
					savedMedications.push(row);
				},
			}),
		},
	};
});

function medicationForm(overrides: Record<string, string> = {}) {
	const formData = new FormData();
	for (const [field, value] of Object.entries({
		medicationName: "Amlodipine",
		indication: "Essential hypertension",
		status: "Active",
		dose: "5 mg",
		route: "Oral",
		prescribedBy: "Dr. Ada Obi",
		frequency: "Once daily",
		duration: "3 months",
		startedAt: "2026-10-12",
		clinicalNote: "Review blood pressure in two weeks.",
		...overrides,
	}))
		formData.set(field, value);
	return formData;
}

describe("adding a patient medication", () => {
	beforeEach(() => {
		vi.useFakeTimers({ now: new Date("2026-10-14T10:00:00Z"), toFake: ["Date"] });
		savedMedications.length = 0;
		updateTagMock.mockClear();
		rows.patients = [{ id: "patient-1" }];
		rows.encounters = [{ id: "ENC-1" }];
		getSessionDataMock.mockResolvedValue({
			user: { id: "member-1", name: "Ada Obi", emailVerified: true },
		});
		getOrganizationIdMock.mockResolvedValue("hospital-1");
	});

	test("a verified hospital member can add a medication without an encounter", async () => {
		const result = await createPatientMedicationAction("patient-1", medicationForm());

		expect(result).toEqual({ status: "success", medicationId: expect.stringMatching(/^MED-/) });
		expect(savedMedications).toEqual([
			{
				id: result.status === "success" ? result.medicationId : "",
				patientId: "patient-1",
				encounterId: null,
				medicationName: "Amlodipine",
				indication: "Essential hypertension",
				status: "Active",
				dose: "5 mg",
				route: "Oral",
				prescribedBy: "Dr. Ada Obi",
				frequency: "Once daily",
				duration: "3 months",
				startedAt: "2026-10-12",
				clinicalNote: "Review blood pressure in two weeks.",
				createdBy: "Ada Obi",
				updatedBy: "Ada Obi",
			},
		]);
		expect(updateTagMock).toHaveBeenCalledWith("patient-medications-hospital-1-patient-1");
	});

	test("links the medication to the patient's encounter it was added from", async () => {
		await createPatientMedicationAction("patient-1", medicationForm({ encounterId: "ENC-1" }));

		expect(savedMedications).toEqual([expect.objectContaining({ encounterId: "ENC-1" })]);
	});

	test("saves no clinical note when it is left blank", async () => {
		await createPatientMedicationAction("patient-1", medicationForm({ clinicalNote: " " }));

		expect(savedMedications).toEqual([expect.objectContaining({ clinicalNote: null })]);
	});

	test.each([
		{ field: "medicationName", value: " ", error: "Enter the medication." },
		{ field: "indication", value: " ", error: "Enter the indication." },
		{ field: "status", value: "Paused", error: "Select a status." },
		{ field: "dose", value: " ", error: "Enter the dose." },
		{ field: "route", value: "Topical", error: "Select a route." },
		{ field: "prescribedBy", value: " ", error: "Enter who prescribed it." },
		{ field: "frequency", value: " ", error: "Enter how often it is taken." },
		{ field: "duration", value: " ", error: "Enter how long it is taken for." },
		{ field: "startedAt", value: "", error: "Select the start date." },
		{ field: "startedAt", value: "2026-10-20", error: "The start date can’t be in the future." },
	])("rejects $field set to '$value' without saving", async ({ field, value, error }) => {
		expect(
			await createPatientMedicationAction("patient-1", medicationForm({ [field]: value })),
		).toEqual({ status: "failed", error });
		expect(savedMedications).toEqual([]);
	});

	test("asks a signed-out user to sign in again without saving", async () => {
		getSessionDataMock.mockResolvedValue(null);

		expect(await createPatientMedicationAction("patient-1", medicationForm())).toEqual({
			status: "unauthorized",
			error: "You must be signed in to add medications.",
		});
		expect(savedMedications).toEqual([]);
	});

	test.each([
		{
			scenario: "their email is unverified",
			setup: () =>
				getSessionDataMock.mockResolvedValue({
					user: { id: "member-1", name: "Ada Obi", emailVerified: false },
				}),
			error: "Verify your email before adding medications.",
		},
		{
			scenario: "their hospital is unverified",
			setup: () => getOrganizationIdMock.mockResolvedValue(null),
			error: "Your hospital must be verified before you can add medications.",
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
	])("cannot add a medication when $scenario", async ({ setup, error }) => {
		setup();

		expect(
			await createPatientMedicationAction("patient-1", medicationForm({ encounterId: "ENC-1" })),
		).toEqual({ status: "failed", error });
		expect(savedMedications).toEqual([]);
	});
});
