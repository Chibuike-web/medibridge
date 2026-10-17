"use client";

import {
	AlertDialog,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
	Drawer,
	DrawerClose,
	DrawerContent,
	DrawerDescription,
	DrawerHeader,
	DrawerTitle,
} from "@/components/ui/drawer";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import {
	RiAddLine,
	RiArchiveLine,
	RiArrowDownSLine,
	RiCheckboxBlankCircleFill,
	RiCheckboxBlankCircleLine,
	RiCheckboxCircleFill,
	RiCloseCircleFill,
	RiCloseLine,
	RiCornerDownLeftFill,
	RiEdit2Line,
	RiMore2Fill,
	RiSendPlaneLine,
	RiShare2Line,
} from "@remixicon/react";
import Link from "next/link";
import { CopyIdButton } from "@/components/copy-id-button";
import { cn } from "@/lib/utils/cn";
import { useId, useState } from "react";
import type { TransferDetailsType } from "@/features/transfers/types";
import { formatDate } from "@/lib/utils/format-date";

type TransferDetailsDrawerProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	transfer: TransferDetailsType | null;
	isLoading: boolean;
	canArchive: boolean;
	returnTo: string;
};

const EMPTY_VALUE = "-";

export function TransferDetailsDrawer({
	open,
	onOpenChange,
	transfer,
	isLoading,
	canArchive,
	returnTo,
}: TransferDetailsDrawerProps) {
	const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
	const [isArchiveDialogOpen, setIsArchiveDialogOpen] = useState(false);

	return (
		<Drawer open={open} onOpenChange={onOpenChange} direction="right">
			<DrawerContent className="overflow-hidden rounded-3xl text-sm data-[vaul-drawer-direction=right]:top-4 data-[vaul-drawer-direction=right]:right-4 data-[vaul-drawer-direction=right]:bottom-4 data-[vaul-drawer-direction=right]:h-auto data-[vaul-drawer-direction=right]:w-[37.5rem]">
				<DrawerHeader className="border-b border-gray-200 text-left flex-row gap-4 items-center">
					<DrawerTitle className="text-gray-800 leading-[1.2] flex-1">
						View transfer details
					</DrawerTitle>
					{transfer ? (
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="ghost" size="icon" aria-label="Transfer actions">
									<RiMore2Fill aria-hidden="true" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent
								align="end"
								className="w-50 rounded-xl bg-white text-sm text-gray-700"
							>
								<DropdownMenuItem className="rounded-lg">
									<RiShare2Line aria-hidden="true" />
									Export
								</DropdownMenuItem>
								{transfer.status === "pending" ? (
									<>
										<DropdownMenuItem className="rounded-lg">
											<RiSendPlaneLine aria-hidden="true" />
											Resend request
										</DropdownMenuItem>
										<DropdownMenuItem
											className="rounded-lg text-rose-600 focus:bg-rose-50 focus:text-rose-600"
											onSelect={() => setIsCancelDialogOpen(true)}
										>
											<RiCloseLine aria-hidden="true" className="text-current" />
											Cancel transfer
										</DropdownMenuItem>
									</>
								) : null}
								{transfer.status === "failed" ? (
									<DropdownMenuItem className="rounded-lg">
										<RiCornerDownLeftFill aria-hidden="true" />
										Retry transfer
									</DropdownMenuItem>
								) : null}
								{transfer.status === "cancelled" ? (
									<DropdownMenuItem className="rounded-lg" asChild>
										<Link
											href={{
												pathname: "/dashboard/new-transfer-request",
												query: { patientId: transfer.patientId, returnTo },
											}}
										>
											<RiAddLine aria-hidden="true" />
											Start new transfer
										</Link>
									</DropdownMenuItem>
								) : null}
								{transfer.status === "rejected" ? (
									<DropdownMenuItem className="rounded-lg" asChild>
										<Link
											href={{
												pathname: "/dashboard/new-transfer-request",
												query: { patientId: transfer.patientId, returnTo },
											}}
										>
											<RiEdit2Line aria-hidden="true" />
											Edit and resend
										</Link>
									</DropdownMenuItem>
								) : null}
								{canArchive && transfer.status !== "pending" ? (
									<>
										<DropdownMenuSeparator />
										<DropdownMenuItem
											className="rounded-lg"
											onSelect={() => setIsArchiveDialogOpen(true)}
										>
											<RiArchiveLine aria-hidden="true" />
											Archive transfer
										</DropdownMenuItem>
									</>
								) : null}
							</DropdownMenuContent>
						</DropdownMenu>
					) : null}
					<DrawerClose aria-label="Close transfer details" asChild>
						<Button variant="ghost" size="icon">
							<RiCloseLine aria-hidden="true" />
						</Button>
					</DrawerClose>
					<DrawerDescription className="sr-only">
						Showing details for the transfer you selected.
					</DrawerDescription>
				</DrawerHeader>

				<div className="px-4 py-5 overflow-y-auto text-sm">
					{isLoading ? (
						<TransferDetailsFallback />
					) : (
						<>
							<div className="flex flex-col gap-6">
								<div className="flex items-center gap-x-4 gap-y-2 flex-wrap text-nowrap">
									<div className="flex items-center gap-2 shrink-0">
										<span className="text-gray-400">Transfer Status:</span>
										{transfer ? (
											<StatusBadge status={transfer.status} />
										) : (
											<span className="text-gray-600 font-medium">{EMPTY_VALUE}</span>
										)}
									</div>
									<div className="flex items-center gap-2 shrink-0">
										<span className="text-gray-400">Patient ID:</span>
										{transfer ? (
											<CopyIdButton id={transfer.patientId} />
										) : (
											<span className="text-gray-600 font-medium">{EMPTY_VALUE}</span>
										)}
									</div>
									<div className="flex items-center gap-2 shrink-0">
										<span className="text-gray-400">Transfer ID:</span>
										{transfer ? (
											<CopyIdButton id={transfer.id} />
										) : (
											<span className="text-gray-600 font-medium">{EMPTY_VALUE}</span>
										)}
									</div>
								</div>
								<div className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
									<DetailItem label="Patient Name" value={transfer?.patientName} />
									<DetailItem label="Target Hospital" value={transfer?.targetHospitalName} />
									<DetailItem
										label="Target Hospital Email"
										value={
											transfer ? (
												<>
													{transfer.targetHospitalEmail.split("@")[0]}@<wbr />
													<span className="inline-block">{transfer.targetHospitalEmail.split("@")[1]}</span>
												</>
											) : null
										}
									/>
									{transfer?.notes ? <DetailItem label="Notes" value={transfer.notes} /> : null}
								</div>
								{transfer && transfer.transferContent.length > 0 ? (
									<TransferContentSections transferContent={transfer.transferContent} />
								) : null}
							</div>
							{transfer ? <TransferProgress transfer={transfer} /> : null}
						</>
					)}
				</div>
			</DrawerContent>
			<AlertDialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Cancel transfer?</AlertDialogTitle>
						<Button
							type="button"
							variant="ghost"
							size="icon"
							aria-label="Close cancel transfer dialog"
							onClick={() => setIsCancelDialogOpen(false)}
						>
							<RiCloseLine aria-hidden="true" />
						</Button>
					</AlertDialogHeader>
					<AlertDialogDescription>
						The approval request will be withdrawn and the patient will no longer be able to
						respond. The transfer and its full activity history are retained.
					</AlertDialogDescription>
					<AlertDialogFooter className="sm:justify-end">
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<Button
							type="button"
							className="bg-rose-500 text-white hover:bg-rose-600"
							onClick={() => setIsCancelDialogOpen(false)}
						>
							Cancel transfer
						</Button>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
			<AlertDialog open={isArchiveDialogOpen} onOpenChange={setIsArchiveDialogOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Archive transfer</AlertDialogTitle>
						<Button
							type="button"
							variant="ghost"
							size="icon"
							aria-label="Close archive transfer dialog"
							onClick={() => setIsArchiveDialogOpen(false)}
						>
							<RiCloseLine aria-hidden="true" />
						</Button>
					</AlertDialogHeader>
					<AlertDialogDescription>
						This transfer will be removed from your transfers list. The transfer, its contents and
						full activity history are retained and can be restored at any time.
					</AlertDialogDescription>
					<AlertDialogFooter className="sm:justify-end">
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<Button type="button" onClick={() => setIsArchiveDialogOpen(false)}>
							Archive transfer
						</Button>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</Drawer>
	);
}

function TransferContentSections({
	transferContent,
}: {
	transferContent: TransferDetailsType["transferContent"];
}) {
	const transferContentGroups = groupTransferContentByType(transferContent);

	return (
		<div className="flex flex-col gap-4">
			<div className="flex flex-col gap-1.5">
				<h2 className="text-left text-sm font-semibold text-gray-800">Transfer Contents </h2>
				<div className="text-gray-400 flex items-center gap-2">
					{transferContentGroups.map(({ contentType, transferContent }) => (
						<div className="flex items-center" key={contentType}>
							<span>{contentType}</span>
							<span>({transferContent.length})</span>
						</div>
					))}
				</div>
			</div>

			<div className="flex flex-col gap-2.5">
				{transferContentGroups.map((contentGroup) => (
					<TransferContentGroup key={contentGroup.contentType} contentGroup={contentGroup} />
				))}
			</div>
		</div>
	);
}

type TransferContentGroupType = {
	contentType: string;
	transferContent: TransferDetailsType["transferContent"];
};

function groupTransferContentByType(
	transferContent: TransferDetailsType["transferContent"],
): TransferContentGroupType[] {
	const transferContentByContentType = new Map<string, TransferDetailsType["transferContent"]>();

	for (const content of transferContent) {
		const key = content.contentType;
		const existingContentGroup = transferContentByContentType.get(key) ?? [];
		existingContentGroup.push(content);
		transferContentByContentType.set(key, existingContentGroup);
	}

	return Array.from(transferContentByContentType, ([contentType, groupedTransferContent]) => ({
		contentType,
		transferContent: groupedTransferContent,
	}));
}

function TransferContentGroup({ contentGroup }: { contentGroup: TransferContentGroupType }) {
	const [isTransferContentGroupExpanded, setIsTransferContentGroupExpanded] = useState(false);
	const sectionId = useId();
	const titleId = `${sectionId}-title`;
	const panelId = `${sectionId}-panel`;

	return (
		<div className="flex flex-col rounded-[14px] border border-gray-200 p-4">
			<Button
				type="button"
				onClick={() => setIsTransferContentGroupExpanded((prev) => !prev)}
				aria-expanded={isTransferContentGroupExpanded}
				aria-controls={panelId}
				variant="ghost"
				className="flex w-full justify-between gap-4 text-left h-auto whitespace-normal rounded-none border-0 p-0 font-normal hover:bg-transparent hover:text-inherit focus-visible:border-0 active:scale-100 has-[>svg:last-child]:pr-0"
			>
				<span id={titleId} className="text-sm font-semibold text-gray-800">
					{contentGroup.contentType}
				</span>
				<RiArrowDownSLine
					className={cn(
						"size-5 transition-transform text-gray-600 duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none",
						isTransferContentGroupExpanded ? "rotate-180" : "",
					)}
					aria-hidden="true"
				/>
			</Button>

			<div
				id={panelId}
				className={cn(
					"grid overflow-hidden transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none",
					isTransferContentGroupExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
				)}
				aria-hidden={!isTransferContentGroupExpanded}
				inert={!isTransferContentGroupExpanded}
			>
				<div className="min-h-0 overflow-hidden">
					<div role="region" aria-labelledby={titleId} className="mt-4 flex flex-col gap-3">
						{contentGroup.transferContent.map((content) => (
							<div
								key={`${content.contentType}-${content.recordId}`}
								className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
							>
								<div className="flex min-w-0 flex-wrap items-center gap-2">
									<span className="min-w-0 truncate font-medium text-gray-600">
										{content.recordName ?? content.recordId}
									</span>
									{content.status ? (
										<StatusBadge status={content.status} className="shrink-0" />
									) : null}
								</div>
								<CopyIdButton id={content.recordId} />
							</div>
						))}
					</div>
				</div>
			</div>
		</div>
	);
}

function DetailItem({ label, value }: { label: string; value?: React.ReactNode }) {
	return (
		<div className="flex min-w-0 flex-col gap-2 no-line-height">
			<span className="text-gray-400">{label}</span>
			<span className="text-gray-600 font-medium text-pretty [overflow-wrap:anywhere]">
				{value || EMPTY_VALUE}
			</span>
		</div>
	);
}

function TransferProgress({ transfer }: { transfer: TransferDetailsType }) {
	const isApproved = transfer.patientApprovalStatus === "approved";
	const isRejected = transfer.patientApprovalStatus === "rejected";
	const isSent = transfer.deliveryStatus === "sent";
	const isFailed = transfer.deliveryStatus === "failed";
	const steps = [
		{
			title: "Requested",
			state: "done",
			date: transfer.requestedAt,
			description: transfer.requestedByName ? `Requested by ${transfer.requestedByName}` : null,
		},
		{
			title: "Patient approval",
			state: isApproved ? "done" : isRejected ? "failed" : "current",
			date: isApproved ? transfer.approvedAt : isRejected ? transfer.rejectedAt : null,
			description: isApproved
				? "Approved by the patient"
				: isRejected
					? `Rejected by the patient: ${transfer.patientRejectionReason}`
					: "Waiting for patient response",
		},
		{
			title: "Sent",
			state: isSent ? "done" : isFailed ? "failed" : isApproved ? "current" : "upcoming",
			date: isSent ? transfer.sentAt : isFailed ? transfer.failedAt : null,
			description: isSent
				? `Access code sent to ${transfer.targetHospitalEmail}`
				: isFailed
					? "The access email could not be sent"
					: isRejected
						? "Not sent"
						: "Not started",
		},
	];

	return (
		<div className="mt-6 flex flex-col">
			<h2 className="text-left text-sm font-semibold text-gray-800">Activity</h2>
			<ol className="mt-4 flex flex-col gap-1 px-2">
				{steps.map((step, index) => (
					<li key={step.title} className="grid grid-cols-[auto_1fr] gap-3">
						<div className="flex flex-col items-center gap-1">
							{step.state === "done" ? (
								<RiCheckboxCircleFill aria-hidden="true" className="text-green-500" />
							) : step.state === "failed" ? (
								<RiCloseCircleFill aria-hidden="true" className="text-red-500" />
							) : step.state === "current" ? (
								<div className="relative">
									<RiCheckboxBlankCircleLine aria-hidden="true" />
									<RiCheckboxBlankCircleFill
										aria-hidden="true"
										className="absolute top-1/2 left-1/2 size-3 -translate-x-1/2 -translate-y-1/2"
									/>
								</div>
							) : (
								<RiCheckboxBlankCircleLine aria-hidden="true" className="text-gray-400" />
							)}
							{index < steps.length - 1 ? (
								<div
									className={cn(
										"h-[2.375rem] w-0.5",
										step.state === "done" ? "bg-gray-800" : "bg-gray-400",
									)}
								/>
							) : null}
						</div>
						<div>
							<div className="flex items-center gap-2">
								<span className="font-medium text-gray-600">{step.title}</span>
								{step.date ? (
									<>
										<span
											aria-hidden="true"
											className="inline-block size-1 rounded-full bg-gray-200"
										/>
										<span className="font-medium text-gray-400">{formatDate(step.date)}</span>
									</>
								) : null}
							</div>
							{step.description ? <p className="text-gray-400">{step.description}</p> : null}
						</div>
					</li>
				))}
			</ol>
		</div>
	);
}

function TransferDetailsFallback() {
	return (
		<div className="flex flex-col gap-6" aria-busy="true" aria-live="polite">
			<div className="flex flex-wrap gap-4">
				<div className="h-6 w-36 animate-pulse rounded-md bg-gray-100" />
				<div className="h-6 w-40 animate-pulse rounded-md bg-gray-100" />
				<div className="h-6 w-44 animate-pulse rounded-md bg-gray-100" />
			</div>
			<div className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
				{Array.from({ length: 6 }).map((_, index) => (
					<div key={index} className="flex flex-col gap-2">
						<div className="h-4 w-28 animate-pulse rounded bg-gray-100" />
						<div className="h-5 w-44 animate-pulse rounded bg-gray-100" />
					</div>
				))}
			</div>
			<div className="flex flex-col gap-3 rounded-2xl border border-gray-200 p-4">
				<div className="h-4 w-32 animate-pulse rounded bg-gray-100" />
				<div className="h-5 w-full animate-pulse rounded bg-gray-100" />
				<div className="h-5 w-4/5 animate-pulse rounded bg-gray-100" />
				<div className="h-5 w-3/5 animate-pulse rounded bg-gray-100" />
			</div>
		</div>
	);
}
