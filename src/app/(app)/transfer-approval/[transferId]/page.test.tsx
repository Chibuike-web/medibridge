import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderToReadableStream } from "react-dom/server.browser";
import { beforeEach, describe, expect, test, vi } from "vitest";
import TransferApprovalPage from "./page";
import { TransferApprovalClient } from "./transfer-approval-client";
import type { TransferApprovalRecord } from "@/lib/api/get-transfer-approval";

const { getTransferApprovalMock, approvePatientTransferActionMock } = vi.hoisted(() => ({
	getTransferApprovalMock: vi.fn(),
	approvePatientTransferActionMock: vi.fn(),
}));

vi.mock("@/lib/api/get-transfer-approval", () => ({
	getTransferApproval: getTransferApprovalMock,
}));
vi.mock("@/lib/api/transfer-approval-token", () => ({
	verifyTransferApprovalToken: vi.fn(async (token: string) => (token ? { token } : null)),
}));
vi.mock("./actions", () => ({
	approvePatientTransferAction: approvePatientTransferActionMock,
	rejectPatientTransferAction: vi.fn(),
}));

const waitingTransfer: TransferApprovalRecord = {
	transferId: "TRF-1",
	patientName: "Ada Obi",
	sourceHospitalName: "Source Hospital",
	targetHospitalName: "Receiving Hospital",
	requestedByName: "Staff",
	requestedAt: "2026-10-16T09:00:00.000Z",
	reason: "Specialist care",
	accessEndsAt: "2026-10-24T09:00:00.000Z",
	status: "pending",
	patientApprovalStatus: "waiting",
	patientRejectionReason: null,
	sharedDetailSections: [],
	sharedRecordGroups: [
		{
			label: "Diagnoses",
			records: [{ id: "DIA-1", name: "Asthma", status: "Active", fields: [] }],
		},
	],
};

async function renderTransferApprovalPage() {
	const stream = await renderToReadableStream(
		<TransferApprovalPage
			params={Promise.resolve({ transferId: "TRF-1" })}
			searchParams={Promise.resolve({ token: "approval-token" })}
		/>,
		{ onError: () => {} },
	);
	await stream.allReady;
	const html = await new Response(stream).text();
	render(<div dangerouslySetInnerHTML={{ __html: html }} />);
}

describe("transfer approval page", () => {
	beforeEach(() => {
		cleanup();
		getTransferApprovalMock.mockReset();
		approvePatientTransferActionMock.mockReset();
	});

	test("shows a waiting transfer's records with the approve action", async () => {
		getTransferApprovalMock.mockResolvedValue(waitingTransfer);
		await renderTransferApprovalPage();

		expect(screen.getByText("Asthma")).toBeInTheDocument();
		expect(screen.getByRole("button", { name: /approve/i })).toBeInTheDocument();
	});

	test("reopening an approved transfer shows only the result, not the shared records", async () => {
		getTransferApprovalMock.mockResolvedValue({
			...waitingTransfer,
			patientApprovalStatus: "approved",
		});
		await renderTransferApprovalPage();

		expect(
			screen.getByRole("heading", { name: "You approved this transfer request" }),
		).toBeInTheDocument();
		expect(
			screen.getByText(/Receiving Hospital can view the records you approved until 24 Oct 2026/),
		).toBeInTheDocument();
		expect(screen.queryByText("Asthma")).not.toBeInTheDocument();
		expect(screen.queryByRole("button", { name: /approve/i })).not.toBeInTheDocument();
	});

	test("reopening a rejected transfer shows the rejection and its reason, not the shared records", async () => {
		getTransferApprovalMock.mockResolvedValue({
			...waitingTransfer,
			patientApprovalStatus: "rejected",
			patientRejectionReason: "I already moved hospitals",
		});
		await renderTransferApprovalPage();

		expect(
			screen.getByRole("heading", { name: "You rejected this transfer request" }),
		).toBeInTheDocument();
		expect(screen.getByText("Reason: I already moved hospitals")).toBeInTheDocument();
		expect(screen.queryByText("Asthma")).not.toBeInTheDocument();
	});

	test("approving switches the page to the result, moves focus to it and hides the shared records", async () => {
		approvePatientTransferActionMock.mockResolvedValue({ status: "success" });
		render(<TransferApprovalClient transfer={waitingTransfer} approvalToken="approval-token" />);
		expect(screen.getByText("Asthma")).toBeVisible();

		await userEvent.click(screen.getByRole("button", { name: /approve/i }));

		const resultHeading = await screen.findByRole("heading", {
			name: "You approved this transfer request",
		});
		expect(resultHeading).toBeVisible();
		expect(resultHeading).toHaveFocus();
		expect(screen.queryByText("Asthma")).not.toBeInTheDocument();
		expect(approvePatientTransferActionMock).toHaveBeenCalledWith("TRF-1", "approval-token");
	});
});
