// @vitest-environment node

import { beforeEach, describe, expect, test, vi } from "vitest";
import { createPatientDiagnosisAction } from "./create-patient-diagnosis-action";

const { getSessionDataMock, getOrganizationIdMock, updateTagMock, rows, savedDiagnoses } =
	vi.hoisted(() => ({
		getSessionDataMock: vi.fn(),
		getOrganizationIdMock: vi.fn(),
		updateTagMock: vi.fn(),
		rows: { patients: [] as { id: string }[], encounters: [] as { id: string }[] },
		savedDiagnoses: [] as Record<string, unknown>[],
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
					savedDiagnoses.push(row);
				},
			}),
		},
	};
});

function diagnosisForm(overrides: Record<string, string> = {}) {
	const formData = new FormData();
	for (const [field, value] of Object.entries({
		diagnosisName: "Essential hypertension",
		severityStage: "Stage 2",
		status: "Active",
		diagnosedAt: "2026-10-12",
		diagnosedBy: "Dr. Ada Obi",
		clinicalNote: "Elevated readings across three visits.",
		...overrides,
	}))
		formData.set(field, value);
	return formData;
}

describe("adding a patient diagnosis", () => {
	beforeEach(() => {
		vi.useFakeTimers({ now: new Date("2026-10-14T10:00:00Z"), toFake: ["Date"] });
		savedDiagnoses.length = 0;
		updateTagMock.mockClear();
		rows.patients = [{ id: "patient-1" }];
		rows.encounters = [{ id: "ENC-1" }];
		getSessionDataMock.mockResolvedValue({
			user: { id: "member-1", name: "Ada Obi", emailVerified: true },
		});
		getOrganizationIdMock.mockResolvedValue("hospital-1");
	});

	test("a verified hospital member can add a diagnosis without an encounter", async () => {
		const result = await createPatientDiagnosisAction("patient-1", diagnosisForm());

		expect(result).toEqual({ status: "success", diagnosisId: expect.stringMatching(/^DIA-/) });
		expect(savedDiagnoses).toEqual([
			{
				id: result.status === "success" ? result.diagnosisId : "",
				patientId: "patient-1",
				encounterId: null,
				diagnosisName: "Essential hypertension",
				severityStage: "Stage 2",
				status: "Active",
				diagnosedAt: "2026-10-12",
				diagnosedBy: "Dr. Ada Obi",
				clinicalNote: "Elevated readings across three visits.",
				createdBy: "Ada Obi",
				updatedBy: "Ada Obi",
			},
		]);
		expect(updateTagMock).toHaveBeenCalledWith("patient-diagnoses-hospital-1-patient-1");
	});

	test("links the diagnosis to the patient's encounter it was added from", async () => {
		await createPatientDiagnosisAction("patient-1", diagnosisForm({ encounterId: "ENC-1" }));

		expect(savedDiagnoses).toEqual([expect.objectContaining({ encounterId: "ENC-1" })]);
	});

	test("saves no severity or note when they are left blank", async () => {
		await createPatientDiagnosisAction(
			"patient-1",
			diagnosisForm({ severityStage: "", clinicalNote: "  " }),
		);

		expect(savedDiagnoses).toEqual([
			expect.objectContaining({ severityStage: null, clinicalNote: null }),
		]);
	});

	test.each([
		{ field: "diagnosisName", value: "  ", error: "Enter the diagnosis name." },
		{ field: "severityStage", value: "Critical", error: "Select a severity or stage." },
		{ field: "status", value: "Pending", error: "Select a status." },
		{ field: "diagnosedAt", value: "", error: "Select the diagnosis date." },
		{
			field: "diagnosedAt",
			value: "2026-10-20",
			error: "The diagnosis date can’t be in the future.",
		},
		{ field: "diagnosedBy", value: " ", error: "Enter who made the diagnosis." },
	])("rejects $field set to '$value' without saving", async ({ field, value, error }) => {
		expect(
			await createPatientDiagnosisAction("patient-1", diagnosisForm({ [field]: value })),
		).toEqual({ status: "failed", error });
		expect(savedDiagnoses).toEqual([]);
	});

	test("asks a signed-out user to sign in again without saving", async () => {
		getSessionDataMock.mockResolvedValue(null);

		expect(await createPatientDiagnosisAction("patient-1", diagnosisForm())).toEqual({
			status: "unauthorized",
			error: "You must be signed in to add diagnoses.",
		});
		expect(savedDiagnoses).toEqual([]);
	});

	test.each([
		{
			scenario: "their email is unverified",
			setup: () =>
				getSessionDataMock.mockResolvedValue({
					user: { id: "member-1", name: "Ada Obi", emailVerified: false },
				}),
			error: "Verify your email before adding diagnoses.",
		},
		{
			scenario: "their hospital is unverified",
			setup: () => getOrganizationIdMock.mockResolvedValue(null),
			error: "Your hospital must be verified before you can add diagnoses.",
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
	])("cannot add a diagnosis when $scenario", async ({ setup, error }) => {
		setup();

		expect(
			await createPatientDiagnosisAction("patient-1", diagnosisForm({ encounterId: "ENC-1" })),
		).toEqual({ status: "failed", error });
		expect(savedDiagnoses).toEqual([]);
	});
});
