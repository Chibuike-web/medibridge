// @vitest-environment node

import { beforeEach, describe, expect, test, vi } from "vitest";
import { createPatientImmunizationAction } from "./create-patient-immunization-action";

const { getSessionDataMock, getOrganizationIdMock, updateTagMock, rows, savedImmunizations } =
	vi.hoisted(() => ({
		getSessionDataMock: vi.fn(),
		getOrganizationIdMock: vi.fn(),
		updateTagMock: vi.fn(),
		rows: { patients: [] as { id: string }[], encounters: [] as { id: string }[] },
		savedImmunizations: [] as Record<string, unknown>[],
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
					savedImmunizations.push(row);
				},
			}),
		},
	};
});

function immunizationForm(overrides: Record<string, string> = {}) {
	const formData = new FormData();
	for (const [field, value] of Object.entries({
		vaccineName: "Hepatitis B",
		seriesType: "Primary",
		currentDose: "2",
		totalDoses: "3",
		status: "Active",
		dateAdministered: "2026-10-12",
		administeredBy: "Nurse Chika",
		clinicalNote: "No adverse reaction observed.",
		...overrides,
	}))
		formData.set(field, value);
	return formData;
}

describe("adding a patient immunization", () => {
	beforeEach(() => {
		vi.useFakeTimers({ now: new Date("2026-10-14T10:00:00Z"), toFake: ["Date"] });
		savedImmunizations.length = 0;
		updateTagMock.mockClear();
		rows.patients = [{ id: "patient-1" }];
		rows.encounters = [{ id: "ENC-1" }];
		getSessionDataMock.mockResolvedValue({
			user: { id: "member-1", name: "Ada Obi", emailVerified: true },
		});
		getOrganizationIdMock.mockResolvedValue("hospital-1");
	});

	test("a verified hospital member can add an immunization without an encounter", async () => {
		const result = await createPatientImmunizationAction("patient-1", immunizationForm());

		expect(result).toEqual({
			status: "success",
			immunizationId: expect.stringMatching(/^IMM-/),
		});
		expect(savedImmunizations).toEqual([
			{
				id: result.status === "success" ? result.immunizationId : "",
				patientId: "patient-1",
				encounterId: null,
				vaccineName: "Hepatitis B",
				seriesType: "Primary",
				currentDose: "2",
				totalDoses: "3",
				status: "Active",
				dateAdministered: new Date("2026-10-12"),
				administeredBy: "Nurse Chika",
				clinicalNote: "No adverse reaction observed.",
				createdBy: "Ada Obi",
				updatedBy: "Ada Obi",
			},
		]);
		expect(updateTagMock).toHaveBeenCalledWith("patient-immunizations-hospital-1-patient-1");
	});

	test("links the immunization to the patient's encounter it was added from", async () => {
		await createPatientImmunizationAction("patient-1", immunizationForm({ encounterId: "ENC-1" }));

		expect(savedImmunizations).toEqual([expect.objectContaining({ encounterId: "ENC-1" })]);
	});

	test("saves no series type or note when they are left blank", async () => {
		await createPatientImmunizationAction(
			"patient-1",
			immunizationForm({ seriesType: "", clinicalNote: " " }),
		);

		expect(savedImmunizations).toEqual([
			expect.objectContaining({ seriesType: null, clinicalNote: null }),
		]);
	});

	test.each([
		{ field: "vaccineName", value: " ", error: "Enter the vaccine name." },
		{ field: "seriesType", value: "Catch-up", error: "Select a series type." },
		{ field: "currentDose", value: "two", error: "Enter the current dose as a number." },
		{ field: "totalDoses", value: "0", error: "Enter the total doses as a number." },
		{
			field: "currentDose",
			value: "4",
			error: "The current dose can’t be more than the total doses.",
		},
		{ field: "status", value: "Pending", error: "Select a status." },
		{ field: "dateAdministered", value: "", error: "Select the date administered." },
		{
			field: "dateAdministered",
			value: "2026-10-20",
			error: "The date administered can’t be in the future.",
		},
		{ field: "administeredBy", value: " ", error: "Enter who administered it." },
	])("rejects $field set to '$value' without saving", async ({ field, value, error }) => {
		expect(
			await createPatientImmunizationAction("patient-1", immunizationForm({ [field]: value })),
		).toEqual({ status: "failed", error });
		expect(savedImmunizations).toEqual([]);
	});

	test("asks a signed-out user to sign in again without saving", async () => {
		getSessionDataMock.mockResolvedValue(null);

		expect(await createPatientImmunizationAction("patient-1", immunizationForm())).toEqual({
			status: "unauthorized",
			error: "You must be signed in to add immunizations.",
		});
		expect(savedImmunizations).toEqual([]);
	});

	test.each([
		{
			scenario: "their email is unverified",
			setup: () =>
				getSessionDataMock.mockResolvedValue({
					user: { id: "member-1", name: "Ada Obi", emailVerified: false },
				}),
			error: "Verify your email before adding immunizations.",
		},
		{
			scenario: "their hospital is unverified",
			setup: () => getOrganizationIdMock.mockResolvedValue(null),
			error: "Your hospital must be verified before you can add immunizations.",
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
	])("cannot add an immunization when $scenario", async ({ setup, error }) => {
		setup();

		expect(
			await createPatientImmunizationAction(
				"patient-1",
				immunizationForm({ encounterId: "ENC-1" }),
			),
		).toEqual({ status: "failed", error });
		expect(savedImmunizations).toEqual([]);
	});
});
