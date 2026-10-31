// @vitest-environment node

import { beforeEach, describe, expect, test, vi } from "vitest";
import { patientExtraction, type PatientExtractionDocument } from "@/db/schemas/patient";
import type { PatientRecord } from "@/features/patients/schemas/patient-schema";
import { saveExtractedPatientsService } from "./save-extracted-patients-service";

const {
	getOrganizationIdMock,
	getSessionDataMock,
	insertedRows,
	updatedRows,
	extractionRow,
	transactionMock,
	updateTagMock,
	removeUploadMock,
} = vi.hoisted(() => ({
	getOrganizationIdMock: vi.fn(),
	getSessionDataMock: vi.fn(),
	insertedRows: [] as Record<string, unknown>[],
	updatedRows: [] as Record<string, unknown>[],
	extractionRow: {
		createdBy: "uploader-1",
		extractedData: [] as PatientExtractionDocument[],
		isDeleted: false,
	},
	transactionMock: vi.fn(),
	updateTagMock: vi.fn(),
	removeUploadMock: vi.fn(),
}));

vi.mock("next/cache", () => ({ updateTag: updateTagMock }));
vi.mock("@/lib/api/get-organization-id", () => ({ getOrganizationId: getOrganizationIdMock }));
vi.mock("@/lib/api/get-session-data", () => ({ getSessionData: getSessionDataMock }));
vi.mock("@/lib/better-auth/auth", () => ({ db: { transaction: transactionMock } }));
vi.mock("@/lib/storage/client", () => ({ patientUploads: { remove: removeUploadMock } }));

