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
import {
	RiArrowDownSLine,
	RiCheckboxBlankCircleFill,
	RiCheckboxBlankCircleLine,
	RiCheckboxCircleFill,
	RiCloseLine,
} from "@remixicon/react";
import { CopyIdButton } from "@/components/copy-id-button";
import { cn } from "@/lib/utils/cn";
import { statusStyles } from "@/lib/utils/status-styles";
import { useId, useState } from "react";
import pdfFileFormat from "@/assets/file-formats/pdf.svg";
import Image from "next/image";
import { formatFileSize } from "@/lib/utils/format-file-size";

type TransferDetailsDrawerProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	transferId: string | null;
};

export function TransferDetailsDrawer({
	open,
	onOpenChange,
	transferId,
}: TransferDetailsDrawerProps) {
	const statusClassName = statusStyles["Pending".toLowerCase() as keyof typeof statusStyles];

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
						Showing the ID for the transfer you selected.
					</DrawerDescription>
				</DrawerHeader>

				<div className="px-6 py-8 overflow-y-auto">
					<div className="flex flex-col gap-6">
						<div className="flex items-center gap-x-6 gap-y-2 flex-wrap text-nowrap">
							<div className="flex items-center gap-2 shrink-0">
								<span className="text-gray-400">Transfer Status:</span>
								<span
									className={cn(
										"inline-flex rounded-full px-3 py-1 text-sm font-semibold",
										statusClassName,
									)}
								>
									Pending
								</span>
							</div>
							<div className="flex items-center gap-2 shrink-0">
								<span className="text-gray-400">Patient ID:</span>
								<CopyIdButton id="DIA-101" className="text-sm" />
							</div>
							<div className="flex items-center gap-2 shrink-0">
								<span className="text-gray-400">Transfer ID:</span>
								<CopyIdButton id="DIA-101" className="text-sm" />
							</div>
						</div>
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
							<div className="flex flex-col gap-2 shrink-0">
								<span className="text-gray-400">Patient Name:</span>
								<span className="text-gray-600 font-semibold">Lena Muller</span>
							</div>
							<div className="flex flex-col gap-2 shrink-0">
								<span className="text-gray-400">Target Hospital:</span>
								<span className="text-gray-600 font-semibold">
									University College Hospital (UCH), Ibadan
								</span>
							</div>
							<div className="flex flex-col gap-2 shrink-0">
								<span className="text-gray-400">Target Hospital Admin Name</span>
								<span className="text-gray-600 font-semibold">Dr. Adebayo</span>
							</div>
							<div className="flex flex-col gap-2 shrink-0">
								<span className="text-gray-400">Target Hospital Admin Email</span>
								<span className="text-gray-600 font-semibold">adebayo@luth.org</span>
							</div>
							<div className="flex flex-col gap-2 shrink-0">
								<span className="text-gray-400">Requested At</span>
								<span className="text-gray-600 font-semibold">17th Apr 2024, 12:30PM</span>
							</div>
							<div className="flex flex-col gap-2 shrink-0">
								<span className="text-gray-400">Transfer content</span>
								<ul className="list-disc ml-6 text-gray-600 font-semibold">
									<li>Medications</li>
									<li>Medical History</li>
									<li>Labs</li>
								</ul>
							</div>
						</div>
					</div>
					<ClinicalPayload />
					<TransferProgress />
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

function ClinicalPayload() {
	const [isExpanded, setIsExpanded] = useState(false);
	const sectionId = useId();
	const titleId = `${sectionId}-title`;
	const panelId = `${sectionId}-panel`;

	return (
		<div className="mt-6 flex flex-col gap-4 rounded-2xl border border-gray-200 p-5">
			<button
				type="button"
				onClick={() => setIsExpanded((prev) => !prev)}
				aria-expanded={isExpanded}
				aria-controls={panelId}
				className="flex w-full items-center justify-between"
			>
				<div className="flex flex-col lg:flex-row lg:items-center gap-x-2 gap-y-1">
					<span id={titleId} className="text-left text-lg font-semibold text-gray-800">
						Clinical Payload
					</span>
					<span className="text-sm text-muted-foreground text-left">22 January 2026 at 14:10</span>
				</div>
				<RiArrowDownSLine
					className={cn("transition-transform", isExpanded ? "rotate-180" : "")}
					aria-hidden="true"
				/>
			</button>

			{isExpanded && (
				<div id={panelId} aria-labelledby={titleId} className="flex flex-col gap-4">
					<div className="flex items-center gap-2 rounded-2xl border border-gray-200 px-3.5 py-4">
						<Image src={pdfFileFormat} alt="" width={40} height={40} />

						<div className="flex flex-col gap-1">
							<p className="text-sm font-semibold text-gray-800">Patient_Record_A123456.pdf</p>
							<div className="flex items-center gap-1 text-sm text-gray-400">
								<p>{formatFileSize(10000)}</p>
								<span className="size-0.5 block rounded-full bg-foreground" aria-hidden="true" />
							</div>
						</div>
					</div>
					<div className="flex flex-col lg:flex-row gap-x-4 gap-y-2 ">
						<Button className="flex flex-1 h-11" variant="outline">
							Download Record
						</Button>
						<Button className="flex flex-1 h-11">View Record</Button>
					</div>
				</div>
			)}
		</div>
	);
}

function TransferProgress() {
	const [isExpanded, setIsExpanded] = useState(false);
	const sectionId = useId();
	const titleId = `${sectionId}-title`;
	const panelId = `${sectionId}-panel`;

	return (
		<div className="mt-6 flex flex-col gap-4 rounded-2xl border border-gray-200 p-5">
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
					className={cn("transition-transform", isExpanded ? "rotate-180" : "")}
					aria-hidden="true"
				/>
			</button>

			{isExpanded && (
				<div id={panelId} aria-labelledby={titleId} className="flex flex-col px-2">
					<div className="flex items-center gap-3">
						<RiCheckboxCircleFill aria-hidden="true" />
						<div className="flex flex-col">
							<span className="font-semibold text-gray-600">Requested</span>
							<span className="text-gray-400">Initiated by Dr. Adebayo</span>
						</div>
					</div>
					<div className="px-[0.6875rem]">
						<span className="inline-block h-8 w-0.5 bg-gray-600" />
					</div>
					<div className="flex items-center gap-3">
						<RiCheckboxBlankCircleFill aria-hidden="true" />
						<div className="flex flex-col">
							<span className="font-semibold text-gray-600">Patient Approval</span>
							<span className="text-gray-400">Waiting for patient response</span>
						</div>
					</div>
					<div className="px-[0.6875rem]">
						<span className="inline-block h-8 w-0.5 bg-gray-600" />
					</div>
					<div className="flex items-center gap-3">
						<RiCheckboxBlankCircleLine aria-hidden="true" />
						<div className="flex flex-col">
							<span className="font-semibold text-gray-600">Sent</span>
							<span className="text-gray-400">No started</span>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
