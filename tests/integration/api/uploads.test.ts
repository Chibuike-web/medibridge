// @vitest-environment node

import path from "node:path";
import os from "node:os";
import { afterAll, afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);

afterAll(() => consoleLogSpy.mockRestore());

const {
	existsSyncMock,
	readFileSyncMock,
	mkdirMock,
	readdirMock,
	renameMock,
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
	readFileSyncMock: vi.fn(),
	mkdirMock: vi.fn(),
	readdirMock: vi.fn(),
	renameMock: vi.fn(),
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
	readFileSync: readFileSyncMock,
}));
vi.mock("node:fs/promises", () => ({
	mkdir: mkdirMock,
	readdir: readdirMock,
	rename: renameMock,
	rm: rmMock,
	writeFile: writeFileMock,
}));
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

const fileSystem = await vi.importActual<typeof import("node:fs/promises")>("node:fs/promises");
let testUploadDir: string;

// Run upload filesystem operations in a real, isolated directory.
function storedPath(filePath: string) {
	const relativePath = path.relative(process.cwd(), filePath);
	if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
		throw new Error("Upload path is outside the workspace");
	}
	return path.join(testUploadDir, relativePath);
}

function fileRequest(url: string) {
	const formData = new FormData();
	formData.append("file", new File(["file contents"], "record.pdf", { type: "application/pdf" }));

	return new Request(url, { method: "POST", body: formData });
}

