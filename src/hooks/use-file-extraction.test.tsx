import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import type { SelectedFile } from "@/lib/types/upload";
import { useFileExtraction } from "./use-file-extraction";

const fetchMock = vi.fn();

function uploadedFile(clientId: string, name: string): SelectedFile {
	const browserFile = new File(["patient information"], name, { type: "application/pdf" });
	return {
		clientId,
		browserFile,
		name,
		size: browserFile.size,
		status: "upload-complete",
		id: `saved-${clientId}`,
		storedName: `saved-${clientId}.pdf`,
		url: `patient-uploads/hospital/member/saved-${clientId}.pdf`,
		type: browserFile.type,
	};
}

function ExtractionHarness({ files }: { files: SelectedFile[] }) {
	const { fileExtractions, extractionIds, extractInfo, extractError, isExtracting } =
		useFileExtraction(files);
	return (
		<>
			<button disabled={isExtracting} onClick={() => void extractInfo()}>
				Extract
			</button>
			{extractError && <p role="alert">{extractError}</p>}
			{files.map((file) => {
				const extraction = fileExtractions[file.clientId];
				return (
					<section key={file.clientId} aria-label={file.name}>
						<p>
							{extraction?.status === "extract-complete"
								? "Extracted"
								: extraction?.status === "extract-failed"
									? "Extraction failed"
									: extraction?.status === "extracting"
										? "Extracting"
										: file.status === "upload-complete"
											? "Uploaded"
											: file.status === "upload-failed"
												? "Upload failed"
												: "Uploading"}
						</p>
						{extraction?.status === "extract-failed" && (
							<button disabled={isExtracting} onClick={() => void extractInfo([file.clientId])}>
								Try again
							</button>
						)}
					</section>
				);
			})}
			{extractionIds.map((id) => (
				<a key={id} href={`/dashboard/review-extracted-info?extractionId=${id}`}>
					Review {id}
				</a>
			))}
		</>
	);
}

async function extract() {
	await act(async () => {
		fireEvent.click(screen.getByRole("button", { name: "Extract" }));
	});
}

describe("independent file extraction", () => {
	beforeEach(() => {
		fetchMock.mockReset();
		vi.stubGlobal("fetch", fetchMock);
	});

	afterEach(() => {
		vi.unstubAllGlobals();
		vi.restoreAllMocks();
	});

	test("extracts only uploaded documents and leaves unfinished uploads alone", async () => {
		const files: SelectedFile[] = [
			uploadedFile("ready", "ready.pdf"),
			{
				clientId: "pending",
				browserFile: new File(["pending"], "pending.pdf"),
				name: "pending.pdf",
				size: 7,
				status: "uploading",
			},
			{
				clientId: "failed",
				browserFile: new File(["failed"], "failed.pdf"),
				name: "failed.pdf",
				size: 6,
				status: "upload-failed",
			},
		];
		fetchMock.mockResolvedValueOnce(
			Response.json({
				status: "success",
				extractionId: "ready-extraction",
				result: [{ name: "saved-ready.pdf", status: "success" }],
			}),
		);
		render(<ExtractionHarness files={files} />);
		expect(
			within(screen.getByRole("region", { name: "pending.pdf" })).getByText("Uploading"),
		).toBeVisible();
		expect(
			within(screen.getByRole("region", { name: "failed.pdf" })).getByText("Upload failed"),
		).toBeVisible();
		await extract();

		expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ filenames: ["saved-ready.pdf"] });
		expect(
			within(screen.getByRole("region", { name: "ready.pdf" })).getByText("Extracted"),
		).toBeVisible();
		expect(
			within(screen.getByRole("region", { name: "pending.pdf" })).getByText("Uploading"),
		).toBeVisible();
		expect(
			within(screen.getByRole("region", { name: "failed.pdf" })).getByText("Upload failed"),
		).toBeVisible();
		expect(screen.getByRole("link", { name: "Review ready-extraction" })).toBeVisible();
	});

	test("shows a plain error after a network failure and lets that document be retried", async () => {
		vi.spyOn(console, "error").mockImplementation(() => {});
		fetchMock.mockRejectedValueOnce(new Error("private network details"));
		render(<ExtractionHarness files={[uploadedFile("ready", "ready.pdf")]} />);
		expect(screen.getByText("Uploaded")).toBeVisible();
		await extract();
		expect(screen.getByRole("alert")).toHaveTextContent(
			"We couldn’t extract patient information. Please try again.",
		);
		expect(screen.getByText("Extraction failed")).toBeVisible();
		expect(screen.queryByRole("link")).not.toBeInTheDocument();

		fetchMock.mockResolvedValueOnce(
			Response.json({
				status: "success",
				extractionId: "retry-extraction",
				result: [{ name: "saved-ready.pdf", status: "success" }],
			}),
		);
		await act(async () => {
			fireEvent.click(screen.getByRole("button", { name: "Try again" }));
		});
		expect(screen.getByText("Extracted")).toBeVisible();
		expect(screen.queryByRole("alert")).not.toBeInTheDocument();
		expect(screen.getByRole("link", { name: "Review retry-extraction" })).toBeVisible();
	});

	test("marks a missing document result as failed instead of leaving extraction running", async () => {
		fetchMock.mockResolvedValueOnce(
			Response.json({
				status: "success",
				extractionId: "saved-extraction",
				result: [{ name: "saved-first.pdf", status: "success" }],
			}),
		);
		render(
			<ExtractionHarness
				files={[uploadedFile("first", "first.pdf"), uploadedFile("second", "second.pdf")]}
			/>,
		);
		await extract();
		expect(
			within(screen.getByRole("region", { name: "first.pdf" })).getByText("Extracted"),
		).toBeVisible();
		expect(
			within(screen.getByRole("region", { name: "second.pdf" })).getByText("Extraction failed"),
		).toBeVisible();
		expect(
			within(screen.getByRole("region", { name: "second.pdf" })).getByRole("button", {
				name: "Try again",
			}),
		).toBeEnabled();
		expect(screen.getByRole("button", { name: "Extract" })).toBeEnabled();
	});

	test("removes stale review links when a document is replaced by a different upload with the same name", async () => {
		fetchMock.mockResolvedValueOnce(
			Response.json({
				status: "success",
				extractionId: "old-extraction",
				result: [{ name: "saved-old.pdf", status: "success" }],
			}),
		);
		const { rerender } = render(<ExtractionHarness files={[uploadedFile("old", "record.pdf")]} />);
		await extract();
		expect(screen.getByRole("link", { name: "Review old-extraction" })).toBeVisible();
		expect(screen.getByText("Extracted")).toBeVisible();

		rerender(<ExtractionHarness files={[uploadedFile("new", "record.pdf")]} />);
		expect(screen.queryByRole("link")).not.toBeInTheDocument();
		expect(screen.getByText("Uploaded")).toBeVisible();
		fetchMock.mockResolvedValueOnce(
			Response.json({
				status: "success",
				extractionId: "new-extraction",
				result: [{ name: "saved-new.pdf", status: "success" }],
			}),
		);
		await extract();
		expect(screen.getByRole("link", { name: "Review new-extraction" })).toBeVisible();
		expect(screen.queryByRole("link", { name: "Review old-extraction" })).not.toBeInTheDocument();
	});
});
