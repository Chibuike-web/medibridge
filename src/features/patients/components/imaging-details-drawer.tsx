"use client";

import { CopyIdButton } from "@/components/copy-id-button";
import { ChooseFileCard } from "@/components/choose-file-card";
import { StatusBadge } from "@/components/status-badge";
import {
	AlertDialog,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
	AttachmentFormFields,
	type AttachmentFormRow,
} from "@/features/patients/components/attachment-form-fields";
import { imagingModalities, imagingStatuses } from "@/features/patients/server/schemas";
import { updatePatientImagingAction } from "@/features/patients/server/update-patient-imaging-action";
import type {
	ImagingDetailsHistoryEvent,
	ImagingType,
	RecordFile,
} from "@/features/patients/types";
import { cn } from "@/lib/utils/cn";
import { authClient } from "@/lib/better-auth/auth.client";
import { getDocumentFileIcon } from "@/lib/utils/document-file-icon";
import {
	RiAddLine,
	RiArchiveLine,
	RiArrowDownSLine,
	RiArrowRightLine,
	RiCalendarLine,
	RiCheckLine,
	RiCloseLine,
	RiEdit2Line,
	RiErrorWarningFill,
	RiMore2Fill,
	RiShare2Line,
} from "@remixicon/react";
import { format, parseISO } from "date-fns";
import Image from "next/image";
import { Fragment, useId, useRef, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";

type ImagingDetailsDrawerProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	imaging: ImagingType | null;
	onImagingUpdated: () => void;
};

const imagingDetailsFormId = "imaging-details-form";

const imagingDetailsFieldLabelClassName =
	"inline-flex items-baseline gap-0.5 text-sm font-medium text-gray-700";
const imagingDetailsRequiredLabelClassName = "font-normal text-gray-400";
const imagingDetailsFieldControlClassName =
	"border-gray-200 bg-white text-gray-700 placeholder:text-gray-400 text-sm h-9";

