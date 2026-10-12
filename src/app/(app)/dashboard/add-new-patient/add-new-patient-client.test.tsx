import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { AddNewPatientClient } from "./add-new-patient-client";
import { deletePatientUploadAction } from "@/features/patients/server/delete-patient-upload-action";

vi.mock("@/features/patients/server/delete-patient-upload-action", () => ({
	deletePatientUploadAction: vi.fn(),
}));

const fetchMock = vi.fn();
const firstStoredName = "11111111-1111-4111-8111-111111111111.pdf";
const secondStoredName = "22222222-2222-4222-8222-222222222222.pdf";

async function uploadRecords() {
	fetchMock.mockImplementationOnce(async (_url, { body }: { body: FormData }) => {
		const clientIds = body.getAll("clientId");
		return Response.json({
			status: "success",
			files: [firstStoredName, secondStoredName].map((storedName, index) => ({
				clientId: clientIds[index],
				status: "upload-complete",
				id: storedName.slice(0, -4),
				name: `record-${index + 1}.pdf`,
				storedName,
				size: 8,
				type: "application/pdf",
				url: `patient-uploads/hospital-1/member-1/${storedName}`,
			})),
		});
	});
	render(<AddNewPatientClient />);
	fireEvent.change(screen.getByLabelText("Choose files or drag and drop them here."), {
		target: { files: [new File(["first"], "record-1.pdf"), new File(["second"], "record-2.pdf")] },
	});
	await act(async () => {
		await vi.advanceTimersByTimeAsync(2000);
	});
	expect(screen.getAllByText("Upload complete")).toHaveLength(2);
}

async function extractRecords(response: Response) {
	fetchMock.mockResolvedValueOnce(response);
	fireEvent.click(screen.getByRole("button", { name: "Extract Information" }));
	await act(async () => {
		fireEvent.click(screen.getByRole("button", { name: "Start Extraction" }));
	});
}

