// @vitest-environment node
import { beforeEach, expect, test, vi } from "vitest";
import { GET } from "./route";
const { session, organization, extraction, sign, storageFetch } = vi.hoisted(() => ({
	session: vi.fn(),
	organization: vi.fn(),
	extraction: vi.fn(),
	sign: vi.fn(),
	storageFetch: vi.fn(),
}));
vi.mock("@/lib/api/get-session-data", () => ({ getSessionData: session }));
vi.mock("@/lib/api/get-organization-id", () => ({ getOrganizationId: organization }));
vi.mock("@/lib/api/get-patient-extraction-by-id", () => ({ getPatientExtractionById: extraction }));
vi.mock("@/lib/storage/client", () => ({ patientUploads: { createSignedUrl: sign } }));
const request = (documentId: string) =>
	GET(new Request("http://localhost"), {
		params: Promise.resolve({ extractionId: "extraction-1", documentId }),
	});
beforeEach(() => {
	session.mockResolvedValue({ user: { id: "reviewer-1", emailVerified: true } });
	organization.mockResolvedValue("hospital-1");
	extraction.mockResolvedValue({
		id: "extraction-1",
		createdBy: "uploader-1",
		extractedData: [
			{ documentId: "record.pdf" },
			{ documentId: "record.docx" },
			{ documentId: "../uploader-2/record.pdf" },
		],
	});
	vi.stubGlobal("fetch", storageFetch);
	storageFetch.mockReset();
	storageFetch.mockImplementation(async () => new Response("document"));
	sign.mockResolvedValue({
		data: { signedUrl: "https://storage.test/document?token=scoped" },
		error: null,
	});
});
test.each([
	["pdf", "application/pdf", "inline"],
	["docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "attachment"],
])(
	"streams the original uploader's %s document with a type set by the app",
	async (extension, contentType, disposition) => {
		const response = await request(`record.${extension}`);
		expect(response.status).toBe(200);
		expect(await response.text()).toBe("document");
		expect(response.headers.get("Location")).toBeNull();
		expect(response.headers.get("Content-Type")).toBe(contentType);
		expect(response.headers.get("Content-Disposition")).toBe(disposition);
		expect(response.headers.get("Cache-Control")).toBe("private, no-store");
		expect(sign).toHaveBeenCalledWith(`hospital-1/uploader-1/record.${extension}`, 60);
	},
);
test.each(["other.pdf", "../uploader-2/record.pdf", "..\\record.pdf"])(
	"refuses a document outside the extraction: %s",
	async (documentId) => {
		expect((await request(documentId)).status).toBe(404);
		expect(sign).not.toHaveBeenCalled();
	},
);
test("refuses another hospital's extraction", async () => {
	expect((await request("record.pdf")).status).toBe(200);
	sign.mockClear();
	extraction.mockResolvedValue(null);
	expect((await request("record.pdf")).status).toBe(404);
	expect(sign).not.toHaveBeenCalled();
});
test.each([null, false])("requires a signed-in verified user: %s", async (verified) => {
	session.mockResolvedValue(
		verified === null ? null : { user: { id: "member-1", emailVerified: false } },
	);
	expect((await request("record.pdf")).status).toBe(verified === null ? 401 : 403);
	expect(sign).not.toHaveBeenCalled();
});
test("returns not found when the stored file is missing", async () => {
	vi.spyOn(console, "error").mockImplementation(() => {});
	sign.mockResolvedValue({ data: null, error: new Error("Object not found") });
	expect((await request("record.pdf")).status).toBe(404);
	expect(storageFetch).not.toHaveBeenCalled();
});
