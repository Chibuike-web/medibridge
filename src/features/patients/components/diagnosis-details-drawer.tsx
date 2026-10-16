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
import { diagnosisSeverityStages, diagnosisStatuses } from "@/features/patients/server/schemas";
import { updatePatientDiagnosisAction } from "@/features/patients/server/update-patient-diagnosis-action";
import type {
	DiagnosisDetailsHistoryEvent,
	DiagnosisDetailsRelatedRecord,
	DiagnosisDetailsType,
} from "@/features/patients/types";
import { cn } from "@/lib/utils/cn";
import { authClient } from "@/lib/better-auth/auth.client";
import {
	RiAddLine,
	RiArchiveLine,
	RiArrowDownSLine,
	RiArrowRightLine,
	RiCalendarLine,
	RiCloseLine,
	RiEdit2Line,
	RiErrorWarningFill,
	RiMore2Fill,
	RiShare2Line,
} from "@remixicon/react";
import { Fragment, useId, useState, useTransition, type FormEvent } from "react";
import { format, parseISO } from "date-fns";
import { useRouter } from "next/navigation";

type DiagnosisDetailsDrawerProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	diagnosis: DiagnosisDetailsType | null;
	isLoading: boolean;
	onDiagnosisUpdated: () => void;
};

const EMPTY_VALUE = "-";
const diagnosisDetailsFormId = "diagnosis-details-form";
const diagnosisDetailsFieldLabelClassName =
	"inline-flex items-baseline gap-0.5 text-sm font-medium text-gray-700";
const diagnosisDetailsRequiredLabelClassName = "font-normal text-gray-400";
const diagnosisDetailsFieldControlClassName =
	"h-9 border-gray-200 bg-white text-sm text-gray-700 placeholder:text-gray-400";

