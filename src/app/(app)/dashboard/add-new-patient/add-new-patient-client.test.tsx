import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { AddNewPatientClient } from "./add-new-patient-client";

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
		vi.stubGlobal("fetch", fetchMock);
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.unstubAllGlobals();
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
		expect(screen.getAllByText("Extraction failed")).toHaveLength(2);
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
		expect(screen.getAllByText("Extraction failed")).toHaveLength(2);
		expect(screen.queryByRole("link", { name: "Continue" })).not.toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Try again" })).toBeVisible();
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
