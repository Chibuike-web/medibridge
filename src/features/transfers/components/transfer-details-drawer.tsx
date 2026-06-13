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
} from "@remixicon/react";
import { CopyIdButton } from "@/components/copy-id-button";
import { cn } from "@/lib/utils/cn";
import { useId, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
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
			<DrawerContent className="overflow-hidden rounded-3xl data-[vaul-drawer-direction=right]:top-4 data-[vaul-drawer-direction=right]:right-4 data-[vaul-drawer-direction=right]:bottom-4 data-[vaul-drawer-direction=right]:h-auto data-[vaul-drawer-direction=right]:w-[50rem]">
				<DrawerHeader className="border-b border-gray-200 px-6 py-5 text-left flex flex-row justify-between items-center">
					<DrawerTitle className="text-xl text-gray-800 leading-[1.2]">
						Transfer details
					</DrawerTitle>
					<DrawerClose aria-label="Close transfer details">
						<RiCloseLine className="size-6" aria-hidden="true" />
					</DrawerClose>
					<DrawerDescription className="sr-only">
						Showing details for the transfer you selected.
					</DrawerDescription>
				</DrawerHeader>

				<div className="px-6 py-8 overflow-y-auto">
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
											<span className="text-gray-600 font-semibold">{EMPTY_VALUE}</span>
										)}
									</div>
									<div className="flex items-center gap-2 shrink-0">
										<span className="text-gray-400">Patient ID:</span>
										{transfer ? (
											<CopyIdButton id={transfer.patientId} className="text-sm" />
										) : (
											<span className="text-gray-600 font-semibold">{EMPTY_VALUE}</span>
										)}
									</div>
									<div className="flex items-center gap-2 shrink-0">
										<span className="text-gray-400">Transfer ID:</span>
										{transfer ? (
											<CopyIdButton id={transfer.id} className="text-sm" />
										) : (
											<span className="text-gray-600 font-semibold">{EMPTY_VALUE}</span>
										)}
									</div>
								</div>
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
									<DetailItem label="Patient Name:" value={transfer?.patientName} />
									<DetailItem label="Target Hospital:" value={transfer?.targetHospitalName} />
									<DetailItem
										label="Target Hospital Admin Name"
										value={transfer?.targetHospitalAdminName}
									/>
									<DetailItem
										label="Target Hospital Admin Email"
										value={transfer?.targetHospitalAdminEmail}
									/>
									<DetailItem
										label="Requested At"
										value={transfer ? formatDate(transfer.requestedAt) : null}
									/>
									<DetailItem label="Requested By" value={transfer?.requestedBy} />
									<DetailItem label="Created By" value={transfer?.createdBy} />
									<div className="flex flex-col gap-2 sm:col-span-2">
										<span className="text-gray-400">Selected Records</span>
										{transfer && transfer.transferContent.length > 0 ? (
											<div className="flex flex-col gap-3 rounded-2xl border border-gray-200 p-4">
												{transfer.transferContent.map((content) => (
													<div
														key={`${content.contentType}-${content.recordId}`}
														className="flex flex-wrap items-center justify-between gap-3"
													>
														<span className="font-semibold text-gray-600">
															{content.contentType}
														</span>
														<CopyIdButton id={content.recordId} className="text-sm" />
													</div>
												))}
											</div>
										) : (
											<span className="text-gray-600 font-semibold">{EMPTY_VALUE}</span>
										)}
									</div>
								</div>
							</div>
							<TransferProgress />
						</>
					)}
				</div>
				<DrawerFooter className="border-t border-gray-200 px-6 py-5">
					<div className="flex flex-col lg:flex-row gap-x-4 gap-y-2 lg:self-end">
						<DrawerClose asChild>
							<Button className="h-11 bg-[#FB3748]" variant="destructive">
								Cancel transfer
							</Button>
						</DrawerClose>
						<Button className="h-11">Resend approval request</Button>
					</div>
				</DrawerFooter>
			</DrawerContent>
		</Drawer>
	);
}

function DetailItem({ label, value }: { label: string; value?: string | null }) {
	return (
		<div className="flex flex-col gap-2 shrink-0">
			<span className="text-gray-400">{label}</span>
			<span className="text-gray-600 font-semibold">{value || EMPTY_VALUE}</span>
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

function TransferProgress() {
	const [isExpanded, setIsExpanded] = useState(false);
	const shouldReduceMotion = useReducedMotion();
	const sectionId = useId();
	const titleId = `${sectionId}-title`;
	const panelId = `${sectionId}-panel`;

	return (
		<div className="mt-6 flex flex-col rounded-2xl border border-gray-200 p-5">
			<button
				type="button"
				onClick={() => setIsExpanded((prev) => !prev)}
				aria-expanded={isExpanded}
				aria-controls={panelId}
				className="flex w-full items-center justify-between"
			>
				<div className="flex flex-col lg:flex-row lg:items-center gap-x-2 gap-y-1">
					<span id={titleId} className="text-left text-lg font-semibold text-gray-800">
						Transfer Progress{" "}
					</span>
					<span className="text-sm text-muted-foreground text-left">22 January 2026 at 14:10</span>
				</div>
				<RiArrowDownSLine
					className={cn(
						"transition-transform duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none",
						isExpanded ? "rotate-180" : "",
					)}
					aria-hidden="true"
				/>
			</button>
			<AnimatePresence>
				{isExpanded && (
					<motion.div
						initial={shouldReduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
						animate={shouldReduceMotion ? { opacity: 1 } : { height: "auto", opacity: 1 }}
						exit={shouldReduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
						transition={
							shouldReduceMotion
								? { duration: 0.12 }
								: {
										height: { duration: 0.22, ease: [0.23, 1, 0.32, 1] },
										opacity: { duration: 0.16, ease: "easeOut" },
									}
						}
						className="overflow-hidden"
					>
						<div aria-labelledby={titleId} className="flex flex-col px-2 gap-1 mt-4">
							{/* Item */}
							<div className="grid grid-cols-[auto_1fr] gap-3">
								{/* Left column */}
								<div className="flex flex-col items-center gap-1">
									<RiCheckboxCircleFill aria-hidden="true" className="text-green-500" />
									<div className="h-[2.375rem] w-0.5 bg-gray-800" />
								</div>

								{/* Right column */}
								<div>
									<span className="font-semibold text-gray-600">Requested</span>
									<p className="text-gray-400">Initiated by Dr. Adebayo</p>
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
									<span className="font-semibold text-gray-600">Patient Approval</span>
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
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}
