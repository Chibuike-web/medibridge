"use client";

import Image from "next/image";
import { CopyIdButton } from "@/components/copy-id-button";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
	Drawer,
	DrawerClose,
	DrawerContent,
	DrawerDescription,
	DrawerFooter,
	DrawerHeader,
	DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
	Select,
	SelectContent,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
	AttachmentFormFields,
	type AttachmentFormRow,
} from "@/features/patients/components/attachment-form-fields";
import {
	ImagingModalityOptions,
	ImagingStatusOptions,
} from "@/features/patients/components/create-imaging-drawer";
import type { ImagingType } from "@/features/patients/types";
import pdfFileFormat from "@/assets/file-formats/pdf.svg";
import { cn } from "@/lib/utils/cn";
import {
	RiAddLine,
	RiArrowDownSLine,
	RiCalendarLine,
	RiCloseLine,
	RiEditLine,
} from "@remixicon/react";
import { format } from "date-fns";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useId, useRef, useState } from "react";

type ImagingDetailsDrawerProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	imaging: ImagingType | null;
};

type ImagingHistoryItem = {
	label: string;
	value: string;
	type?: "status";
};

const imagingDetailsFieldLabelClassName =
	"inline-flex items-baseline gap-0.5 text-sm font-medium text-gray-700";
const imagingDetailsRequiredLabelClassName = "font-normal text-gray-400";
const imagingDetailsFieldControlClassName =
	"border-gray-200 bg-white text-gray-700 shadow-xs placeholder:text-gray-400 text-sm h-9";

export function ImagingDetailsDrawer({ open, onOpenChange, imaging }: ImagingDetailsDrawerProps) {
	const [imagingDetailsMode, setImagingDetailsMode] = useState<"view" | "edit">("view");

	function handleImagingDetailsOpenChange(nextOpen: boolean) {
		if (!nextOpen) {
			setImagingDetailsMode("view");
		}

		onOpenChange(nextOpen);
	}

	const isEditingImagingDetails = imagingDetailsMode === "edit" && Boolean(imaging);

	return (
		<Drawer open={open} onOpenChange={handleImagingDetailsOpenChange} direction="right">
			<DrawerContent className="overflow-hidden rounded-3xl text-sm data-[vaul-drawer-direction=right]:top-4 data-[vaul-drawer-direction=right]:right-4 data-[vaul-drawer-direction=right]:bottom-4 data-[vaul-drawer-direction=right]:h-auto data-[vaul-drawer-direction=right]:w-[50rem]">
				<DrawerHeader className="flex-row items-center justify-between border-b border-gray-200 px-6 py-5 text-left">
					<DrawerTitle className="text-lg leading-[1.2] text-gray-800">
						{isEditingImagingDetails ? "Edit imaging details" : "View imaging details"}
					</DrawerTitle>
					<DrawerClose aria-label="Close imaging details drawer">
						<RiCloseLine className="size-6" aria-hidden="true" />
					</DrawerClose>
					<DrawerDescription className="sr-only">
						{isEditingImagingDetails
							? "Edit the selected imaging details."
							: "Showing details for the imaging study you selected."}
					</DrawerDescription>
				</DrawerHeader>

				<div className="min-h-0 overflow-y-auto px-6 py-8 text-sm">
					{isEditingImagingDetails && imaging ? (
						<ImagingDetailsEditForm imaging={imaging} />
					) : imaging ? (
						<ImagingDetailsView
							imaging={imaging}
							onEditImagingDetails={() => setImagingDetailsMode("edit")}
						/>
					) : (
						<div className="rounded-2xl border border-gray-200 p-5 text-gray-500">
							Imaging details could not be found.
						</div>
					)}
				</div>

				<DrawerFooter className="border-t border-gray-200 px-6 py-5 text-sm">
					{isEditingImagingDetails ? (
						<div className="flex flex-col gap-x-4 gap-y-2 lg:flex-row lg:self-end">
							<Button
								type="button"
								variant="outline"
								className="text-sm"
								onClick={() => setImagingDetailsMode("view")}
							>
								Cancel
							</Button>
							<Button
								type="button"
								className="bg-gray-800 text-sm"
								onClick={() => setImagingDetailsMode("view")}
							>
								Save Changes
							</Button>
						</div>
					) : (
						<div className="flex flex-col gap-x-4 gap-y-2 lg:flex-row lg:self-end">
							<DrawerClose asChild>
								<Button type="button" variant="outline" className="text-sm">
									Cancel
								</Button>
							</DrawerClose>
							<Button type="button" className="bg-gray-800 text-sm">
								Archive Imaging
							</Button>
						</div>
					)}
				</DrawerFooter>
			</DrawerContent>
		</Drawer>
	);
}

