// @vitest-environment node
import { beforeEach, expect, test, vi } from "vitest";
import { GET } from "./route";
const { session, organization, extraction, sign, info } = vi.hoisted(() => ({
	session: vi.fn(),
	organization: vi.fn(),
	extraction: vi.fn(),
	sign: vi.fn(),
	info: vi.fn(),
}));
vi.mock("@/lib/api/get-session-data", () => ({ getSessionData: session }));
vi.mock("@/lib/api/get-organization-id", () => ({ getOrganizationId: organization }));
vi.mock("@/lib/api/get-patient-extraction-by-id", () => ({ getPatientExtractionById: extraction }));
vi.mock("@/lib/storage/client", () => ({ patientUploads: { createSignedUrl: sign, info } }));
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
	info.mockResolvedValue({ data: { size: 10 }, error: null });
	sign.mockResolvedValue({
		data: { signedUrl: "https://storage.test/document?token=scoped" },
		error: null,
	});
});
test.each(["pdf", "docx"])(
	"authorizes the original uploader's %s document before granting temporary access",
	async (extension) => {
		const response = await request(`record.${extension}`);
		expect(response.status).toBe(302);
		expect(response.headers.get("Location")).toBe("https://storage.test/document?token=scoped");
		expect(response.headers.get("Cache-Control")).toBe("private, no-store");
		expect(sign).toHaveBeenCalledWith(`hospital-1/uploader-1/record.${extension}`, 60, {
			download: extension === "docx",
		});
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
	expect((await request("record.pdf")).status).toBe(302);
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
	info.mockResolvedValue({ data: null, error: new Error("missing") });
	expect((await request("record.pdf")).status).toBe(404);
	expect(sign).not.toHaveBeenCalled();
});
