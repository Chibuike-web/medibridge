"use client";

import { CopyIdButton } from "@/components/copy-id-button";
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
import { labTestFlags, labTestStatuses } from "@/features/patients/server/schemas";
import { updatePatientLabTestAction } from "@/features/patients/server/update-patient-lab-test-action";
import type {
	LabTestDetailsHistoryEvent,
	LabTestType,
	RecordFile,
} from "@/features/patients/types";
import { cn } from "@/lib/utils/cn";
import { authClient } from "@/lib/better-auth/auth.client";
import docFileIcon from "@/assets/file-formats/doc.svg";
import jpgFileIcon from "@/assets/file-formats/jpg.svg";
import pdfFileIcon from "@/assets/file-formats/pdf.svg";
import pngFileIcon from "@/assets/file-formats/png.svg";
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
import { ChooseFileCard } from "@/components/choose-file-card";
import { useRouter } from "next/navigation";

type LabTestDetailsDrawerProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	labTest: LabTestType | null;
	onLabTestUpdated: () => void;
};

const labTestDetailsFormId = "lab-test-details-form";

const fieldLabelClassName = "inline-flex items-baseline gap-0.5 text-sm font-medium text-gray-700";
const optionalLabelClassName = "font-normal text-gray-400";
const fieldControlClassName =
	"border-gray-200 bg-white text-gray-700 placeholder:text-gray-400 text-sm h-9";