function createPatientRecord(patientId: string | null, firstName: string): PatientRecord {
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

const failedDocument: PatientExtractionDocument = {
	documentId: "scan.pdf",
	status: "failed",
	patient: null,
};

describe("saveExtractedPatientsService", () => {
	beforeEach(() => {
		insertedRows.length = 0;
		updatedRows.length = 0;
		getSessionDataMock.mockResolvedValue({ user: { id: "member-1", emailVerified: true } });
		getOrganizationIdMock.mockResolvedValue("hospital-1");
		extractionRow.extractedData = [
			{ documentId: "ada.pdf", status: "ready", patient: createPatientRecord("P-0001", "Ada") },
			failedDocument,
		];
		extractionRow.isDeleted = false;
		removeUploadMock.mockReset();
		removeUploadMock.mockResolvedValue({ data: [], error: null });
		transactionMock.mockImplementation(async (save) =>
			save({
				select: () => ({
					from: () => ({
						where: () => ({
							for: async () => (extractionRow.isDeleted ? [] : [structuredClone(extractionRow)]),
						}),
					}),
				}),
				insert: () => ({
					values: async (row: Record<string, unknown>) => {
						insertedRows.push(row);
					},
				}),
				update: (table: unknown) => ({
					set: (row: Record<string, unknown>) => ({
						where: async () => {
							if (table === patientExtraction) {
								extractionRow.extractedData = row.extractedData as PatientExtractionDocument[];
							} else {
								updatedRows.push(row);
							}
						},
					}),
				}),
				delete: () => ({
					where: async () => {
						extractionRow.isDeleted = true;
					},
				}),
			}),
		);
	});

	test("stores an extracted Female patient so the patient lists read her as female", async () => {
		const result = await saveExtractedPatientsService(
			"extraction-1",
			"ada.pdf",
			createPatientRecord("P-0001", "Ada"),
		);

		expect(result).toEqual({ status: "success", savedCount: 1 });
		expect(insertedRows).toContainEqual(
			expect.objectContaining({ firstName: "Ada", sex: "female", maritalStatus: "married" }),
		);
	});

	test("creates the patient with a generated ID and removes its document from the extraction", async () => {
		const editedPatient = createPatientRecord("ID-FROM-DOCUMENT", "Adanna");

		const result = await saveExtractedPatientsService("extraction-1", "ada.pdf", editedPatient);

		expect(result).toEqual({ status: "success", savedCount: 1 });
		const [createdPatient] = insertedRows;
		expect(createdPatient).toEqual({ id: expect.any(String), organizationId: "hospital-1" });
		const generatedId = createdPatient.id as string;
		expect(generatedId).toMatch(/^[0-9a-f-]{36}$/);
		expect(insertedRows).toContainEqual(
			expect.objectContaining({ patientId: generatedId, firstName: "Adanna" }),
		);
		expect(updatedRows).toEqual([]);
		expect(extractionRow.isDeleted).toBe(false);
		expect(extractionRow.extractedData).toEqual([failedDocument]);
		expect(updateTagMock).toHaveBeenCalledWith("patients-list-hospital-1");
		expect(updateTagMock).toHaveBeenCalledWith("recent-patients-hospital-1");
		expect(updateTagMock).toHaveBeenCalledWith("overview-stats-hospital-1");
		expect(updateTagMock).toHaveBeenCalledWith(`patient-profile-hospital-1-${generatedId}`);
		expect(updateTagMock).toHaveBeenCalledWith(`patient-by-id-hospital-1-${generatedId}`);
	});

	test("deletes the source document once its patient is saved", async () => {
		await saveExtractedPatientsService(
			"extraction-1",
			"ada.pdf",
			createPatientRecord("P-0001", "Ada"),
		);

		expect(removeUploadMock).toHaveBeenCalledWith(["hospital-1/uploader-1/ada.pdf"]);
	});

	test("keeps the saved patient when the source document can't be deleted yet", async () => {
		const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
		removeUploadMock.mockResolvedValue({ data: null, error: new Error("Private storage detail") });

		const result = await saveExtractedPatientsService(
			"extraction-1",
			"ada.pdf",
			createPatientRecord("P-0001", "Ada"),
		);

		expect(result).toEqual({ status: "success", savedCount: 1 });
		expect(consoleError).toHaveBeenCalled();
	});

	test("deletes the extraction once its last document is saved", async () => {
		extractionRow.extractedData = [
			{ documentId: "ada.pdf", status: "ready", patient: createPatientRecord(null, "Ada") },
		];

		expect(
			await saveExtractedPatientsService(
				"extraction-1",
				"ada.pdf",
				createPatientRecord(null, "Ada"),
			),
		).toEqual({ status: "success", savedCount: 1 });
		expect(insertedRows).toContainEqual(expect.objectContaining({ organizationId: "hospital-1" }));
		expect(extractionRow.isDeleted).toBe(true);
	});

	test("gives each newly saved patient a different ID", async () => {
		await saveExtractedPatientsService(
			"extraction-1",
			"ada.pdf",
			createPatientRecord("ID-FROM-DOCUMENT", "Ada"),
		);
		extractionRow.extractedData = [
			{ documentId: "bola.pdf", status: "ready", patient: createPatientRecord(null, "Bola") },
		];
		await saveExtractedPatientsService(
			"extraction-1",
			"bola.pdf",
			createPatientRecord(null, "Bola"),
		);

		const createdPatientIds = insertedRows
			.filter((row) => "organizationId" in row)
			.map((row) => row.id);
		expect(createdPatientIds).toHaveLength(2);
		expect(new Set(createdPatientIds).size).toBe(2);
	});

	test("does not create a second patient when the same document is saved again", async () => {
		const editedPatient = createPatientRecord(null, "Ada");
		expect(await saveExtractedPatientsService("extraction-1", "ada.pdf", editedPatient)).toEqual({
			status: "success",
			savedCount: 1,
		});

		expect(await saveExtractedPatientsService("extraction-1", "ada.pdf", editedPatient)).toEqual({
			status: "invalid",
			error: "This patient was already saved.",
		});
		expect(insertedRows.filter((row) => "organizationId" in row)).toHaveLength(1);
	});

	test("does not save a patient from a document whose extraction failed", async () => {
		expect(
			await saveExtractedPatientsService(
				"extraction-1",
				"scan.pdf",
				createPatientRecord("P-0001", "Ada"),
			),
		).toEqual({ status: "failed", error: "This document can’t be saved." });
		expect(insertedRows).toEqual([]);
		expect(extractionRow.extractedData).toContainEqual(failedDocument);
	});

	test.each([
		{
			scenario: "signed out",
			session: null,
			status: "unauthorized",
			error: "You must be signed in to save patients.",
		},
		{
			scenario: "without a user ID",
			session: { user: { emailVerified: true } },
			status: "unauthorized",
			error: "You must be signed in to save patients.",
		},
		{
			scenario: "unverified",
			session: { user: { id: "member-1", emailVerified: false } },
			status: "failed",
			error: "Verify your email before saving patients.",
		},
	])("does not save the patient when the user is $scenario", async ({ session, status, error }) => {
		getSessionDataMock.mockResolvedValue(session);
		expect(
			await saveExtractedPatientsService(
				"extraction-1",
				"ada.pdf",
				createPatientRecord("P-0001", "Ada"),
			),
		).toEqual({ status, error });
		expect(insertedRows).toEqual([]);
		expect(updateTagMock).not.toHaveBeenCalled();
	});

	test("does not save the patient without a verified hospital", async () => {
		getOrganizationIdMock.mockResolvedValue(null);
		expect(
			await saveExtractedPatientsService(
				"extraction-1",
				"ada.pdf",
				createPatientRecord("P-0001", "Ada"),
			),
		).toEqual({ status: "failed", error: "No active organization was found for this session." });
		expect(insertedRows).toEqual([]);
	});

	test.each([null, "", "12/04/1994", "2023-02-30"])(
		"does not save a patient with an unusable date of birth: %s",
		async (dateOfBirth) => {
			const record = createPatientRecord("P-0001", "Ada");
			record.personalInfo.dateOfBirth = dateOfBirth;
			expect(await saveExtractedPatientsService("extraction-1", "ada.pdf", record)).toEqual({
				status: "failed",
				error: dateOfBirth ? "Provide a valid date of birth." : "Date of birth is required.",
			});
			expect(insertedRows).toEqual([]);
		},
	);

	test("returns a fixed message instead of the database error when saving fails", async () => {
		vi.spyOn(console, "error").mockImplementation(() => {});
		transactionMock.mockRejectedValue(
			new Error('Failed query: insert into "patient_personal_information"\nparams: Ada,Okafor'),
		);

		const result = await saveExtractedPatientsService(
			"extraction-1",
			"ada.pdf",
			createPatientRecord("P-0001", "Ada"),
		);

		expect(result).toEqual({
			status: "failed",
			error: "We couldn’t save this patient. Please try again.",
		});
		expect(updateTagMock).not.toHaveBeenCalled();
	});
});
