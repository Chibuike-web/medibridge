import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
import type { TransferDetailsType } from "../types";
import { TransferDetailsDrawer } from "./transfer-details-drawer";

const { resendMock, retryMock, cancelMock } = vi.hoisted(() => ({
	resendMock: vi.fn(),
	retryMock: vi.fn(),
	cancelMock: vi.fn(),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/features/transfers/server/resend-transfer-request-action", () => ({
	resendTransferRequestAction: resendMock,
}));
vi.mock("@/features/transfers/server/retry-transfer-delivery-action", () => ({
	retryTransferDeliveryAction: retryMock,
}));
vi.mock("@/features/transfers/server/cancel-transfer-action", () => ({
	cancelTransferAction: cancelMock,
}));

const waitingTransfer: TransferDetailsType = {
	id: "TRF-1",
	patientName: "Chuka Joy Eze",
	patientFirstName: "Chuka",
	patientMiddleName: "Joy",
	patientLastName: "Eze",
	patientId: "patient-1",
	status: "pending",
	requestedAt: "2026-10-16T15:07:00.000Z",
	targetHospitalName: "Lagos University Teaching Hospital",
	targetHospitalEmail: "records@luth.example.org",
	requestedByName: "QA Owner Four",
	notes: "Referred for cardiology review.",
	patientApprovalStatus: "waiting",
	patientRejectionReason: null,
	deliveryStatus: "not_started",
	approvedAt: null,
	rejectedAt: null,
	sentAt: null,
	failedAt: null,
	cancelledAt: null,
	transferContent: [],
};

const failedTransfer: TransferDetailsType = {
	...waitingTransfer,
	status: "failed",
	patientApprovalStatus: "approved",
	deliveryStatus: "failed",
	approvedAt: "2026-10-16T15:08:00.000Z",
	failedAt: "2026-10-16T15:08:05.000Z",
};

function renderDrawer(transfer: TransferDetailsType, onTransferUpdated = vi.fn()) {
	render(
		<TransferDetailsDrawer
			open
			onOpenChange={() => {}}
			transfer={transfer}
			isLoading={false}
			canArchive={false}
			returnTo="/dashboard/transfers"
			onTransferUpdated={onTransferUpdated}
		/>,
	);

	return within(screen.getByRole("list"));
}

async function chooseAction(name: string) {
	const user = userEvent.setup();
	await user.click(screen.getByRole("button", { name: "Transfer actions" }));
	await user.click(await screen.findByRole("menuitem", { name }));
	return user;
}

describe("Transfer details activity", () => {
	test("shows who requested the transfer and that it is waiting for the patient", () => {
		const activity = renderDrawer(waitingTransfer);

		expect(activity.getByText("Requested by QA Owner Four")).toBeVisible();
		expect(activity.getByText("Waiting for patient response")).toBeVisible();
		expect(activity.getByText("Not started")).toBeVisible();
		expect(screen.getByText("Referred for cardiology review.")).toBeVisible();
	});

	test("shows the approval and the access code being sent once the patient approves", () => {
		const activity = renderDrawer({
			...waitingTransfer,
			status: "completed",
			patientApprovalStatus: "approved",
			deliveryStatus: "sent",
			approvedAt: "2026-10-16T15:08:00.000Z",
			sentAt: "2026-10-16T15:08:05.000Z",
		});

		expect(activity.getByText("Approved by the patient")).toBeVisible();
		expect(activity.getByText("Access code sent to records@luth.example.org")).toBeVisible();
		expect(activity.queryByText("Waiting for patient response")).not.toBeInTheDocument();
	});

	test("shows the patient's reason and that nothing was sent when they reject", () => {
		const activity = renderDrawer({
			...waitingTransfer,
			status: "rejected",
			patientApprovalStatus: "rejected",
			patientRejectionReason: "I want to choose another hospital",
			rejectedAt: "2026-10-16T15:09:00.000Z",
		});

		expect(
			activity.getByText("Rejected by the patient: I want to choose another hospital"),
		).toBeVisible();
		expect(activity.getByText("Not sent")).toBeVisible();
	});

	test("shows a failed delivery after the patient approves", () => {
		const activity = renderDrawer(failedTransfer);

		expect(activity.getByText("Approved by the patient")).toBeVisible();
		expect(activity.getByText("The access email could not be sent")).toBeVisible();
	});

	test("shows that the hospital cancelled before the patient responded", () => {
		const activity = renderDrawer({
			...waitingTransfer,
			status: "cancelled",
			cancelledAt: "2026-10-16T15:10:00.000Z",
		});

		expect(activity.getByText("Cancelled before the patient responded")).toBeVisible();
		expect(activity.getByText("Not sent")).toBeVisible();
		expect(activity.queryByText("Waiting for patient response")).not.toBeInTheDocument();
	});
});