function ImagingDetailsView({
	imaging,
	onEditImagingDetails,
}: {
	imaging: ImagingType;
	onEditImagingDetails: () => void;
}) {
	const hasImagingFile = Boolean(imaging.fileName);

	return (
		<div className="flex flex-col gap-10">
			<div className="flex flex-wrap items-center gap-x-8 gap-y-3 text-nowrap">
				<div className="flex items-center gap-2">
					<span className="text-gray-400">Imaging ID:</span>
					<CopyIdButton id={imaging.imagingId} className="text-sm" />
				</div>
				{imaging.encounterId ? (
					<div className="flex items-center gap-2">
						<span className="text-gray-400">Encounter ID:</span>
						<CopyIdButton id={imaging.encounterId} className="text-sm" />
					</div>
				) : null}
			</div>

			<div className="flex flex-col gap-6">
				<div className="flex flex-wrap items-center justify-between gap-4">
					<div className="flex items-center gap-3">
						<h2 className="text-xl font-semibold text-gray-800">{imaging.study}</h2>
						<StatusBadge status={imaging.status} />
					</div>
					<button
						type="button"
						onClick={onEditImagingDetails}
						className="inline-flex items-center gap-2 text-sm font-medium text-gray-400 transition hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-300"
					>
						<RiEditLine className="size-4" aria-hidden="true" />
						Edit
					</button>
				</div>

				<div className="grid grid-cols-1 gap-x-16 gap-y-6 sm:grid-cols-2">
					<ImagingDetailItem label="Impression" value={imaging.impression} />
					<ImagingDetailItem label="Region" value={imaging.region} />
					<ImagingDetailItem label="Modality" value={imaging.modality} />
					<ImagingDetailItem label="Ordered at" value={imaging.orderedAtLabel} />
					<ImagingDetailItem label="Ordered by" value={imaging.orderedBy} />
					<ImagingDetailItem label="Created by" value={imaging.createdBy} />
					<ImagingDetailItem label="Created at" value={imaging.createdAtLabel} />
					<ImagingDetailItem label="Updated by" value={imaging.updatedBy} />
					<ImagingDetailItem label="Updated at" value={imaging.updatedAtLabel} />
					<ImagingDetailItem label="Clinical notes" value={imaging.clinicalNote} />
				</div>
			</div>

			<div className="flex flex-col gap-6">
				<ImagingHistoryCard
					title="Updated"
					timestamp={imaging.updatedAtLabel}
					items={[
						{ label: "Impression", value: imaging.impression },
						{ label: "Status", value: imaging.status, type: "status" },
						{ label: "Reported by", value: imaging.reportedBy },
						{ label: "Clinical notes", value: imaging.clinicalNote },
					]}
					file={hasImagingFile ? imaging : null}
				/>

				<ImagingHistoryCard
					title="Created"
					timestamp={imaging.createdAtLabel}
					items={[
						{ label: "Status", value: "Pending", type: "status" },
						{ label: "Region", value: imaging.region },
						{ label: "Modality", value: imaging.modality },
						{ label: "Ordered by", value: imaging.orderedBy },
						{ label: "Ordered at", value: imaging.orderedAtLabel },
						{ label: "Created by", value: imaging.createdBy },
					]}
				/>

				{hasImagingFile ? (
					<ImagingHistoryCard
						title="Imaging Files"
						timestamp={imaging.updatedAtLabel}
						items={[]}
						file={imaging}
					/>
				) : null}
			</div>
		</div>
	);
}

