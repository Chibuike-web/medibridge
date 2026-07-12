"use client";

import { useState, useTransition } from "react";
import { approvePatientTransferAction, rejectPatientTransferAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { TransferApprovalRecord } from "@/lib/api/get-transfer-approval";
import { formatDate } from "@/lib/utils/format-date";

type TransferApprovalClientProps = {
	transfer: TransferApprovalRecord;
	approvalToken: string;
};

export function TransferApprovalClient({ transfer, approvalToken }: TransferApprovalClientProps) {
	const [rejectionReason, setRejectionReason] = useState(transfer.patientRejectionReason ?? "");
	const [approvalSubmissionError, setApprovalSubmissionError] = useState<string | null>(null);
	const [rejectionSubmissionError, setRejectionSubmissionError] = useState<string | null>(null);
	const [currentPatientApprovalStatus, setCurrentPatientApprovalStatus] = useState(transfer.patientApprovalStatus);
	const [isRejectionReasonFormOpen, setIsRejectionReasonFormOpen] = useState(false);
	const [isSubmittingApprovalOrRejection, startApprovalOrRejectionSubmission] = useTransition();
	const hasPatientApprovedTransfer = currentPatientApprovalStatus === "approved";
	const hasPatientRejectedTransfer = currentPatientApprovalStatus === "rejected";
	const canPatientStillApproveOrRejectTransfer = !hasPatientApprovedTransfer && !hasPatientRejectedTransfer;

	function handleApprove() {
		setApprovalSubmissionError(null);
		setRejectionSubmissionError(null);

		startApprovalOrRejectionSubmission(async () => {
			const result = await approvePatientTransferAction(transfer.transferId, approvalToken);

			if (result.success) {
				setCurrentPatientApprovalStatus("approved");
				setIsRejectionReasonFormOpen(false);
				return;
			}

			setApprovalSubmissionError("Approval failed. Please try again.");
		});
	}

	function handleReject() {
		setApprovalSubmissionError(null);
		setRejectionSubmissionError(null);

		if (!rejectionReason.trim()) {
			setRejectionSubmissionError("Please enter a reason for rejecting the transfer request.");
			return;
		}

		startApprovalOrRejectionSubmission(async () => {
			const result = await rejectPatientTransferAction({
				transferId: transfer.transferId,
				approvalToken,
				reason: rejectionReason,
			});

			if (result.success) {
				setCurrentPatientApprovalStatus("rejected");
				setIsRejectionReasonFormOpen(false);
				return;
			}

			setRejectionSubmissionError("Rejection failed. Please try again.");
		});
	}

	return (
		<section className="bg-white">
			<div className="border-b border-gray-200 p-6">
				<p className="text-sm font-medium text-gray-500">Patient transfer request</p>
				<h1 className="mt-2 text-2xl font-semibold text-gray-900">Review shared record request</h1>
				<p className="mt-3 max-w-2xl text-sm leading-6 text-gray-600">
					{transfer.sourceHospitalName} wants to share selected patient records with {transfer.targetHospitalName}.
					Please review the request before approving.
				</p>
			</div>

			<div className="grid gap-6 p-6">
				<div className="grid gap-4 rounded-xl bg-gray-50 p-4 ring-1 ring-gray-200 sm:grid-cols-2">
					<DetailItem label="Patient" value={transfer.patientName} />
					<DetailItem label="Patient ID" value={transfer.patientId} />
					<DetailItem label="Source Hospital" value={transfer.sourceHospitalName} />
					<DetailItem label="Target Hospital" value={transfer.targetHospitalName} />
					<DetailItem
						label="Target Hospital Email"
						value={transfer.targetHospitalAdminEmail || "-"}
					/>
					<DetailItem label="Requested By" value={transfer.requestedBy || "-"} />
					<DetailItem label="Requested At" value={formatDate(transfer.requestedAt)} />
				</div>

				<div>
					<h2 className="text-sm font-semibold text-gray-800">Selected records</h2>
					<div className="mt-3 overflow-hidden rounded-xl border border-gray-200">
						{transfer.selectedRecords.length > 0 ? (
							transfer.selectedRecords.map((record) => (
								<div
									key={`${record.contentType}-${record.recordId}`}
									className="flex items-center justify-between gap-4 border-b border-gray-200 px-4 py-3 last:border-b-0"
								>
									<span className="text-sm font-medium text-gray-700">{record.contentType}</span>
									<span className="rounded-md bg-gray-50 px-2 py-1 text-sm text-gray-600 ring-1 ring-gray-200">
										{record.recordId}
									</span>
								</div>
							))
						) : (
							<p className="px-4 py-3 text-sm text-gray-500">No records selected.</p>
						)}
					</div>
				</div>

				{hasPatientApprovedTransfer ? (
					<StatusMessage tone="success" message="You approved this transfer request." />
				) : null}

				{hasPatientRejectedTransfer ? (
					<StatusMessage
						tone="danger"
						message={
							rejectionReason
								? `You rejected this transfer request. Reason: ${rejectionReason}`
								: "You rejected this transfer request."
						}
					/>
				) : null}

				{approvalSubmissionError && canPatientStillApproveOrRejectTransfer ? (
					<p className="text-sm text-red-600">{approvalSubmissionError}</p>
				) : null}

				{rejectionSubmissionError && canPatientStillApproveOrRejectTransfer ? (
					<p className="text-sm text-red-600">{rejectionSubmissionError}</p>
				) : null}

				{isRejectionReasonFormOpen && canPatientStillApproveOrRejectTransfer ? (
					<div className="grid gap-3">
						<label htmlFor="rejection-reason" className="text-sm font-medium text-gray-700">
							Reason for rejection
						</label>
						<Textarea
							id="rejection-reason"
							value={rejectionReason}
							onChange={(event) => {
								setRejectionReason(event.target.value);
								setRejectionSubmissionError(null);
							}}
							placeholder="Tell the requesting hospital why you are rejecting this transfer."
							className="min-h-28"
						/>
					</div>
				) : null}

				{canPatientStillApproveOrRejectTransfer ? (
					<div className="flex flex-wrap items-center justify-end gap-3">
						{isRejectionReasonFormOpen ? (
							<Button
								type="button"
								variant="outline"
								className="h-auto px-6 py-3"
								disabled={isSubmittingApprovalOrRejection}
								onClick={() => {
									setIsRejectionReasonFormOpen(false);
									setApprovalSubmissionError(null);
									setRejectionSubmissionError(null);
								}}
							>
								Cancel
							</Button>
						) : null}
						<Button
							type="button"
							variant={isRejectionReasonFormOpen ? "destructive" : "outline"}
							className="h-auto px-6 py-3"
							disabled={isSubmittingApprovalOrRejection}
							onClick={() => {
								if (!isRejectionReasonFormOpen) {
									setIsRejectionReasonFormOpen(true);
									setApprovalSubmissionError(null);
									setRejectionSubmissionError(null);
									return;
								}

								handleReject();
							}}
						>
							{isSubmittingApprovalOrRejection && isRejectionReasonFormOpen ? "Rejecting..." : "Reject"}
						</Button>
						<Button
							type="button"
							className="h-auto px-6 py-3"
							disabled={isSubmittingApprovalOrRejection || isRejectionReasonFormOpen}
							onClick={handleApprove}
						>
							{isSubmittingApprovalOrRejection && !isRejectionReasonFormOpen ? "Approving..." : "Approve"}
						</Button>
					</div>
				) : null}
			</div>
		</section>
	);
}

function DetailItem({ label, value }: { label: string; value: string }) {
	return (
		<div className="flex flex-col gap-2">
			<span className="text-sm text-gray-400">{label}</span>
			<span className="text-sm font-semibold text-gray-700">{value}</span>
		</div>
	);
}

function StatusMessage({ tone, message }: { tone: "success" | "danger"; message: string }) {
	return (
		<p
			className={
				tone === "success"
					? "rounded-lg bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700"
					: "rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
			}
		>
			{message}
		</p>
	);
}
