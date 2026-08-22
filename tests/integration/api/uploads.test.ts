// @vitest-environment node

import { afterAll, beforeEach, describe, expect, test, vi } from "vitest";

const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);

afterAll(() => consoleLogSpy.mockRestore());

const {
	existsSyncMock,
	mkdirSyncMock,
	writeFileSyncMock,
	readFileSyncMock,
	mkdirMock,
	saveFileMock,
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
	saveFileMock: vi.fn(),
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
vi.mock("node:fs/promises", () => ({ mkdir: mkdirMock }));
vi.mock("@/lib/utils/save-file", () => ({ saveFile: saveFileMock }));
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

		test("returns 500 when a form entry is not a file", async () => {
			const formData = new FormData();
			formData.append("file", "not-a-file");

			const response = await uploadFile(
				new Request("http://localhost/api/file-upload", { method: "POST", body: formData }),
			);

			expect(response.status).toBe(500);
			expect(await response.json()).toMatchObject({ status: "failed", error: "Invalid upload" });
		});
	});

	describe("POST /api/verification-file-upload", () => {
		test("returns 400 when no file is included", async () => {
			const response = await uploadVerificationFile(
				new Request("http://localhost/api/verification-file-upload", { method: "POST", body: new FormData() }),
			);

			expect(response.status).toBe(400);
			expect(await response.json()).toEqual({ error: "No file" });
		});

		test("saves the verification file and returns its metadata", async () => {
			const response = await uploadVerificationFile(fileRequest("http://localhost/api/verification-file-upload"));

			expect(response.status).toBe(200);
			expect(await response.json()).toMatchObject({
				status: "success",
				filename: "record.txt",
				mimetype: "text/plain",
				size: 13,
			});
			expect(saveFileMock).toHaveBeenCalledOnce();
		});
	});

	describe("POST /api/extract-file", () => {
		test("returns 400 when filenames are missing", async () => {
			const response = await extractFile(
				new Request("http://localhost/api/extract-file", {
					method: "POST",
					headers: { "content-type": "application/json" },
					body: JSON.stringify({}),
				}),
			);

			expect(response.status).toBe(400);
			expect(await response.json()).toEqual({ error: "Missing file" });
			expect(createWorkerMock).toHaveBeenCalledWith("eng");
			expect(terminateMock).toHaveBeenCalledOnce();
			expect(generateTextMock).not.toHaveBeenCalled();
		});
	});
});
