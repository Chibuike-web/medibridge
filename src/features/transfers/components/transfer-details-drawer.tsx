"use client";

import {
	Drawer,
	DrawerClose,
	DrawerContent,
	DrawerDescription,
	DrawerFooter,
	DrawerHeader,
	DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import {
	RiArrowDownSLine,
	RiCheckboxBlankCircleFill,
	RiCheckboxBlankCircleLine,
	RiCheckboxCircleFill,
	RiCloseLine,
	RiMore2Fill,
} from "@remixicon/react";
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
};

const EMPTY_VALUE = "-";

export function TransferDetailsDrawer({
	open,
	onOpenChange,
	transfer,
	isLoading,
}: TransferDetailsDrawerProps) {
	return (
		<Drawer open={open} onOpenChange={onOpenChange} direction="right">
			<DrawerContent className="overflow-hidden rounded-3xl text-sm data-[vaul-drawer-direction=right]:top-4 data-[vaul-drawer-direction=right]:right-4 data-[vaul-drawer-direction=right]:bottom-4 data-[vaul-drawer-direction=right]:h-auto data-[vaul-drawer-direction=right]:w-[50rem]">
				<DrawerHeader className="border-b border-gray-200 text-left flex-row gap-4 items-center">
					<DrawerTitle className="text-gray-800 leading-[1.2] flex-1">
						View transfer details
					</DrawerTitle>
					<Button variant="ghost" size="icon">
						<RiMore2Fill className="size-5" />
					</Button>
					<DrawerClose aria-label="Close transfer details" asChild>
						<Button variant="ghost" size="icon">
							<RiCloseLine className="size-5" aria-hidden="true" />
						</Button>
					</DrawerClose>
					<DrawerDescription className="sr-only">
						Showing details for the transfer you selected.
					</DrawerDescription>
				</DrawerHeader>

				<div className="px-4 py-6 overflow-y-auto text-sm">
					{isLoading ? (
						<TransferDetailsFallback />
					) : (
						<>
							<div className="flex flex-col gap-6">
								<div className="flex items-center gap-x-6 gap-y-2 flex-wrap text-nowrap">
									<div className="flex items-center gap-2 shrink-0">
										<span className="text-gray-400">Transfer Status:</span>
										{transfer ? (
											<StatusBadge status={transfer.status} className="text-sm" />
										) : (
											<span className="text-gray-600 font-medium">{EMPTY_VALUE}</span>
										)}
									</div>
									<div className="flex items-center gap-2 shrink-0">
										<span className="text-gray-400">Patient ID:</span>
										{transfer ? (
											<CopyIdButton id={transfer.patientId} className="text-sm" />
										) : (
											<span className="text-gray-600 font-medium">{EMPTY_VALUE}</span>
										)}
									</div>
									<div className="flex items-center gap-2 shrink-0">
										<span className="text-gray-400">Transfer ID:</span>
										{transfer ? (
											<CopyIdButton id={transfer.id} className="text-sm" />
										) : (
											<span className="text-gray-600 font-medium">{EMPTY_VALUE}</span>
										)}
									</div>
								</div>
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
									<DetailItem label="Patient Name:" value={transfer?.patientName} />
									<DetailItem label="Target Hospital:" value={transfer?.targetHospitalName} />
									<DetailItem label="Target Hospital Email" value={transfer?.targetHospitalEmail} />
								</div>
								{transfer && transfer.transferContent.length > 0 ? (
									<TransferContentSections transferContent={transfer.transferContent} />
								) : null}
							</div>
							<TransferProgress
								requestedAt={transfer?.requestedAt}
								requestedBy={transfer?.requestedBy}
								createdBy={transfer?.createdBy}
							/>
						</>
					)}
				</div>
				<DrawerFooter className="border-t border-gray-200 text-sm">
					<div className="flex flex-col gap-2 lg:flex-row lg:self-end">
						<DrawerClose asChild>
							<Button className="bg-[#FB3748]" variant="destructive">
								Cancel transfer
							</Button>
						</DrawerClose>
						<Button>Resend approval request</Button>
					</div>
				</DrawerFooter>
			</DrawerContent>
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
			<button
				type="button"
				onClick={() => setIsTransferContentGroupExpanded((prev) => !prev)}
				aria-expanded={isTransferContentGroupExpanded}
				aria-controls={panelId}
				className="flex w-full items-center justify-between gap-4 text-left"
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
			</button>

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
								<CopyIdButton id={content.recordId} className="text-sm" />
							</div>
						))}
					</div>
				</div>
			</div>
		</div>
	);
}

function DetailItem({ label, value }: { label: string; value?: string | null }) {
	return (
		<div className="flex flex-col gap-2 shrink-0 no-line-height">
			<span className="text-gray-400">{label}</span>
			<span className="text-gray-600 font-medium">{value || EMPTY_VALUE}</span>
		</div>
	);
}

function TransferProgress({
	requestedAt,
	requestedBy,
	createdBy,
}: {
	requestedAt?: string | null;
	requestedBy?: string | null;
	createdBy?: string | null;
}) {
	return (
		<div className="mt-6 flex flex-col">
			<h2 className="text-left text-sm font-semibold text-gray-800">Activity </h2>

			<div className="mt-4 flex flex-col gap-1 px-2">
				{/* Item */}
				<div className="grid grid-cols-[auto_1fr] gap-3">
					{/* Left column */}
					<div className="flex flex-col items-center gap-1">
						<RiCheckboxCircleFill aria-hidden="true" className="text-green-500" />
						<div className="h-[2.375rem] w-0.5 bg-gray-800" />
					</div>

					{/* Right column */}
					<div>
						<div className="flex gap-2 items-center">
							<span className="font-medium text-gray-600">Requested</span>
							<span className="inline-block bg-gray-200 size-1 rounded-full" />
							<span className="font-medium text-gray-400">{formatDate(requestedAt ?? "")}</span>
						</div>
						<p className="text-gray-400">Initiated by {requestedBy || createdBy}</p>
					</div>
				</div>

				{/* Item */}
				<div className="grid grid-cols-[auto_1fr] gap-3">
					<div className="flex flex-col items-center gap-1">
						<div className="relative">
							<RiCheckboxBlankCircleLine aria-hidden="true" />
							<RiCheckboxBlankCircleFill
								aria-hidden="true"
								className="size-3 absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2"
							/>
						</div>
						<div className="h-[2.375rem] w-0.5 bg-gray-400" />
					</div>

					<div>
						<div className="flex gap-2 items-center">
							<span className="font-medium text-gray-600">Patient Approval</span>
							<span className="inline-block bg-gray-200 size-1 rounded-full" />
							<span className="font-medium text-gray-400">22 January 2026 at 14:10</span>
						</div>
						<p className="text-gray-400">Waiting for patient response</p>
					</div>
				</div>

				{/* Last item (no line) */}
				<div className="grid grid-cols-[auto_1fr] gap-3">
					<RiCheckboxBlankCircleLine aria-hidden="true" className="text-gray-400" />
					<div>
						<span className="font-semibold text-gray-600">Sent</span>
						<p className="text-gray-400">Not started</p>
					</div>
				</div>
			</div>
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
			<div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
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
