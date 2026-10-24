import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { useFileUpload } from "./use-file-upload";
import { useFileExtraction } from "./use-file-extraction";
import { FileUploadCard } from "@/components/file-upload-card";

const { deleteUploadMock, pushMock } = vi.hoisted(() => ({
	deleteUploadMock: vi.fn(),
	pushMock: vi.fn(),
}));

vi.mock("@/features/patients/server/delete-patient-upload-action", () => ({
	deletePatientUploadAction: deleteUploadMock,
}));
vi.mock("@/features/patients/server/remove-extraction-document-action", () => ({
	removeExtractionDocumentAction: vi.fn(),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: pushMock }) }));

const fetchMock = vi.fn();
const firstStoredName = "11111111-1111-4111-8111-111111111111.pdf";
const secondStoredName = "22222222-2222-4222-8222-222222222222.pdf";

function UploadHarness() {
	const { files, handleFiles, clearFile, uploadError } = useFileUpload();
	const { extractInfo } = useFileExtraction(files);
	return (
		<>
			<label>
				Patient records
				<input
					type="file"
					multiple
					onChange={(event) => {
						void handleFiles(Array.from(event.target.files ?? []));
					}}
				/>
			</label>
			<button onClick={() => void extractInfo()}>Extract all</button>
			{uploadError && <p role="alert">{uploadError}</p>}
			{files.map((file) => (
				<section key={file.clientId} aria-label={file.name}>
					<p>{file.name}</p>
					<p>
						{file.status === "upload-complete"
							? "Uploaded"
							: file.status === "upload-failed"
								? "Upload failed"
								: "Working"}
					</p>
					<button onClick={() => void clearFile(file.clientId)}>Remove</button>
				</section>
			))}
		</>
	);
}

function UploadRetryHarness() {
	const { files, handleFiles, retryUpload, clearFile, uploadError } = useFileUpload();
	return (
		<>
			<label>
				Patient records
				<input
					type="file"
					multiple
					onChange={async (event) => {
						await handleFiles(Array.from(event.target.files ?? []));
					}}
				/>
			</label>
			{uploadError && <p role="alert">{uploadError}</p>}
			{files.map((file) => (
				<section key={file.clientId} aria-label={file.name}>
					<FileUploadCard
						id={file.clientId}
						name={file.name}
						size={file.size}
						extension="pdf"
						uploadStatus={file.status}
						onRetry={retryUpload}
						onRemove={async (clientId) => {
							if (clientId) await clearFile(clientId);
						}}
					/>
				</section>
			))}
		</>
	);
}

function uploadedFile(name: string, storedName: string) {
	return {
		status: "upload-complete",
		id: storedName.slice(0, -4),
		name,
		storedName,
		type: "application/pdf",
		size: 8,
		url: `patient-uploads/hospital-1/member-1/${storedName}`,
	};
}

function respondToUpload(files: ReturnType<typeof uploadedFile>[]) {
	fetchMock.mockImplementationOnce(async (_url, { body }: { body: string }) => {
		const clientIds = JSON.parse(body).files.map((file: { clientId: string }) => file.clientId);
		return Response.json({
			status: "success",
			files: files.map((file, index) => ({
				...file,
				signedUrl: `https://storage.test/${file.storedName}`,
				clientId: clientIds[index],
			})),
		});
	});
}

async function selectFiles(files: File[]) {
	fireEvent.change(screen.getByLabelText("Patient records"), { target: { files } });
	await act(async () => {
		await vi.advanceTimersByTimeAsync(2000);
	});
}

function extractionRequests() {
	return fetchMock.mock.calls
		.filter(([url]) => url === "/api/extract-file")
		.map(([, options]) => JSON.parse(options.body).filenames);
}