describe("Uploads and extraction API", () => {
	beforeEach(async () => {
		vi.clearAllMocks();
		testUploadDir = await fileSystem.mkdtemp(path.join(os.tmpdir(), "medibridge-uploads-"));
		mkdirMock.mockImplementation((filePath, options) =>
			fileSystem.mkdir(storedPath(filePath), options),
		);
		readdirMock.mockImplementation((filePath) => fileSystem.readdir(storedPath(filePath)));
		renameMock.mockImplementation((from, to) =>
			fileSystem.rename(storedPath(from), storedPath(to)),
		);
		rmMock.mockImplementation((filePath, options) => fileSystem.rm(storedPath(filePath), options));
		writeFileMock.mockImplementation((filePath, buffer) =>
			fileSystem.writeFile(storedPath(filePath), buffer),
		);
		existsSyncMock.mockReturnValue(true);
		createWorkerMock.mockResolvedValue({ terminate: terminateMock, recognize: vi.fn() });
		getSessionDataMock.mockResolvedValue({ user: { id: "owner-1", emailVerified: true } });
		getOrganizationIdMock.mockResolvedValue("hospital-1");
	});

	afterEach(async () => {
		await fileSystem.rm(testUploadDir, { recursive: true, force: true });
	});

	describe("POST /api/file-upload", () => {
		test("returns 400 when no file is included", async () => {
			const response = await uploadFile(
				new Request("http://localhost/api/file-upload", { method: "POST", body: new FormData() }),
			);

			expect(response.status).toBe(400);
			expect(await response.json()).toEqual({ status: "failed", error: "No file" });
		});

		test("saves uploaded files and returns their metadata", async () => {
			const response = await uploadFile(fileRequest("http://localhost/api/file-upload"));
			const body = await response.json();

			expect(response.status).toBe(200);
			expect(body.status).toBe("success");
			expect(body.message).toBe("Files successfully uploaded");
			expect(body.files).toHaveLength(1);
			expect(body.files[0]).toMatchObject({
				name: "record.pdf",
				type: "application/pdf",
				size: 13,
			});
			expect(body.files[0].storedName).toBe(`${body.files[0].id}.pdf`);
			expect(body.files[0].storedName).toMatch(/^[0-9a-f-]{36}\.pdf$/);
			expect(body.files[0].url).toBe(
				`patient-uploads/hospital-1/owner-1/${body.files[0].storedName}`,
			);
			expect(await fileSystem.readFile(storedPath(path.resolve(body.files[0].url)), "utf8")).toBe(
				"file contents",
			);
		});

		test("denies patient uploads without a session or an approved hospital", async () => {
			getSessionDataMock.mockResolvedValue(null);
			expect((await uploadFile(fileRequest("http://localhost/api/file-upload"))).status).toBe(401);
			getSessionDataMock.mockResolvedValue({ user: { id: "owner-1" } });
			getOrganizationIdMock.mockResolvedValue(null);
			expect((await uploadFile(fileRequest("http://localhost/api/file-upload"))).status).toBe(403);
			expect(writeFileMock).not.toHaveBeenCalled();
		});

		test("rejects an empty file before saving any files in the batch", async () => {
			const formData = new FormData();
			formData.append("file", new File(["valid contents"], "valid.pdf"));
			formData.append("file", new File([], "empty.pdf"));
			const response = await uploadFile(
				new Request("http://localhost/api/file-upload", {
					method: "POST",
					body: formData,
				}),
			);
			expect(response.status).toBe(400);
			expect(await response.json()).toEqual({ status: "failed", error: "No file" });
			expect(await fileSystem.readdir(testUploadDir)).toEqual([]);
		});

		test("returns a fixed error when the session lookup fails", async () => {
			getSessionDataMock.mockRejectedValueOnce(new Error("private provider details"));
			const response = await uploadFile(fileRequest("http://localhost/api/file-upload"));
			expect(response.status).toBe(500);
			expect(await response.json()).toEqual({
				status: "failed",
				error: "We couldn’t upload your files. Please try again.",
			});
			expect(await fileSystem.readdir(testUploadDir)).toEqual([]);
		});

		test("preserves the display names and contents of every valid file in a batch", async () => {
			const formData = new FormData();
			formData.append("file", new File(["pdf contents"], "record.PDF"));
			formData.append("file", new File(["docx contents"], "intake.docx"));
			const response = await uploadFile(
				new Request("http://localhost/api/file-upload", {
					method: "POST",
					body: formData,
				}),
			);
			expect(response.status).toBe(200);
			const body = await response.json();
			expect(body.files.map((file: { name: string }) => file.name)).toEqual([
				"record.PDF",
				"intake.docx",
			]);
			for (const [index, contents] of ["pdf contents", "docx contents"].entries()) {
				expect(
					await fileSystem.readFile(storedPath(path.resolve(body.files[index].url)), "utf8"),
				).toBe(contents);
			}
		});

		test("reports a failed patient file write instead of success", async () => {
			writeFileMock.mockRejectedValueOnce(new Error("private disk details"));
			const response = await uploadFile(fileRequest("http://localhost/api/file-upload"));
			expect(response.status).toBe(500);
			expect(await response.json()).toEqual({
				status: "failed",
				error: "We couldn’t upload your files. Please try again.",
			});
			expect(
				await fileSystem.readdir(
					storedPath(path.resolve("patient-uploads", "hospital-1", "owner-1")),
				),
			).toEqual([]);
		});

		test("keeps another user's upload separate when both choose the same filename", async () => {
			const firstResponse = await uploadFile(fileRequest("http://localhost/api/file-upload"));
			getSessionDataMock.mockResolvedValue({ user: { id: "owner-2" } });
			getOrganizationIdMock.mockResolvedValue("hospital-2");
			const secondResponse = await uploadFile(fileRequest("http://localhost/api/file-upload"));
			const firstUpload = (await firstResponse.json()).files[0];
			const secondUpload = (await secondResponse.json()).files[0];
			expect(firstUpload.name).toBe(secondUpload.name);
			expect(firstUpload.url).not.toBe(secondUpload.url);
			expect(secondUpload.url).toBe(
				`patient-uploads/hospital-2/owner-2/${secondUpload.storedName}`,
			);
		});

		test.each(["..\\private.pdf", "../../private.pdf", "report:final.pdf", "🩺 report.pdf"])(
			"saves the original name %s safely under a generated filename",
			async (name) => {
				const formData = new FormData();
				formData.append("file", new File(["contents"], name, { type: "application/pdf" }));
				const response = await uploadFile({ formData: async () => formData } as Request);
				expect(response.status).toBe(200);
				const [uploadedFile] = (await response.json()).files;
				expect(uploadedFile.name).toBe(name);
				expect(uploadedFile.storedName).toMatch(/^[0-9a-f-]{36}\.pdf$/);
				expect(path.dirname(path.resolve(uploadedFile.url))).toBe(
					path.resolve("patient-uploads", "hospital-1", "owner-1"),
				);
				expect(await fileSystem.readFile(storedPath(path.resolve(uploadedFile.url)), "utf8")).toBe(
					"contents",
				);
			},
		);

		test("does not overwrite another upload with the same original filename", async () => {
			const formData = new FormData();
			formData.append("file", new File(["first document"], "record.pdf"));
			formData.append("file", new File(["second document"], "record.pdf"));
			const response = await uploadFile({ formData: async () => formData } as Request);
			expect(response.status).toBe(200);
			const { files } = await response.json();
			expect(files).toHaveLength(2);
			expect(files[0].name).toBe("record.pdf");
			expect(files[1].name).toBe("record.pdf");
			expect(files[0].url).not.toBe(files[1].url);
			expect(await fileSystem.readFile(storedPath(path.resolve(files[0].url)), "utf8")).toBe(
				"first document",
			);
			expect(await fileSystem.readFile(storedPath(path.resolve(files[1].url)), "utf8")).toBe(
				"second document",
			);
		});

		test.each([
			["empty.pdf", "", 0, "No file"],
			["pdf", "contents", 8, "Invalid file type. Only PDF, PNG, JPG, and DOCX are allowed."],
			["record.doc", "contents", 8, "Invalid file type. Only PDF, PNG, JPG, and DOCX are allowed."],
			[
				"record.pdf",
				"contents",
				50 * 1024 * 1024 + 1,
				"File is too large. Maximum allowed size is 50MB.",
			],
		])("rejects invalid file %s of size %s before saving", async (name, contents, size, error) => {
			const file = new File([contents], name);
			Object.defineProperty(file, "size", { value: size });
			const formData = new FormData();
			formData.append("file", file);
			const response = await uploadFile({ formData: async () => formData } as Request);
			expect(response.status).toBe(400);
			expect(await response.json()).toEqual({ status: "failed", error });
			expect(await fileSystem.readdir(testUploadDir)).toEqual([]);
		});

		test("rejects a non-file form entry as a client error without saving it", async () => {
			const formData = new FormData();
			formData.append("file", "not-a-file");

			const response = await uploadFile(
				new Request("http://localhost/api/file-upload", { method: "POST", body: formData }),
			);

			expect(writeFileMock).not.toHaveBeenCalled();
			expect(response.status).toBe(400);
			expect(await response.json()).toMatchObject({
				status: "failed",
				error: "No file",
			});
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
			expect(await response.json()).toEqual({ status: "failed", error: "No file" });
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

			const ownerUploadDir = path.resolve("hospital-uploads", "owner-1");
			const savedNames = await fileSystem.readdir(storedPath(ownerUploadDir));
			expect(savedNames).toHaveLength(1);
			expect(savedNames[0]).toMatch(/^[0-9a-f-]{36}\.pdf$/);
			expect(
				await fileSystem.readFile(storedPath(path.join(ownerUploadDir, savedNames[0])), "utf8"),
			).toBe("accreditation contents");
		});

		test("keeps a path-traversal file name inside the owner's folder", async () => {
			const response = await uploadVerificationFile(
				verificationFileRequest("../../.env.local.pdf"),
			);

			expect(response.status).toBe(200);
			const savedNames = await fileSystem.readdir(
				storedPath(path.resolve("hospital-uploads", "owner-1")),
			);
			expect(savedNames).toHaveLength(1);
			expect(savedNames[0]).toMatch(/^[0-9a-f-]{36}\.pdf$/);
		});

		test.each(["write", "rename"])(
			"preserves the previous document when replacement %s fails",
			async (failure) => {
				const ownerUploadDir = storedPath(path.resolve("hospital-uploads", "owner-1"));
				expect(
					(await uploadVerificationFile(verificationFileRequest("old.pdf", "old document"))).status,
				).toBe(200);
				const previousFileNames = await fileSystem.readdir(ownerUploadDir);
				let documentsDuringWrite: string[] | undefined;
				expect(previousFileNames).toHaveLength(1);
				expect(
					await fileSystem.readFile(path.join(ownerUploadDir, previousFileNames[0]), "utf8"),
				).toBe("old document");
				if (failure === "write") {
					writeFileMock.mockImplementationOnce(async (filePath) => {
						await fileSystem.writeFile(storedPath(filePath), "partial replacement");
						documentsDuringWrite = await fileSystem.readdir(ownerUploadDir);
						throw new Error("disk full");
					});
				} else {
					renameMock.mockRejectedValueOnce(new Error("replacement cannot be moved"));
				}

				const response = await uploadVerificationFile(verificationFileRequest("license.pdf"));

				expect(response.status).toBe(500);
				if (failure === "write") {
					expect(documentsDuringWrite).toEqual(previousFileNames);
				}
				expect(await response.json()).toEqual({
					status: "failed",
					error: "We couldn’t upload your file. Please try again.",
				});
				expect(await fileSystem.readdir(ownerUploadDir)).toEqual(previousFileNames);
				expect(
					await fileSystem.readFile(path.join(ownerUploadDir, previousFileNames[0]), "utf8"),
				).toBe("old document");
				expect(await fileSystem.readdir(storedPath(path.resolve("hospital-uploads")))).toEqual([
					"owner-1",
				]);
			},
		);

		test("keeps only the complete replacement when its file type changes", async () => {
			const ownerUploadDir = storedPath(path.resolve("hospital-uploads", "owner-1"));
			expect(
				(await uploadVerificationFile(verificationFileRequest("old.pdf", "old document"))).status,
			).toBe(200);
			const [oldFileName] = await fileSystem.readdir(ownerUploadDir);
			expect(await fileSystem.readFile(path.join(ownerUploadDir, oldFileName), "utf8")).toBe(
				"old document",
			);

			const response = await uploadVerificationFile(
				verificationFileRequest("new.png", "new document"),
			);
			expect(response.status).toBe(200);
			expect(await response.json()).toMatchObject({ status: "success", filename: "new.png" });
			const savedNames = await fileSystem.readdir(ownerUploadDir);
			expect(savedNames).toHaveLength(1);
			expect(savedNames[0]).not.toBe(oldFileName);
			expect(savedNames[0]).toMatch(/\.png$/);
			expect(await fileSystem.readFile(path.join(ownerUploadDir, savedNames[0]), "utf8")).toBe(
				"new document",
			);
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

		test("returns a flat list of extracted patients through the installed AI SDK", async () => {
			const ai = await vi.importActual<typeof import("ai")>("ai");
			const { MockLanguageModelV4 } = await import("ai/test");
			const patient = {
				personalInfo: {
					firstName: "Alex",
					middleName: null,
					lastName: "Synthetic",
					patientId: "TEST-164-001",
					dateOfBirth: "1990-01-01",
					sex: "Male",
					age: 36,
					maritalStatus: null,
					nationalId: null,
				},
				contactInfo: {
					phoneNumber: null,
					emailAddress: "patient@example.org",
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
			const model = new MockLanguageModelV4({
				doGenerate: {
					content: [{ type: "text", text: JSON.stringify({ elements: [patient] }) }],
					finishReason: { unified: "stop", raw: "stop" },
					warnings: [],
					usage: {
						inputTokens: { total: 10, noCache: 10, cacheRead: 0, cacheWrite: 0 },
						outputTokens: { total: 10, text: 10, reasoning: 0 },
					},
				},
			});
			mammothExtractRawTextMock.mockResolvedValue({ value: "Alex Synthetic, born 1990-01-01" });
			outputArrayMock.mockImplementationOnce(ai.Output.array);
			generateTextMock.mockImplementationOnce((options) => ai.generateText({ ...options, model }));

			const response = await extractFile(extractFileRequest({ filenames: ["intake.docx"] }));

			expect(response.status).toBe(200);
			expect(await response.json()).toMatchObject({
				status: "success",
				parsed: 1,
				failed: 0,
				extracted: [patient],
			});
		});

		test.each(["../hospital-2/private.pdf", "..\\private.pdf", "C:\\private.pdf"])(
			"denies extraction of a supplied path %s",
			async (filename) => {
				const response = await extractFile(extractFileRequest({ filenames: [filename] }));
				expect(response.status).toBe(400);
				expect(readFileSyncMock).not.toHaveBeenCalled();
				expect(createWorkerMock).not.toHaveBeenCalled();
			},
		);

		test("extracts only the signed-in member's own hospital upload", async () => {
			mammothExtractRawTextMock.mockResolvedValue({ value: "patient information" });
			generateTextMock.mockResolvedValue({ output: [] });
			const response = await extractFile(extractFileRequest({ filenames: ["intake.docx"] }));
			expect(response.status).toBe(200);
			const payload = await response.json();
			expect(payload.result).toEqual([
				{
					name: "intake.docx",
					path: path.resolve("patient-uploads/hospital-1/owner-1/intake.docx"),
					text: "patient information",
					status: "success",
				},
			]);
		});

		test("extracts an uploaded patient document using its returned stored filename", async () => {
			const formData = new FormData();
			formData.append("file", new File(["patient information"], "original intake.docx"));
			const uploadedResponse = await uploadFile({ formData: async () => formData } as Request);
			expect(uploadedResponse.status).toBe(200);
			const [uploadedFile] = (await uploadedResponse.json()).files;
			mammothExtractRawTextMock.mockImplementation(async ({ path: filePath }) => ({
				value: await fileSystem.readFile(storedPath(filePath), "utf8"),
			}));
			generateTextMock.mockResolvedValue({ output: [] });
			const response = await extractFile(
				extractFileRequest({ filenames: [uploadedFile.storedName] }),
			);
			expect(response.status).toBe(200);
			expect((await response.json()).result).toEqual([
				{
					name: uploadedFile.storedName,
					path: path.resolve(uploadedFile.url),
					text: "patient information",
					status: "success",
				},
			]);
		});

		test("rejects signed-out requests before reading any files", async () => {
			getSessionDataMock.mockResolvedValue(null);

			const response = await extractFile(extractFileRequest({ filenames: ["intake.pdf"] }));

			expect(response.status).toBe(401);
			expect(await response.json()).toEqual({
				status: "failed",
				error: "Sign in to extract patient records.",
			});
			expect(readFileSyncMock).not.toHaveBeenCalled();
			expect(generateTextMock).not.toHaveBeenCalled();
		});

		test("rejects members without a verified hospital before reading any files", async () => {
			getSessionDataMock.mockResolvedValue({ user: { id: "owner-1" } });
			getOrganizationIdMock.mockResolvedValue(null);

			const response = await extractFile(extractFileRequest({ filenames: ["intake.pdf"] }));

			expect(response.status).toBe(403);
			expect(await response.json()).toEqual({
				status: "failed",
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
			expect(await response.json()).toEqual({ status: "failed", error: "Missing file" });
			expect(readFileSyncMock).not.toHaveBeenCalled();
			expect(generateTextMock).not.toHaveBeenCalled();
		});
	});
});
