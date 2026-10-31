// @vitest-environment node

import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import type { PatientExtractionDocument } from "@/db/schemas/patient";
import { discardPatientExtractionService } from "./discard-patient-extraction-service";

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
			try {
				for (const key of keys) await removeFileMock(key);
				return { data: [], error: null };
			} catch (error) {
				return { data: null, error };
			}
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
				delete: () => ({
					where: async () => {
						storedExtraction.current = null;
					},
				}),
			}),
	},
}));

const patient = {
	personalInfo: {
		firstName: "Ada",
		middleName: null,
		lastName: "Okafor",
		patientId: "3f2b9c1e-0000-4000-8000-000000000001",
		dateOfBirth: "1990-04-12",
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

function uploadedFile(documentId: string) {
	return `hospital-1/uploader-1/${documentId}`;
}

describe("discarding a patient extraction", () => {
	beforeEach(() => {
		getSessionDataMock.mockResolvedValue({ user: { id: "member-1", emailVerified: true } });
		getOrganizationIdMock.mockResolvedValue("hospital-1");
		removeFileMock.mockResolvedValue(undefined);
		storedExtraction.current = {
			createdBy: "uploader-1",
			extractedData: [
				{ documentId: "ready.pdf", status: "ready", patient },
				{ documentId: "failed.pdf", status: "failed", patient: null },
			],
		};
	});

	afterEach(() => vi.restoreAllMocks());

	test("clears the review and all of its uploaded files", async () => {
		expect(await discardPatientExtractionService("extraction-1")).toEqual({ status: "success" });
		expect(storedExtraction.current).toBeNull();
		expect(removeFileMock).toHaveBeenCalledWith(uploadedFile("ready.pdf"));
		expect(removeFileMock).toHaveBeenCalledWith(uploadedFile("failed.pdf"));
		expect(updateTagMock).toHaveBeenCalledWith("patient-extraction-hospital-1-extraction-1");
	});

	test("clears the review even when an uploaded file can't be deleted yet", async () => {
		const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
		removeFileMock.mockRejectedValue(new Error("Private storage detail"));

		expect(await discardPatientExtractionService("extraction-1")).toEqual({ status: "success" });
		expect(storedExtraction.current).toBeNull();
		expect(consoleErrorSpy).toHaveBeenCalled();
	});

	test("lets the member leave without deleting files when the extraction is already gone", async () => {
		storedExtraction.current = null;

		expect(await discardPatientExtractionService("extraction-1")).toEqual({ status: "success" });
		expect(removeFileMock).not.toHaveBeenCalled();
	});

	test.each([
		{
			scenario: "signed out",
			session: null,
			organizationId: "hospital-1",
			result: { status: "unauthorized", error: "Sign in to leave this review." },
		},
		{
			scenario: "unverified",
			session: { user: { id: "member-1", emailVerified: false } },
			organizationId: "hospital-1",
			result: { status: "failed", error: "Verify your email before leaving this review." },
		},
		{
			scenario: "without a verified hospital",
			session: { user: { id: "member-1", emailVerified: true } },
			organizationId: null,
			result: {
				status: "failed",
				error: "Your hospital must be verified before you can leave this review.",
			},
		},
	])(
		"does not discard anything when the member is $scenario",
		async ({ session, organizationId, result }) => {
			getSessionDataMock.mockResolvedValue(session);
			getOrganizationIdMock.mockResolvedValue(organizationId);

			expect(await discardPatientExtractionService("extraction-1")).toEqual(result);
			expect(storedExtraction.current?.extractedData).toHaveLength(2);
			expect(removeFileMock).not.toHaveBeenCalled();
		},
	);
});