describe("Patient uploads with generated storage names", () => {
	beforeEach(() => {
		vi.useFakeTimers();
		fetchMock.mockReset();
		deleteUploadMock.mockReset();
		pushMock.mockReset();
		vi.stubGlobal("fetch", async (url: string, options: RequestInit) => {
			if (url.startsWith("https://storage.test/"))
				return new Response(null, { status: url.includes("/failed/") ? 500 : 200 });
			const response = await fetchMock(url, options);
			if (url !== "/api/file-upload" || !response?.ok) return response;
			const data = await response.clone().json();
			if (data.status !== "success" || !Array.isArray(data.files)) return response;
			return Response.json({
				...data,
				files: data.files.map((file: { clientId: string; status?: string }) => ({
					...file,
					signedUrl: `https://storage.test/${file.status === "upload-failed" ? "failed" : "complete"}/${file.clientId}`,
				})),
			});
		});
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.unstubAllGlobals();
	});

	test("keeps equal display names separate and extracts each stored document", async () => {
		respondToUpload([
			uploadedFile("report.pdf", firstStoredName),
			uploadedFile("report.pdf", secondStoredName),
		]);
		render(<UploadHarness />);
		await selectFiles([new File(["first"], "report.pdf"), new File(["second"], "report.pdf")]);
		const records = screen.getAllByRole("region", { name: "report.pdf" });
		expect(records).toHaveLength(2);
		for (const record of records) expect(within(record).getByText("Uploaded")).toBeVisible();

		fetchMock.mockResolvedValueOnce(
			Response.json({
				status: "success",
				extractionId: "saved-extraction",
				hasReadyDocument: true,
			}),
		);
		await act(async () => {
			fireEvent.click(screen.getByRole("button", { name: "Extract all" }));
		});
		expect(extractionRequests()).toEqual([[firstStoredName, secondStoredName]]);
		expect(pushMock).toHaveBeenCalledWith(
			"/dashboard/review-extracted-info?extractionId=saved-extraction",
		);
	});

	test("uploads a selected JPEG file without showing an invalid file type error", async () => {
		const uploaded = uploadedFile("scan.jpeg", "33333333-3333-4333-8333-333333333333.jpeg");
		respondToUpload([uploaded]);
		render(<UploadHarness />);

		await selectFiles([new File(["contents"], "scan.jpeg", { type: "image/jpeg" })]);

		expect(
			within(screen.getByRole("region", { name: "scan.jpeg" })).getByText("Uploaded"),
		).toBeVisible();
		expect(screen.queryByRole("alert")).not.toBeInTheDocument();
	});

	test("matches mixed upload results to their cards by client ID even when results arrive in another order", async () => {
		fetchMock.mockImplementationOnce(async (_url, { body }: { body: string }) => {
			const clientIds = JSON.parse(body).files.map((file: { clientId: string }) => file.clientId);
			return Response.json({
				status: "success",
				files: [
					{
						clientId: clientIds[1],
						name: "failed.pdf",
						status: "upload-failed",
					},
					{ ...uploadedFile("saved.pdf", firstStoredName), clientId: clientIds[0] },
				],
			});
		});
		render(<UploadHarness />);
		await selectFiles([new File(["saved"], "saved.pdf"), new File(["failed"], "failed.pdf")]);
		const savedCard = screen.getByRole("region", { name: "saved.pdf" });
		const failedCard = screen.getByRole("region", { name: "failed.pdf" });
		expect(within(savedCard).getByText("Uploaded")).toBeVisible();
		expect(within(failedCard).getByText("Upload failed")).toBeVisible();

		fireEvent.click(within(failedCard).getByRole("button", { name: "Remove" }));
		expect(screen.queryByRole("region", { name: "failed.pdf" })).not.toBeInTheDocument();
		expect(within(savedCard).getByText("Uploaded")).toBeVisible();
		expect(deleteUploadMock).not.toHaveBeenCalled();
	});

	test("preserves an earlier uploaded card when a later request fails", async () => {
		respondToUpload([uploadedFile("saved.pdf", firstStoredName)]);
		render(<UploadHarness />);
		await selectFiles([new File(["saved"], "saved.pdf")]);
		const savedCard = screen.getByRole("region", { name: "saved.pdf" });
		expect(within(savedCard).getByText("Uploaded")).toBeVisible();

		fetchMock.mockResolvedValueOnce(
			Response.json({ status: "failed", error: "Upload unavailable." }, { status: 500 }),
		);
		await selectFiles([new File(["failed"], "failed.pdf")]);
		expect(within(savedCard).getByText("Uploaded")).toBeVisible();
		expect(
			within(screen.getByRole("region", { name: "failed.pdf" })).getByText("Upload failed"),
		).toBeVisible();
		expect(screen.getByRole("alert")).toHaveTextContent("Upload unavailable.");
	});

	test("removes the generated upload URL and keeps the visible file when deletion fails", async () => {
		const uploaded = uploadedFile("original report.pdf", firstStoredName);
		respondToUpload([uploaded]);
		render(<UploadHarness />);
		await selectFiles([new File(["contents"], uploaded.name)]);
		const record = screen.getByRole("region", { name: uploaded.name });
		expect(within(record).getByText("Uploaded")).toBeVisible();

		deleteUploadMock.mockResolvedValueOnce({ status: "failed", error: "Unable to delete file." });
		fireEvent.click(within(record).getByRole("button", { name: "Remove" }));
		await act(async () => {
			await vi.advanceTimersByTimeAsync(5000);
		});
		expect(deleteUploadMock).toHaveBeenCalledWith(uploaded.url);
		expect(screen.getByRole("alert")).toHaveTextContent("Unable to delete file.");
		expect(within(record).getByText("Uploaded")).toBeVisible();

		deleteUploadMock.mockResolvedValueOnce({ status: "success" });
		fireEvent.click(within(record).getByRole("button", { name: "Remove" }));
		await act(async () => {
			await vi.advanceTimersByTimeAsync(5000);
		});
		expect(screen.queryByRole("region", { name: uploaded.name })).not.toBeInTheDocument();
	});
});

