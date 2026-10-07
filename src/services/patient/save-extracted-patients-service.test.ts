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
} = vi.hoisted(() => ({
	getOrganizationIdMock: vi.fn(),
	getSessionMock: vi.fn(),
	headersMock: vi.fn(),
	queryResultMock: vi.fn(),
	savedRows: [] as Record<string, unknown>[],
	selectMock: vi.fn(),
	transactionMock: vi.fn(),
}));

vi.mock("next/headers", () => ({ headers: headersMock }));
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
		headersMock.mockResolvedValue(new Headers());
		getSessionMock.mockResolvedValue({ user: { id: "member-1" } });
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

	test("saves every patient to the member's approved hospital", async () => {
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
	});
});
