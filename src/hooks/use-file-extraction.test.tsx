import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import type { SelectedFile } from "@/lib/types/upload";
import { useFileExtraction } from "./use-file-extraction";

const { pushMock } = vi.hoisted(() => ({ pushMock: vi.fn() }));

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: pushMock }) }));

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
	const { extractInfo, extractError, isExtracting } = useFileExtraction(files);
	return (
		<>
			<button disabled={isExtracting} onClick={() => void extractInfo()}>
				Extract
			</button>
			{extractError && <p role="alert">{extractError}</p>}
		</>
	);
}

async function extract() {
	await act(async () => {
		fireEvent.click(screen.getByRole("button", { name: "Extract" }));
	});
}

describe("file extraction", () => {
	beforeEach(() => {
		fetchMock.mockReset();
		pushMock.mockReset();
		vi.stubGlobal("fetch", fetchMock);
	});

	afterEach(() => {
		vi.unstubAllGlobals();
		vi.restoreAllMocks();
	});

	test("extracts only uploaded documents and opens the saved extraction for review", async () => {
		const files: SelectedFile[] = [
			uploadedFile("first", "first.pdf"),
			uploadedFile("second", "second.pdf"),
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
				extractionId: "saved-extraction",
				hasReadyDocument: true,
			}),
		);
		render(<ExtractionHarness files={files} />);
		await extract();

		expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
			filenames: ["saved-first.pdf", "saved-second.pdf"],
		});
		expect(pushMock).toHaveBeenCalledWith(
			"/dashboard/review-extracted-info?extractionId=saved-extraction",
		);
		expect(screen.getByRole("button", { name: "Extract" })).toBeDisabled();
	});

	test("shows the server error and lets the user extract again when nothing was saved", async () => {
		fetchMock.mockResolvedValueOnce(
			Response.json(
				{
					status: "failed",
					error: "We couldn’t save the extracted information. Please try again.",
				},
				{ status: 500 },
			),
		);
		render(<ExtractionHarness files={[uploadedFile("ready", "ready.pdf")]} />);
		await extract();
		expect(screen.getByRole("alert")).toHaveTextContent(
			"We couldn’t save the extracted information. Please try again.",
		);
		expect(pushMock).not.toHaveBeenCalled();

		fetchMock.mockResolvedValueOnce(
			Response.json({
				status: "success",
				extractionId: "saved-extraction",
				hasReadyDocument: true,
			}),
		);
		await extract();
		expect(screen.queryByRole("alert")).not.toBeInTheDocument();
		expect(pushMock).toHaveBeenCalledWith(
			"/dashboard/review-extracted-info?extractionId=saved-extraction",
		);
	});

	test("retries documents that all failed in the same saved extraction", async () => {
		fetchMock.mockResolvedValueOnce(
			Response.json({
				status: "success",
				extractionId: "saved-extraction",
				hasReadyDocument: false,
			}),
		);
		render(<ExtractionHarness files={[uploadedFile("ready", "ready.pdf")]} />);
		await extract();
		expect(pushMock).not.toHaveBeenCalled();
		expect(screen.getByRole("button", { name: "Extract" })).toBeEnabled();

		fetchMock.mockResolvedValueOnce(
			Response.json({
				status: "success",
				extractionId: "saved-extraction",
				hasReadyDocument: true,
			}),
		);
		await extract();
		expect(JSON.parse(fetchMock.mock.lastCall![1].body)).toEqual({
			filenames: ["saved-ready.pdf"],
			extractionId: "saved-extraction",
		});
		expect(pushMock).toHaveBeenCalledWith(
			"/dashboard/review-extracted-info?extractionId=saved-extraction",
		);
	});

	test("shows a plain error instead of network details when the request fails", async () => {
		vi.spyOn(console, "error").mockImplementation(() => {});
		fetchMock.mockRejectedValueOnce(new Error("private network details"));
		render(<ExtractionHarness files={[uploadedFile("ready", "ready.pdf")]} />);
		await extract();
		expect(screen.getByRole("alert")).toHaveTextContent(
			"We couldn’t extract patient information. Please try again.",
		);
		expect(screen.getByRole("alert")).not.toHaveTextContent("private network details");
		expect(screen.getByRole("button", { name: "Extract" })).toBeEnabled();
		expect(pushMock).not.toHaveBeenCalled();
	});
});
