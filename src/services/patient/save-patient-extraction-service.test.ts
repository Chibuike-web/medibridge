// @vitest-environment node

import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import type { PatientExtractionRecord } from "@/db/schemas/patient";
import { savePatientExtractionService } from "./save-patient-extraction-service";

const { getSessionDataMock, getOrganizationIdMock, saveRowMock, savedExtractions } = vi.hoisted(
	() => ({
		getSessionDataMock: vi.fn(),
		getOrganizationIdMock: vi.fn(),
		saveRowMock: vi.fn(),
		savedExtractions: [] as Record<string, unknown>[],
	}),
);

vi.mock("@/lib/api/get-session-data", () => ({ getSessionData: getSessionDataMock }));
vi.mock("@/lib/api/get-organization-id", () => ({ getOrganizationId: getOrganizationIdMock }));
vi.mock("@/lib/better-auth/auth", () => ({
	db: { insert: () => ({ values: saveRowMock }) },
}));

const extractedRecord: PatientExtractionRecord = {
	documentId: "intake.docx",
	personalInfo: {
		firstName: "Ada",
		middleName: null,
		lastName: "Okafor",
		patientId: null,
		dateOfBirth: null,
		sex: null,
		age: null,
		maritalStatus: null,
		nationalId: null,
	},
	contactInfo: {
		phoneNumber: null,
		emailAddress: null,
		residentialAddress: null,
		stateOfOrigin: null,
		countryOfOrigin: null,
	},
	emergencyInfo: {
		firstName: null,
		middleName: null,
		lastName: null,
		relationship: null,
		phone: null,
	},
	physicalInfo: { height: null, weight: null, bloodGroup: null, genotype: null },
};

describe("saving patient extractions", () => {
	beforeEach(() => {
		savedExtractions.length = 0;
		getSessionDataMock.mockResolvedValue({ user: { id: "member-1", emailVerified: true } });
		getOrganizationIdMock.mockResolvedValue("hospital-1");
		saveRowMock.mockImplementation(async (row: Record<string, unknown>) => {
			savedExtractions.push(structuredClone(row));
		});
	});

	afterEach(() => vi.restoreAllMocks());

	test("saves incomplete extracted records with their document IDs to the member's verified hospital", async () => {
		const records = [extractedRecord, { ...extractedRecord, documentId: "scan.pdf" }];
		const result = await savePatientExtractionService(records);

		expect(result.status).toBe("success");
		if (result.status !== "success") throw new Error("Expected the extraction to save.");
		expect(result.extractionId).toEqual(expect.any(String));
		expect(savedExtractions).toEqual([
			{
				id: result.extractionId,
				organizationId: "hospital-1",
				createdBy: "member-1",
				extractedData: records,
			},
		]);
	});

	test("uses the authenticated member and hospital rather than ownership fields supplied in the extraction", async () => {
		const result = await savePatientExtractionService([
			{ ...extractedRecord, organizationId: "hospital-2", createdBy: "other-member" },
		]);

		expect(result.status).toBe("success");
		expect(savedExtractions).toEqual([
			{
				id: expect.any(String),
				organizationId: "hospital-1",
				createdBy: "member-1",
				extractedData: [extractedRecord],
			},
		]);
	});

	test("does not save an extraction when the user is signed out", async () => {
		getSessionDataMock.mockResolvedValue(null);

		expect(await savePatientExtractionService([extractedRecord])).toEqual({
			status: "failed",
			error: "Sign in to save extracted patient information.",
		});
		expect(savedExtractions).toEqual([]);
	});

	test("does not save an extraction without a verified hospital", async () => {
		getOrganizationIdMock.mockResolvedValue(null);

		expect(await savePatientExtractionService([extractedRecord])).toEqual({
			status: "failed",
			error: "Your hospital must be verified before you can save an extraction.",
		});
		expect(savedExtractions).toEqual([]);
	});

	test.each([false, undefined])(
		"does not save an extraction when email verification is %s",
		async (emailVerified) => {
			getSessionDataMock.mockResolvedValue({ user: { id: "member-1", emailVerified } });

			expect(await savePatientExtractionService([extractedRecord])).toEqual({
				status: "failed",
				error: "Verify your email before saving extracted patient information.",
			});
			expect(savedExtractions).toEqual([]);
		},
	);

	test.each([
		{ scenario: "an empty batch", input: [] },
		{ scenario: "a non-array payload", input: { records: [extractedRecord] } },
		{ scenario: "a missing document ID", input: [{ ...extractedRecord, documentId: undefined }] },
		{
			scenario: "a malformed patient field",
			input: [
				{ ...extractedRecord, personalInfo: { ...extractedRecord.personalInfo, age: "unknown" } },
			],
		},
	])("does not save $scenario", async ({ input }) => {
		expect(await savePatientExtractionService(input)).toEqual({
			status: "failed",
			error: "Provide valid extracted patient information.",
		});
		expect(savedExtractions).toEqual([]);
	});

	test("returns a fixed error and no extraction ID when the database write fails", async () => {
		const databaseError = new Error("Private database connection details");
		const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
		saveRowMock.mockRejectedValue(databaseError);

		expect(await savePatientExtractionService([extractedRecord])).toEqual({
			status: "failed",
			error: "We couldn’t save the extracted information. Please try again.",
		});
		expect(savedExtractions).toEqual([]);
		expect(consoleErrorSpy).toHaveBeenCalledWith(
			"Saving patient extraction failed:",
			databaseError,
		);
	});
});