export function DiagnosisDetailsDrawer({
	open,
	onOpenChange,
	diagnosis,
	isLoading,
	onDiagnosisUpdated,
}: DiagnosisDetailsDrawerProps) {
	const router = useRouter();
	const { data: activeMemberRole } = authClient.useActiveMemberRole();
	const canArchive = activeMemberRole?.role === "owner" || activeMemberRole?.role === "admin";
	const [diagnosisDetailsMode, setDiagnosisDetailsMode] = useState<"view" | "edit">("view");
	const [isArchiveDialogOpen, setIsArchiveDialogOpen] = useState(false);
	const [formError, setFormError] = useState("");
	const [isPending, startTransition] = useTransition();

	function handleDiagnosisDetailsModeChange(nextMode: "view" | "edit") {
		setFormError("");
		setDiagnosisDetailsMode(nextMode);
	}

	function handleDiagnosisDetailsOpenChange(nextOpen: boolean) {
		if (!nextOpen) {
			handleDiagnosisDetailsModeChange("view");
		}

		onOpenChange(nextOpen);
	}

	function handleSave(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();

		if (!diagnosis) return;

		setFormError("");
		const formData = new FormData(event.currentTarget);

		startTransition(async () => {
			const result = await updatePatientDiagnosisAction(diagnosis.diagnosisId, formData);

			if (result.status === "unauthorized") {
				router.refresh();
				return;
			}

			if (result.status !== "success") {
				setFormError(result.error);
				return;
			}

			setDiagnosisDetailsMode("view");
			onDiagnosisUpdated();
		});
	}

	const isEditingDiagnosisDetails = diagnosisDetailsMode === "edit" && Boolean(diagnosis);

	return (
		<Drawer open={open} onOpenChange={handleDiagnosisDetailsOpenChange} direction="right">
			<DrawerContent className="overflow-hidden rounded-3xl text-sm data-[vaul-drawer-direction=right]:top-4 data-[vaul-drawer-direction=right]:right-4 data-[vaul-drawer-direction=right]:bottom-4 data-[vaul-drawer-direction=right]:h-auto data-[vaul-drawer-direction=right]:w-[37.5rem]">
				<DrawerHeader className="flex-row items-center justify-between border-b border-gray-200 text-left">
					<DrawerTitle className="flex-1 leading-[1.2] text-gray-800">
						{isEditingDiagnosisDetails ? "Edit diagnosis details" : "View diagnosis details"}
					</DrawerTitle>
					{diagnosis && !isEditingDiagnosisDetails ? (
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="ghost" size="icon" aria-label="Diagnosis actions">
									<RiMore2Fill aria-hidden="true" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent
								align="end"
								className="w-50 rounded-xl bg-white text-sm text-gray-700"
							>
								<DropdownMenuItem
									className="rounded-lg"
									onSelect={() => handleDiagnosisDetailsModeChange("edit")}
								>
									<RiEdit2Line aria-hidden="true" />
									Edit
								</DropdownMenuItem>
								<DropdownMenuItem className="rounded-lg">
									<RiShare2Line aria-hidden="true" />
									Export
								</DropdownMenuItem>
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
						<Button variant="ghost" size="icon" aria-label="Close diagnosis details">
							<RiCloseLine aria-hidden="true" />
						</Button>
					</DrawerClose>
					<DrawerDescription className="sr-only">
						{isEditingDiagnosisDetails
							? "Edit the selected diagnosis details."
							: "Showing details for the diagnosis you selected."}
					</DrawerDescription>
				</DrawerHeader>

				<div className="min-h-0 overflow-y-auto px-4 py-5 text-sm">
					{isLoading ? (
						<DiagnosisDetailsFallback />
					) : isEditingDiagnosisDetails && diagnosis ? (
						<DiagnosisDetailsEditForm
							diagnosis={diagnosis}
							formError={formError}
							onFormErrorDismiss={() => setFormError("")}
							onSubmit={handleSave}
						/>
					) : diagnosis ? (
						<div className="flex flex-col gap-12">
							<DiagnosisDetailsOverview diagnosis={diagnosis} />
							<DiagnosisRelatedRecords relatedRecords={diagnosis.relatedRecords} />
							<DiagnosisHistorySection history={diagnosis.history} />
						</div>
					) : (
						<div className="rounded-2xl border border-gray-200 p-5 text-gray-500">
							Diagnosis details could not be found.
						</div>
					)}
				</div>

				{isEditingDiagnosisDetails ? (
					<DrawerFooter className="border-t border-gray-200 text-sm">
						<div className="flex flex-col gap-2 lg:flex-row lg:self-end">
							<Button
								type="button"
								variant="outline"
								onClick={() => handleDiagnosisDetailsModeChange("view")}
							>
								Cancel
							</Button>
							<Button type="submit" form={diagnosisDetailsFormId} disabled={isPending}>
								{isPending ? "Saving…" : "Save changes"}
							</Button>
						</div>
					</DrawerFooter>
				) : null}
			</DrawerContent>
			<AlertDialog open={isArchiveDialogOpen} onOpenChange={setIsArchiveDialogOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Archive diagnosis</AlertDialogTitle>
						<Button
							type="button"
							variant="ghost"
							size="icon"
							aria-label="Close archive diagnosis dialog"
							onClick={() => setIsArchiveDialogOpen(false)}
						>
							<RiCloseLine aria-hidden="true" />
						</Button>
					</AlertDialogHeader>
					<AlertDialogDescription>
						This diagnosis will be removed from the patient’s active problem list. The record, its
						related medications, labs, imaging and full activity history are retained and can be
						restored at any time.
					</AlertDialogDescription>
					<AlertDialogFooter className="sm:justify-end">
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<Button type="button" onClick={() => setIsArchiveDialogOpen(false)}>
							Archive diagnosis
						</Button>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</Drawer>
	);
}

function DiagnosisDetailsOverview({ diagnosis }: { diagnosis: DiagnosisDetailsType }) {
	return (
		<div className="flex flex-col gap-8">
			<div className="flex flex-col gap-4">
				<div className="flex flex-wrap items-center gap-x-8 gap-y-3 text-nowrap">
					<div className="flex items-center gap-2">
						<span className="text-gray-400">Diagnosis ID:</span>
						<CopyIdButton id={diagnosis.diagnosisId} />
					</div>
					<div className="flex items-center gap-2">
						{diagnosis.encounterId ? (
							<>
								<span className="text-gray-400">Encounter ID:</span>
								<CopyIdButton id={diagnosis.encounterId} />
							</>
						) : null}
					</div>
				</div>
				<p className="flex flex-wrap items-center gap-2 font-medium">
					<span className="text-gray-600">Created by {diagnosis.createdBy}</span>
					<span aria-hidden="true" className="size-1 rounded-full bg-gray-300" />
					<span className="text-gray-400">{diagnosis.createdAt}</span>
				</p>
			</div>

			<div className="flex flex-col gap-6">
				<div className="flex items-center gap-3">
					<h2 className="text-lg font-semibold text-gray-800">{diagnosis.name}</h2>
					<StatusBadge status={diagnosis.status} />
				</div>

				<div className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
					<DiagnosisDetailItem label="Severity/Stage" value={diagnosis.severityStage} />
					<DiagnosisDetailItem label="Diagnosed at" value={diagnosis.diagnosedAt} />
					<DiagnosisDetailItem label="Diagnosed by" value={diagnosis.diagnosedBy} />
					<DiagnosisDetailItem label="Last reviewed" value={diagnosis.lastReviewedAt} />
					<DiagnosisDetailItem label="Clinical note" value={diagnosis.clinicalNote} />
				</div>
			</div>
		</div>
	);
}

function DiagnosisDetailsEditForm({
	diagnosis,
	formError,
	onFormErrorDismiss,
	onSubmit,
}: {
	diagnosis: DiagnosisDetailsType;
	formError: string;
	onFormErrorDismiss: () => void;
	onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
	const generatedAttachmentRowId = useId();
	const [diagnosedAt, setDiagnosedAt] = useState<Date | undefined>(() =>
		diagnosis.editValues.diagnosedAt ? parseISO(diagnosis.editValues.diagnosedAt) : undefined,
	);

	const [diagnosisAttachmentRows, setDiagnosisAttachmentRows] = useState<AttachmentFormRow[]>(() =>
		getDiagnosisAttachmentRows(diagnosis),
	);

	function handleAddDiagnosisAttachmentRow() {
		setDiagnosisAttachmentRows((prev) => [
			...prev,
			{
				id: `${generatedAttachmentRowId}-attachment-${prev.length + 1}`,
				name: "",
				recordId: "",
			},
		]);
	}

	function handleRemoveDiagnosisAttachmentRow(attachmentRowId: string) {
		setDiagnosisAttachmentRows((prev) =>
			prev.filter((attachmentRow) => attachmentRow.id !== attachmentRowId),
		);
	}

	return (
		<form id={diagnosisDetailsFormId} onSubmit={onSubmit} className="flex flex-col gap-12">
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
						<span className="text-gray-400">Diagnosis ID:</span>
						<CopyIdButton id={diagnosis.diagnosisId} />
					</div>
					{diagnosis.encounterId ? (
						<div className="flex items-center gap-2">
							<span className="text-gray-400">Encounter ID:</span>
							<CopyIdButton id={diagnosis.encounterId} />
						</div>
					) : null}
				</div>

				<div className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
					<div className="flex flex-col gap-2 sm:col-span-2">
						<Label htmlFor="edit-diagnosis-name" className={diagnosisDetailsFieldLabelClassName}>
							Diagnosis name
							<span className={diagnosisDetailsRequiredLabelClassName}>(required)</span>
						</Label>
						<Input
							id="edit-diagnosis-name"
							name="diagnosisName"
							defaultValue={diagnosis.name}
							className={diagnosisDetailsFieldControlClassName}
							required
						/>
					</div>

					<div className="flex flex-col gap-2">
						<Label
							htmlFor="edit-diagnosis-severity"
							className={diagnosisDetailsFieldLabelClassName}
						>
							Severity/Stage
							<span className={diagnosisDetailsRequiredLabelClassName}>(optional)</span>
						</Label>
						<Select
							name="severityStage"
							defaultValue={diagnosis.editValues.severityStage || undefined}
						>
							<SelectTrigger id="edit-diagnosis-severity" className="w-full">
								<SelectValue placeholder="Select severity or stage" />
							</SelectTrigger>
							<SelectContent>
								<SelectGroup>
									{diagnosisSeverityStages.map((severityStage) => (
										<SelectItem key={severityStage} value={severityStage}>
											{severityStage}
										</SelectItem>
									))}
								</SelectGroup>
							</SelectContent>
						</Select>
					</div>

					<div className="flex flex-col gap-2">
						<Label htmlFor="edit-diagnosis-status" className={diagnosisDetailsFieldLabelClassName}>
							Status<span className={diagnosisDetailsRequiredLabelClassName}>(required)</span>
						</Label>
						<Select name="status" defaultValue={diagnosis.status} required>
							<SelectTrigger id="edit-diagnosis-status" className="w-full">
								<SelectValue placeholder="Select status" />
							</SelectTrigger>
							<SelectContent>
								<SelectGroup>
									{diagnosisStatuses.map((status) => (
										<SelectItem key={status} value={status}>
											{status}
										</SelectItem>
									))}
								</SelectGroup>
							</SelectContent>
						</Select>
					</div>

					<div className="flex flex-col gap-2">
						<Label
							htmlFor="edit-diagnosis-diagnosed-at"
							className={diagnosisDetailsFieldLabelClassName}
						>
							Diagnosed at
							<span className={diagnosisDetailsRequiredLabelClassName}>(required)</span>
						</Label>
						<input
							type="hidden"
							name="diagnosedAt"
							value={diagnosedAt ? format(diagnosedAt, "yyyy-MM-dd") : ""}
						/>
						<Popover>
							<PopoverTrigger asChild>
								<Button
									id="edit-diagnosis-diagnosed-at"
									type="button"
									variant="outline"
									className={`${diagnosisDetailsFieldControlClassName} flex w-full justify-between font-normal hover:bg-white active:scale-100`}
								>
									{diagnosedAt ? format(diagnosedAt, "PPP") : "Select diagnosis date"}

									<RiCalendarLine className="size-4 text-gray-600" aria-hidden="true" />
								</Button>
							</PopoverTrigger>
							<PopoverContent className="p-0">
								<Calendar
									mode="single"
									selected={diagnosedAt}
									onSelect={setDiagnosedAt}
									disabled={{ after: new Date() }}
									autoFocus
								/>
							</PopoverContent>
						</Popover>
					</div>

					<div className="flex flex-col gap-2">
						<Label
							htmlFor="edit-diagnosis-diagnosed-by"
							className={diagnosisDetailsFieldLabelClassName}
						>
							Diagnosed by
							<span className={diagnosisDetailsRequiredLabelClassName}>(required)</span>
						</Label>
						<Input
							id="edit-diagnosis-diagnosed-by"
							name="diagnosedBy"
							defaultValue={diagnosis.editValues.diagnosedBy}
							className={diagnosisDetailsFieldControlClassName}
							required
						/>
					</div>

					<div className="flex flex-col gap-2 sm:col-span-2">
						<Label
							htmlFor="edit-diagnosis-clinical-note"
							className={diagnosisDetailsFieldLabelClassName}
						>
							Clinical notes
							<span className={diagnosisDetailsRequiredLabelClassName}>(optional)</span>
						</Label>
						<Textarea
							id="edit-diagnosis-clinical-note"
							name="clinicalNote"
							defaultValue={diagnosis.editValues.clinicalNote}
							className="bg-white text-sm text-gray-700 placeholder:text-gray-400"
						/>
					</div>
				</div>
			</div>

			<div className="flex flex-col gap-6">
				{diagnosisAttachmentRows.map((attachmentRow, attachmentIndex) => (
					<AttachmentFormFields
						key={attachmentRow.id}
						attachmentRow={attachmentRow}
						attachmentIndex={attachmentIndex}
						fieldLabelClassName={diagnosisDetailsFieldLabelClassName}
						requiredLabelClassName={diagnosisDetailsRequiredLabelClassName}
						fieldControlClassName={diagnosisDetailsFieldControlClassName}
						onRemoveAttachmentRow={handleRemoveDiagnosisAttachmentRow}
					/>
				))}

				<div>
					<Button
						type="button"
						variant="outline"
						className="bg-white text-gray-600"
						onClick={handleAddDiagnosisAttachmentRow}
					>
						<RiAddLine className="size-5" aria-hidden="true" />
						Add related record
					</Button>
				</div>
			</div>
		</form>
	);
}

function getDiagnosisAttachmentRows(diagnosis: DiagnosisDetailsType): AttachmentFormRow[] {
	return [
		...diagnosis.relatedRecords.labTests.map((record) => ({
			id: `attachment-lab-test-${record.id}`,
			name: record.name,
			recordId: record.id,
		})),
		...diagnosis.relatedRecords.imaging.map((record) => ({
			id: `attachment-imaging-${record.id}`,
			name: record.name,
			recordId: record.id,
		})),
		...diagnosis.relatedRecords.medications.map((record) => ({
			id: `attachment-medication-${record.id}`,
			name: record.name,
			recordId: record.id,
		})),
		...diagnosis.relatedRecords.procedures.map((record) => ({
			id: `attachment-procedure-${record.id}`,
			name: record.name,
			recordId: record.id,
		})),
	];
}

function DiagnosisDetailItem({ label, value }: { label: string; value: string }) {
	return (
		<div className="flex flex-col gap-2 no-line-height">
			<span className="text-gray-400">{label}</span>
			<span className="font-medium text-gray-600">{value || EMPTY_VALUE}</span>
		</div>
	);
}

function DiagnosisHistorySection({ history }: { history: DiagnosisDetailsHistoryEvent[] }) {
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
			<div className="flex flex-col gap-4">
				{history.map((historyEvent) => (
					<DiagnosisHistoryCard key={historyEvent.id} historyEvent={historyEvent} />
				))}
			</div>
		</div>
	);
}

function DiagnosisHistoryCard({ historyEvent }: { historyEvent: DiagnosisDetailsHistoryEvent }) {
	const [isDiagnosisHistoryExpanded, setIsDiagnosisHistoryExpanded] = useState(false);
	const sectionId = useId();
	const titleId = `${sectionId}-title`;
	const panelId = `${sectionId}-panel`;
	const changeCount =
		historyEvent.items.filter((item) => item.label !== "Clinical note").length || 1;

	return (
		<section className="flex flex-col rounded-xl border border-gray-200 p-4">
			<Button
				type="button"
				onClick={() => setIsDiagnosisHistoryExpanded((prev) => !prev)}
				aria-expanded={isDiagnosisHistoryExpanded}
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
						isDiagnosisHistoryExpanded ? "rotate-180" : "",
					)}
					aria-hidden="true"
				/>
			</Button>
			<div
				id={panelId}
				className={cn(
					"grid overflow-hidden transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none",
					isDiagnosisHistoryExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
				)}
				aria-hidden={!isDiagnosisHistoryExpanded}
				inert={!isDiagnosisHistoryExpanded}
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

function DiagnosisRelatedRecords({
	relatedRecords,
}: {
	relatedRecords: DiagnosisDetailsType["relatedRecords"];
}) {
	const sections = [
		{ title: "Medications", records: relatedRecords.medications },
		{ title: "Lab Tests", records: relatedRecords.labTests },
		{ title: "Imaging", records: relatedRecords.imaging },
		{ title: "Procedures", records: relatedRecords.procedures },
	].filter((section) => section.records.length > 0);

	if (sections.length === 0) {
		return null;
	}

	return (
		<div className="flex flex-col gap-[14px]">
			<div className="flex items-center justify-between w-full">
				<h2 className="text-sm font-semibold text-gray-800">Related records</h2>
				<Button
					variant="ghost"
					className="text-gray-400 h-auto rounded-none border-0 p-0 font-normal hover:bg-transparent hover:text-gray-400 focus-visible:border-0"
				>
					View more
				</Button>
			</div>{" "}
			<div className="flex flex-col gap-4">
				{sections.map((section) => (
					<DiagnosisRelatedRecordSection
						key={section.title}
						title={section.title}
						records={section.records}
					/>
				))}
			</div>
		</div>
	);
}

function DiagnosisRelatedRecordSection({
	title,
	records,
}: {
	title: string;
	records: DiagnosisDetailsRelatedRecord[];
}) {
	const [isRelatedRecordSectionExpanded, setIsRelatedRecordSectionExpanded] = useState(false);
	const sectionId = useId();
	const titleId = `${sectionId}-title`;
	const panelId = `${sectionId}-panel`;

	return (
		<section className="flex flex-col rounded-xl border border-gray-200 p-4">
			<Button
				type="button"
				onClick={() => setIsRelatedRecordSectionExpanded((prev) => !prev)}
				aria-expanded={isRelatedRecordSectionExpanded}
				aria-controls={panelId}
				variant="ghost"
				className="flex w-full justify-between gap-4 text-left h-auto whitespace-normal rounded-none border-0 p-0 font-normal hover:bg-transparent hover:text-inherit focus-visible:border-0 active:scale-100 has-[>svg:last-child]:pr-0"
			>
				<span id={titleId} className="text-sm font-semibold text-gray-800">
					{title}
				</span>
				<RiArrowDownSLine
					className={cn(
						"size-5 shrink-0 transition-transform duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none",
						isRelatedRecordSectionExpanded ? "rotate-180" : "",
					)}
					aria-hidden="true"
				/>
			</Button>
			<div
				id={panelId}
				className={cn(
					"grid overflow-hidden transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none",
					isRelatedRecordSectionExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
				)}
				aria-hidden={!isRelatedRecordSectionExpanded}
				inert={!isRelatedRecordSectionExpanded}
			>
				<div className="min-h-0 overflow-hidden">
					<div role="region" aria-labelledby={titleId} className="mt-5 flex flex-col gap-4">
						{records.map((record) => (
							<div
								key={record.id}
								className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
							>
								<div className="flex w-full items-center gap-2">
									<span className="min-w-0 truncate font-medium text-gray-600">{record.name}</span>
									<StatusBadge status={record.status} className="shrink-0" />
								</div>
								<CopyIdButton id={record.id} />
							</div>
						))}
					</div>
				</div>
			</div>
		</section>
	);
}

function DiagnosisDetailsFallback() {
	return (
		<div className="flex flex-col gap-8" aria-busy="true" aria-live="polite">
			<div className="flex flex-wrap gap-6">
				<div className="h-6 w-36 animate-pulse rounded-md bg-gray-100" />
				<div className="h-6 w-40 animate-pulse rounded-md bg-gray-100" />
			</div>
			<div className="flex flex-col gap-6">
				<div className="h-7 w-56 animate-pulse rounded-md bg-gray-100" />
				<div className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
					{Array.from({ length: 8 }).map((_, index) => (
						<div key={index} className="flex flex-col gap-2">
							<div className="h-4 w-28 animate-pulse rounded bg-gray-100" />
							<div className="h-5 w-44 animate-pulse rounded bg-gray-100" />
						</div>
					))}
				</div>
			</div>
			{Array.from({ length: 2 }).map((_, index) => (
				<div key={index} className="flex flex-col gap-4 rounded-xl border border-gray-200 p-4">
					<div className="h-5 w-48 animate-pulse rounded bg-gray-100" />
					<div className="grid grid-cols-1 gap-x-4 gap-y-5 sm:grid-cols-2">
						<div className="h-5 w-40 animate-pulse rounded bg-gray-100" />
						<div className="h-5 w-36 animate-pulse rounded bg-gray-100" />
					</div>
				</div>
			))}
		</div>
	);
}
