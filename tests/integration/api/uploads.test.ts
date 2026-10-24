// @vitest-environment node

import { afterAll, beforeEach, describe, expect, test, vi } from "vitest";

const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);

afterAll(() => consoleLogSpy.mockRestore());

const {
	signedUploadMock,
	readFileMock,
	getSessionDataMock,
	getOrganizationIdMock,
	selectMock,
	saveExtractionMock,
	savedExtractions,
	storedExtraction,
	getPatientExtractionByIdMock,
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
	revalidateTagMock,
} = vi.hoisted(() => ({
	signedUploadMock: vi.fn(),
	readFileMock: vi.fn(),
	getSessionDataMock: vi.fn(),
	getOrganizationIdMock: vi.fn(),
	selectMock: vi.fn(),
	saveExtractionMock: vi.fn(),
	savedExtractions: [] as Record<string, unknown>[],
	storedExtraction: { extractedData: [] as unknown[], isDeleted: false },
	getPatientExtractionByIdMock: vi.fn(),
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
	revalidateTagMock: vi.fn(),
}));

vi.mock("@/lib/storage/client", () => ({
	patientUploads: {
		createSignedUploadUrl: signedUploadMock,
		download: async (key: string) => ({ data: new Blob([await readFileMock(key)]), error: null }),
	},
	hospitalUploads: { createSignedUploadUrl: signedUploadMock },
}));
vi.mock("@/lib/api/get-session-data", () => ({ getSessionData: getSessionDataMock }));
vi.mock("@/lib/api/get-organization-id", () => ({ getOrganizationId: getOrganizationIdMock }));
vi.mock("@/lib/api/get-patient-extraction-by-id", () => ({
	getPatientExtractionById: getPatientExtractionByIdMock,
}));
vi.mock("@/lib/better-auth/auth", () => ({
	db: {
		select: selectMock,
		insert: () => ({ values: saveExtractionMock }),
		transaction: async (write: (tx: unknown) => Promise<void>) =>
			write({
				select: () => ({
					from: () => ({
						where: () => ({
							for: async () =>
								storedExtraction.isDeleted ? [] : [structuredClone(storedExtraction)],
						}),
					}),
				}),
				update: () => ({
					set: ({ extractedData }: { extractedData: unknown[] }) => ({
						where: async () => {
							storedExtraction.extractedData = extractedData;
						},
					}),
				}),
			}),
	},
}));
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
vi.mock("next/cache", () => ({ revalidateTag: revalidateTagMock }));

import { POST as extractFile } from "@/app/api/extract-file/route";
import { POST as uploadFile } from "@/app/api/file-upload/route";
import { POST as uploadVerificationFile } from "@/app/api/verification-file-upload/route";

function metadataRequest(url: string, body: unknown) {
	return new Request(url, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(body),
	});
}
function fileRequest(name = "record.pdf", size = 13) {
	return metadataRequest("http://localhost/api/file-upload", {
		files: [{ clientId: "client-record", name, type: "application/pdf", size }],
	});
}
function readyDocument(documentId: string) {
	const { documentId: _, ...patient } = createExtractedPatient(documentId);
	return { documentId, status: "ready", patient };
}

function modelDocuments() {
	const prompt: string = generateTextMock.mock.calls[0][0].messages[0].content[0].text;
	return JSON.parse(prompt.slice(prompt.indexOf("["), prompt.lastIndexOf("]") + 1));
}