function ImagingDetailItem({ label, value }: { label: string; value: string }) {
	return (
		<div className="flex flex-col gap-2">
			<span className="text-gray-400">{label}</span>
			<span className="font-semibold text-gray-600">{value || "-"}</span>
		</div>
	);
}

function ImagingHistoryCard({
	title,
	timestamp,
	items,
	file,
}: {
	title: string;
	timestamp: string;
	items: ImagingHistoryItem[];
	file?: ImagingType | null;
}) {
	const [isImagingHistoryExpanded, setIsImagingHistoryExpanded] = useState(true);
	const shouldReduceMotion = useReducedMotion();
	const sectionId = useId();
	const titleId = `${sectionId}-title`;
	const panelId = `${sectionId}-panel`;

	return (
		<section className="flex flex-col rounded-2xl border border-gray-200 p-5">
			<button
				type="button"
				onClick={() => setIsImagingHistoryExpanded((prev) => !prev)}
				aria-expanded={isImagingHistoryExpanded}
				aria-controls={panelId}
				className="flex w-full items-center justify-between gap-4 text-left"
			>
				<div className="flex flex-wrap items-center gap-1.5">
					<span id={titleId} className="text-base font-semibold text-gray-800">
						{title}
					</span>
					{timestamp ? <span className="text-gray-400">{timestamp}</span> : null}
				</div>
				<RiArrowDownSLine
					className={cn(
						"size-5 shrink-0 transition-transform duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none",
						isImagingHistoryExpanded ? "rotate-180" : "",
					)}
					aria-hidden="true"
				/>
			</button>
			<AnimatePresence initial={false}>
				{isImagingHistoryExpanded ? (
					<motion.div
						id={panelId}
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
						<div aria-labelledby={titleId}>
							{items.length > 0 ? (
								<div className="mt-6 grid grid-cols-1 gap-x-16 gap-y-5 sm:grid-cols-2">
									{items.map((item) => (
										<ImagingHistoryDetailItem key={`${title}-${item.label}`} item={item} />
									))}
								</div>
							) : null}

							{file ? <ImagingFileCard imaging={file} className="mt-6" /> : null}
						</div>
					</motion.div>
				) : null}
			</AnimatePresence>
		</section>
	);
}

function ImagingHistoryDetailItem({ item }: { item: ImagingHistoryItem }) {
	return (
		<div className="flex flex-col gap-2">
			<span className="text-gray-400">{item.label}</span>
			{item.type === "status" ? (
				<StatusBadge status={item.value || "Pending"} className="w-max" />
			) : (
				<span className="font-semibold text-gray-600">{item.value || "-"}</span>
			)}
		</div>
	);
}

function ImagingFileCard({ imaging, className }: { imaging: ImagingType; className?: string }) {
	return (
		<div
			className={`flex flex-col gap-4 rounded-2xl border border-gray-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between ${className ?? ""}`}
		>
			<div className="flex min-w-0 items-center gap-4">
				<Image src={pdfFileFormat} alt="" width={40} height={40} className="shrink-0" />
				<div className="min-w-0">
					<p className="truncate font-semibold text-gray-800">{imaging.fileName}</p>
					<p className="mt-1 text-sm text-gray-500">{imaging.fileSize || "120KB"}</p>
				</div>
			</div>
			<div className="flex flex-col gap-3 sm:flex-row">
				<Button type="button" variant="outline" className="text-sm">
					Download
				</Button>
				<Button type="button" className="bg-gray-800 text-sm">
					View Scan
				</Button>
			</div>
		</div>
	);
}

