"use client";

import { CopyIdButton } from "@/components/copy-id-button";
import { ChooseFileCard } from "@/components/choose-file-card";
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
import { Select, SelectContent, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
	AttachmentFormFields,
	type AttachmentFormRow,
} from "@/features/patients/components/attachment-form-fields";
import {
	ImagingModalityOptions,
	ImagingStatusOptions,
} from "@/features/patients/components/create-imaging-drawer";
import type { ImagingDetailsHistoryEvent, ImagingType } from "@/features/patients/types";
import { cn } from "@/lib/utils/cn";
import { getDocumentFileIcon } from "@/lib/utils/document-file-icon";
import {
	RiAddLine,
	RiArrowDownSLine,
	RiCalendarLine,
	RiCloseLine,
	RiEditLine,
} from "@remixicon/react";
import { format } from "date-fns";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import { useId, useRef, useState } from "react";

type ImagingDetailsDrawerProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	imaging: ImagingType | null;
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
						<div className="flex flex-col gap-10">
							<ImagingDetailsOverview
								imaging={imaging}
								onEditImagingDetails={() => setImagingDetailsMode("edit")}
							/>
							<ImagingFilesSection files={imaging.files} />
							<ImagingHistorySection history={imaging.history} />
						</div>
					) : (
						<div className="rounded-2xl border border-gray-200 p-5 text-gray-500">
							Imaging details could not be found.
						</div>
					)}
				</div>

				<DrawerFooter className="border-t border-gray-200 px-6 py-5 text-sm">
					{isEditingImagingDetails ? (
						<div className="flex flex-col gap-x-4 gap-y-2 lg:flex-row lg:self-end">
							<Button type="button" variant="outline" onClick={() => setImagingDetailsMode("view")}>
								Cancel
							</Button>
							<Button type="button" onClick={() => setImagingDetailsMode("view")}>
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
							<Button type="button">Archive Imaging</Button>
						</div>
					)}
				</DrawerFooter>
			</DrawerContent>
		</Drawer>
	);
}

function ImagingDetailsOverview({
	imaging,
	onEditImagingDetails,
}: {
	imaging: ImagingType;
	onEditImagingDetails: () => void;
}) {
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
		</div>
	);
}

function ImagingDetailItem({ label, value }: { label: string; value: string }) {
	return (
		<div className="flex flex-col gap-2">
			<span className="text-gray-400">{label}</span>
			{label === "Status" ? (
				<StatusBadge status={value || "Pending"} className="w-max" />
			) : (
				<span className="font-semibold text-gray-600">{value || "-"}</span>
			)}
		</div>
	);
}