describe("continue to review saved patient extractions", () => {
	beforeEach(() => {
		vi.useFakeTimers();
		fetchMock.mockReset();
		vi.mocked(deletePatientUploadAction).mockReset();
		vi.stubGlobal("fetch", fetchMock);
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.unstubAllGlobals();
		vi.restoreAllMocks();
	});

	test("links to the saved extraction once every uploaded document succeeds", async () => {
		await uploadRecords();
		expect(screen.queryByRole("link", { name: "Continue" })).not.toBeInTheDocument();
		await extractRecords(
			Response.json({
				status: "success",
				extractionId: "saved-extraction",
				result: [firstStoredName, secondStoredName].map((name) => ({ name, status: "success" })),
			}),
		);

		expect(screen.getByText("record-1.pdf")).toBeVisible();
		expect(screen.getByText("record-2.pdf")).toBeVisible();
		expect(screen.queryByText("Extraction complete")).not.toBeInTheDocument();
		expect(screen.getByRole("link", { name: "Continue" })).toHaveAttribute(
			"href",
			"/dashboard/review-extracted-info?extractionId=saved-extraction",
		);
	});

	test("keeps earlier successful records in the review link after retrying a failed document", async () => {
		await uploadRecords();
		await extractRecords(
			Response.json({
				status: "success",
				extractionId: "first-extraction",
				result: [
					{ name: firstStoredName, status: "success" },
					{ name: secondStoredName, status: "failed" },
				],
			}),
		);
		expect(screen.getByText("record-1.pdf")).toBeVisible();
		expect(screen.queryByText("Extraction complete")).not.toBeInTheDocument();
		expect(screen.getByText("Extraction failed")).toBeVisible();
		expect(screen.queryByRole("link", { name: "Continue" })).not.toBeInTheDocument();

		fetchMock.mockResolvedValueOnce(
			Response.json({
				status: "success",
				extractionId: "retry-extraction",
				result: [{ name: secondStoredName, status: "success" }],
			}),
		);
		await act(async () => {
			fireEvent.click(screen.getByRole("button", { name: "Try again" }));
		});

		expect(screen.getByText("record-1.pdf")).toBeVisible();
		expect(screen.getByText("record-2.pdf")).toBeVisible();
		expect(screen.queryByText("Extraction complete")).not.toBeInTheDocument();
		expect(screen.getByRole("link", { name: "Continue" })).toHaveAttribute(
			"href",
			"/dashboard/review-extracted-info?extractionId=first-extraction&extractionId=retry-extraction",
		);
	});

	test("keeps review unavailable when successful results arrive without a saved extraction ID", async () => {
		await uploadRecords();
		await extractRecords(
			Response.json({
				status: "success",
				result: [firstStoredName, secondStoredName].map((name) => ({ name, status: "success" })),
			}),
		);

		expect(screen.getByRole("alert")).toHaveTextContent(
			"We couldn’t load the saved extraction. Please try again.",
		);
		for (const name of ["record-1.pdf", "record-2.pdf"]) {
			expect(
				within(screen.getByRole("group", { name })).getByText("Extraction failed"),
			).toBeVisible();
		}
		expect(screen.queryByRole("link", { name: "Continue" })).not.toBeInTheDocument();
	});

	test("shows a save failure and keeps review unavailable when no extraction was saved", async () => {
		await uploadRecords();
		await extractRecords(
			Response.json(
				{
					status: "failed",
					error: "We couldn’t save the extracted information. Please try again.",
				},
				{ status: 500 },
			),
		);

		expect(screen.getByRole("alert")).toHaveTextContent(
			"We couldn’t save the extracted information.",
		);
		for (const name of ["record-1.pdf", "record-2.pdf"]) {
			expect(
				within(screen.getByRole("group", { name })).getByText("Extraction failed"),
			).toBeVisible();
		}
		expect(screen.queryByRole("link", { name: "Continue" })).not.toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Retry all" })).toBeVisible();
		fireEvent.click(screen.getByRole("button", { name: "Dismiss extraction error" }));
		expect(screen.queryByRole("alert")).not.toBeInTheDocument();
		expect(screen.getByRole("group", { name: "record-1.pdf" })).toBeVisible();
		expect(screen.getByRole("group", { name: "record-2.pdf" })).toBeVisible();
	});

	test("shows the all-failed heading and file actions without repeating them in a banner", async () => {
		await uploadRecords();
		await extractRecords(
			Response.json({
				status: "success",
				extractionId: "failed-extraction",
				result: [firstStoredName, secondStoredName].map((name) => ({ name, status: "failed" })),
			}),
		);
		expect(
			screen.getByRole("heading", { name: "We couldn’t extract these records" }),
		).toBeVisible();
		expect(screen.queryByRole("alert")).not.toBeInTheDocument();
		for (const name of ["record-1.pdf", "record-2.pdf"]) {
			const card = within(screen.getByRole("group", { name }));
			expect(card.getByText("Extraction failed")).toBeVisible();
			expect(card.getByRole("button", { name: "Try again" })).toBeEnabled();
			expect(card.getByRole("button", { name: "Remove" })).toBeEnabled();
		}
		expect(screen.getByRole("group", { name: "record-1.pdf" })).toBeVisible();
		expect(screen.getByRole("group", { name: "record-2.pdf" })).toBeVisible();
		expect(screen.getByRole("button", { name: "Retry all" })).toBeEnabled();
	});

	test("retries only the selected failed record and shows a new server error when the retry fails", async () => {
		await uploadRecords();
		await extractRecords(
			Response.json(
				{ status: "failed", error: "Extraction service is unavailable. Please try again." },
				{ status: 503 },
			),
		);
		fireEvent.click(screen.getByRole("button", { name: "Dismiss extraction error" }));
		fetchMock.mockResolvedValueOnce(
			Response.json(
				{ status: "failed", error: "Extraction service is still unavailable. Please try again." },
				{ status: 503 },
			),
		);
		await act(async () => {
			fireEvent.click(
				within(screen.getByRole("group", { name: "record-1.pdf" })).getByRole("button", {
					name: "Try again",
				}),
			);
		});
		expect(JSON.parse(fetchMock.mock.lastCall![1].body)).toEqual({ filenames: [firstStoredName] });
		expect(screen.getByRole("alert")).toHaveTextContent("Extraction service is still unavailable.");
		expect(
			within(screen.getByRole("group", { name: "record-2.pdf" })).getByText("Extraction failed"),
		).toBeVisible();
	});

	test("retries all failed records while keeping successful results available for review", async () => {
		await uploadRecords();
		await extractRecords(
			Response.json({
				status: "success",
				extractionId: "first-extraction",
				result: [
					{ name: firstStoredName, status: "success" },
					{ name: secondStoredName, status: "failed" },
				],
			}),
		);
		fetchMock.mockResolvedValueOnce(
			Response.json({
				status: "success",
				extractionId: "retry-extraction",
				result: [{ name: secondStoredName, status: "success" }],
			}),
		);
		await act(async () => {
			fireEvent.click(screen.getByRole("button", { name: "Retry all" }));
		});
		expect(JSON.parse(fetchMock.mock.lastCall![1].body)).toEqual({ filenames: [secondStoredName] });
		expect(screen.getByRole("link", { name: "Continue" })).toHaveAttribute(
			"href",
			"/dashboard/review-extracted-info?extractionId=first-extraction&extractionId=retry-extraction",
		);
	});

	test("removes failed records and returns to file selection after the last removal", async () => {
		await uploadRecords();
		await extractRecords(
			Response.json({
				status: "success",
				extractionId: "failed-extraction",
				result: [firstStoredName, secondStoredName].map((name) => ({ name, status: "failed" })),
			}),
		);
		vi.mocked(deletePatientUploadAction).mockResolvedValue({ status: "success" });
		await act(async () => {
			fireEvent.click(
				within(screen.getByRole("group", { name: "record-1.pdf" })).getByRole("button", {
					name: "Remove",
				}),
			);
		});
		expect(screen.queryByRole("group", { name: "record-1.pdf" })).not.toBeInTheDocument();
		expect(screen.getByRole("group", { name: "record-2.pdf" })).toBeVisible();
		expect(screen.queryByRole("alert")).not.toBeInTheDocument();
		await act(async () => {
			fireEvent.click(
				within(screen.getByRole("group", { name: "record-2.pdf" })).getByRole("button", {
					name: "Remove",
				}),
			);
		});
		expect(screen.getByRole("heading", { name: "Upload Patient’s Record" })).toBeVisible();
		expect(screen.getByLabelText("Choose files or drag and drop them here.")).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Browse files" })).toBeEnabled();
		expect(
			screen.queryByRole("heading", { name: "We couldn’t extract these records" }),
		).not.toBeInTheDocument();
		expect(screen.queryByRole("alert")).not.toBeInTheDocument();
		expect(screen.queryByRole("button", { name: "Retry all" })).not.toBeInTheDocument();

		fetchMock.mockImplementationOnce(async (_url, { body }: { body: FormData }) =>
			Response.json({
				status: "success",
				files: [
					{
						clientId: body.get("clientId"),
						status: "upload-complete",
						id: "33333333-3333-4333-8333-333333333333",
						name: "record-1.pdf",
						storedName: "33333333-3333-4333-8333-333333333333.pdf",
						size: 8,
						type: "application/pdf",
						url: "patient-uploads/hospital-1/member-1/33333333-3333-4333-8333-333333333333.pdf",
					},
				],
			}),
		);
		await act(async () => {
			fireEvent.change(screen.getByLabelText("Choose files or drag and drop them here."), {
				target: { files: [new File(["replacement"], "record-1.pdf", { type: "application/pdf" })] },
			});
		});
		expect(
			within(screen.getByRole("group", { name: "record-1.pdf" })).getByText("Upload complete"),
		).toBeVisible();
		expect(screen.getByRole("button", { name: "Extract Information" })).toBeEnabled();
		expect(screen.queryByText("Extraction failed")).not.toBeInTheDocument();
		expect(screen.queryByRole("alert")).not.toBeInTheDocument();
	});

	test.each(["Try again", "Retry all"])(
		"clears the extraction banner immediately when %s starts a new attempt",
		async (action) => {
			await uploadRecords();
			await extractRecords(
				Response.json(
					{ status: "failed", error: "Extraction service is unavailable. Please try again." },
					{ status: 503 },
				),
			);
			expect(screen.getByRole("alert")).toBeVisible();
			let finishRetry!: (response: Response) => void;
			fetchMock.mockImplementationOnce(
				() =>
					new Promise<Response>((resolve) => {
						finishRetry = resolve;
					}),
			);
			const retryButton =
				action === "Try again"
					? within(screen.getByRole("group", { name: "record-1.pdf" })).getByRole("button", {
							name: action,
						})
					: screen.getByRole("button", { name: action });
			fireEvent.click(retryButton);
			expect(screen.queryByRole("alert")).not.toBeInTheDocument();
			expect(screen.getByText("Extracting patient data...")).toBeVisible();
			await act(async () => {
				finishRetry(
					Response.json({
						status: "success",
						extractionId: "retry-extraction",
						result: (action === "Try again"
							? [firstStoredName]
							: [firstStoredName, secondStoredName]
						).map((name) => ({
							name,
							status: "success",
						})),
					}),
				);
			});
			expect(screen.queryByRole("alert")).not.toBeInTheDocument();
		},
	);

	test("clears the extraction banner while removal is pending and retains the other failed file", async () => {
		await uploadRecords();
		await extractRecords(
			Response.json(
				{ status: "failed", error: "Extraction service is unavailable. Please try again." },
				{ status: 503 },
			),
		);
		expect(screen.getByRole("alert")).toBeVisible();
		let finishRemoval!: (result: { status: "success" }) => void;
		vi.mocked(deletePatientUploadAction).mockImplementationOnce(
			() =>
				new Promise((resolve) => {
					finishRemoval = resolve;
				}),
		);
		fireEvent.click(
			within(screen.getByRole("group", { name: "record-1.pdf" })).getByRole("button", {
				name: "Remove",
			}),
		);
		expect(screen.queryByRole("alert")).not.toBeInTheDocument();
		expect(
			within(screen.getByRole("group", { name: "record-1.pdf" })).getByRole("button", {
				name: "Remove",
			}),
		).toBeDisabled();
		await act(async () => {
			finishRemoval({ status: "success" });
		});
		expect(screen.queryByRole("group", { name: "record-1.pdf" })).not.toBeInTheDocument();
		expect(
			within(screen.getByRole("group", { name: "record-2.pdf" })).getByText("Extraction failed"),
		).toBeVisible();
		expect(screen.queryByRole("alert")).not.toBeInTheDocument();
	});

	test.each(["denied", "connection lost"])(
		"keeps the file removable after removal fails: %s",
		async (failure) => {
			await uploadRecords();
			await extractRecords(
				Response.json(
					{ status: "failed", error: "Extraction service is unavailable. Please try again." },
					{ status: 503 },
				),
			);
			expect(screen.getByRole("alert")).toHaveTextContent("Extraction failed");
			if (failure === "denied") {
				vi.mocked(deletePatientUploadAction).mockResolvedValueOnce({
					status: "failed",
					error: "Unable to remove this upload.",
				});
			} else {
				vi.spyOn(console, "error").mockImplementation(() => undefined);
				vi.mocked(deletePatientUploadAction).mockRejectedValueOnce(
					new Error("Private network details"),
				);
			}
			await act(async () => {
				fireEvent.click(
					within(screen.getByRole("group", { name: "record-1.pdf" })).getByRole("button", {
						name: "Remove",
					}),
				);
			});
			expect(screen.getByRole("alert")).toHaveTextContent(
				failure === "denied"
					? "Unable to remove this upload."
					: "We couldn’t remove this file. Please try again.",
			);
			expect(screen.queryByText(/Private network details/)).not.toBeInTheDocument();
			expect(
				screen.queryByRole("button", { name: "Dismiss extraction error" }),
			).not.toBeInTheDocument();
			const card = within(screen.getByRole("group", { name: "record-1.pdf" }));
			expect(card.getByRole("button", { name: "Remove" })).toBeEnabled();
			expect(card.getByRole("button", { name: "Try again" })).toBeEnabled();
			vi.mocked(deletePatientUploadAction).mockResolvedValueOnce({ status: "success" });
			await act(async () => {
				fireEvent.click(card.getByRole("button", { name: "Remove" }));
			});
			expect(screen.queryByRole("group", { name: "record-1.pdf" })).not.toBeInTheDocument();
			expect(screen.getByRole("group", { name: "record-2.pdf" })).toBeVisible();
			expect(screen.queryByRole("alert")).not.toBeInTheDocument();
		},
	);

	test("clears an extraction error when retrying a failed upload and preserves the other records", async () => {
		await uploadRecords();
		await extractRecords(
			Response.json(
				{ status: "failed", error: "Extraction service is unavailable." },
				{ status: 503 },
			),
		);
		fetchMock.mockResolvedValueOnce(
			Response.json({ status: "failed", error: "Upload unavailable." }, { status: 503 }),
		);
		await act(async () => {
			fireEvent.drop(screen.getByRole("main"), {
				dataTransfer: {
					files: [new File(["new record"], "new-record.pdf", { type: "application/pdf" })],
				},
			});
		});
		const failedUpload = within(screen.getByRole("group", { name: "new-record.pdf" }));
		expect(failedUpload.getByText("Upload failed")).toBeVisible();
		fetchMock.mockResolvedValueOnce(
			Response.json(
				{ status: "failed", error: "Extraction service is still unavailable." },
				{ status: 503 },
			),
		);
		await act(async () => {
			fireEvent.click(
				within(screen.getByRole("group", { name: "record-1.pdf" })).getByRole("button", {
					name: "Try again",
				}),
			);
		});
		expect(screen.getByRole("button", { name: "Dismiss extraction error" })).toBeVisible();
		fetchMock.mockImplementationOnce(async (_url, { body }: { body: FormData }) =>
			Response.json({
				status: "success",
				files: [
					{
						clientId: body.get("clientId"),
						status: "upload-complete",
						name: "new-record.pdf",
						id: "33333333-3333-4333-8333-333333333333",
						storedName: "33333333-3333-4333-8333-333333333333.pdf",
						size: 10,
						type: "application/pdf",
						url: "patient-uploads/hospital-1/member-1/33333333-3333-4333-8333-333333333333.pdf",
					},
				],
			}),
		);
		await act(async () => {
			fireEvent.click(failedUpload.getByRole("button", { name: "Try again" }));
		});
		expect(failedUpload.getByText("Upload complete")).toBeVisible();
		expect(screen.queryByRole("alert")).not.toBeInTheDocument();
		for (const name of ["record-1.pdf", "record-2.pdf"]) {
			expect(
				within(screen.getByRole("group", { name })).getByText("Extraction failed"),
			).toBeVisible();
		}
	});

	test("lets the user retry a failed upload from its card and then start extraction", async () => {
		fetchMock.mockResolvedValueOnce(
			Response.json({ status: "failed", error: "Upload unavailable." }, { status: 503 }),
		);
		render(<AddNewPatientClient />);
		fireEvent.change(screen.getByLabelText("Choose files or drag and drop them here."), {
			target: { files: [new File(["contents"], "record.pdf", { type: "application/pdf" })] },
		});
		await act(async () => {
			await vi.advanceTimersByTimeAsync(2000);
		});
		expect(screen.getByText("record.pdf")).toBeVisible();
		expect(screen.getByText("Upload failed")).toBeVisible();
		expect(screen.getByRole("button", { name: "Extract Information" })).toBeDisabled();

		fetchMock.mockImplementationOnce(async (_url, { body }: { body: FormData }) =>
			Response.json({
				status: "success",
				files: [
					{
						clientId: body.get("clientId"),
						status: "upload-complete",
						id: firstStoredName.slice(0, -4),
						name: "record.pdf",
						storedName: firstStoredName,
						size: 8,
						type: "application/pdf",
						url: `patient-uploads/hospital-1/member-1/${firstStoredName}`,
					},
				],
			}),
		);
		await act(async () => {
			fireEvent.click(screen.getByRole("button", { name: "Try again" }));
		});
		expect(screen.getAllByText("record.pdf")).toHaveLength(1);
		expect(screen.getByText("Upload complete")).toBeVisible();
		expect(screen.queryByRole("alert")).not.toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Extract Information" })).toBeEnabled();
	});
});