export function LabTestDetailsDrawer({
	open,
	onOpenChange,
	labTest,
	onLabTestUpdated,
}: LabTestDetailsDrawerProps) {
	const router = useRouter();
	const { data: activeMemberRole } = authClient.useActiveMemberRole();
	const canArchive = activeMemberRole?.role === "owner" || activeMemberRole?.role === "admin";
	const [labTestDetailsMode, setLabTestDetailsMode] = useState<"view" | "edit">("view");
	const [isArchiveDialogOpen, setIsArchiveDialogOpen] = useState(false);
	const [formError, setFormError] = useState("");
	const [isPending, startTransition] = useTransition();

	function handleLabTestDetailsModeChange(nextMode: "view" | "edit") {
		setFormError("");
		setLabTestDetailsMode(nextMode);
	}

	function handleLabTestDetailsOpenChange(nextOpen: boolean) {
		if (!nextOpen) {
			handleLabTestDetailsModeChange("view");
		}

		onOpenChange(nextOpen);
	}

	function handleSave(formData: FormData) {
		if (!labTest) return;

		setFormError("");

		if (
			formData.getAll("files").reduce((totalSize, file) => totalSize + (file as File).size, 0) >
			100 * 1024 * 1024
		) {
			setFormError("Files can add up to 100 MB per save.");
			return;
		}

		startTransition(async () => {
			const result = await updatePatientLabTestAction(labTest.labId, formData);

			if (result.status === "unauthorized") {
				router.refresh();
				return;
			}

			if (result.status !== "success") {
				setFormError(result.error);
				return;
			}

			setLabTestDetailsMode("view");
			onLabTestUpdated();
		});
	}

	const isEditingLabTestDetails = labTestDetailsMode === "edit" && Boolean(labTest);

	return (
		<Drawer open={open} onOpenChange={handleLabTestDetailsOpenChange} direction="right">
			<DrawerContent className="overflow-hidden rounded-3xl text-sm data-[vaul-drawer-direction=right]:top-4 data-[vaul-drawer-direction=right]:right-4 data-[vaul-drawer-direction=right]:bottom-4 data-[vaul-drawer-direction=right]:h-auto data-[vaul-drawer-direction=right]:w-[37.5rem]">
				<DrawerHeader className="flex-row items-center justify-between border-b border-gray-200 text-left">
					<DrawerTitle className="flex-1 leading-[1.2] text-gray-800">
						{isEditingLabTestDetails ? "Edit lab test details" : "View details"}
					</DrawerTitle>
					{labTest && !isEditingLabTestDetails ? (
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="ghost" size="icon" aria-label="Lab test actions">
									<RiMore2Fill aria-hidden="true" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent
								align="end"
								className="w-50 rounded-xl bg-white text-sm text-gray-700"
							>
								<DropdownMenuItem
									className="rounded-lg"
									onSelect={() => handleLabTestDetailsModeChange("edit")}
								>
									<RiEdit2Line aria-hidden="true" />
									Edit
								</DropdownMenuItem>
								<DropdownMenuItem className="rounded-lg">
									<RiShare2Line aria-hidden="true" />
									Export
								</DropdownMenuItem>
								{labTest.status === "Pending" ? (
									<DropdownMenuItem className="rounded-lg">
										<RiCheckLine aria-hidden="true" />
										Mark as completed
									</DropdownMenuItem>
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
						<Button variant="ghost" size="icon" aria-label="Close lab test details drawer">
							<RiCloseLine aria-hidden="true" />
						</Button>
					</DrawerClose>
					<DrawerDescription className="sr-only">
						{isEditingLabTestDetails
							? "Edit the selected laboratory test details."
							: "Showing details for the laboratory test you selected."}
					</DrawerDescription>
				</DrawerHeader>

				<div className="min-h-0 overflow-y-auto px-4 py-5 text-sm">
					{isEditingLabTestDetails && labTest ? (
						<LabTestDetailsEditForm
							labTest={labTest}
							formError={formError}
							onFormErrorDismiss={() => setFormError("")}
							onSave={handleSave}
						/>
					) : labTest ? (
						<div className="flex flex-col gap-10">
							<LabTestDetailsOverview labTest={labTest} />
							<LabTestFilesSection files={labTest.files} />
							<LabTestHistorySection history={labTest.history} />
						</div>
					) : (
						<div className="rounded-2xl border border-gray-200 p-5 text-gray-500">
							Lab test details could not be found.
						</div>
					)}
				</div>

				{isEditingLabTestDetails ? (
					<DrawerFooter className="border-t border-gray-200 text-sm">
						<div className="flex flex-col gap-2 lg:flex-row lg:self-end">
							<Button
								type="button"
								variant="outline"
								onClick={() => handleLabTestDetailsModeChange("view")}
							>
								Cancel
							</Button>
							<Button type="submit" form={labTestDetailsFormId} disabled={isPending}>
								{isPending ? "Saving…" : "Save changes"}
							</Button>
						</div>
					</DrawerFooter>
				) : null}
			</DrawerContent>
			<AlertDialog open={isArchiveDialogOpen} onOpenChange={setIsArchiveDialogOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Archive lab test</AlertDialogTitle>
						<Button
							type="button"
							variant="ghost"
							size="icon"
							aria-label="Close archive lab test dialog"
							onClick={() => setIsArchiveDialogOpen(false)}
						>
							<RiCloseLine aria-hidden="true" />
						</Button>
					</AlertDialogHeader>
					<AlertDialogDescription>
						This lab test will be removed from the patient’s active problem list. The record, its
						related medications, labs, imaging and full activity history are retained and can be
						restored at any time.
					</AlertDialogDescription>
					<AlertDialogFooter className="sm:justify-end">
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<Button type="button" onClick={() => setIsArchiveDialogOpen(false)}>
							Archive lab test
						</Button>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</Drawer>
	);
}

function LabTestDetailsOverview({ labTest }: { labTest: LabTestType }) {
	return (
		<div className="flex flex-col gap-8">
			<div className="flex flex-col gap-4">
				<div className="flex flex-wrap items-center gap-x-8 gap-y-3 text-nowrap">
					<div className="flex items-center gap-2">
						<span className="text-gray-400">Lab ID</span>
						<CopyIdButton id={labTest.labId} />
					</div>
				</div>
				<p className="flex flex-wrap items-center gap-2 font-medium">
					<span className="text-gray-600">Created by {labTest.createdBy || "-"}</span>
					<span aria-hidden="true" className="size-1 rounded-full bg-gray-300" />
					<span className="text-gray-400">{labTest.createdAtLabel}</span>
				</p>
			</div>

			<div className="flex flex-col gap-6">
				<div className="flex items-center gap-3">
					<h2 className="text-lg font-semibold text-gray-800">{labTest.test}</h2>
					<StatusBadge status={labTest.status} />
				</div>

				<div className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
					<LabTestDetailItem label="Flag" value={labTest.flag} />
					<LabTestDetailItem label="Interpretation" value={labTest.interpretation} />
					<LabTestDetailItem label="Result" value={labTest.result} />
					<LabTestDetailItem label="Specimen" value={labTest.specimen} />
					<LabTestDetailItem label="Reference Range" value={labTest.referenceRange} />
					<LabTestDetailItem label="Ordered by" value={labTest.orderedBy} />
					<LabTestDetailItem label="Ordered at" value={labTest.orderedAtLabel} />
				</div>
			</div>
		</div>
	);
}

function LabTestDetailItem({ label, value }: { label: string; value: string }) {
	return (
		<div className="flex flex-col gap-2 no-line-height">
			<span className="text-gray-400">{label}</span>
			<span className="font-medium text-gray-600">{value || "-"}</span>
		</div>
	);
}

function LabTestFilesSection({ files }: { files: LabTestType["files"] }) {
	const [areLabTestFilesExpanded, setAreLabTestFilesExpanded] = useState(false);
	const visibleFiles = areLabTestFilesExpanded ? files : files.slice(0, 3);

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
						onClick={() => setAreLabTestFilesExpanded((previousValue) => !previousValue)}
					>
						<span className="grid justify-items-end">
							<span
								aria-hidden={areLabTestFilesExpanded}
								className={cn("col-start-1 row-start-1", areLabTestFilesExpanded && "invisible")}
							>
								View more
							</span>
							<span
								aria-hidden={!areLabTestFilesExpanded}
								className={cn("col-start-1 row-start-1", !areLabTestFilesExpanded && "invisible")}
							>
								View less
							</span>
						</span>
					</Button>
				) : null}
			</div>
			<div className="flex flex-col gap-3">
				{visibleFiles.map((file) => (
					<div
						key={file.id}
						className="flex items-center gap-4 rounded-xl border border-gray-200 p-4"
					>
						<Image
							src={getLabTestFileIcon(file.name, file.type)}
							alt=""
							width={36}
							height={36}
							className="size-9 shrink-0"
							aria-hidden="true"
						/>
						<div className="min-w-0 flex-1">
							<p className="truncate font-semibold text-gray-800">{file.name}</p>
							<p className="mt-1 truncate text-gray-400">
								{file.size} - Uploaded on {file.uploadedAtLabel}
							</p>
						</div>
						<div className="flex shrink-0 items-center gap-2">
							<Button asChild variant="outline">
								<a href={`${file.url}?download`} download={file.name}>
									Download
								</a>
							</Button>
							<Button asChild>
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

function getLabTestFileIcon(fileName: string, fileType: string) {
	const format = (fileType || fileName.split(".").pop() || "").toLowerCase();

	if (format.includes("pdf")) return pdfFileIcon;
	if (format.includes("png")) return pngFileIcon;
	if (format.includes("jpg") || format.includes("jpeg")) return jpgFileIcon;
	return docFileIcon;
}

function LabTestHistorySection({ history }: { history: LabTestDetailsHistoryEvent[] }) {
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
				<LabTestHistoryCard key={historyEvent.id} historyEvent={historyEvent} />
			))}
		</div>
	);
}

function LabTestHistoryCard({ historyEvent }: { historyEvent: LabTestDetailsHistoryEvent }) {
	const [isLabTestHistoryExpanded, setIsLabTestHistoryExpanded] = useState(false);
	const sectionId = useId();
	const titleId = `${sectionId}-title`;
	const panelId = `${sectionId}-panel`;
	const changeCount =
		historyEvent.items.filter((item) => item.label !== "Clinical note").length || 1;

	return (
		<section className="flex flex-col rounded-xl border border-gray-200 p-4">
			<Button
				type="button"
				onClick={() => setIsLabTestHistoryExpanded((prev) => !prev)}
				aria-expanded={isLabTestHistoryExpanded}
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
						isLabTestHistoryExpanded ? "rotate-180" : "",
					)}
					aria-hidden="true"
				/>
			</Button>
			<div
				id={panelId}
				className={cn(
					"grid overflow-hidden transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none",
					isLabTestHistoryExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
				)}
				aria-hidden={!isLabTestHistoryExpanded}
				inert={!isLabTestHistoryExpanded}
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

function LabTestDetailsEditForm({
	labTest,
	formError,
	onFormErrorDismiss,
	onSave,
}: {
	labTest: LabTestType;
	formError: string;
	onFormErrorDismiss: () => void;
	onSave: (formData: FormData) => void;
}) {
	const generatedAttachmentRowId = useId();
	const nextAttachmentRowNumberRef = useRef(0);
	const [orderedAt, setOrderedAt] = useState<Date | undefined>(() =>
		labTest.orderedAtValue ? parseISO(labTest.orderedAtValue.slice(0, 10)) : undefined,
	);
	const [labTestAttachmentRows, setLabTestAttachmentRows] = useState<AttachmentFormRow[]>([]);
	const labTestFileInputRef = useRef<HTMLInputElement>(null);
	const [editableLabTestFiles, setEditableLabTestFiles] = useState<
		(RecordFile & { file?: File })[]
	>(labTest.files);
	const [pendingLabTestFileRemovalId, setPendingLabTestFileRemovalId] = useState<string | null>(
		null,
	);

	const hasLabTestFiles = editableLabTestFiles.length > 0;

	function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const formData = new FormData(event.currentTarget);

		for (const labTestFile of editableLabTestFiles) {
			if (labTestFile.file) formData.append("files", labTestFile.file);
		}

		for (const savedFile of labTest.files) {
			if (!editableLabTestFiles.some((labTestFile) => labTestFile.id === savedFile.id)) {
				formData.append("removedFileIds", savedFile.id);
			}
		}

		onSave(formData);
	}

	function handleRemoveLabTestFile(fileId: string) {
		setEditableLabTestFiles((prev) => prev.filter((labTestFile) => labTestFile.id !== fileId));
		setPendingLabTestFileRemovalId(null);
	}

	function handleLabTestFilesChange(event: React.ChangeEvent<HTMLInputElement>) {
		const selectedFiles = Array.from(event.target.files ?? []);

		setEditableLabTestFiles((prev) => [
			...prev,
			...selectedFiles.map((file) => ({
				id: crypto.randomUUID(),
				name: file.name,
				url: URL.createObjectURL(file),
				type: file.type,
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

	function handleAddLabTestAttachmentRow() {
		nextAttachmentRowNumberRef.current += 1;

		setLabTestAttachmentRows((prev) => [
			...prev,
			{
				id: `${generatedAttachmentRowId}-attachment-${nextAttachmentRowNumberRef.current}`,
				name: "",
				recordId: "",
			},
		]);
	}

	function handleRemoveLabTestAttachmentRow(attachmentRowId: string) {
		setLabTestAttachmentRows((prev) =>
			prev.filter((attachmentRow) => attachmentRow.id !== attachmentRowId),
		);
	}

	return (
		<form id={labTestDetailsFormId} onSubmit={handleSubmit} className="flex flex-col gap-12">
			<input type="hidden" name="updatedAt" value={labTest.updatedAtValue} />
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
						<span className="text-gray-400">Lab ID:</span>
						<CopyIdButton id={labTest.labId} />
					</div>
					{labTest.encounterId ? (
						<div className="flex items-center gap-2">
							<span className="text-gray-400">Encounter ID:</span>
							<CopyIdButton id={labTest.encounterId} />
						</div>
					) : null}
				</div>

				<div className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
					<div className="flex flex-col gap-2 sm:col-span-2">
						<Label htmlFor="edit-lab-test-name" className={fieldLabelClassName}>
							Test<span className={optionalLabelClassName}>(required)</span>
						</Label>
						<Input
							id="edit-lab-test-name"
							name="testName"
							defaultValue={labTest.testName}
							className={fieldControlClassName}
							required
						/>
					</div>

					<div className="flex flex-col gap-2">
						<Label htmlFor="edit-lab-test-flag" className={fieldLabelClassName}>
							Flag<span className={optionalLabelClassName}>(required if completed)</span>
						</Label>
						<Select name="flag" defaultValue={labTest.flag || undefined}>
							<SelectTrigger id="edit-lab-test-flag" className={`${fieldControlClassName} w-full`}>
								<SelectValue placeholder="Select flag" />
							</SelectTrigger>
							<SelectContent>
								<SelectGroup>
									{labTestFlags.map((flag) => (
										<SelectItem key={flag} value={flag}>
											{flag}
										</SelectItem>
									))}
								</SelectGroup>
							</SelectContent>
						</Select>
					</div>

					<div className="flex flex-col gap-2">
						<Label htmlFor="edit-lab-test-status" className={fieldLabelClassName}>
							Status<span className={optionalLabelClassName}>(required)</span>
						</Label>
						<Select name="status" defaultValue={labTest.status} required>
							<SelectTrigger
								id="edit-lab-test-status"
								className={`${fieldControlClassName} w-full`}
							>
								<SelectValue placeholder="Select status" />
							</SelectTrigger>
							<SelectContent>
								<SelectGroup>
									{labTestStatuses.map((status) => (
										<SelectItem key={status} value={status}>
											{status}
										</SelectItem>
									))}
								</SelectGroup>
							</SelectContent>
						</Select>
					</div>

					<div className="flex flex-col gap-2">
						<Label htmlFor="edit-lab-test-reference-range" className={fieldLabelClassName}>
							Reference Range<span className={optionalLabelClassName}>(optional)</span>
						</Label>
						<Input
							id="edit-lab-test-reference-range"
							name="referenceRange"
							defaultValue={labTest.referenceRange}
							className={fieldControlClassName}
						/>
					</div>

					<div className="flex flex-col gap-2">
						<Label htmlFor="edit-lab-test-ordered-by" className={fieldLabelClassName}>
							Ordered by<span className={optionalLabelClassName}>(required)</span>
						</Label>
						<Input
							id="edit-lab-test-ordered-by"
							name="orderedBy"
							defaultValue={labTest.orderedBy}
							placeholder="e.g. Dr. Adebayo Johnson"
							className={fieldControlClassName}
							required
						/>
					</div>

					<div className="flex flex-col gap-2">
						<Label htmlFor="edit-lab-test-ordered-at" className={fieldLabelClassName}>
							Ordered at<span className={optionalLabelClassName}>(required)</span>
						</Label>
						<input
							type="hidden"
							name="orderedAt"
							value={orderedAt ? format(orderedAt, "yyyy-MM-dd") : ""}
						/>
						<Popover>
							<PopoverTrigger asChild>
								<Button
									id="edit-lab-test-ordered-at"
									type="button"
									variant="outline"
									data-empty={!orderedAt}
									className={`${fieldControlClassName} flex w-full justify-between gap-3 font-normal data-[empty=true]:text-gray-400 hover:bg-white active:scale-100`}
								>
									<span className="min-w-0 truncate">
										{orderedAt ? format(orderedAt, "PPP") : "Select date"}
									</span>
									<RiCalendarLine className="size-4 shrink-0 text-gray-600" aria-hidden="true" />
								</Button>
							</PopoverTrigger>
							<PopoverContent className="p-0">
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
						<Label htmlFor="edit-lab-test-specimen" className={fieldLabelClassName}>
							Specimen<span className={optionalLabelClassName}>(required)</span>
						</Label>
						<Input
							id="edit-lab-test-specimen"
							name="specimen"
							defaultValue={labTest.specimen}
							placeholder="e.g. Whole blood"
							className={fieldControlClassName}
							required
						/>
					</div>

					<div className="flex flex-col gap-2 sm:col-span-2">
						<Label htmlFor="edit-lab-test-result" className={fieldLabelClassName}>
							Result<span className={optionalLabelClassName}>(required if completed)</span>
						</Label>
						<Input
							id="edit-lab-test-result"
							name="result"
							defaultValue={labTest.result}
							placeholder="e.g. 14.8 x10^9/L"
							className={fieldControlClassName}
						/>
					</div>

					<div className="flex flex-col gap-2 sm:col-span-2">
						<Label htmlFor="edit-lab-test-interpretation" className={fieldLabelClassName}>
							Interpretation<span className={optionalLabelClassName}>(optional)</span>
						</Label>
						<Textarea
							id="edit-lab-test-interpretation"
							name="interpretation"
							defaultValue={labTest.interpretation}
							placeholder="e.g. Elevated white blood cell count suggesting possible infection"
							className="min-h-20 bg-white text-sm text-gray-700 placeholder:text-gray-400"
						/>
					</div>

					<div className="flex flex-col gap-2 sm:col-span-2">
						<Label htmlFor="edit-lab-test-clinical-notes" className={fieldLabelClassName}>
							Clinical notes<span className={optionalLabelClassName}>(optional)</span>
						</Label>
						<Textarea
							id="edit-lab-test-clinical-notes"
							name="clinicalNote"
							defaultValue={labTest.clinicalNote}
							placeholder="Add additional laboratory observations or recommendations"
							className="min-h-28 bg-white text-sm text-gray-700 placeholder:text-gray-400"
						/>
					</div>
				</div>
			</div>
			<div className="space-y-3 sm:col-span-2">
				<Label className={fieldLabelClassName}>
					Files <span className="text-gray-400">(required if completed)</span>
				</Label>
				{hasLabTestFiles ? (
					<>
						<div className="space-y-3">
							{editableLabTestFiles.map((file) => (
								<div
									key={file.id}
									className={cn(
										"rounded-xl border p-4",
										pendingLabTestFileRemovalId === file.id ? "border-red-500" : "border-gray-200",
									)}
								>
									<div className="flex items-center gap-4">
										<Image
											src={getLabTestFileIcon(file.name, file.type)}
											alt=""
											width={36}
											height={36}
											className={`size-9 shrink-0 transition-opacity duration-200 ${pendingLabTestFileRemovalId === file.id ? "opacity-40" : "opacity-100"}`}
											aria-hidden="true"
										/>

										<div
											className={`min-w-0 flex-1 transition-opacity duration-200 ${pendingLabTestFileRemovalId === file.id ? "opacity-40" : "opacity-100"}`}
										>
											<p className="truncate font-semibold text-gray-800">{file.name}</p>

											<p className="truncate text-gray-400">
												{file.size} ·{" "}
												{file.file ? "Not saved yet" : `Uploaded on ${file.uploadedAtLabel}`}
											</p>
										</div>

										{pendingLabTestFileRemovalId !== file.id ? (
											<div className="flex shrink-0 items-center gap-2">
												<Button
													type="button"
													variant="outline"
													onClick={() => setPendingLabTestFileRemovalId(file.id)}
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
											pendingLabTestFileRemovalId === file.id
												? "grid-rows-[1fr] opacity-100"
												: "grid-rows-[0fr] opacity-0",
										)}
										aria-hidden={pendingLabTestFileRemovalId !== file.id}
										inert={pendingLabTestFileRemovalId !== file.id}
									>
										<div className="min-h-0 overflow-hidden">
											<div className="mt-6 flex flex-wrap items-center justify-between gap-4">
												<p className="max-w-md text-sm font-medium text-gray-700">
													Remove {file.name} from this lab test?
												</p>
												<div className="ml-auto flex shrink-0 items-center gap-3">
													<Button
														type="button"
														variant="outline"
														onClick={() => setPendingLabTestFileRemovalId(null)}
													>
														Cancel
													</Button>
													<Button
														type="button"
														className="bg-red-500 hover:bg-red-600 focus-visible:ring-red-300"
														onClick={() => handleRemoveLabTestFile(file.id)}
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
							ref={labTestFileInputRef}
							type="file"
							aria-label="Choose files to add"
							multiple
							accept="image/jpeg,image/png,application/pdf"
							className="sr-only"
							onChange={handleLabTestFilesChange}
						/>

						<Button
							type="button"
							variant="outline"
							onClick={() => labTestFileInputRef.current?.click()}
						>
							<RiAddLine className="size-5" aria-hidden="true" />
							Add files
						</Button>
					</>
				) : (
					<ChooseFileCard
						onFilesSelected={handleLabTestFilesChange}
						fileInputRef={labTestFileInputRef}
						title="Choose one or more files or drag and drop them here."
						description="JPEG, PNG, and PDF, up to 50 MB."
						browseLabel="Browse files"
						accept="image/jpeg,image/png,application/pdf"
						inputId="lab-test-files"
						multiple
					/>
				)}
			</div>
			<div className="flex flex-col gap-6">
				{labTestAttachmentRows.map((attachmentRow, attachmentIndex) => (
					<AttachmentFormFields
						key={attachmentRow.id}
						attachmentRow={attachmentRow}
						attachmentIndex={attachmentIndex}
						fieldLabelClassName={fieldLabelClassName}
						requiredLabelClassName={optionalLabelClassName}
						fieldControlClassName={fieldControlClassName}
						onRemoveAttachmentRow={handleRemoveLabTestAttachmentRow}
					/>
				))}

				<div>
					<Button
						type="button"
						variant="outline"
						className="bg-white text-gray-600"
						onClick={handleAddLabTestAttachmentRow}
					>
						<RiAddLine className="size-5" aria-hidden="true" />
						Add related record
					</Button>
				</div>
			</div>
		</form>
	);
}
