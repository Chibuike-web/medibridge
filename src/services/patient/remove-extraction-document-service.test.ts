// @vitest-environment node

import path from "node:path";
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

vi.mock("node:fs/promises", () => ({ rm: removeFileMock }));
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
		expect(removeFileMock).toHaveBeenCalledWith(
			path.resolve("patient-uploads", "hospital-1", "uploader-1", "scan.pdf"),
			{ force: true },
		);
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
		{ scenario: "a saved patient's document", documentId: "ada.pdf", status: "saved" as const },
		{
			scenario: "a document not in the extraction",
			documentId: "other.pdf",
			status: "ready" as const,
		},
	])("does not remove $scenario", async ({ documentId, status }) => {
		storedExtraction.current!.extractedData = [{ ...readyDocument, status }, failedDocument];

		expect(await removeExtractionDocumentService("extraction-1", documentId)).toEqual({
			status: "failed",
			error: "This document can’t be removed.",
		});
		expect(storedExtraction.current?.extractedData).toHaveLength(2);
		expect(removeFileMock).not.toHaveBeenCalled();
		expect(updateTagMock).not.toHaveBeenCalled();
	});

	test("does not remove anything when the extraction is not found for the member's hospital", async () => {
		storedExtraction.current = null;

		expect(await removeExtractionDocumentService("extraction-1", "scan.pdf")).toEqual({
			status: "failed",
			error: "This document can’t be removed.",
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
