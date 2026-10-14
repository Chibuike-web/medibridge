// @vitest-environment node

import { beforeEach, describe, expect, test, vi } from "vitest";
import { createPatientProcedureAction } from "./create-patient-procedure-action";

const { getSessionDataMock, getOrganizationIdMock, updateTagMock, rows, savedProcedures } =
	vi.hoisted(() => ({
		getSessionDataMock: vi.fn(),
		getOrganizationIdMock: vi.fn(),
		updateTagMock: vi.fn(),
		rows: { patients: [] as { id: string }[], encounters: [] as { id: string }[] },
		savedProcedures: [] as Record<string, unknown>[],
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
					savedProcedures.push(row);
				},
			}),
		},
	};
});

function procedureForm(overrides: Record<string, string> = {}) {
	const formData = new FormData();
	for (const [field, value] of Object.entries({
		procedureName: "Appendectomy",
		indication: "Acute appendicitis",
		status: "Completed",
		procedureDate: "2026-10-12",
		physician: "Dr. Ada Obi",
		assistants: "Dr. Ekene, Dr. Manny",
		facility: "Lagos University Teaching Hospital",
		clinicalNote: "Procedure was a success.",
		...overrides,
	}))
		formData.set(field, value);
	return formData;
}

describe("adding a patient procedure", () => {
	beforeEach(() => {
		vi.useFakeTimers({ now: new Date("2026-10-14T10:00:00Z"), toFake: ["Date"] });
		savedProcedures.length = 0;
		updateTagMock.mockClear();
		rows.patients = [{ id: "patient-1" }];
		rows.encounters = [{ id: "ENC-1" }];
		getSessionDataMock.mockResolvedValue({
			user: { id: "member-1", name: "Ada Obi", emailVerified: true },
		});
		getOrganizationIdMock.mockResolvedValue("hospital-1");
	});

	test("records a completed procedure as performed, without an encounter", async () => {
		const result = await createPatientProcedureAction("patient-1", procedureForm());

		expect(result).toEqual({ status: "success", procedureId: expect.stringMatching(/^PRO-/) });
		expect(savedProcedures).toEqual([
			{
				id: result.status === "success" ? result.procedureId : "",
				patientId: "patient-1",
				encounterId: null,
				procedureName: "Appendectomy",
				indication: "Acute appendicitis",
				status: "Completed",
				procedureDate: new Date("2026-10-12"),
				performedBy: "Dr. Ada Obi",
				assistants: "Dr. Ekene, Dr. Manny",
				facility: "Lagos University Teaching Hospital",
				clinicalNote: "Procedure was a success.",
				createdBy: "Ada Obi",
				updatedBy: "Ada Obi",
			},
		]);
		expect(updateTagMock).toHaveBeenCalledWith("patient-procedures-hospital-1-patient-1");
	});

	test("records a pending procedure as planned, even for a future date", async () => {
		await createPatientProcedureAction(
			"patient-1",
			procedureForm({ status: "Pending", procedureDate: "2026-11-02" }),
		);

		expect(savedProcedures).toEqual([
			expect.objectContaining({
				status: "Pending",
				plannedDate: new Date("2026-11-02"),
				plannedPhysician: "Dr. Ada Obi",
				plannedAssistants: "Dr. Ekene, Dr. Manny",
				plannedFacility: "Lagos University Teaching Hospital",
			}),
		]);
		expect(savedProcedures[0]).not.toHaveProperty("procedureDate");
	});

	test("links the procedure to the patient's encounter it was added from", async () => {
		await createPatientProcedureAction("patient-1", procedureForm({ encounterId: "ENC-1" }));

		expect(savedProcedures).toEqual([expect.objectContaining({ encounterId: "ENC-1" })]);
	});

	test("saves no indication or note when they are left blank", async () => {
		await createPatientProcedureAction(
			"patient-1",
			procedureForm({ indication: " ", clinicalNote: "" }),
		);

		expect(savedProcedures).toEqual([
			expect.objectContaining({ indication: null, clinicalNote: null }),
		]);
	});

	test.each([
		{ field: "procedureName", value: " ", error: "Enter the procedure." },
		{ field: "status", value: "Scheduled", error: "Select a status." },
		{ field: "procedureDate", value: "", error: "Select the procedure date." },
		{
			field: "procedureDate",
			value: "2026-10-20",
			error: "A completed procedure can’t be dated in the future.",
		},
		{ field: "physician", value: " ", error: "Enter the physician." },
		{ field: "assistants", value: "", error: "Add at least one assistant." },
		{ field: "facility", value: " ", error: "Enter the facility." },
	])("rejects $field set to '$value' without saving", async ({ field, value, error }) => {
		expect(
			await createPatientProcedureAction("patient-1", procedureForm({ [field]: value })),
		).toEqual({ status: "failed", error });
		expect(savedProcedures).toEqual([]);
	});

	test("asks a signed-out user to sign in again without saving", async () => {
		getSessionDataMock.mockResolvedValue(null);

		expect(await createPatientProcedureAction("patient-1", procedureForm())).toEqual({
			status: "unauthorized",
			error: "You must be signed in to add procedures.",
		});
		expect(savedProcedures).toEqual([]);
	});

	test.each([
		{
			scenario: "their email is unverified",
			setup: () =>
				getSessionDataMock.mockResolvedValue({
					user: { id: "member-1", name: "Ada Obi", emailVerified: false },
				}),
			error: "Verify your email before adding procedures.",
		},
		{
			scenario: "their hospital is unverified",
			setup: () => getOrganizationIdMock.mockResolvedValue(null),
			error: "Your hospital must be verified before you can add procedures.",
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
	])("cannot add a procedure when $scenario", async ({ setup, error }) => {
		setup();

		expect(
			await createPatientProcedureAction("patient-1", procedureForm({ encounterId: "ENC-1" })),
		).toEqual({ status: "failed", error });
		expect(savedProcedures).toEqual([]);
	});
});