function ImagingDetailsEditForm({ imaging }: { imaging: ImagingType }) {
	const generatedAttachmentRowId = useId();
	const nextAttachmentRowNumberRef = useRef(0);
	const [orderedAt, setOrderedAt] = useState<Date | undefined>();
	const [imagingAttachmentRows, setImagingAttachmentRows] = useState<AttachmentFormRow[]>([]);
	const selectedModalityValue = getImagingSelectValue(imaging.modality);
	const selectedStatusValue = imaging.status.toLowerCase();
	const orderedAtDisplayValue = orderedAt
		? format(orderedAt, "PPP")
		: imaging.orderedAtLabel !== "-"
			? imaging.orderedAtLabel
			: "Select date";

	function handleAddImagingAttachmentRow() {
		nextAttachmentRowNumberRef.current += 1;

		setImagingAttachmentRows((prev) => [
			...prev,
			{
				id: `${generatedAttachmentRowId}-attachment-${nextAttachmentRowNumberRef.current}`,
				name: "",
				recordId: "",
			},
		]);
	}

	function handleRemoveImagingAttachmentRow(attachmentRowId: string) {
		setImagingAttachmentRows((prev) =>
			prev.filter((attachmentRow) => attachmentRow.id !== attachmentRowId),
		);
	}

	return (
		<form className="flex flex-col gap-12">
			<div className="flex flex-wrap items-center gap-x-8 gap-y-3 text-nowrap">
				<div className="flex items-center gap-2">
					<span className="text-gray-400">Imaging ID:</span>
					<CopyIdButton id={imaging.imagingId} className="text-sm" />
				</div>
				{imaging.encounterId ? (
					<div className="flex items-center gap-2">
						<span className="text-gray-400">Encounter ID:</span>
						<CopyIdButton id={imaging.encounterId} className="text-sm" />
					</div>
				) : null}
			</div>

			<div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2">
				<div className="flex flex-col gap-2 sm:col-span-2">
					<Label htmlFor="edit-imaging-study" className={imagingDetailsFieldLabelClassName}>
						Study<span className={imagingDetailsRequiredLabelClassName}>(required)</span>
					</Label>
					<Input
						id="edit-imaging-study"
						name="study"
						defaultValue={imaging.study}
						className={imagingDetailsFieldControlClassName}
					/>
				</div>

				<div className="flex flex-col gap-2 sm:col-span-2">
					<Label htmlFor="edit-imaging-region" className={imagingDetailsFieldLabelClassName}>
						Region<span className={imagingDetailsRequiredLabelClassName}>(required)</span>
					</Label>
					<Input
						id="edit-imaging-region"
						name="region"
						defaultValue={imaging.region}
						className={imagingDetailsFieldControlClassName}
					/>
				</div>

				<div className="flex flex-col gap-2">
					<Label htmlFor="edit-imaging-modality" className={imagingDetailsFieldLabelClassName}>
						Modality<span className={imagingDetailsRequiredLabelClassName}>(required)</span>
					</Label>
					<Select defaultValue={selectedModalityValue}>
						<SelectTrigger
							id="edit-imaging-modality"
							className={`${imagingDetailsFieldControlClassName} w-full`}
						>
							<SelectValue placeholder="Select modality" />
						</SelectTrigger>
						<SelectContent className="rounded-xl border-gray-200 p-1 text-sm text-gray-700 shadow-xl">
							<ImagingModalityOptions />
						</SelectContent>
					</Select>
				</div>

				<div className="flex flex-col gap-2">
					<Label className={imagingDetailsFieldLabelClassName}>
						Ordered at<span className={imagingDetailsRequiredLabelClassName}>(required)</span>
					</Label>
					<input
						type="hidden"
						name="orderedAt"
						value={orderedAt ? format(orderedAt, "yyyy-MM-dd") : imaging.orderedAtValue}
					/>
					<Popover>
						<PopoverTrigger asChild>
							<Button
								type="button"
								variant="outline"
								data-empty={!orderedAt && imaging.orderedAtLabel === "-"}
								className={`${imagingDetailsFieldControlClassName} flex w-full items-center justify-between gap-3 font-normal data-[empty=true]:text-gray-400 hover:bg-white active:scale-100`}
							>
								<span className="min-w-0 truncate">{orderedAtDisplayValue}</span>
								<RiCalendarLine className="size-4 shrink-0 text-gray-600" aria-hidden="true" />
							</Button>
						</PopoverTrigger>
						<PopoverContent className="p-0">
							<Calendar mode="single" selected={orderedAt} onSelect={setOrderedAt} autoFocus />
						</PopoverContent>
					</Popover>
				</div>

				<div className="flex flex-col gap-2">
					<Label htmlFor="edit-imaging-ordered-by" className={imagingDetailsFieldLabelClassName}>
						Ordered by<span className={imagingDetailsRequiredLabelClassName}>(required)</span>
					</Label>
					<Input
						id="edit-imaging-ordered-by"
						name="orderedBy"
						defaultValue={imaging.orderedBy}
						placeholder="e.g. Dr. Adebayo Johnson"
						className={imagingDetailsFieldControlClassName}
					/>
				</div>

				<div className="flex flex-col gap-2">
					<Label htmlFor="edit-imaging-status" className={imagingDetailsFieldLabelClassName}>
						Status<span className={imagingDetailsRequiredLabelClassName}>(required)</span>
					</Label>
					<Select defaultValue={selectedStatusValue}>
						<SelectTrigger
							id="edit-imaging-status"
							className={`${imagingDetailsFieldControlClassName} w-full`}
						>
							<SelectValue placeholder="Select status" />
						</SelectTrigger>
						<SelectContent className="rounded-xl border-gray-200 p-1 text-sm text-gray-700 shadow-xl">
							<ImagingStatusOptions />
						</SelectContent>
					</Select>
				</div>

				<div className="flex flex-col gap-2 sm:col-span-2">
					<Label htmlFor="edit-imaging-impression" className={imagingDetailsFieldLabelClassName}>
						Impression<span className={imagingDetailsRequiredLabelClassName}>(required)</span>
					</Label>
					<Textarea
						id="edit-imaging-impression"
						name="impression"
						defaultValue={imaging.impression === "-" ? "" : imaging.impression}
						placeholder="e.g. Suspicious liver lesion identified in the right hepatic lobe"
						className="min-h-20 border-gray-200 bg-white text-sm text-gray-700 shadow-xs placeholder:text-gray-400"
					/>
				</div>

				<div className="flex flex-col gap-2 sm:col-span-2">
					<Label htmlFor="edit-imaging-clinical-notes" className={imagingDetailsFieldLabelClassName}>
						Clinical notes<span className={imagingDetailsRequiredLabelClassName}>(optional)</span>
					</Label>
					<Textarea
						id="edit-imaging-clinical-notes"
						name="clinicalNote"
						defaultValue={imaging.clinicalNote === "-" ? "" : imaging.clinicalNote}
						placeholder="Add additional findings, preparation instructions, or radiology notes"
						className="min-h-28 border-gray-200 bg-white text-sm text-gray-700 shadow-xs placeholder:text-gray-400"
					/>
				</div>
			</div>

			<div className="flex flex-col gap-6">
				{imagingAttachmentRows.map((attachmentRow, attachmentIndex) => (
					<AttachmentFormFields
						key={attachmentRow.id}
						attachmentRow={attachmentRow}
						attachmentIndex={attachmentIndex}
						fieldLabelClassName={imagingDetailsFieldLabelClassName}
						requiredLabelClassName={imagingDetailsRequiredLabelClassName}
						fieldControlClassName={imagingDetailsFieldControlClassName}
						onRemoveAttachmentRow={handleRemoveImagingAttachmentRow}
					/>
				))}

				<div>
					<Button
						type="button"
						variant="outline"
						className="border-gray-200 bg-white text-sm text-gray-600 shadow-xs"
						onClick={handleAddImagingAttachmentRow}
					>
						<RiAddLine className="size-5" aria-hidden="true" />
						Add related record
					</Button>
				</div>
			</div>
		</form>
	);
}

function getImagingSelectValue(value: string) {
	return value.toLowerCase().replaceAll(" ", "-");
}
