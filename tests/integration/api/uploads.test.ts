// @vitest-environment node

import path from "node:path";
import { afterAll, beforeEach, describe, expect, test, vi } from "vitest";

const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);

afterAll(() => consoleLogSpy.mockRestore());

const {
	existsSyncMock,
	mkdirSyncMock,
	writeFileSyncMock,
	readFileSyncMock,
	mkdirMock,
	rmMock,
	writeFileMock,
	getSessionDataMock,
	getOrganizationIdMock,
	selectMock,
	existingHospitalQueryMock,
	createWorkerMock,
	terminateMock,
	generateTextMock,
	gatewayMock,
	outputArrayMock,
	wrapLanguageModelMock,
	devToolsMiddlewareMock,
	PdfParseMock,
	mammothExtractRawTextMock,
} = vi.hoisted(() => ({
	existsSyncMock: vi.fn(),
	mkdirSyncMock: vi.fn(),
	writeFileSyncMock: vi.fn(),
	readFileSyncMock: vi.fn(),
	mkdirMock: vi.fn(),
	rmMock: vi.fn(),
	writeFileMock: vi.fn(),
	getSessionDataMock: vi.fn(),
	getOrganizationIdMock: vi.fn(),
	selectMock: vi.fn(),
	existingHospitalQueryMock: vi.fn(),
	createWorkerMock: vi.fn(),
	terminateMock: vi.fn(),
	generateTextMock: vi.fn(),
	gatewayMock: vi.fn(() => ({ model: "mock-model" })),
	outputArrayMock: vi.fn(),
	wrapLanguageModelMock: vi.fn(({ model }) => model),
	devToolsMiddlewareMock: vi.fn(),
	PdfParseMock: vi.fn(),
	mammothExtractRawTextMock: vi.fn(),
}));

vi.mock("node:fs", () => ({
	existsSync: existsSyncMock,
	mkdirSync: mkdirSyncMock,
	writeFileSync: writeFileSyncMock,
	readFileSync: readFileSyncMock,
}));
vi.mock("node:fs/promises", () => ({ mkdir: mkdirMock, rm: rmMock, writeFile: writeFileMock }));
vi.mock("@/lib/api/get-session-data", () => ({ getSessionData: getSessionDataMock }));
vi.mock("@/lib/api/get-organization-id", () => ({ getOrganizationId: getOrganizationIdMock }));
vi.mock("@/lib/better-auth/auth", () => ({ db: { select: selectMock } }));
vi.mock("tesseract.js", () => ({ createWorker: createWorkerMock }));
vi.mock("mammoth", () => ({ default: { extractRawText: mammothExtractRawTextMock } }));
vi.mock("pdf-parse", () => ({ PDFParse: PdfParseMock }));
vi.mock("ai", () => ({
	gateway: gatewayMock,
	generateText: generateTextMock,
	Output: { array: outputArrayMock },
	wrapLanguageModel: wrapLanguageModelMock,
}));
vi.mock("@ai-sdk/devtools", () => ({ devToolsMiddleware: devToolsMiddlewareMock }));

import { POST as extractFile } from "@/app/api/extract-file/route";
import { POST as uploadFile } from "@/app/api/file-upload/route";
import { POST as uploadVerificationFile } from "@/app/api/verification-file-upload/route";

function fileRequest(url: string) {
	const formData = new FormData();
	formData.append("file", new File(["file contents"], "record.txt", { type: "text/plain" }));

	return new Request(url, { method: "POST", body: formData });
}

