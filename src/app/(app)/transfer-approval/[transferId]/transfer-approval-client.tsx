"use client";

import { RiArrowDownSLine, RiCloseLine, RiErrorWarningFill } from "@remixicon/react";
import { format } from "date-fns";
import { Fragment, useId, useState, useTransition, type ReactNode } from "react";
import { approvePatientTransferAction, rejectPatientTransferAction } from "./actions";
import { StatusBadge } from "@/components/status-badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { TransferApprovalRecord } from "@/lib/api/get-transfer-approval";
import { cn } from "@/lib/utils/cn";
import { getInitials } from "@/lib/utils/get-initials";

type TransferApprovalClientProps = {
	transfer: TransferApprovalRecord;
	approvalToken: string;
};

export function TransferApprovalClient({ transfer, approvalToken }: TransferApprovalClientProps) {
	const rejectionReasonId = useId();
	const [rejectionReason, setRejectionReason] = useState("");
	const [submissionError, setSubmissionError] = useState("");
	const [answeredApprovalStatus, setAnsweredApprovalStatus] = useState<
		"approved" | "rejected" | null
	>(null);
	const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
	const [isPending, startTransition] = useTransition();

	function handleApprove() {
		setSubmissionError("");
		startTransition(async () => {
			const result = await approvePatientTransferAction(transfer.transferId, approvalToken);

			if (result.status === "failed") {
				setSubmissionError(result.error);
				return;
			}

			setAnsweredApprovalStatus("approved");
		});
	}

	function handleReject() {
		setSubmissionError("");
		startTransition(async () => {
			const result = await rejectPatientTransferAction({
				transferId: transfer.transferId,
				approvalToken,
				reason: rejectionReason,
			});

			setIsRejectDialogOpen(false);

			if (result.status === "failed") {
				setSubmissionError(result.error);
				return;
			}

			setAnsweredApprovalStatus("rejected");
		});
	}

	if (answeredApprovalStatus) {
		return (
			<TransferApprovalResult
				patientApprovalStatus={answeredApprovalStatus}
				sourceHospitalName={transfer.sourceHospitalName}
				targetHospitalName={transfer.targetHospitalName}
				accessEndsAt={transfer.accessEndsAt}
				patientRejectionReason={rejectionReason.trim() || null}
			/>
		);
	}

	return (
		<>
			<main className="mt-12 mb-40 px-6 text-sm sm:mb-28">
				<div className="mx-auto flex max-w-[75rem] flex-col">
					<h1 className="text-lg text-gray-500 text-balance">
						<span className="font-semibold text-gray-800">{transfer.sourceHospitalName}</span> wants
						to share your records with{" "}
						<span className="font-semibold text-gray-800">{transfer.targetHospitalName}</span>
					</h1>
					<p className="mt-2 text-gray-500 text-pretty">
						Please review the details below. Nothing is shared until you approve.
					</p>

					<div className="mt-5 flex items-center gap-3">
						<Avatar>
							<AvatarFallback className="bg-gray-100 text-xs font-semibold text-gray-700">
								{getInitials(transfer.patientName)}
							</AvatarFallback>
						</Avatar>
						<p className="text-lg font-semibold text-gray-800">{transfer.patientName}</p>
					</div>

					<dl className="mt-6 flex flex-col gap-4 sm:flex-row sm:gap-6">
						<RequestDetail
							label="Requested by"
							value={`${transfer.requestedByName ?? "-"}, ${format(transfer.requestedAt, "d MMM yyyy")}`}
						/>
						<RequestDetail label="Reason" value={transfer.reason || "-"} />
						<RequestDetail
							label="Access ends"
							value={format(transfer.accessEndsAt, "d MMM yyyy")}
						/>
					</dl>

					{submissionError ? (
						<div
							role="alert"
							className="mt-6 flex items-start gap-2 rounded-xl bg-red-50 px-3 py-3 text-left font-medium text-red-700"
						>
							<RiErrorWarningFill className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
							<p className="min-w-0 flex-1 text-pretty">{submissionError}</p>
						</div>
					) : null}

					<h2 className="mt-10 text-lg font-semibold text-gray-800">What will be shared</h2>
					<div className="mt-4 flex flex-col gap-3">
						{transfer.sharedDetailSections.map((section) => (
							<SharedSection key={section.title} title={section.title}>
								<div className="grid gap-x-4 gap-y-3 sm:grid-cols-3 sm:gap-y-6">
									{section.fields.map((field) => (
										<SharedField key={field.label} label={field.label} value={field.value} />
									))}
								</div>
							</SharedSection>
						))}
						{transfer.sharedRecordGroups.map((group) => (
							<SharedRecordGroup key={group.label} group={group} />
						))}
					</div>
				</div>
			</main>

			<footer className="fixed inset-x-0 bottom-0 z-50 border-t border-gray-100 bg-white px-6 py-4">
				<div className="mx-auto flex w-full max-w-[75rem] flex-col gap-3 sm:flex-row">
					<Button
						type="button"
						variant="destructive"
						className="border border-destructive bg-transparent text-destructive shadow-none hover:bg-destructive/10 hover:text-destructive focus-visible:border-destructive sm:flex-1"
						disabled={isPending}
						onClick={() => setIsRejectDialogOpen(true)}
					>
						<span className="sm:hidden">Reject</span>
						<span className="hidden sm:inline">Reject transfer</span>
					</Button>
					<Button type="button" className="sm:flex-1" disabled={isPending} onClick={handleApprove}>
						{isPending && !isRejectDialogOpen ? (
							"Approving…"
						) : (
							<>
								<span className="sm:hidden">Approve</span>
								<span className="hidden sm:inline">Approve transfer</span>
							</>
						)}
					</Button>
				</div>
			</footer>

			<Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Reject transfer request?</DialogTitle>
						<DialogDescription className="sr-only">
							The requesting hospital will be told you rejected the transfer.
						</DialogDescription>
						<DialogClose asChild>
							<Button variant="ghost" size="icon" aria-label="Close reject transfer dialog">
								<RiCloseLine aria-hidden="true" />
							</Button>
						</DialogClose>
					</DialogHeader>
					<div className="flex flex-col gap-2 px-4 py-5 text-sm">
						<Label htmlFor={rejectionReasonId} className="text-gray-700">
							Reason for rejection <span className="font-normal text-gray-400">(optional)</span>
						</Label>
						<Textarea
							id={rejectionReasonId}
							value={rejectionReason}
							onChange={(event) => setRejectionReason(event.target.value)}
							className="min-h-28 bg-white text-sm text-gray-700 placeholder:text-gray-400"
						/>
					</div>
					<DialogFooter className="sm:justify-end">
						<DialogClose asChild>
							<Button variant="outline">Cancel</Button>
						</DialogClose>
						<Button type="button" variant="destructive" disabled={isPending} onClick={handleReject}>
							{isPending ? "Rejecting…" : "Reject request"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}

function RequestDetail({ label, value }: { label: string; value: string }) {
	return (
		<div className="flex flex-col gap-2">
			<dt className="text-gray-400">{label}:</dt>
			<dd className="font-semibold text-gray-700">{value}</dd>
		</div>
	);
}

function SharedSection({
	title,
	count,
	action,
	children,
}: {
	title: string;
	count?: number;
	action?: ReactNode;
	children: ReactNode;
}) {
	const [isExpanded, setIsExpanded] = useState(true);
	const panelId = useId();

	return (
		<section className="overflow-hidden rounded-xl bg-gray-50 ring-1 ring-gray-200">
			<h3 className="sm:hidden">
				<Button
					type="button"
					variant="ghost"
					className="h-10 w-full justify-between gap-4 rounded-none border-0 px-4 text-base has-[>svg:first-child]:pl-4 has-[>svg:last-child]:pr-4 font-semibold text-gray-700 hover:bg-transparent hover:text-gray-700 focus-visible:border-0 active:scale-100"
					aria-expanded={isExpanded}
					aria-controls={panelId}
					onClick={() => setIsExpanded((prev) => !prev)}
				>
					{count === undefined ? title : `${title} (${count})`}
					<RiArrowDownSLine
						className={cn("text-gray-500", isExpanded && "rotate-180")}
						aria-hidden="true"
					/>
				</Button>
			</h3>
			<div className="hidden h-10 items-center justify-between gap-4 px-4 sm:flex">
				<h3 className="text-base font-semibold text-gray-700">{title}</h3>
				{action}
			</div>
			<div
				id={panelId}
				inert={!isExpanded}
				className={cn(
					"grid rounded-xl bg-white ring-gray-200 transition-[grid-template-rows] motion-reduce:transition-none sm:grid-rows-[1fr] sm:ring-1",
					isExpanded
						? "grid-rows-[1fr] ring-1 duration-300 ease-in-out"
						: "grid-rows-[0fr] duration-200 ease-out",
				)}
			>
				<div className="min-h-0 overflow-hidden">
					<div className="p-4">{children}</div>
				</div>
			</div>
		</section>
	);
}

function SharedField({ label, value }: { label: string; value: string }) {
	return (
		<div className="grid grid-cols-2 gap-x-4 sm:flex sm:flex-col sm:gap-2">
			<span className="text-gray-400">{label}</span>
			<span className="font-semibold text-gray-700 [overflow-wrap:anywhere]">{value}</span>
		</div>
	);
}

function SharedRecordGroup({
	group,
}: {
	group: TransferApprovalRecord["sharedRecordGroups"][number];
}) {
	const [isShowingAll, setIsShowingAll] = useState(false);
	const hasMoreThanThree = group.records.length > 3;

	return (
		<SharedSection
			title={group.label}
			count={group.records.length}
			action={
				hasMoreThanThree ? (
					<Button
						type="button"
						variant="ghost"
						className="ml-auto hidden h-auto rounded-none border-0 p-0 font-normal text-gray-400 hover:bg-transparent hover:text-gray-400 focus-visible:border-0 sm:inline-flex"
						onClick={() => setIsShowingAll((prev) => !prev)}
					>
						{isShowingAll ? "View less" : "View all"}
					</Button>
				) : null
			}
		>
			<div className="grid gap-x-4 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
				{group.records.map((record, index) => (
					<div
						key={record.id}
						className={cn("flex flex-col gap-3", index >= 3 && !isShowingAll && "sm:hidden")}
					>
						<div className="flex flex-wrap items-center gap-2">
							<span className="font-semibold text-gray-800">{record.name}</span>
							<StatusBadge status={record.status} />
						</div>
						<dl className="grid grid-cols-2 gap-x-4 gap-y-3">
							{record.fields.map((field) => (
								<Fragment key={field.label}>
									<dt className="text-gray-400">{field.label}</dt>
									<dd className="font-semibold text-gray-700 [overflow-wrap:anywhere]">
										{field.value}
									</dd>
								</Fragment>
							))}
						</dl>
					</div>
				))}
			</div>
		</SharedSection>
	);
}

export function TransferApprovalResult({
	patientApprovalStatus,
	sourceHospitalName,
	targetHospitalName,
	accessEndsAt,
	patientRejectionReason,
}: Pick<
	TransferApprovalRecord,
	"sourceHospitalName" | "targetHospitalName" | "accessEndsAt" | "patientRejectionReason"
> & { patientApprovalStatus: "approved" | "rejected" }) {
	return (
		<main className="bg-white px-6 py-10">
			<section className="mx-auto flex min-h-[calc(100dvh-5rem)] w-full max-w-3xl items-center justify-center text-center">
				<div>
					<h1 className="text-lg font-semibold text-gray-800 text-balance">
						{patientApprovalStatus === "approved"
							? "You approved this transfer request"
							: "You rejected this transfer request"}
					</h1>
					<p className="mt-4 text-sm text-gray-600 text-pretty">
						{patientApprovalStatus === "approved"
							? `${targetHospitalName} can view the records you approved until ${format(accessEndsAt, "d MMM yyyy")}.`
							: `${sourceHospitalName} has been told, and your records were not shared.`}
					</p>
					{patientApprovalStatus === "rejected" && patientRejectionReason ? (
						<p className="mt-2 text-sm text-gray-600 text-pretty">
							Reason: {patientRejectionReason}
						</p>
					) : null}
				</div>
			</section>
		</main>
	);
}
