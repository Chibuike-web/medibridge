import { render, screen, within } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import type { TransferDetailsType } from "../types";
import { TransferDetailsDrawer } from "./transfer-details-drawer";

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

function renderDrawer(transfer: TransferDetailsType) {
	render(
		<TransferDetailsDrawer
			open
			onOpenChange={() => {}}
			transfer={transfer}
			canArchive={false}
			returnTo="/dashboard/transfers"
			transferActionFeedback={null}
			onDismissTransferActionFeedback={() => {}}
			isTransferActionPending={false}
			onResendRequest={() => {}}
			onRetryTransfer={() => {}}
			onCancelTransfer={() => {}}
		/>,
	);

	return within(screen.getByRole("list"));
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