describe("Transfer recovery actions", () => {
	test("resending a waiting request confirms where the link went and refreshes the transfer", async () => {
		resendMock.mockResolvedValue({
			status: "success",
			message: "Approval link sent to chuka@example.com.",
		});
		const onTransferUpdated = vi.fn();
		renderDrawer(waitingTransfer, onTransferUpdated);

		await chooseAction("Resend request");

		expect(await screen.findByRole("status")).toHaveTextContent(
			"Approval link sent to chuka@example.com.",
		);
		expect(resendMock).toHaveBeenCalledWith("TRF-1");
		expect(onTransferUpdated).toHaveBeenCalled();
	});

	test("shows why a resend failed", async () => {
		resendMock.mockResolvedValue({
			status: "failed",
			error: "We couldn’t send the approval link. Please try again.",
		});
		renderDrawer(waitingTransfer);

		await chooseAction("Resend request");

		expect(await screen.findByRole("alert")).toHaveTextContent(
			"We couldn’t send the approval link. Please try again.",
		);
	});

	test("retrying a failed delivery confirms the access code was sent", async () => {
		retryMock.mockResolvedValue({
			status: "success",
			message: "Access code sent to records@luth.example.org.",
		});
		renderDrawer(failedTransfer);

		await chooseAction("Retry transfer");

		expect(await screen.findByRole("status")).toHaveTextContent(
			"Access code sent to records@luth.example.org.",
		);
		expect(retryMock).toHaveBeenCalledWith("TRF-1");
	});

	test("cancelling asks first, then withdraws the request and closes the dialog", async () => {
		cancelMock.mockResolvedValue({
			status: "success",
			message: "Transfer cancelled. The patient can no longer respond to the request.",
		});
		renderDrawer(waitingTransfer);

		const user = await chooseAction("Cancel transfer");
		const dialog = await screen.findByRole("alertdialog", { name: "Cancel transfer?" });
		expect(cancelMock).not.toHaveBeenCalled();
		await user.click(within(dialog).getByRole("button", { name: "Cancel transfer" }));

		expect(await screen.findByRole("status")).toHaveTextContent(
			"Transfer cancelled. The patient can no longer respond to the request.",
		);
		expect(cancelMock).toHaveBeenCalledWith("TRF-1");
		expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
	});

	test.each([
		{
			action: "Resend request",
			transfer: waitingTransfer,
			mock: resendMock,
			error: "We couldn’t send the approval link. Please try again.",
		},
		{
			action: "Retry transfer",
			transfer: failedTransfer,
			mock: retryMock,
			error: "We couldn’t retry this transfer. Please try again.",
		},
		{
			action: "Cancel transfer",
			transfer: waitingTransfer,
			mock: cancelMock,
			error: "We couldn’t cancel this transfer. Please try again.",
		},
	])(
		"keeps the drawer open with a plain error when $action never reaches the server",
		async ({ action, transfer, mock, error }) => {
			vi.spyOn(console, "error").mockImplementation(() => {});
			mock.mockRejectedValue(new Error("Failed to fetch"));
			renderDrawer(transfer);

			const user = await chooseAction(action);
			if (action === "Cancel transfer") {
				const dialog = await screen.findByRole("alertdialog", { name: "Cancel transfer?" });
				await user.click(within(dialog).getByRole("button", { name: "Cancel transfer" }));
			}

			expect(await screen.findByRole("alert")).toHaveTextContent(error);
			expect(screen.getByText("Transfer details")).toBeVisible();
			expect(mock).toHaveBeenCalledWith("TRF-1");
		},
	);

	test("shows a retry result only on the transfer that was retried", async () => {
		let finishRetry!: (result: { status: "success"; message: string }) => void;
		retryMock.mockReturnValue(new Promise((resolve) => (finishRetry = resolve)));
		const otherTransfer = { ...waitingTransfer, id: "TRF-2", patientName: "Ngozi Bello" };
		const drawer = (transfer: TransferDetailsType) => (
			<TransferDetailsDrawer
				open
				onOpenChange={() => {}}
				transfer={transfer}
				isLoading={false}
				canArchive={false}
				returnTo="/dashboard/transfers"
				onTransferUpdated={() => {}}
			/>
		);
		const { rerender } = render(drawer(failedTransfer));

		await chooseAction("Retry transfer");
		rerender(drawer(otherTransfer));
		finishRetry({ status: "success", message: "Access code sent to records@luth.example.org." });

		expect(await screen.findByText("Ngozi Bello")).toBeVisible();
		await new Promise((resolve) => setTimeout(resolve, 0));
		expect(screen.queryByRole("status")).not.toBeInTheDocument();
		expect(screen.queryByRole("alert")).not.toBeInTheDocument();

		rerender(drawer(failedTransfer));
		expect(await screen.findByRole("status")).toHaveTextContent(
			"Access code sent to records@luth.example.org.",
		);
	});
});
