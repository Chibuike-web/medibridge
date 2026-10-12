// @vitest-environment node

import path from "node:path";
import { beforeEach, expect, test, vi } from "vitest";
import { GET } from "./route";

const { getSessionDataMock, getOrganizationIdMock, getExtractionMock, readFileMock } = vi.hoisted(
	() => ({
		getSessionDataMock: vi.fn(),
		getOrganizationIdMock: vi.fn(),
		getExtractionMock: vi.fn(),
		readFileMock: vi.fn(),
	}),
);

vi.mock("@/lib/api/get-session-data", () => ({ getSessionData: getSessionDataMock }));
vi.mock("@/lib/api/get-organization-id", () => ({ getOrganizationId: getOrganizationIdMock }));
vi.mock("@/lib/api/get-patient-extraction-by-id", () => ({
	getPatientExtractionById: getExtractionMock,
}));
vi.mock("node:fs/promises", () => ({ readFile: readFileMock }));

function requestDocument(documentId: string) {
	return GET(new Request("http://localhost"), {
		params: Promise.resolve({ extractionId: "extraction-1", documentId }),
	});
}

beforeEach(() => {
	getSessionDataMock.mockResolvedValue({ user: { id: "reviewer-1", emailVerified: true } });
	getOrganizationIdMock.mockResolvedValue("hospital-1");
	getExtractionMock.mockResolvedValue({
		id: "extraction-1",
		createdBy: "uploader-1",
		extractedData: [
			{ documentId: "record.pdf" },
			{ documentId: "record.docx" },
			{ documentId: "../uploader-2/record.pdf" },
		],
	});
	readFileMock.mockResolvedValue(Buffer.from("file contents"));
});

test("serves a PDF from the uploader's folder inline", async () => {
	const response = await requestDocument("record.pdf");
	expect(response.status).toBe(200);
	expect(response.headers.get("Content-Type")).toBe("application/pdf");
	expect(response.headers.get("Content-Disposition")).toBe("inline");
	expect(await response.text()).toBe("file contents");
	expect(readFileMock).toHaveBeenCalledWith(
		path.resolve("patient-uploads", "hospital-1", "uploader-1", "record.pdf"),
	);
});

test("serves a Word document as a download", async () => {
	const response = await requestDocument("record.docx");
	expect(response.status).toBe(200);
	expect(response.headers.get("Content-Disposition")).toBe("attachment");
});

test("refuses a document that does not belong to the extraction", async () => {
	const response = await requestDocument("other.pdf");
	expect(response.status).toBe(404);
	expect(await response.json()).toEqual({ status: "failed", error: "Document not found." });
	expect(readFileMock).not.toHaveBeenCalled();
});

test("refuses a document ID that points outside the uploader's folder", async () => {
	const response = await requestDocument("../uploader-2/record.pdf");
	expect(response.status).toBe(404);
	expect(readFileMock).not.toHaveBeenCalled();
});

test("refuses an extraction from another hospital", async () => {
	getExtractionMock.mockResolvedValue(null);
	const response = await requestDocument("record.pdf");
	expect(response.status).toBe(404);
	expect(readFileMock).not.toHaveBeenCalled();
});

test("requires a signed-in user", async () => {
	getSessionDataMock.mockResolvedValue(null);
	const response = await requestDocument("record.pdf");
	expect(response.status).toBe(401);
	expect(getExtractionMock).not.toHaveBeenCalled();
	expect(readFileMock).not.toHaveBeenCalled();
});

test("returns not found when the stored file is missing", async () => {
	vi.spyOn(console, "error").mockImplementation(() => {});
	readFileMock.mockRejectedValue(new Error("ENOENT"));
	const response = await requestDocument("record.pdf");
	expect(response.status).toBe(404);
	expect(await response.json()).toEqual({ status: "failed", error: "Document not found." });
});