describe("retrying failed patient uploads", () => {
	beforeEach(() => {
		vi.useFakeTimers();
		fetchMock.mockReset();
		deleteUploadMock.mockReset();
		vi.stubGlobal("fetch", async (url: string, options: RequestInit) => {
			if (url.startsWith("https://storage.test/"))
				return new Response(null, { status: url.includes("/failed/") ? 500 : 200 });
			const response = await fetchMock(url, options);
			if (url !== "/api/file-upload" || !response?.ok) return response;
			const data = await response.clone().json();
			if (data.status !== "success" || !Array.isArray(data.files)) return response;
			return Response.json({
				...data,
				files: data.files.map((file: { clientId: string; status?: string }) => ({
					...file,
					signedUrl: `https://storage.test/${file.status === "upload-failed" ? "failed" : "complete"}/${file.clientId}`,
				})),
			});
		});
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.unstubAllGlobals();
		vi.restoreAllMocks();
	});

	test("retries the selected failed file in its existing card and preserves successful uploads", async () => {
		let failedClientId: FormDataEntryValue | null = null;
		fetchMock.mockImplementationOnce(async (_url, { body }: { body: string }) => {
			const clientIds = JSON.parse(body).files.map((file: { clientId: string }) => file.clientId);
			failedClientId = clientIds[1];
			return Response.json({
				status: "success",
				files: [
					{ ...uploadedFile("saved.pdf", firstStoredName), clientId: clientIds[0] },
					{ name: "failed.pdf", clientId: failedClientId, status: "upload-failed" },
				],
			});
		});
		render(<UploadRetryHarness />);
		await selectFiles([
			new File(["saved"], "saved.pdf", { type: "application/pdf" }),
			new File(["failed contents"], "failed.pdf", { type: "application/pdf" }),
		]);
		const savedCard = screen.getByRole("region", { name: "saved.pdf" });
		const failedCard = screen.getByRole("region", { name: "failed.pdf" });
		expect(within(savedCard).getByText("Upload complete")).toBeVisible();
		expect(within(failedCard).getByText("Upload failed")).toBeVisible();

		fetchMock.mockImplementationOnce(async (url, { body }: { body: string }) => {
			expect(url).toBe("/api/file-upload");
			expect(JSON.parse(body).files.map((file: { clientId: string }) => file.clientId)).toEqual([
				failedClientId,
			]);
			expect(JSON.parse(body).files).toHaveLength(1);
			expect(JSON.parse(body).files[0]).toMatchObject({
				name: "failed.pdf",
				size: "failed contents".length,
				type: "application/pdf",
			});
			return Response.json({
				status: "success",
				files: [{ ...uploadedFile("failed.pdf", secondStoredName), clientId: failedClientId }],
			});
		});
		await act(async () => {
			fireEvent.click(within(failedCard).getByRole("button", { name: "Try again" }));
		});

		expect(within(failedCard).getByText("Upload complete")).toBeVisible();
		expect(within(savedCard).getByText("Upload complete")).toBeVisible();
		expect(screen.getAllByRole("region", { name: "failed.pdf" })).toEqual([failedCard]);
		expect(within(failedCard).queryByRole("button", { name: "Try again" })).not.toBeInTheDocument();
	});

	test.each([
		{ scenario: "the request is rejected", failedStatus: "request", error: "Upload unavailable." },
		{
			scenario: "the file fails again",
			failedStatus: "file",
			error: "We couldn’t upload this file. Please try again.",
		},
		{
			scenario: "the saved file is missing from the response",
			failedStatus: "missing",
			error: "We couldn’t upload this file. Please try again.",
		},
	])(
		"keeps the failed file available for another retry when $scenario",
		async ({ failedStatus, error }) => {
			fetchMock.mockResolvedValueOnce(
				Response.json({ status: "failed", error: "Initial failure." }, { status: 503 }),
			);
			render(<UploadRetryHarness />);
			await selectFiles([new File(["contents"], "failed.pdf")]);
			const failedCard = screen.getByRole("region", { name: "failed.pdf" });
			expect(within(failedCard).getByText("Upload failed")).toBeVisible();

			fetchMock.mockImplementationOnce(async (_url, { body }: { body: string }) => {
				if (failedStatus === "request")
					return Response.json({ status: "failed", error }, { status: 503 });
				return Response.json({
					status: "success",
					files:
						failedStatus === "file"
							? [
									{
										clientId: JSON.parse(body).files[0].clientId,
										name: "failed.pdf",
										status: "upload-failed",
									},
								]
							: [],
				});
			});
			await act(async () => {
				fireEvent.click(within(failedCard).getByRole("button", { name: "Try again" }));
			});
			expect(screen.getByRole("alert")).toHaveTextContent(error);
			expect(within(failedCard).getByText("Upload failed")).toBeVisible();
			expect(within(failedCard).getByRole("button", { name: "Try again" })).toBeEnabled();

			respondToUpload([uploadedFile("failed.pdf", firstStoredName)]);
			await act(async () => {
				fireEvent.click(within(failedCard).getByRole("button", { name: "Try again" }));
			});
			expect(within(failedCard).getByText("Upload complete")).toBeVisible();
			expect(screen.queryByRole("alert")).not.toBeInTheDocument();
		},
	);

	test("returns a fixed message on connection loss and allows a later successful retry", async () => {
		fetchMock.mockResolvedValueOnce(
			Response.json({ status: "failed", error: "Initial failure." }, { status: 503 }),
		);
		render(<UploadRetryHarness />);
		await selectFiles([new File(["contents"], "failed.pdf")]);
		const failedCard = screen.getByRole("region", { name: "failed.pdf" });
		expect(within(failedCard).getByText("Upload failed")).toBeVisible();
		vi.spyOn(console, "error").mockImplementation(() => {});
		fetchMock.mockRejectedValueOnce(new Error("Private network details"));
		await act(async () => {
			fireEvent.click(within(failedCard).getByRole("button", { name: "Try again" }));
		});
		expect(screen.getByRole("alert")).toHaveTextContent(
			"We couldn’t upload this file. Please try again.",
		);
		expect(screen.queryByText(/Private network details/)).not.toBeInTheDocument();
		expect(within(failedCard).getByText("Upload failed")).toBeVisible();

		respondToUpload([uploadedFile("failed.pdf", firstStoredName)]);
		await act(async () => {
			fireEvent.click(within(failedCard).getByRole("button", { name: "Try again" }));
		});
		expect(within(failedCard).getByText("Upload complete")).toBeVisible();
	});

	test("shows uploading and sends only one retry while the response is pending", async () => {
		fetchMock.mockResolvedValueOnce(
			Response.json({ status: "failed", error: "Initial failure." }, { status: 503 }),
		);
		render(<UploadRetryHarness />);
		await selectFiles([new File(["contents"], "failed.pdf")]);
		const failedCard = screen.getByRole("region", { name: "failed.pdf" });
		expect(within(failedCard).getByText("Upload failed")).toBeVisible();
		let completeRetry!: (response: Response) => void;
		let retryClientId: FormDataEntryValue | null = null;
		fetchMock.mockImplementationOnce((_url, { body }: { body: string }) => {
			retryClientId = JSON.parse(body).files[0].clientId;
			return new Promise<Response>((resolve) => {
				completeRetry = resolve;
			});
		});
		const retryButton = within(failedCard).getByRole("button", { name: "Try again" });
		act(() => {
			fireEvent.click(retryButton);
			fireEvent.click(retryButton);
		});
		expect(within(failedCard).getByText("Uploading...")).toBeVisible();
		expect(within(failedCard).queryByRole("button", { name: "Try again" })).not.toBeInTheDocument();
		expect(fetchMock).toHaveBeenCalledTimes(2); // Initial upload and one retry.
		await act(async () => {
			completeRetry(
				Response.json({
					status: "success",
					files: [{ ...uploadedFile("failed.pdf", firstStoredName), clientId: retryClientId }],
				}),
			);
		});
		expect(within(failedCard).getByText("Upload complete")).toBeVisible();
	});
});
