"use client";

import { useState, useTransition } from "react";
import { approvePatientTransferAction, rejectPatientTransferAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { TransferApprovalRecord } from "@/lib/api/get-transfer-approval";
import { formatDate } from "@/lib/utils/format-date";

type TransferApprovalClientProps = {
	transfer: TransferApprovalRecord;
};

export function TransferApprovalClient({ transfer }: TransferApprovalClientProps) {
	const [reason, setReason] = useState(transfer.patientRejectionReason ?? "");
	const [approveError, setApproveError] = useState<string | null>(null);
	const [rejectError, setRejectError] = useState<string | null>(null);
	const [currentApprovalStatus, setCurrentApprovalStatus] = useState(
		transfer.patientApprovalStatus,
	);
	const [isRejecting, setIsRejecting] = useState(false);
	const [isPending, startTransition] = useTransition();
	const isApproved = currentApprovalStatus === "approved";
	const isRejected = currentApprovalStatus === "rejected";

	function handleApprove() {
		setApproveError(null);
		setRejectError(null);

		startTransition(async () => {
			const result = await approvePatientTransferAction(transfer.transferId);

			if (result.success) {
				setCurrentApprovalStatus("approved");
				setIsRejecting(false);
				return;
			}

			setApproveError("Approval failed. Please try again.");
		});
	}

	function handleReject() {
		setApproveError(null);
		setRejectError(null);

		if (!reason.trim()) {
			setRejectError("Please enter a reason for rejecting the transfer request.");
			return;
		}

		startTransition(async () => {
			const result = await rejectPatientTransferAction({
				transferId: transfer.transferId,
				reason,
			});

			if (result.success) {
				setCurrentApprovalStatus("rejected");
				setIsRejecting(false);
				return;
			}

			setRejectError("Rejection failed. Please try again.");
		});
	}

	return (
		<section className="bg-white">
			<div className="border-b border-gray-200 p-6">
				<p className="text-sm font-medium text-gray-500">Patient transfer request</p>
				<h1 className="mt-2 text-2xl font-semibold text-gray-900">Review shared record request</h1>
				<p className="mt-3 max-w-2xl text-base leading-6 text-gray-600">
					{transfer.sourceHospitalName} wants to share selected patient records with{" "}
					{transfer.targetHospitalName}. Please review the request before approving.
				</p>
			</div>

			<div className="grid gap-6 p-6">
				<div className="grid gap-4 rounded-xl bg-gray-50 p-4 ring-1 ring-gray-200 sm:grid-cols-2">
					<DetailItem label="Patient" value={transfer.patientName} />
					<DetailItem label="Patient ID" value={transfer.patientId} />
					<DetailItem label="Source Hospital" value={transfer.sourceHospitalName} />
					<DetailItem label="Target Hospital" value={transfer.targetHospitalName} />
					<DetailItem label="Requested By" value={transfer.requestedBy || "-"} />
					<DetailItem label="Requested At" value={formatDate(transfer.requestedAt)} />
				</div>

				<div>
					<h2 className="text-base font-semibold text-gray-800">Selected records</h2>
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

				{isApproved ? (
					<StatusMessage tone="success" message="You approved this transfer request." />
				) : null}

				{isRejected ? (
					<StatusMessage
						tone="danger"
						message={
							reason
								? `You rejected this transfer request. Reason: ${reason}`
								: "You rejected this transfer request."
						}
					/>
				) : null}

				{approveError && !isApproved && !isRejected ? (
					<p className="text-sm text-red-600">{approveError}</p>
				) : null}

				{rejectError && !isApproved && !isRejected ? (
					<p className="text-sm text-red-600">{rejectError}</p>
				) : null}

				{isRejecting && !isApproved && !isRejected ? (
					<div className="grid gap-3">
						<label htmlFor="rejection-reason" className="text-sm font-medium text-gray-700">
							Reason for rejection
						</label>
						<Textarea
							id="rejection-reason"
							value={reason}
							onChange={(event) => {
								setReason(event.target.value);
								setRejectError(null);
							}}
							placeholder="Tell the requesting hospital why you are rejecting this transfer."
							className="min-h-28"
						/>
					</div>
				) : null}

				{!isApproved && !isRejected ? (
					<div className="flex flex-wrap items-center justify-end gap-3">
						{isRejecting ? (
							<Button
								type="button"
								variant="outline"
								className="h-auto px-6 py-3"
								disabled={isPending}
								onClick={() => {
									setIsRejecting(false);
									setApproveError(null);
									setRejectError(null);
								}}
							>
								Cancel
							</Button>
						) : null}
						<Button
							type="button"
							variant={isRejecting ? "destructive" : "outline"}
							className="h-auto px-6 py-3"
							disabled={isPending}
							onClick={() => {
								if (!isRejecting) {
									setIsRejecting(true);
									setApproveError(null);
									setRejectError(null);
									return;
								}

								handleReject();
							}}
						>
							{isPending && isRejecting ? "Rejecting..." : "Reject"}
						</Button>
						<Button
							type="button"
							className="h-auto px-6 py-3"
							disabled={isPending || isRejecting}
							onClick={handleApprove}
						>
							{isPending && !isRejecting ? "Approving..." : "Approve"}
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