function ImagingFilesSection({ files }: { files: ImagingType["files"] }) {
	const [areImagingFilesExpanded, setAreImagingFilesExpanded] = useState(false);
	const visibleFiles = areImagingFilesExpanded ? files : files.slice(0, 3);

	if (files.length === 0) return null;

	return (
		<div className="flex flex-col gap-[14px]">
			<div className="flex w-full items-center justify-between">
				<p className="text-[18px] font-semibold text-gray-800">Files</p>
				{files.length > 3 ? (
					<button
						type="button"
						className="text-gray-400"
						onClick={() => setAreImagingFilesExpanded((previousValue) => !previousValue)}
					>
						{areImagingFilesExpanded ? "View less" : "View more"}
					</button>
				) : null}
			</div>
			<div className="space-y-3">
				{visibleFiles.map((file) => (
					<div
						key={file.url}
						className="flex items-center gap-4 rounded-2xl border border-gray-200 p-4"
					>
						<Image
							src={getDocumentFileIcon(file.name, file.type)}
							alt=""
							width={44}
							height={44}
							className="size-11 shrink-0"
						/>
						<div className="min-w-0 flex-1">
							<p className="truncate font-semibold text-gray-800">{file.name}</p>
							<p className="text-gray-400">
								{file.size} · Uploaded on {file.uploadedAt.slice(0, 10)}
							</p>
						</div>
						<div className="flex shrink-0 items-center gap-2">
							<Button type="button" variant="outline">Download</Button>
							<Button asChild type="button">
								<a href={file.url}>Open</a>
							</Button>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}

function ImagingHistorySection({ history }: { history: ImagingDetailsHistoryEvent[] }) {
	return (
		<div className="flex flex-col gap-[14px]">
			<div className="flex items-center justify-between w-full">
				<p className="text-[18px] font-semibold">History</p>
				<button className="text-gray-400">View more</button>
			</div>
			{history.map((historyEvent) => (
				<ImagingHistoryCard key={historyEvent.id} historyEvent={historyEvent} />
			))}
		</div>
	);
}

function ImagingHistoryCard({ historyEvent }: { historyEvent: ImagingDetailsHistoryEvent }) {
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
				<p>
					<span id={titleId} className="font-semibold text-gray-800">
						{historyEvent.title}
					</span>{" "}
					<span className="text-sm text-gray-400">on {historyEvent.timestamp}</span>
				</p>
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
						<div
							aria-labelledby={titleId}
							className="mt-6 grid grid-cols-1 gap-x-16 gap-y-5 sm:grid-cols-2"
						>
							{historyEvent.items.map((item) => (
								<ImagingDetailItem
									key={`${historyEvent.id}-${item.label}`}
									label={item.label}
									value={item.value}
								/>
							))}
						</div>
					</motion.div>
				) : null}
			</AnimatePresence>
		</section>
	);
}

function ImagingDetailsEditForm({ imaging }: { imaging: ImagingType }) {
	const generatedAttachmentRowId = useId();
	const nextAttachmentRowNumberRef = useRef(0);
	const [orderedAt, setOrderedAt] = useState<Date | undefined>();
	const [imagingAttachmentRows, setImagingAttachmentRows] = useState<AttachmentFormRow[]>([]);
	const imagingFileInputRef = useRef<HTMLInputElement>(null);
	const [editableImagingFiles, setEditableImagingFiles] = useState(imaging.files ?? []);
	const hasImagingFiles = editableImagingFiles.length > 0;
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

	function handleRemoveImagingFile(fileUrl: string) {
		setEditableImagingFiles((previousFiles) =>
			previousFiles.filter((previousFile) => previousFile.url !== fileUrl),
		);
	}

	function handleImagingFilesChange(event: React.ChangeEvent<HTMLInputElement>) {
		const selectedFiles = Array.from(event.target.files ?? []);
		const nextFiles = selectedFiles.map((file) => ({
			name: file.name,
			type: file.type,
			url: URL.createObjectURL(file),
			size: `${Math.round(file.size / 1024)}KB`,
			uploadedAt: new Date().toISOString(),
		}));

		setEditableImagingFiles((previousFiles) => [...previousFiles, ...nextFiles]);
		event.target.value = "";
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
					<Label
						htmlFor="edit-imaging-clinical-notes"
						className={imagingDetailsFieldLabelClassName}
					>
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

			<div className="space-y-3">
				<Label className={imagingDetailsFieldLabelClassName}>
					Files<span className={imagingDetailsRequiredLabelClassName}>(optional)</span>
				</Label>

				{hasImagingFiles ? (
					<>
						<div className="space-y-3">
							{editableImagingFiles.map((file) => (
								<div key={file.url} className="flex items-center gap-4 rounded-2xl border border-gray-200 p-4">
									<Image src={getDocumentFileIcon(file.name, file.type)} alt="" width={44} height={44} className="size-11 shrink-0" />
									<div className="min-w-0 flex-1">
										<p className="truncate font-semibold text-gray-800">{file.name}</p>
										<p className="text-gray-400">{file.size} · Uploaded on {file.uploadedAt.slice(0, 10)}</p>
									</div>
									<Button type="button" variant="outline" onClick={() => handleRemoveImagingFile(file.url)}>
										Remove
									</Button>
									<Button asChild type="button"><a href={file.url} target="_blank" rel="noreferrer">Open</a></Button>
								</div>
							))}
						</div>

						<input ref={imagingFileInputRef} type="file" multiple accept="image/jpeg,image/png,application/pdf" className="sr-only" onChange={handleImagingFilesChange} />
						<Button type="button" variant="outline" onClick={() => imagingFileInputRef.current?.click()}>
							<RiAddLine className="size-5" aria-hidden="true" />
							Add files
						</Button>
					</>
				) : (
					<ChooseFileCard
						onFilesSelected={handleImagingFilesChange}
						fileInputRef={imagingFileInputRef}
						title="Choose one or more files or drag and drop them here."
						description="JPEG, PNG, and PDF, up to 50 MB."
						browseLabel="Browse files"
						accept="image/jpeg,image/png,application/pdf"
						inputId="imaging-files"
						multiple
					/>
				)}
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
					<Button type="button" variant="outline" onClick={handleAddImagingAttachmentRow}>
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