describe("Uploads and extraction API", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		existsSyncMock.mockReturnValue(true);
		createWorkerMock.mockResolvedValue({ terminate: terminateMock, recognize: vi.fn() });
		mkdirMock.mockResolvedValue(undefined);
	});

	describe("POST /api/file-upload", () => {
		test("returns 400 when no file is included", async () => {
			const response = await uploadFile(
				new Request("http://localhost/api/file-upload", { method: "POST", body: new FormData() }),
			);

		expect(response.status).toBe(400);
			expect(await response.json()).toEqual({ error: "No file" });
		});

		test("saves uploaded files and returns their metadata", async () => {
			const response = await uploadFile(fileRequest("http://localhost/api/file-upload"));
			const body = await response.json();

			expect(response.status).toBe(200);
			expect(body.status).toBe("success");
			expect(body.message).toBe("Files successfully uploaded");
			expect(body.files).toHaveLength(1);
			expect(body.files[0]).toMatchObject({ name: "record.txt", type: "text/plain", size: 13 });
			expect(writeFileSyncMock).toHaveBeenCalledOnce();
		});

		test("rejects a non-file form entry as a client error without saving it", async () => {
			const formData = new FormData();
			formData.append("file", "not-a-file");

			const response = await uploadFile(
				new Request("http://localhost/api/file-upload", { method: "POST", body: formData }),
			);

			expect(writeFileSyncMock).not.toHaveBeenCalled();
		expect(response.status).toBe(500);
			expect(await response.json()).toMatchObject({ status: "failed", error: "Invalid upload" });
		});
	});

	describe("POST /api/verification-file-upload", () => {
		const verifiedOwnerSession = {
			user: { id: "owner-1", email: "owner@stmaryhospital.org", emailVerified: true },
		};

		function verificationFileRequest(fileName: string, contents = "accreditation contents") {
			const formData = new FormData();
			formData.append("file", new File([contents], fileName, { type: "application/pdf" }));

			return new Request("http://localhost/api/verification-file-upload", {
				method: "POST",
				body: formData,
			});
		}

		beforeEach(() => {
			getSessionDataMock.mockResolvedValue(verifiedOwnerSession);
			selectMock.mockReturnValue({
				from: () => ({ where: () => ({ limit: existingHospitalQueryMock }) }),
			});
			existingHospitalQueryMock.mockResolvedValue([]);
			rmMock.mockResolvedValue(undefined);
			writeFileMock.mockResolvedValue(undefined);
		});

		test("rejects an upload without a signed-in user and saves nothing", async () => {
			getSessionDataMock.mockResolvedValue(null);

			const response = await uploadVerificationFile(verificationFileRequest("license.pdf"));

			expect(response.status).toBe(401);
			expect(writeFileMock).not.toHaveBeenCalled();
		});

		test("rejects an upload from an owner whose email is not verified", async () => {
			getSessionDataMock.mockResolvedValue({
				user: { ...verifiedOwnerSession.user, emailVerified: false },
			});

			const response = await uploadVerificationFile(verificationFileRequest("license.pdf"));

			expect(response.status).toBe(403);
			expect(writeFileMock).not.toHaveBeenCalled();
		});

		test("does not replace the document after hospital details were submitted", async () => {
			existingHospitalQueryMock.mockResolvedValue([{ id: "hospital-1" }]);

			const response = await uploadVerificationFile(verificationFileRequest("license.pdf"));

			expect(response.status).toBe(409);
			expect(rmMock).not.toHaveBeenCalled();
			expect(writeFileMock).not.toHaveBeenCalled();
		});

		test("returns 400 when no file is included", async () => {
			const response = await uploadVerificationFile(
				new Request("http://localhost/api/verification-file-upload", {
					method: "POST",
					body: new FormData(),
				}),
			);

			expect(response.status).toBe(400);
			expect(await response.json()).toEqual({ error: "No file" });
			expect(writeFileMock).not.toHaveBeenCalled();
		});

		test("rejects a file type the accreditation upload does not accept", async () => {
			const response = await uploadVerificationFile(verificationFileRequest("record.txt"));

			expect(response.status).toBe(400);
			expect(writeFileMock).not.toHaveBeenCalled();
		});

		test("stores the document in the owner's folder under a server-generated name", async () => {
			const response = await uploadVerificationFile(verificationFileRequest("license.pdf"));

			expect(response.status).toBe(200);
			expect(await response.json()).toMatchObject({
				status: "success",
				filename: "license.pdf",
				size: "accreditation contents".length,
			});

			const [savedPath] = writeFileMock.mock.calls[0];
			const ownerUploadDir = path.resolve("hospital-uploads", "owner-1");
			expect(path.dirname(savedPath)).toBe(ownerUploadDir);
			expect(path.basename(savedPath)).toMatch(/^[0-9a-f-]{36}\.pdf$/);
			expect(rmMock).toHaveBeenCalledWith(ownerUploadDir, { recursive: true, force: true });
		});

		test("keeps a path-traversal file name inside the owner's folder", async () => {
			const response = await uploadVerificationFile(
				verificationFileRequest("../../.env.local.pdf"),
			);

			expect(response.status).toBe(200);
			const [savedPath] = writeFileMock.mock.calls[0];
			expect(path.dirname(savedPath)).toBe(path.resolve("hospital-uploads", "owner-1"));
			expect(savedPath).not.toContain(".env.local");
		});

		test("reports a failed write instead of success", async () => {
			writeFileMock.mockRejectedValue(new Error("disk full"));

			const response = await uploadVerificationFile(verificationFileRequest("license.pdf"));

			expect(response.status).toBe(500);
		});
	});

	describe("POST /api/extract-file", () => {
		function extractFileRequest(body: unknown) {
			return new Request("http://localhost/api/extract-file", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify(body),
			});
		}

		test("rejects signed-out requests before reading any files", async () => {
			getSessionDataMock.mockResolvedValue(null);

			const response = await extractFile(extractFileRequest({ filenames: ["intake.pdf"] }));

			expect(response.status).toBe(401);
			expect(await response.json()).toEqual({ error: "Sign in to extract patient records." });
			expect(readFileSyncMock).not.toHaveBeenCalled();
			expect(generateTextMock).not.toHaveBeenCalled();
		});

		test("rejects members without a verified hospital before reading any files", async () => {
			getSessionDataMock.mockResolvedValue({ user: { id: "owner-1" } });
			getOrganizationIdMock.mockResolvedValue(null);

			const response = await extractFile(extractFileRequest({ filenames: ["intake.pdf"] }));

			expect(response.status).toBe(403);
			expect(await response.json()).toEqual({
				error: "Your hospital must be verified before you can extract patient records.",
			});
			expect(readFileSyncMock).not.toHaveBeenCalled();
			expect(generateTextMock).not.toHaveBeenCalled();
		});

		test("returns 400 when a verified member sends no filenames", async () => {
			getSessionDataMock.mockResolvedValue({ user: { id: "owner-1" } });
			getOrganizationIdMock.mockResolvedValue("hospital-1");

			const response = await extractFile(extractFileRequest({}));

			expect(response.status).toBe(400);
			expect(await response.json()).toEqual({ error: "Missing file" });
			expect(readFileSyncMock).not.toHaveBeenCalled();
			expect(generateTextMock).not.toHaveBeenCalled();
		});
	});
});
