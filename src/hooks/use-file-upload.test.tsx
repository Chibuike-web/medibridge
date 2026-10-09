import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { useFileUpload } from "./use-file-upload";

const { deleteUploadMock } = vi.hoisted(() => ({ deleteUploadMock: vi.fn() }));

vi.mock("@/features/patients/server/delete-patient-upload-action", () => ({
	deletePatientUploadAction: deleteUploadMock,
}));

const fetchMock = vi.fn();
const firstStoredName = "11111111-1111-4111-8111-111111111111.pdf";
const secondStoredName = "22222222-2222-4222-8222-222222222222.pdf";

function UploadHarness() {
	const { files, handleFiles, extractInfo, clearFile, uploadError } = useFileUpload();
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
			<button
				onClick={() =>
					void extractInfo(
						files.filter((file) => file.status === "extract-failed").map((file) => file.id),
					)
				}
			>
				Retry failed
			</button>
			{uploadError && <p role="alert">{uploadError}</p>}
			{files.map((file) => (
				<section key={file.id} aria-label={file.name}>
					<p>{file.name}</p>
					<p>
						{file.status === "extract-complete"
							? "Extracted"
							: file.status === "extract-failed"
								? "Extraction failed"
								: file.status === "upload-complete"
									? "Uploaded"
									: "Working"}
					</p>
					<button onClick={() => void clearFile(file.id)}>Remove</button>
				</section>
			))}
		</>
	);
}

function uploadedFile(name: string, storedName: string) {
	return {
		id: storedName.slice(0, -4),
		name,
		storedName,
		size: 8,
		url: `patient-uploads/hospital-1/member-1/${storedName}`,
	};
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
		vi.stubGlobal("fetch", fetchMock);
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.unstubAllGlobals();
	});

	test("keeps equal display names separate and retries only the failed stored document", async () => {
		fetchMock.mockResolvedValueOnce(
			Response.json({
				status: "success",
				files: [
					uploadedFile("report.pdf", firstStoredName),
					uploadedFile("report.pdf", secondStoredName),
				],
			}),
		);
		render(<UploadHarness />);
		await selectFiles([new File(["first"], "report.pdf"), new File(["second"], "report.pdf")]);
		const records = screen.getAllByRole("region", { name: "report.pdf" });
		expect(records).toHaveLength(2);
		for (const record of records) expect(within(record).getByText("Uploaded")).toBeVisible();

		fetchMock.mockResolvedValueOnce(
			Response.json({
				status: "success",
				result: [
					{ name: firstStoredName, status: "success" },
					{ name: secondStoredName, status: "failed" },
				],
				extracted: [],
			}),
		);
		await act(async () => {
			fireEvent.click(screen.getByRole("button", { name: "Extract all" }));
		});
		expect(extractionRequests()).toEqual([[firstStoredName, secondStoredName]]);
		expect(within(records[0]).getByText("Extracted")).toBeVisible();
		expect(within(records[1]).getByText("Extraction failed")).toBeVisible();

		fetchMock.mockResolvedValueOnce(
			Response.json({
				status: "success",
				result: [{ name: secondStoredName, status: "success" }],
				extracted: [],
			}),
		);
		await act(async () => {
			fireEvent.click(screen.getByRole("button", { name: "Retry failed" }));
		});
		expect(extractionRequests()).toEqual([[firstStoredName, secondStoredName], [secondStoredName]]);
		for (const record of records) expect(within(record).getByText("Extracted")).toBeVisible();
	});

	test("uploads a selected JPEG file without showing an invalid file type error", async () => {
		const uploaded = uploadedFile("scan.jpeg", "33333333-3333-4333-8333-333333333333.jpeg");
		fetchMock.mockResolvedValueOnce(Response.json({ status: "success", files: [uploaded] }));
		render(<UploadHarness />);

		await selectFiles([new File(["contents"], "scan.jpeg", { type: "image/jpeg" })]);

		expect(
			within(screen.getByRole("region", { name: "scan.jpeg" })).getByText("Uploaded"),
		).toBeVisible();
		expect(screen.queryByRole("alert")).not.toBeInTheDocument();
	});

	test("removes the generated upload URL and keeps the visible file when deletion fails", async () => {
		const uploaded = uploadedFile("original report.pdf", firstStoredName);
		fetchMock.mockResolvedValueOnce(Response.json({ status: "success", files: [uploaded] }));
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