function createExtractedPatient(documentId: string) {
	return {
		documentId,
		personalInfo: {
			firstName: "Alex",
			middleName: null,
			lastName: "Synthetic",
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
}

describe("Uploads and extraction API", () => {
	beforeEach(async () => {
		vi.clearAllMocks();
		savedExtractions.length = 0;
		saveExtractionMock.mockImplementation(async (row: Record<string, unknown>) => {
			savedExtractions.push(structuredClone(row));
		});
		signedUploadMock.mockImplementation(async (key: string) => ({
			data: { signedUrl: `https://storage.test/${key}?token=upload-only` },
			error: null,
		}));
		selectMock.mockReturnValue({
			from: () => ({ where: () => ({ limit: existingHospitalQueryMock }) }),
		});
		existingHospitalQueryMock.mockResolvedValue([]);
		readFileMock.mockResolvedValue(Buffer.from("PDF file contents"));
		createWorkerMock.mockResolvedValue({ terminate: terminateMock, recognize: vi.fn() });
		getSessionDataMock.mockResolvedValue({ user: { id: "owner-1", emailVerified: true } });
		getOrganizationIdMock.mockResolvedValue("hospital-1");
		storedExtraction.isDeleted = false;
	});

	describe("direct upload authorizations", () => {
		test("returns an upload-only URL and server-generated name without receiving bytes", async () => {
			const response = await uploadFile(fileRequest());
			const body = await response.json();
			expect(response.status).toBe(200);
			expect(body.status).toBe("success");
			expect(body.files[0]).toMatchObject({
				name: "record.pdf",
				type: "application/pdf",
				size: 13,
				clientId: "client-record",
			});
			expect(body.files[0].storedName).toBe(`${body.files[0].id}.pdf`);
			expect(body.files[0].url).toBe(
				`patient-uploads/hospital-1/owner-1/${body.files[0].storedName}`,
			);
			expect(body.files[0].signedUrl).toContain("token=upload-only");
			expect(body.files[0].status).toBeUndefined();
			expect(signedUploadMock).toHaveBeenCalledWith(
				`hospital-1/owner-1/${body.files[0].storedName}`,
				{ upsert: false },
			);
		});
		test.each([
			"record.jpeg",
			"intake.docx",
			"../../private.pdf",
			"..\\private.pdf",
			"🩺 report.pdf",
		])("keeps the display name %s while generating a safe object key", async (name) => {
			const response = await uploadFile(fileRequest(name));
			const body = await response.json();
			expect(response.status).toBe(200);
			expect(body.files[0].name).toBe(name);
			expect(body.files[0].storedName).toMatch(/^[a-f0-9-]{36}\.(pdf|jpeg|docx)$/);
		});
		test("accepts 50 MB metadata and keeps equal display names in distinct immutable objects", async () => {
			const first = await uploadFile(fileRequest("record.pdf", 50 * 1024 * 1024));
			const second = await uploadFile(fileRequest());
			expect(first.status).toBe(200);
			expect(second.status).toBe(200);
			expect((await first.json()).files[0].url).not.toBe((await second.json()).files[0].url);
		});
		test.each([0, 50 * 1024 * 1024 + 1])(
			"rejects invalid size %s without granting upload access",
			async (size) => {
				expect((await uploadFile(fileRequest("record.pdf", size))).status).toBe(400);
				expect(signedUploadMock).not.toHaveBeenCalled();
			},
		);
		test("rejects an unsupported file in a batch before granting any uploads", async () => {
			const response = await uploadFile(
				metadataRequest("http://localhost/api/file-upload", {
					files: [
						{ clientId: "1", name: "valid.pdf", type: "application/pdf", size: 10 },
						{ clientId: "2", name: "bad.html", type: "text/html", size: 10 },
					],
				}),
			);
			expect(response.status).toBe(400);
			expect(signedUploadMock).not.toHaveBeenCalled();
		});
		test.each([null, false])(
			"denies patient upload grants without a verified session: %s",
			async (verified) => {
				getSessionDataMock.mockResolvedValue(
					verified === null ? null : { user: { id: "owner-1", emailVerified: false } },
				);
				expect((await uploadFile(fileRequest())).status).toBe(verified === null ? 401 : 403);
				expect(signedUploadMock).not.toHaveBeenCalled();
			},
		);
		test("keeps upload keys in the authenticated hospital and uploader namespace", async () => {
			const first = (await (await uploadFile(fileRequest())).json()).files[0];
			getOrganizationIdMock.mockResolvedValue("hospital-2");
			getSessionDataMock.mockResolvedValue({ user: { id: "owner-2", emailVerified: true } });
			const second = (await (await uploadFile(fileRequest())).json()).files[0];
			expect(first.url).toContain("hospital-1/owner-1/");
			expect(second.url).toContain("hospital-2/owner-2/");
			getOrganizationIdMock.mockResolvedValue(null);
			expect((await uploadFile(fileRequest())).status).toBe(403);
		});
		test("reports provider failure with a fixed message", async () => {
			vi.spyOn(console, "error").mockImplementation(() => {});
			signedUploadMock.mockResolvedValueOnce({
				data: null,
				error: new Error("private provider details"),
			});
			const response = await uploadFile(fileRequest());
			expect(response.status).toBe(500);
			expect(await response.json()).toEqual({
				status: "failed",
				error: "We couldn’t upload your files. Please try again.",
			});
		});
		test("rejects missing or malformed metadata", async () => {
			expect(
				(await uploadFile(metadataRequest("http://localhost/api/file-upload", { files: [] })))
					.status,
			).toBe(400);
			expect(
				(
					await uploadFile(
						new Request("http://localhost/api/file-upload", { method: "POST", body: "bad json" }),
					)
				).status,
			).toBe(400);
			expect(signedUploadMock).not.toHaveBeenCalled();
		});
	});
	describe("accreditation upload authorization", () => {
		const request = (name = "license.pdf") =>
			metadataRequest("http://localhost/api/verification-file-upload", {
				name,
				type: "application/pdf",
				size: 10,
			});
		test("gives a verified owner a generated private key before hospital onboarding", async () => {
			const response = await uploadVerificationFile(request());
			const body = await response.json();
			expect(response.status).toBe(200);
			expect(body.key).toMatch(/^owner-1\/[a-f0-9-]{36}\.pdf$/);
			expect(signedUploadMock).toHaveBeenCalledWith(body.key, { upsert: false });
		});
		test.each([null, false])("requires a signed-in verified owner: %s", async (verified) => {
			getSessionDataMock.mockResolvedValue(
				verified === null ? null : { user: { id: "owner-1", emailVerified: false } },
			);
			expect((await uploadVerificationFile(request())).status).toBe(verified === null ? 401 : 403);
			expect(signedUploadMock).not.toHaveBeenCalled();
		});
		test("does not grant replacement access after hospital details were submitted", async () => {
			existingHospitalQueryMock.mockResolvedValue([{ id: "hospital-details-1" }]);
			expect((await uploadVerificationFile(request())).status).toBe(409);
			expect(signedUploadMock).not.toHaveBeenCalled();
		});
		test("rejects an unsupported accreditation file", async () => {
			expect((await uploadVerificationFile(request("license.html"))).status).toBe(400);
			expect(signedUploadMock).not.toHaveBeenCalled();
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

		test("stores each document as ready with its patient for the authenticated hospital", async () => {
			mammothExtractRawTextMock.mockResolvedValue({ value: "Patient information" });
			generateTextMock.mockResolvedValue({ output: [createExtractedPatient("intake.docx")] });

			const response = await extractFile(extractFileRequest({ filenames: ["intake.docx"] }));
			const payload = await response.json();

			expect(response.status).toBe(200);
			expect(payload).toEqual({
				status: "success",
				extractionId: expect.any(String),
				hasReadyDocument: true,
			});
			expect(savedExtractions).toEqual([
				{
					id: payload.extractionId,
					organizationId: "hospital-1",
					createdBy: "owner-1",
					extractedData: [readyDocument("intake.docx")],
				},
			]);
		});

		test("returns a save error without a success payload when extraction storage fails", async () => {
			const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
			mammothExtractRawTextMock.mockResolvedValue({ value: "Patient information" });
			generateTextMock.mockResolvedValue({ output: [createExtractedPatient("intake.docx")] });
			saveExtractionMock.mockRejectedValue(new Error("Private database connection details"));

			try {
				const response = await extractFile(extractFileRequest({ filenames: ["intake.docx"] }));

				expect(response.status).toBe(500);
				expect(await response.json()).toEqual({
					status: "failed",
					error: "We couldn’t save the extracted information. Please try again.",
				});
				expect(savedExtractions).toEqual([]);
			} finally {
				consoleErrorSpy.mockRestore();
			}
		});

		test("stores a document as failed when the model returns no patient record for it", async () => {
			mammothExtractRawTextMock.mockResolvedValue({
				value: "A document without patient information",
			});
			generateTextMock.mockResolvedValue({ output: [] });

			const response = await extractFile(extractFileRequest({ filenames: ["intake.docx"] }));

			expect(response.status).toBe(200);
			expect(await response.json()).toMatchObject({ status: "success", hasReadyDocument: false });
			expect(savedExtractions).toEqual([
				expect.objectContaining({
					extractedData: [{ documentId: "intake.docx", status: "failed", patient: null }],
				}),
			]);
		});

		test("stores every document as failed without exposing the error when the model call fails", async () => {
			const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
			mammothExtractRawTextMock.mockResolvedValue({ value: "Patient information" });
			generateTextMock.mockRejectedValue(new Error("Private model provider detail"));

			try {
				const response = await extractFile(
					extractFileRequest({ filenames: ["first.docx", "second.docx"] }),
				);

				expect(response.status).toBe(200);
				const payload = await response.json();
				expect(payload).toEqual({
					status: "success",
					extractionId: expect.any(String),
					hasReadyDocument: false,
				});
				expect(savedExtractions).toEqual([
					expect.objectContaining({
						id: payload.extractionId,
						extractedData: [
							{ documentId: "first.docx", status: "failed", patient: null },
							{ documentId: "second.docx", status: "failed", patient: null },
						],
					}),
				]);
			} finally {
				consoleErrorSpy.mockRestore();
			}
		});

		test.each(["png", "docx", "pdf"])(
			"sends the text read from a %s upload to the model and stores it as ready",
			async (extension) => {
				const text = "Patient Alex Synthetic, born 1990-01-01. ".repeat(5);
				createWorkerMock.mockResolvedValue({
					terminate: terminateMock,
					recognize: vi.fn().mockResolvedValue({ data: { text: `  ${text}  ` } }),
				});
				mammothExtractRawTextMock.mockResolvedValue({ value: text });
				PdfParseMock.mockImplementation(function () {
					return {
						getInfo: vi.fn().mockResolvedValue({ total: 1 }),
						getText: vi.fn().mockResolvedValue({ text }),
						destroy: vi.fn().mockResolvedValue(undefined),
					};
				});
				const filename = `intake.${extension}`;
				generateTextMock.mockResolvedValue({ output: [createExtractedPatient(filename)] });

				const response = await extractFile(extractFileRequest({ filenames: [filename] }));

				expect(response.status).toBe(200);
				expect(modelDocuments()).toEqual([
					{ id: filename, filename, content: extension === "png" ? text.trim() : text },
				]);
				expect(savedExtractions).toEqual([
					expect.objectContaining({ extractedData: [readyDocument(filename)] }),
				]);
			},
		);

		test("combines readable PDF text with OCR text from a scanned page", async () => {
			const readableText = "Patient Alex Synthetic, born 1990-01-01. ".repeat(5);
			createWorkerMock.mockResolvedValue({
				terminate: terminateMock,
				recognize: vi.fn().mockResolvedValue({ data: { text: "  Scanned patient information  " } }),
			});
			PdfParseMock.mockImplementation(function () {
				return {
					getInfo: vi.fn().mockResolvedValue({ total: 2 }),
					getText: vi.fn().mockImplementation(async ({ partial }) => ({
						text: partial[0] === 1 ? readableText : "",
					})),
					getScreenshot: vi.fn().mockResolvedValue({ pages: [{ data: Buffer.from("scan") }] }),
					destroy: vi.fn().mockResolvedValue(undefined),
				};
			});
			generateTextMock.mockResolvedValue({ output: [createExtractedPatient("mixed.pdf")] });

			const response = await extractFile(extractFileRequest({ filenames: ["mixed.pdf"] }));

			expect(response.status).toBe(200);
			expect(modelDocuments()).toEqual([
				{
					id: "mixed.pdf",
					filename: "mixed.pdf",
					content: `${readableText}\n\nScanned patient information`,
				},
			]);
		});

		test.each(["png", "docx", "pdf"])(
			"stores an unreadable %s as failed without exposing parser errors or losing a successful file",
			async (extension) => {
				const internalError = new Error("Private parser detail: /internal/patient-data");
				const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
				const destroyPdfMock = vi.fn().mockResolvedValue(undefined);
				createWorkerMock.mockResolvedValue({
					terminate: terminateMock,
					recognize: vi.fn().mockRejectedValue(internalError),
				});
				readFileMock.mockImplementation(async (key: string) => Buffer.from(key));
				mammothExtractRawTextMock.mockImplementation(async ({ buffer }: { buffer: Buffer }) => {
					if (buffer.toString().endsWith("unreadable.docx")) throw internalError;
					return { value: "Good patient information" };
				});
				PdfParseMock.mockImplementation(function () {
					return {
						getInfo: vi.fn().mockResolvedValue({ total: 1 }),
						getText: vi.fn().mockRejectedValue(internalError),
						destroy: destroyPdfMock,
					};
				});
				generateTextMock.mockResolvedValue({ output: [createExtractedPatient("readable.docx")] });
				const filename = `unreadable.${extension}`;

				try {
					const response = await extractFile(
						extractFileRequest({ filenames: [filename, "readable.docx"] }),
					);
					expect(response.status).toBe(200);
					expect(await response.json()).toEqual({
						status: "success",
						extractionId: expect.any(String),
						hasReadyDocument: true,
					});
					expect(modelDocuments()).toEqual([
						{ id: "readable.docx", filename: "readable.docx", content: "Good patient information" },
					]);
					expect(savedExtractions).toEqual([
						expect.objectContaining({
							extractedData: [
								{ documentId: filename, status: "failed", patient: null },
								readyDocument("readable.docx"),
							],
						}),
					]);
					if (extension === "pdf") {
						// Closing the external parser after a failed read is a resource-lifecycle contract.
						expect(destroyPdfMock).toHaveBeenCalled();
					}
				} finally {
					consoleErrorSpy.mockRestore();
				}
			},
		);

		test("stores unsupported files as failed while keeping a supported file ready", async () => {
			mammothExtractRawTextMock.mockResolvedValue({ value: "Good patient information" });
			generateTextMock.mockResolvedValue({ output: [createExtractedPatient("readable.docx")] });

			const response = await extractFile(
				extractFileRequest({ filenames: ["intake.txt", "readable.docx"] }),
			);

			expect(response.status).toBe(200);
			expect(savedExtractions).toEqual([
				expect.objectContaining({
					extractedData: [
						{ documentId: "intake.txt", status: "failed", patient: null },
						readyDocument("readable.docx"),
					],
				}),
			]);
		});

		test("rewrites only the retried failed documents in the same saved extraction", async () => {
			const savedPatient = { ...readyDocument("saved.docx"), status: "saved" };
			storedExtraction.extractedData = [
				savedPatient,
				{ documentId: "first.docx", status: "failed", patient: null },
				{ documentId: "second.docx", status: "failed", patient: null },
			];
			getPatientExtractionByIdMock.mockResolvedValue({
				id: "saved-extraction",
				createdBy: "owner-1",
				extractedData: structuredClone(storedExtraction.extractedData),
			});
			mammothExtractRawTextMock.mockResolvedValue({ value: "Patient information" });
			generateTextMock.mockResolvedValue({ output: [createExtractedPatient("first.docx")] });

			const response = await extractFile(
				extractFileRequest({
					filenames: ["first.docx", "second.docx"],
					extractionId: "saved-extraction",
				}),
			);

			expect(response.status).toBe(200);
			expect(await response.json()).toEqual({
				status: "success",
				extractionId: "saved-extraction",
				hasReadyDocument: true,
			});
			expect(getPatientExtractionByIdMock).toHaveBeenCalledWith("saved-extraction");
			expect(storedExtraction.extractedData).toEqual([
				savedPatient,
				readyDocument("first.docx"),
				{ documentId: "second.docx", status: "failed", patient: null },
			]);
			expect(savedExtractions).toEqual([]);
			expect(revalidateTagMock).toHaveBeenCalledWith(
				"patient-extraction-hospital-1-saved-extraction",
				{ expire: 0 },
			);
		});

		test("explains the retry cannot finish when the upload was removed while it was extracting", async () => {
			const failedDocument = { documentId: "first.docx", status: "failed", patient: null };
			storedExtraction.extractedData = [failedDocument];
			getPatientExtractionByIdMock.mockResolvedValue({
				id: "saved-extraction",
				createdBy: "owner-1",
				extractedData: [failedDocument],
			});
			mammothExtractRawTextMock.mockResolvedValue({ value: "Patient information" });
			generateTextMock.mockImplementation(async () => {
				storedExtraction.isDeleted = true;
				return { output: [createExtractedPatient("first.docx")] };
			});

			const response = await extractFile(
				extractFileRequest({ filenames: ["first.docx"], extractionId: "saved-extraction" }),
			);

			expect(generateTextMock).toHaveBeenCalled();
			expect(response.status).toBe(400);
			expect(await response.json()).toEqual({
				status: "invalid",
				error: "This review was already cleared.",
			});
			expect(storedExtraction.extractedData).toEqual([failedDocument]);
			expect(revalidateTagMock).not.toHaveBeenCalled();
		});

		test("returns the stored result without extracting again when the document is already ready", async () => {
			getPatientExtractionByIdMock.mockResolvedValue({
				id: "saved-extraction",
				createdBy: "owner-1",
				extractedData: [readyDocument("first.docx")],
			});

			const response = await extractFile(
				extractFileRequest({ filenames: ["first.docx"], extractionId: "saved-extraction" }),
			);

			expect(response.status).toBe(200);
			expect(await response.json()).toEqual({
				status: "success",
				extractionId: "saved-extraction",
				hasReadyDocument: true,
			});
			expect(createWorkerMock).not.toHaveBeenCalled();
			expect(generateTextMock).not.toHaveBeenCalled();
		});

		test("explains a retried document was already removed", async () => {
			getPatientExtractionByIdMock.mockResolvedValue({
				id: "saved-extraction",
				createdBy: "owner-1",
				extractedData: [readyDocument("other.docx")],
			});

			const response = await extractFile(
				extractFileRequest({ filenames: ["first.docx"], extractionId: "saved-extraction" }),
			);

			expect(response.status).toBe(400);
			expect(await response.json()).toEqual({
				status: "invalid",
				error: "This document was already removed.",
			});
			expect(generateTextMock).not.toHaveBeenCalled();
		});

		test("stores a flat list of extracted patients through the installed AI SDK", async () => {
			const ai = await vi.importActual<typeof import("ai")>("ai");
			const { MockLanguageModelV4 } = await import("ai/test");
			const patient = {
				documentId: "intake.docx",
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
			const payload = await response.json();
			const { documentId, ...extractedPatient } = patient;
			expect(savedExtractions).toEqual([
				expect.objectContaining({
					id: payload.extractionId,
					extractedData: [{ documentId, status: "ready", patient: extractedPatient }],
				}),
			]);
		});

		test.each(["../hospital-2/private.pdf", "..\\private.pdf", "C:\\private.pdf"])(
			"denies extraction of a supplied path %s",
			async (filename) => {
				const response = await extractFile(extractFileRequest({ filenames: [filename] }));
				expect(response.status).toBe(400);
				expect(readFileMock).not.toHaveBeenCalled();
				expect(createWorkerMock).not.toHaveBeenCalled();
			},
		);

		test("extracts only the signed-in member's own hospital upload", async () => {
			mammothExtractRawTextMock.mockResolvedValue({ value: "patient information" });
			generateTextMock.mockResolvedValue({ output: [createExtractedPatient("intake.docx")] });
			const response = await extractFile(extractFileRequest({ filenames: ["intake.docx"] }));
			expect(response.status).toBe(200);
			expect(readFileMock).toHaveBeenCalledWith("hospital-1/owner-1/intake.docx");
			expect(mammothExtractRawTextMock).toHaveBeenCalledWith({ buffer: expect.any(Buffer) });
			expect(savedExtractions).toEqual([
				expect.objectContaining({ organizationId: "hospital-1", createdBy: "owner-1" }),
			]);
		});

		test("extracts an uploaded patient document using its returned stored filename", async () => {
			const uploadedResponse = await uploadFile(fileRequest("original intake.docx"));
			expect(uploadedResponse.status).toBe(200);
			const [uploadedFile] = (await uploadedResponse.json()).files;
			readFileMock.mockResolvedValue(Buffer.from("patient information"));
			mammothExtractRawTextMock.mockImplementation(async ({ buffer }: { buffer: Buffer }) => ({
				value: buffer.toString(),
			}));
			generateTextMock.mockResolvedValue({
				output: [createExtractedPatient(uploadedFile.storedName)],
			});
			const response = await extractFile(
				extractFileRequest({ filenames: [uploadedFile.storedName] }),
			);
			expect(response.status).toBe(200);
			expect(modelDocuments()).toEqual([
				{
					id: uploadedFile.storedName,
					filename: uploadedFile.storedName,
					content: "patient information",
				},
			]);
			expect(savedExtractions).toEqual([
				expect.objectContaining({ extractedData: [readyDocument(uploadedFile.storedName)] }),
			]);
		});

		test.each([false, undefined])(
			"rejects extraction when email verification is %s",
			async (emailVerified) => {
				getSessionDataMock.mockResolvedValue({ user: { id: "owner-1", emailVerified } });
				const response = await extractFile(extractFileRequest({ filenames: ["intake.pdf"] }));
				expect(response.status).toBe(403);
				expect(await response.json()).toEqual({
					status: "failed",
					error: "Verify your email before extracting patient records.",
				});
				expect(readFileMock).not.toHaveBeenCalled();
				expect(createWorkerMock).not.toHaveBeenCalled();
				expect(generateTextMock).not.toHaveBeenCalled();
				expect(savedExtractions).toEqual([]);
			},
		);

		test("rejects signed-out requests before reading any files", async () => {
			getSessionDataMock.mockResolvedValue(null);

			const response = await extractFile(extractFileRequest({ filenames: ["intake.pdf"] }));

			expect(response.status).toBe(401);
			expect(await response.json()).toEqual({
				status: "failed",
				error: "Sign in to extract patient records.",
			});
			expect(readFileMock).not.toHaveBeenCalled();
			expect(generateTextMock).not.toHaveBeenCalled();
		});

		test("rejects members without a verified hospital before reading any files", async () => {
			getSessionDataMock.mockResolvedValue({ user: { id: "owner-1", emailVerified: true } });
			getOrganizationIdMock.mockResolvedValue(null);

			const response = await extractFile(extractFileRequest({ filenames: ["intake.pdf"] }));

			expect(response.status).toBe(403);
			expect(await response.json()).toEqual({
				status: "failed",
				error: "Your hospital must be verified before you can extract patient records.",
			});
			expect(readFileMock).not.toHaveBeenCalled();
			expect(generateTextMock).not.toHaveBeenCalled();
		});

		test("returns 400 when a verified member sends no filenames", async () => {
			getSessionDataMock.mockResolvedValue({ user: { id: "owner-1", emailVerified: true } });
			getOrganizationIdMock.mockResolvedValue("hospital-1");

			const response = await extractFile(extractFileRequest({}));

			expect(response.status).toBe(400);
			expect(await response.json()).toEqual({ status: "failed", error: "Missing file" });
			expect(readFileMock).not.toHaveBeenCalled();
			expect(generateTextMock).not.toHaveBeenCalled();
		});
	});
});
