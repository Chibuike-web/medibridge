// @vitest-environment node

import { beforeEach, describe, expect, test, vi } from "vitest";
import type { PatientRecord } from "@/features/patients/schemas/patient-schema";
import { saveExtractedPatientsService } from "./save-extracted-patients-service";

const {
	getOrganizationIdMock,
	getSessionMock,
	headersMock,
	queryResultMock,
	savedRows,
	selectMock,
	transactionMock,
	updateTagMock,
} = vi.hoisted(() => ({
	getOrganizationIdMock: vi.fn(),
	getSessionMock: vi.fn(),
	headersMock: vi.fn(),
	queryResultMock: vi.fn(),
	savedRows: [] as Record<string, unknown>[],
	selectMock: vi.fn(),
	transactionMock: vi.fn(),
	updateTagMock: vi.fn(),
}));

vi.mock("next/headers", () => ({ headers: headersMock }));
vi.mock("next/cache", () => ({ updateTag: updateTagMock }));
vi.mock("@/lib/api/get-organization-id", () => ({ getOrganizationId: getOrganizationIdMock }));
vi.mock("@/lib/better-auth/auth", () => ({
	auth: { api: { getSession: getSessionMock } },
	db: { select: selectMock, transaction: transactionMock },
}));

function createPatientRecord(patientId: string, firstName: string): PatientRecord {
	return {
		personalInfo: {
			firstName,
			middleName: null,
			lastName: "Okafor",
			patientId,
			dateOfBirth: "1990-04-12",
			sex: "Female",
			age: 35,
			maritalStatus: "Married",
			nationalId: "12345678901",
		},
		contactInfo: {
			phoneNumber: "08031234567",
			emailAddress: null,
			residentialAddress: "12 Health Street, Lagos",
			stateOfOrigin: "Anambra",
			countryOfOrigin: "Nigeria",
		},
		emergencyInfo: {
			firstName: "Chidi",
			middleName: null,
			lastName: "Okafor",
			relationship: "Husband",
			phone: "08037654321",
		},
		physicalInfo: {
			height: "165",
			weight: "60",
			bloodGroup: "O+",
			genotype: "AA",
		},
	};
}

describe("saveExtractedPatientsService", () => {
	beforeEach(() => {
		savedRows.length = 0;
		updateTagMock.mockReset();
		headersMock.mockResolvedValue(new Headers());
		getSessionMock.mockResolvedValue({ user: { id: "member-1", emailVerified: true } });
		getOrganizationIdMock.mockResolvedValue("hospital-1");
		selectMock.mockReturnValue({
			from: () => ({ where: () => ({ limit: queryResultMock }) }),
		});
		queryResultMock.mockResolvedValue([]);
		transactionMock.mockImplementation(async (saveRows) =>
			saveRows({
				insert: () => ({
					values: async (row: Record<string, unknown>) => {
						savedRows.push(row);
					},
				}),
			}),
		);
	});

	test("saves every patient to the member's approved hospital and refreshes its cached patient data", async () => {
		const result = await saveExtractedPatientsService([
			createPatientRecord("P-0001", "Ada"),
			createPatientRecord("P-0002", "Ngozi"),
		]);

		expect(result).toEqual({ status: "success", savedCount: 2 });
		expect(savedRows).toContainEqual(
			expect.objectContaining({ id: "P-0001", organizationId: "hospital-1" }),
		);
		expect(savedRows).toContainEqual(
			expect.objectContaining({ id: "P-0002", organizationId: "hospital-1" }),
		);
		expect(updateTagMock).toHaveBeenCalledWith("patients-list-hospital-1");
		expect(updateTagMock).toHaveBeenCalledWith("recent-patients-hospital-1");
		expect(updateTagMock).toHaveBeenCalledWith("overview-stats-hospital-1");
		for (const patientId of ["P-0001", "P-0002"]) {
			expect(updateTagMock).toHaveBeenCalledWith(`patient-profile-hospital-1-${patientId}`);
			expect(updateTagMock).toHaveBeenCalledWith(`patient-by-id-hospital-1-${patientId}`);
		}
	});

	test.each([
		{ scenario: "signed out", session: null, error: "You must be signed in to save patients." },
		{
			scenario: "without a user ID",
			session: { user: { emailVerified: true } },
			error: "You must be signed in to save patients.",
		},
		{
			scenario: "unverified",
			session: { user: { id: "member-1", emailVerified: false } },
			error: "Verify your email before saving patients.",
		},
	])("does not save records when the user is $scenario", async ({ session, error }) => {
		getSessionMock.mockResolvedValue(session);
		expect(await saveExtractedPatientsService([createPatientRecord("P-0001", "Ada")])).toEqual({
			status: "failed",
			error,
		});
		expect(savedRows).toEqual([]);
		expect(updateTagMock).not.toHaveBeenCalled();
	});

	test("does not save records without a verified hospital", async () => {
		getOrganizationIdMock.mockResolvedValue(null);
		expect(await saveExtractedPatientsService([createPatientRecord("P-0001", "Ada")])).toEqual({
			status: "failed",
			error: "No active organization was found for this session.",
		});
		expect(savedRows).toEqual([]);
	});

	test("does not save an upload that gives two patients the same patient ID", async () => {
		const result = await saveExtractedPatientsService([
			createPatientRecord("P-0001", "Ada"),
			createPatientRecord(" P-0001 ", "Ngozi"),
		]);

		expect(result).toEqual({
			status: "failed",
			error: "Patient 2: patient ID P-0001 is also used by Patient 1.",
		});
		expect(savedRows).toEqual([]);
	});

	test("does not save a patient whose ID is already in use", async () => {
		queryResultMock.mockResolvedValue([{ id: "P-0002" }]);

		const result = await saveExtractedPatientsService([
			createPatientRecord("P-0001", "Ada"),
			createPatientRecord("P-0002", "Ngozi"),
		]);

		expect(result).toEqual({
			status: "failed",
			error: "Patient 2: patient ID P-0002 is already in use.",
		});
		expect(savedRows).toEqual([]);
	});

	test.each([null, "", "12/04/1994", "2023-02-30"])(
		"does not save a patient with an unusable date of birth: %s",
		async (dateOfBirth) => {
			const record = createPatientRecord("P-0001", "Ada");
			record.personalInfo.dateOfBirth = dateOfBirth;
			expect(await saveExtractedPatientsService([record])).toEqual({
				status: "failed",
				error: dateOfBirth
					? "Patient 1: provide a valid date of birth."
					: "Patient 1: date of birth is required.",
			});
			expect(savedRows).toEqual([]);
		},
	);

	test("returns a fixed message instead of the database error when saving fails", async () => {
		vi.spyOn(console, "error").mockImplementation(() => {});
		transactionMock.mockRejectedValue(
			new Error('Failed query: insert into "patient_personal_information"\nparams: Ada,Okafor'),
		);

		const result = await saveExtractedPatientsService([createPatientRecord("P-0001", "Ada")]);

		expect(result).toEqual({
			status: "failed",
			error: "We couldn’t save these patients. Please try again.",
		});
		expect(updateTagMock).not.toHaveBeenCalled();
	});
});