export function ImagingDetailsDrawer({
	open,
	onOpenChange,
	imaging,
	onImagingUpdated,
}: ImagingDetailsDrawerProps) {
	const router = useRouter();
	const { data: activeMemberRole } = authClient.useActiveMemberRole();
	const canArchive = activeMemberRole?.role === "owner" || activeMemberRole?.role === "admin";
	const [imagingDetailsMode, setImagingDetailsMode] = useState<"view" | "edit">("view");
	const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
	const [isArchiveDialogOpen, setIsArchiveDialogOpen] = useState(false);
	const [formError, setFormError] = useState("");
	const [isPending, startTransition] = useTransition();

	function handleImagingDetailsModeChange(nextMode: "view" | "edit") {
		setFormError("");
		setImagingDetailsMode(nextMode);
	}

	function handleImagingDetailsOpenChange(nextOpen: boolean) {
		if (!nextOpen) {
			handleImagingDetailsModeChange("view");
		}

		onOpenChange(nextOpen);
	}

	function handleSave(formData: FormData) {
		if (!imaging) return;

		setFormError("");

		if (
			formData.getAll("files").reduce((totalSize, file) => totalSize + (file as File).size, 0) >
			100 * 1024 * 1024
		) {
			setFormError("Files can add up to 100 MB per save.");
			return;
		}

		startTransition(async () => {
			const result = await updatePatientImagingAction(imaging.imagingId, formData);

			if (result.status === "unauthorized") {
				router.refresh();
				return;
			}

			if (result.status !== "success") {
				setFormError(result.error);
				return;
			}

			setImagingDetailsMode("view");
			onImagingUpdated();
		});
	}

	const isEditingImagingDetails = imagingDetailsMode === "edit" && Boolean(imaging);

	return (
		<Drawer open={open} onOpenChange={handleImagingDetailsOpenChange} direction="right">
			<DrawerContent className="overflow-hidden rounded-3xl text-sm data-[vaul-drawer-direction=right]:top-4 data-[vaul-drawer-direction=right]:right-4 data-[vaul-drawer-direction=right]:bottom-4 data-[vaul-drawer-direction=right]:h-auto data-[vaul-drawer-direction=right]:w-[37.5rem]">
				<DrawerHeader className="flex-row items-center justify-between border-b border-gray-200 text-left">
					<DrawerTitle className="flex-1 leading-[1.2] text-gray-800">
						{isEditingImagingDetails ? "Edit imaging details" : "View imaging details"}
					</DrawerTitle>
					{imaging && !isEditingImagingDetails ? (
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="ghost" size="icon" aria-label="Imaging actions">
									<RiMore2Fill aria-hidden="true" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent
								align="end"
								className="w-50 rounded-xl bg-white text-sm text-gray-700"
							>
								<DropdownMenuItem
									className="rounded-lg"
									onSelect={() => handleImagingDetailsModeChange("edit")}
								>
									<RiEdit2Line aria-hidden="true" />
									Edit
								</DropdownMenuItem>
								<DropdownMenuItem className="rounded-lg">
									<RiShare2Line aria-hidden="true" />
									Export
								</DropdownMenuItem>
								{imaging.status === "Pending" ? (
									<>
										<DropdownMenuItem className="rounded-lg">
											<RiCheckLine aria-hidden="true" />
											Mark as completed
										</DropdownMenuItem>
										<DropdownMenuItem
											className="rounded-lg text-rose-600 focus:bg-rose-50 focus:text-rose-600"
											onSelect={() => setIsCancelDialogOpen(true)}
										>
											<RiCloseLine aria-hidden="true" className="text-current" />
											Cancel imaging
										</DropdownMenuItem>
									</>
								) : null}
								{canArchive ? (
									<>
										<DropdownMenuSeparator />
										<DropdownMenuItem
											className="rounded-lg"
											onSelect={() => setIsArchiveDialogOpen(true)}
										>
											<RiArchiveLine aria-hidden="true" />
											Archive
										</DropdownMenuItem>
									</>
								) : null}
							</DropdownMenuContent>
						</DropdownMenu>
					) : null}
					<DrawerClose asChild>
						<Button variant="ghost" size="icon" aria-label="Close imaging details drawer">
							<RiCloseLine aria-hidden="true" />
						</Button>
					</DrawerClose>
					<DrawerDescription className="sr-only">
						{isEditingImagingDetails
							? "Edit the selected imaging details."
							: "Showing details for the imaging study you selected."}
					</DrawerDescription>
				</DrawerHeader>

				<div className="min-h-0 overflow-y-auto px-4 py-5 text-sm">
					{isEditingImagingDetails && imaging ? (
						<ImagingDetailsEditForm
							imaging={imaging}
							formError={formError}
							onFormErrorDismiss={() => setFormError("")}
							onSave={handleSave}
						/>
					) : imaging ? (
						<div className="flex flex-col gap-10">
							<ImagingDetailsOverview imaging={imaging} />
							<ImagingFilesSection files={imaging.files} />
							<ImagingHistorySection history={imaging.history} />
						</div>
					) : (
						<div className="rounded-2xl border border-gray-200 p-5 text-gray-500">
							Imaging details could not be found.
						</div>
					)}
				</div>

				{isEditingImagingDetails ? (
					<DrawerFooter className="border-t border-gray-200 text-sm">
						<div className="flex flex-col gap-2 lg:flex-row lg:self-end">
							<Button
								type="button"
								variant="outline"
								onClick={() => handleImagingDetailsModeChange("view")}
							>
								Cancel
							</Button>
							<Button type="submit" form={imagingDetailsFormId} disabled={isPending}>
								{isPending ? "Saving…" : "Save changes"}
							</Button>
						</div>
					</DrawerFooter>
				) : null}
			</DrawerContent>
			<AlertDialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Cancel imaging?</AlertDialogTitle>
						<Button
							type="button"
							variant="ghost"
							size="icon"
							aria-label="Close cancel imaging dialog"
							onClick={() => setIsCancelDialogOpen(false)}
						>
							<RiCloseLine aria-hidden="true" />
						</Button>
					</AlertDialogHeader>
					<AlertDialogDescription>
						This imaging will be removed from the patient’s active imaging list. The imaging record,
						related encounters, reports, and full activity history will be retained and can be
						restored at any time.
					</AlertDialogDescription>
					<AlertDialogFooter className="sm:justify-end">
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<Button
							type="button"
							className="bg-rose-500 text-white hover:bg-rose-600"
							onClick={() => setIsCancelDialogOpen(false)}
						>
							Cancel imaging
						</Button>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
			<AlertDialog open={isArchiveDialogOpen} onOpenChange={setIsArchiveDialogOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Archive imaging</AlertDialogTitle>
						<Button
							type="button"
							variant="ghost"
							size="icon"
							aria-label="Close archive imaging dialog"
							onClick={() => setIsArchiveDialogOpen(false)}
						>
							<RiCloseLine aria-hidden="true" />
						</Button>
					</AlertDialogHeader>
					<AlertDialogDescription>
						This imaging will be removed from the patient’s active problem list. The record, its
						related medications, labs, imaging and full activity history are retained and can be
						restored at any time.
					</AlertDialogDescription>
					<AlertDialogFooter className="sm:justify-end">
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<Button type="button" onClick={() => setIsArchiveDialogOpen(false)}>
							Archive imaging
						</Button>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</Drawer>
	);
}

function ImagingDetailsOverview({ imaging }: { imaging: ImagingType }) {
	return (
		<div className="flex flex-col gap-8">
			<div className="flex flex-col gap-4">
				<div className="flex flex-wrap items-center gap-x-8 gap-y-3 text-nowrap">
					<div className="flex items-center gap-2">
						<span className="text-gray-400">Imaging ID:</span>
						<CopyIdButton id={imaging.imagingId} />
					</div>
					{imaging.encounterId ? (
						<div className="flex items-center gap-2">
							<span className="text-gray-400">Encounter ID:</span>
							<CopyIdButton id={imaging.encounterId} />
						</div>
					) : null}
				</div>
				<p className="flex flex-wrap items-center gap-2 font-medium">
					<span className="text-gray-600">Created by {imaging.createdBy}</span>
					<span aria-hidden="true" className="size-1 rounded-full bg-gray-300" />
					<span className="text-gray-400">{imaging.createdAtLabel}</span>
				</p>
			</div>

			<div className="flex flex-col gap-6">
				<div className="flex items-center gap-3">
					<h2 className="text-lg font-semibold text-gray-800">{imaging.study}</h2>
					<StatusBadge status={imaging.status} />
				</div>

				<div className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
					<ImagingDetailItem label="Impression" value={imaging.impression} />
					<ImagingDetailItem label="Region" value={imaging.region} />
					<ImagingDetailItem label="Modality" value={imaging.modality} />
					<ImagingDetailItem label="Ordered at" value={imaging.orderedAtLabel} />
					<ImagingDetailItem label="Ordered by" value={imaging.orderedBy} />
					<ImagingDetailItem label="Clinical notes" value={imaging.clinicalNote} />
				</div>
			</div>
		</div>
	);
}

function ImagingDetailItem({ label, value }: { label: string; value: string }) {
	return (
		<div className="flex flex-col gap-2 no-line-height">
			<span className="text-gray-400">{label}</span>
			<span className="font-medium text-gray-600">{value || "-"}</span>
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
				<h2 className="text-sm font-semibold text-gray-800">Files</h2>
				{files.length > 3 ? (
					<Button
						type="button"
						variant="ghost"
						className="text-gray-400 h-auto rounded-none border-0 p-0 font-normal hover:bg-transparent hover:text-gray-400 focus-visible:border-0"
						onClick={() => setAreImagingFilesExpanded((previousValue) => !previousValue)}
					>
						<span className="grid justify-items-end">
							<span
								aria-hidden={areImagingFilesExpanded}
								className={cn("col-start-1 row-start-1", areImagingFilesExpanded && "invisible")}
							>
								View more
							</span>
							<span
								aria-hidden={!areImagingFilesExpanded}
								className={cn("col-start-1 row-start-1", !areImagingFilesExpanded && "invisible")}
							>
								View less
							</span>
						</span>
					</Button>
				) : null}
			</div>
			<div className="space-y-3">
				{visibleFiles.map((file) => (
					<div
						key={file.id}
						className="flex items-center gap-4 rounded-xl border border-gray-200 p-4"
					>
						<Image
							src={getDocumentFileIcon(file.name, file.type)}
							alt=""
							width={36}
							height={36}
							className="size-9 shrink-0"
						/>
						<div className="min-w-0 flex-1">
							<p className="truncate font-semibold text-gray-800">{file.name}</p>
							<p className="truncate text-gray-400">
								{file.size} · Uploaded on {file.uploadedAtLabel}
							</p>
						</div>
						<div className="flex shrink-0 items-center gap-2">
							<Button asChild variant="outline">
								<a href={`${file.url}?download`} download={file.name}>
									Download
								</a>
							</Button>
							<Button asChild type="button">
								<a href={file.url} target="_blank" rel="noreferrer">
									Open
								</a>
							</Button>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}

function ImagingHistorySection({ history }: { history: ImagingDetailsHistoryEvent[] }) {
	if (history.length === 0) {
		return null;
	}

	return (
		<div className="flex flex-col gap-[14px]">
			<div className="flex items-center justify-between w-full">
				<h2 className="text-sm font-semibold text-gray-800">Activity</h2>
				<Button
					variant="ghost"
					className="text-gray-400 h-auto rounded-none border-0 p-0 font-normal hover:bg-transparent hover:text-gray-400 focus-visible:border-0"
				>
					View more
				</Button>
			</div>
			{history.map((historyEvent) => (
				<ImagingHistoryCard key={historyEvent.id} historyEvent={historyEvent} />
			))}
		</div>
	);
}

function ImagingHistoryCard({ historyEvent }: { historyEvent: ImagingDetailsHistoryEvent }) {
	const [isImagingHistoryExpanded, setIsImagingHistoryExpanded] = useState(false);
	const sectionId = useId();
	const titleId = `${sectionId}-title`;
	const panelId = `${sectionId}-panel`;
	const changeCount =
		historyEvent.items.filter((item) => item.label !== "Clinical note").length || 1;

	return (
		<section className="flex flex-col rounded-xl border border-gray-200 p-4">
			<Button
				type="button"
				onClick={() => setIsImagingHistoryExpanded((prev) => !prev)}
				aria-expanded={isImagingHistoryExpanded}
				aria-controls={panelId}
				variant="ghost"
				className="flex w-full justify-between gap-4 text-left h-auto whitespace-normal rounded-none border-0 p-0 font-normal hover:bg-transparent hover:text-inherit focus-visible:border-0 active:scale-100 has-[>svg:last-child]:pr-0"
			>
				<p className="min-w-0 text-sm">
					<span id={titleId} className="font-semibold text-gray-800">
						{historyEvent.title} by {historyEvent.actor}
					</span>{" "}
					<span aria-hidden="true" className="text-gray-200">
						•
					</span>{" "}
					<span className="text-gray-400">{historyEvent.timestamp}</span>{" "}
					<span aria-hidden="true" className="text-gray-200">
						•
					</span>{" "}
					<span className="text-gray-400">
						{changeCount} {changeCount === 1 ? "change" : "changes"}
					</span>
				</p>
				<RiArrowDownSLine
					className={cn(
						"size-5 shrink-0 transition-transform duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none",
						isImagingHistoryExpanded ? "rotate-180" : "",
					)}
					aria-hidden="true"
				/>
			</Button>
			<div
				id={panelId}
				className={cn(
					"grid overflow-hidden transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none",
					isImagingHistoryExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
				)}
				aria-hidden={!isImagingHistoryExpanded}
				inert={!isImagingHistoryExpanded}
			>
				<div className="min-h-0 overflow-hidden">
					<div role="region" aria-labelledby={titleId} className="mt-4">
						<dl className="grid grid-cols-[8.75rem_1fr] gap-x-4 gap-y-2">
							{historyEvent.items.map((item) => (
								<Fragment key={`${historyEvent.id}-${item.label}`}>
									<dt className="text-gray-400">{item.label}</dt>
									<dd className="flex flex-wrap items-center gap-2 text-gray-700">
										{item.label === "Clinical note" ? (
											item.value
										) : (
											<>
												<span className="text-gray-400">{item.previousValue}</span>
												<RiArrowRightLine className="size-4 shrink-0" aria-hidden="true" />
												<span className="sr-only">{" changed to "}</span>
												<span>{item.value}</span>
											</>
										)}
									</dd>
								</Fragment>
							))}
						</dl>
					</div>
				</div>
			</div>
		</section>
	);
}

function ImagingDetailsEditForm({
	imaging,
	formError,
	onFormErrorDismiss,
	onSave,
}: {
	imaging: ImagingType;
	formError: string;
	onFormErrorDismiss: () => void;
	onSave: (formData: FormData) => void;
}) {
	const generatedAttachmentRowId = useId();
	const nextAttachmentRowNumberRef = useRef(0);
	const [orderedAt, setOrderedAt] = useState<Date | undefined>(() =>
		imaging.orderedAtValue ? parseISO(imaging.orderedAtValue.slice(0, 10)) : undefined,
	);
	const [imagingAttachmentRows, setImagingAttachmentRows] = useState<AttachmentFormRow[]>([]);
	const imagingFileInputRef = useRef<HTMLInputElement>(null);
	const [editableImagingFiles, setEditableImagingFiles] = useState<
		(RecordFile & { file?: File })[]
	>(imaging.files);
	const [pendingImagingFileRemovalId, setPendingImagingFileRemovalId] = useState<string | null>(
		null,
	);
	const hasImagingFiles = editableImagingFiles.length > 0;

	function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const formData = new FormData(event.currentTarget);

		for (const imagingFile of editableImagingFiles) {
			if (imagingFile.file) formData.append("files", imagingFile.file);
		}

		for (const savedFile of imaging.files) {
			if (!editableImagingFiles.some((imagingFile) => imagingFile.id === savedFile.id)) {
				formData.append("removedFileIds", savedFile.id);
			}
		}

		onSave(formData);
	}

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

	function handleRemoveImagingFile(fileId: string) {
		setEditableImagingFiles((prev) => prev.filter((imagingFile) => imagingFile.id !== fileId));
		setPendingImagingFileRemovalId(null);
	}

	function handleImagingFilesChange(event: React.ChangeEvent<HTMLInputElement>) {
		const selectedFiles = Array.from(event.target.files ?? []);

		setEditableImagingFiles((prev) => [
			...prev,
			...selectedFiles.map((file) => ({
				id: crypto.randomUUID(),
				name: file.name,
				type: file.type,
				url: URL.createObjectURL(file),
				size:
					file.size >= 1024 * 1024
						? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
						: `${Math.ceil(file.size / 1024)} KB`,
				uploadedAtLabel: "",
				file,
			})),
		]);
		event.target.value = "";
	}

	return (
		<form id={imagingDetailsFormId} onSubmit={handleSubmit} className="flex flex-col gap-12">
			<div className="flex flex-col gap-8">
				{formError && (
					<div
						key={formError}
						ref={(banner) => banner?.scrollIntoView({ behavior: "smooth", block: "center" })}
						role="alert"
						className="flex items-start gap-2 rounded-xl bg-red-50 px-3 py-3 text-left text-sm font-medium text-red-700"
					>
						<RiErrorWarningFill className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
						<p className="min-w-0 flex-1 text-pretty">{formError}</p>
						<Button
							type="button"
							variant="ghost"
							size="icon"
							className="ml-auto -my-1 size-6 rounded-full text-red-700 hover:bg-red-100 hover:text-red-700"
							aria-label="Dismiss error"
							onClick={onFormErrorDismiss}
						>
							<RiCloseLine aria-hidden="true" />
						</Button>
					</div>
				)}
				<div className="flex flex-wrap items-center gap-x-8 gap-y-3 text-nowrap">
					<div className="flex items-center gap-2">
						<span className="text-gray-400">Imaging ID:</span>
						<CopyIdButton id={imaging.imagingId} />
					</div>
					{imaging.encounterId ? (
						<div className="flex items-center gap-2">
							<span className="text-gray-400">Encounter ID:</span>
							<CopyIdButton id={imaging.encounterId} />
						</div>
					) : null}
				</div>

				<div className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
					<div className="flex flex-col gap-2 sm:col-span-2">
						<Label htmlFor="edit-imaging-study" className={imagingDetailsFieldLabelClassName}>
							Study<span className={imagingDetailsRequiredLabelClassName}>(required)</span>
						</Label>
						<Input
							id="edit-imaging-study"
							name="study"
							defaultValue={imaging.study}
							className={imagingDetailsFieldControlClassName}
							required
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
							required
						/>
					</div>

					<div className="flex flex-col gap-2">
						<Label htmlFor="edit-imaging-modality" className={imagingDetailsFieldLabelClassName}>
							Modality<span className={imagingDetailsRequiredLabelClassName}>(required)</span>
						</Label>
						<Select name="modality" defaultValue={imaging.modality} required>
							<SelectTrigger
								id="edit-imaging-modality"
								className={`${imagingDetailsFieldControlClassName} w-full`}
							>
								<SelectValue placeholder="Select modality" />
							</SelectTrigger>
							<SelectContent>
								<SelectGroup>
									{imagingModalities.map((modality) => (
										<SelectItem key={modality} value={modality}>
											{modality}
										</SelectItem>
									))}
								</SelectGroup>
							</SelectContent>
						</Select>
					</div>

					<div className="flex flex-col gap-2">
						<Label htmlFor="edit-imaging-ordered-at" className={imagingDetailsFieldLabelClassName}>
							Ordered at<span className={imagingDetailsRequiredLabelClassName}>(required)</span>
						</Label>
						<input
							type="hidden"
							name="orderedAt"
							value={orderedAt ? format(orderedAt, "yyyy-MM-dd") : ""}
						/>
						<Popover>
							<PopoverTrigger asChild>
								<Button
									id="edit-imaging-ordered-at"
									type="button"
									variant="outline"
									data-empty={!orderedAt}
									className={`${imagingDetailsFieldControlClassName} flex w-full justify-between gap-3 font-normal data-[empty=true]:text-gray-400 hover:bg-white active:scale-100`}
								>
									<span className="min-w-0 truncate">
										{orderedAt ? format(orderedAt, "PPP") : "Select date"}
									</span>
									<RiCalendarLine className="size-4 shrink-0 text-gray-600" aria-hidden="true" />
								</Button>
							</PopoverTrigger>
							<PopoverContent align="end" className="p-0">
								<Calendar
									mode="single"
									selected={orderedAt}
									onSelect={setOrderedAt}
									disabled={{ after: new Date() }}
									autoFocus
								/>
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
							required
						/>
					</div>

					<div className="flex flex-col gap-2">
						<Label htmlFor="edit-imaging-status" className={imagingDetailsFieldLabelClassName}>
							Status<span className={imagingDetailsRequiredLabelClassName}>(required)</span>
						</Label>
						<Select name="status" defaultValue={imaging.status} required>
							<SelectTrigger
								id="edit-imaging-status"
								className={`${imagingDetailsFieldControlClassName} w-full`}
							>
								<SelectValue placeholder="Select status" />
							</SelectTrigger>
							<SelectContent>
								<SelectGroup>
									{imagingStatuses.map((status) => (
										<SelectItem key={status} value={status}>
											{status}
										</SelectItem>
									))}
								</SelectGroup>
							</SelectContent>
						</Select>
					</div>

					<div className="flex flex-col gap-2 sm:col-span-2">
						<Label htmlFor="edit-imaging-impression" className={imagingDetailsFieldLabelClassName}>
							Impression
							<span className={imagingDetailsRequiredLabelClassName}>(required if completed)</span>
						</Label>
						<Textarea
							id="edit-imaging-impression"
							name="impression"
							defaultValue={imaging.impression}
							placeholder="e.g. Suspicious liver lesion identified in the right hepatic lobe"
							className="min-h-20 bg-white text-sm text-gray-700 placeholder:text-gray-400"
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
							defaultValue={imaging.clinicalNote}
							placeholder="Add additional findings, preparation instructions, or radiology notes"
							className="min-h-28 bg-white text-sm text-gray-700 placeholder:text-gray-400"
						/>
					</div>
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
								<div
									key={file.id}
									className={cn(
										"rounded-xl border p-4",
										pendingImagingFileRemovalId === file.id ? "border-red-500" : "border-gray-200",
									)}
								>
									<div className="flex items-center gap-4">
										<Image
											src={getDocumentFileIcon(file.name, file.type)}
											alt=""
											width={36}
											height={36}
											className={`size-9 shrink-0 transition-opacity duration-200 ${pendingImagingFileRemovalId === file.id ? "opacity-40" : "opacity-100"}`}
										/>
										<div
											className={`min-w-0 flex-1 transition-opacity duration-200 ${pendingImagingFileRemovalId === file.id ? "opacity-40" : "opacity-100"}`}
										>
											<p className="truncate font-semibold text-gray-800">{file.name}</p>
											<p className="truncate text-gray-400">
												{file.size} ·{" "}
												{file.file ? "Not saved yet" : `Uploaded on ${file.uploadedAtLabel}`}
											</p>
										</div>
										{pendingImagingFileRemovalId !== file.id ? (
											<div className="flex shrink-0 items-center gap-2">
												<Button
													type="button"
													variant="outline"
													onClick={() => setPendingImagingFileRemovalId(file.id)}
												>
													Remove
												</Button>
												<Button asChild type="button">
													<a href={file.url} target="_blank" rel="noreferrer">
														Open
													</a>
												</Button>
											</div>
										) : null}
									</div>
									<div
										className={cn(
											"grid overflow-hidden transition-[grid-template-rows,opacity] duration-200 ease-out motion-reduce:transition-none",
											pendingImagingFileRemovalId === file.id
												? "grid-rows-[1fr] opacity-100"
												: "grid-rows-[0fr] opacity-0",
										)}
										aria-hidden={pendingImagingFileRemovalId !== file.id}
										inert={pendingImagingFileRemovalId !== file.id}
									>
										<div className="min-h-0 overflow-hidden">
											<div className="mt-6 flex flex-wrap items-center justify-between gap-4">
												<p className="max-w-md text-sm font-medium text-gray-700">
													Remove {file.name} from this imaging record?
												</p>
												<div className="ml-auto flex shrink-0 items-center gap-3">
													<Button
														type="button"
														variant="outline"
														onClick={() => setPendingImagingFileRemovalId(null)}
													>
														Cancel
													</Button>
													<Button
														type="button"
														className="bg-red-500 hover:bg-red-600 focus-visible:ring-red-300"
														onClick={() => handleRemoveImagingFile(file.id)}
													>
														Remove file
													</Button>
												</div>
											</div>
										</div>
									</div>
								</div>
							))}
						</div>

						<input
							ref={imagingFileInputRef}
							type="file"
							aria-label="Choose files to add"
							multiple
							accept="image/jpeg,image/png,application/pdf"
							className="sr-only"
							onChange={handleImagingFilesChange}
						/>
						<Button
							type="button"
							variant="outline"
							onClick={() => imagingFileInputRef.current?.click()}
						>
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
