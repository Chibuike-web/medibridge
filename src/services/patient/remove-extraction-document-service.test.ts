// @vitest-environment node

import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import type { PatientExtractionDocument } from "@/db/schemas/patient";
import { removeExtractionDocumentService } from "./remove-extraction-document-service";

const {
	getSessionDataMock,
	getOrganizationIdMock,
	removeFileMock,
	updateTagMock,
	storedExtraction,
} = vi.hoisted(() => ({
	getSessionDataMock: vi.fn(),
	getOrganizationIdMock: vi.fn(),
	removeFileMock: vi.fn(),
	updateTagMock: vi.fn(),
	storedExtraction: {
		current: null as { createdBy: string; extractedData: PatientExtractionDocument[] } | null,
	},
}));

vi.mock("@/lib/storage/client", () => ({
	patientUploads: {
		remove: async (keys: string[]) => {
			for (const key of keys) await removeFileMock(key);
			return { data: [], error: null };
		},
	},
}));
vi.mock("next/cache", () => ({ updateTag: updateTagMock }));
vi.mock("@/lib/api/get-session-data", () => ({ getSessionData: getSessionDataMock }));
vi.mock("@/lib/api/get-organization-id", () => ({ getOrganizationId: getOrganizationIdMock }));
vi.mock("@/lib/better-auth/auth", () => ({
	db: {
		transaction: async (write: (tx: unknown) => Promise<unknown>) =>
			write({
				select: () => ({
					from: () => ({
						where: () => ({
							for: async () =>
								storedExtraction.current ? [structuredClone(storedExtraction.current)] : [],
						}),
					}),
				}),
				update: () => ({
					set: ({ extractedData }: { extractedData: PatientExtractionDocument[] }) => ({
						where: async () => {
							storedExtraction.current!.extractedData = extractedData;
						},
					}),
				}),
				delete: () => ({
					where: async () => {
						storedExtraction.current = null;
					},
				}),
			}),
	},
}));

const readyDocument: PatientExtractionDocument = {
	documentId: "ada.pdf",
	status: "ready",
	patient: {
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
	},
};

const failedDocument: PatientExtractionDocument = {
	documentId: "scan.pdf",
	status: "failed",
	patient: null,
};

describe("removing a document from a saved extraction", () => {
	beforeEach(() => {
		getSessionDataMock.mockResolvedValue({ user: { id: "member-1", emailVerified: true } });
		getOrganizationIdMock.mockResolvedValue("hospital-1");
		removeFileMock.mockResolvedValue(undefined);
		updateTagMock.mockReset();
		storedExtraction.current = {
			createdBy: "uploader-1",
			extractedData: [readyDocument, failedDocument],
		};
	});

	afterEach(() => vi.restoreAllMocks());

	test("removes the document from the extraction and deletes its uploaded file", async () => {
		expect(await removeExtractionDocumentService("extraction-1", "scan.pdf")).toEqual({
			status: "success",
		});
		expect(storedExtraction.current?.extractedData).toEqual([readyDocument]);
		expect(removeFileMock).toHaveBeenCalledWith(`hospital-1/uploader-1/${"scan.pdf"}`);
		expect(updateTagMock).toHaveBeenCalledWith("patient-extraction-hospital-1-extraction-1");
	});

	test("deletes the whole extraction when its last document is removed", async () => {
		storedExtraction.current!.extractedData = [failedDocument];

		expect(await removeExtractionDocumentService("extraction-1", "scan.pdf")).toEqual({
			status: "success",
		});
		expect(storedExtraction.current).toBeNull();
		expect(removeFileMock).toHaveBeenCalled();
	});

	test("keeps the extraction removed when the uploaded file cannot be deleted", async () => {
		const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
		removeFileMock.mockRejectedValue(new Error("Private file system detail"));

		expect(await removeExtractionDocumentService("extraction-1", "scan.pdf")).toEqual({
			status: "success",
		});
		expect(storedExtraction.current?.extractedData).toEqual([readyDocument]);
		expect(consoleErrorSpy).toHaveBeenCalled();
	});

	test.each([
		{
			scenario: "a document that is ready for review",
			documentId: "ada.pdf",
			result: { status: "failed", error: "This document can’t be removed." },
		},
		{
			scenario: "a document that was already removed",
			documentId: "other.pdf",
			result: { status: "invalid", error: "This document was already removed." },
		},
	])("does not remove $scenario", async ({ documentId, result }) => {
		storedExtraction.current!.extractedData = [readyDocument, failedDocument];

		expect(await removeExtractionDocumentService("extraction-1", documentId)).toEqual(result);
		expect(storedExtraction.current?.extractedData).toHaveLength(2);
		expect(removeFileMock).not.toHaveBeenCalled();
		expect(updateTagMock).not.toHaveBeenCalled();
	});

	test("explains the review was cleared when the extraction is not found for the member's hospital", async () => {
		storedExtraction.current = null;

		expect(await removeExtractionDocumentService("extraction-1", "scan.pdf")).toEqual({
			status: "invalid",
			error: "This review was already cleared.",
		});
		expect(removeFileMock).not.toHaveBeenCalled();
	});

	test.each([
		{
			scenario: "signed out",
			session: null,
			organizationId: "hospital-1",
			status: "unauthorized",
			error: "Sign in to remove patient documents.",
		},
		{
			scenario: "unverified",
			session: { user: { id: "member-1", emailVerified: false } },
			organizationId: "hospital-1",
			status: "failed",
			error: "Verify your email before removing patient documents.",
		},
		{
			scenario: "without a verified hospital",
			session: { user: { id: "member-1", emailVerified: true } },
			organizationId: null,
			status: "failed",
			error: "Your hospital must be verified before you can remove patient documents.",
		},
	])(
		"does not remove anything when the member is $scenario",
		async ({ session, organizationId, status, error }) => {
			getSessionDataMock.mockResolvedValue(session);
			getOrganizationIdMock.mockResolvedValue(organizationId);

			expect(await removeExtractionDocumentService("extraction-1", "scan.pdf")).toEqual({
				status,
				error,
			});
			expect(storedExtraction.current?.extractedData).toHaveLength(2);
			expect(removeFileMock).not.toHaveBeenCalled();
		},
	);
});
