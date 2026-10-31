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
import { PixelLoader } from "@/components/ui/pixel-loader";
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
import type {
	ProcedureDetailsHistoryEvent,
	ProcedureDetailsRelatedRecord,
	ProcedureDetailsType,
} from "@/features/patients/types";
import {
	AttachmentFormFields,
	type AttachmentFormRow,
} from "@/features/patients/components/attachment-form-fields";
import { cn } from "@/lib/utils/cn";
import { authClient } from "@/lib/better-auth/auth.client";
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
import { Fragment, useId, useRef, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { updatePatientProcedureAction } from "@/features/patients/server/update-patient-procedure-action";
import { procedureStatuses } from "@/features/patients/server/schemas";

type ProcedureDetailsDrawerProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	procedure: ProcedureDetailsType | null;
	isLoading: boolean;
	onProcedureUpdated: () => void;
};

const EMPTY_VALUE = "-";
const procedureDetailsFormId = "procedure-details-form";
const procedureDetailsFieldLabelClassName =
	"inline-flex items-baseline gap-0.5 text-sm font-medium text-gray-700";
const procedureDetailsRequiredLabelClassName = "font-normal text-gray-400";
const procedureDetailsFieldControlClassName =
	"h-9 border-gray-200 bg-white text-sm text-gray-700 placeholder:text-gray-400";

export function ProcedureDetailsDrawer({
	open,
	onOpenChange,
	procedure,
	isLoading,
	onProcedureUpdated,
}: ProcedureDetailsDrawerProps) {
	const router = useRouter();
	const { data: activeMemberRole } = authClient.useActiveMemberRole();
	const canArchive = activeMemberRole?.role === "owner" || activeMemberRole?.role === "admin";
	const [procedureDetailsMode, setProcedureDetailsMode] = useState<"view" | "edit">("view");
	const [formError, setFormError] = useState("");
	const [isPending, startTransition] = useTransition();
	const [isArchiveDialogOpen, setIsArchiveDialogOpen] = useState(false);

	function handleProcedureDetailsModeChange(nextMode: "view" | "edit") {
		setFormError("");
		setProcedureDetailsMode(nextMode);
	}

	function handleProcedureDetailsOpenChange(nextOpen: boolean) {
		if (!nextOpen) {
			handleProcedureDetailsModeChange("view");
		}

		onOpenChange(nextOpen);
	}

	function handleSave(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();

		if (!procedure) return;

		setFormError("");
		const formData = new FormData(event.currentTarget);

		startTransition(async () => {
			const result = await updatePatientProcedureAction(procedure.procedureId, formData);

			if (result.status === "unauthorized") {
				router.refresh();
				return;
			}

			if (result.status !== "success") {
				setFormError(result.error);
				return;
			}

			setProcedureDetailsMode("view");
			onProcedureUpdated();
		});
	}

	const isEditingProcedureDetails = procedureDetailsMode === "edit" && Boolean(procedure);

	return (
		<Drawer open={open} onOpenChange={handleProcedureDetailsOpenChange} direction="right">
			<DrawerContent className="overflow-hidden rounded-3xl text-sm data-[vaul-drawer-direction=right]:top-4 data-[vaul-drawer-direction=right]:right-4 data-[vaul-drawer-direction=right]:bottom-4 data-[vaul-drawer-direction=right]:h-auto data-[vaul-drawer-direction=right]:w-[37.5rem]">
				<DrawerHeader className="flex-row items-center justify-between border-b border-gray-200 text-left">
					<DrawerTitle className="flex-1 leading-[1.2] text-gray-800">
						{isEditingProcedureDetails ? "Edit procedure details" : "Procedure details"}
					</DrawerTitle>
					{procedure && !isEditingProcedureDetails ? (
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="ghost" size="icon" aria-label="Procedure actions">
									<RiMore2Fill aria-hidden="true" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent
								align="end"
								className="w-50 rounded-xl bg-white text-sm text-gray-700"
							>
								<DropdownMenuItem
									className="rounded-lg"
									onSelect={() => handleProcedureDetailsModeChange("edit")}
								>
									<RiEdit2Line aria-hidden="true" />
									Edit
								</DropdownMenuItem>
								<DropdownMenuItem className="rounded-lg">
									<RiShare2Line aria-hidden="true" />
									Export
								</DropdownMenuItem>
								{procedure.status === "Pending" ? (
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
						<Button variant="ghost" size="icon" aria-label="Close procedure details">
							<RiCloseLine aria-hidden="true" />
						</Button>
					</DrawerClose>
					<DrawerDescription className="sr-only">
						{isEditingProcedureDetails
							? "Edit the selected procedure details."
							: "Showing details for the procedure you selected."}
					</DrawerDescription>
				</DrawerHeader>

				<div className="min-h-0 overflow-y-auto px-4 py-5 text-sm">
					{isLoading ? (
						<ProcedureDetailsFallback />
					) : isEditingProcedureDetails && procedure ? (
						<ProcedureDetailsEditForm
							key={procedure.procedureId}
							procedure={procedure}
							formError={formError}
							onFormErrorDismiss={() => setFormError("")}
							onSubmit={handleSave}
						/>
					) : procedure ? (
						<div className="flex flex-col gap-10">
							<ProcedureDetailsOverview procedure={procedure} />
							<ProcedureRelatedRecords relatedRecords={procedure.relatedRecords} />
							<ProcedureHistorySection history={procedure.history} />
						</div>
					) : (
						<div className="rounded-2xl border border-gray-200 p-5 text-gray-500">
							Procedure details could not be found.
						</div>
					)}
				</div>

				{isEditingProcedureDetails ? (
					<DrawerFooter className="border-t border-gray-200 text-sm">
						<div className="flex flex-col gap-2 lg:flex-row lg:self-end">
							<Button
								type="button"
								variant="outline"
								onClick={() => handleProcedureDetailsModeChange("view")}
							>
								Cancel
							</Button>
							<Button type="submit" form={procedureDetailsFormId} disabled={isPending}>
								{isPending ? <PixelLoader label="Saving…" /> : "Save changes"}
							</Button>
						</div>
					</DrawerFooter>
				) : null}
			</DrawerContent>
			<AlertDialog open={isArchiveDialogOpen} onOpenChange={setIsArchiveDialogOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Archive procedure</AlertDialogTitle>
						<Button
							type="button"
							variant="ghost"
							size="icon"
							aria-label="Close archive procedure dialog"
							onClick={() => setIsArchiveDialogOpen(false)}
						>
							<RiCloseLine aria-hidden="true" />
						</Button>
					</AlertDialogHeader>
					<AlertDialogDescription>
						This procedure will be removed from the patient’s active problem list. The record, its
						related medications, labs, imaging and full activity history are retained and can be
						restored at any time.
					</AlertDialogDescription>
					<AlertDialogFooter className="sm:justify-end">
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<Button type="button" onClick={() => setIsArchiveDialogOpen(false)}>
							Archive procedure
						</Button>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</Drawer>
	);
}

function ProcedureDetailsOverview({ procedure }: { procedure: ProcedureDetailsType }) {
	const dateLabel = procedure.status === "Pending" ? "Planned date" : "Performed on";
	const physicianLabel = procedure.status === "Pending" ? "Planned physician" : "Performed by";
	const assistantLabel = procedure.status === "Pending" ? "Planned Assistants" : "Team/Assistants";
	const facilityLabel = procedure.status === "Pending" ? "Planned Facility" : "Facility";
	const primaryDate =
		procedure.status === "Pending" ? procedure.plannedDate : procedure.procedureDate;
	const primaryPhysician =
		procedure.status === "Pending" ? procedure.plannedPhysician : procedure.performedBy;
	const primaryAssistants =
		procedure.status === "Pending" ? procedure.plannedAssistants : procedure.assistants;
	const primaryFacility =
		procedure.status === "Pending" ? procedure.plannedFacility : procedure.facility;

	return (
		<div className="flex flex-col gap-8">
			<div className="flex flex-col gap-4">
				<div className="flex flex-wrap items-center gap-x-8 gap-y-3 text-nowrap">
					<div className="flex items-center gap-2">
						<span className="text-gray-400">Procedure ID:</span>
						<CopyIdButton id={procedure.procedureId} />
					</div>
					{procedure.encounterId ? (
						<div className="flex items-center gap-2">
							<span className="text-gray-400">Encounter ID:</span>
							<CopyIdButton id={procedure.encounterId} />
						</div>
					) : null}
				</div>
				<p className="flex flex-wrap items-center gap-2 font-medium">
					<span className="text-gray-600">Created by {procedure.createdBy}</span>
					<span aria-hidden="true" className="size-1 rounded-full bg-gray-300" />
					<span className="text-gray-400">{procedure.createdAt}</span>
				</p>
			</div>

			<div className="flex flex-col gap-6">
				<div className="flex items-center gap-3">
					<h2 className="text-base font-semibold text-gray-800">{procedure.name}</h2>
					<StatusBadge status={procedure.status} />
				</div>

				<div className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
					<ProcedureDetailItem label="Indication" value={procedure.indication} />
					<ProcedureDetailItem label={dateLabel} value={primaryDate} />
					<ProcedureDetailItem label={physicianLabel} value={primaryPhysician} />
					<ProcedureDetailListItem label={assistantLabel} values={primaryAssistants} />
					<ProcedureDetailItem label={facilityLabel} value={primaryFacility} />
					<ProcedureDetailItem label="Clinical notes" value={procedure.clinicalNote} />
				</div>
			</div>
		</div>
	);
}

function ProcedureDetailsEditForm({
	procedure,
	formError,
	onFormErrorDismiss,
	onSubmit,
}: {
	procedure: ProcedureDetailsType;
	formError: string;
	onFormErrorDismiss: () => void;
	onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
	const [originalUpdatedAt] = useState(() => procedure.editValues.updatedAt);
	const generatedAttachmentRowId = useId();
	const nextAttachmentRowNumberRef = useRef(0);
	const nextAssistantRowNumberRef = useRef(0);
	const [procedureDate, setProcedureDate] = useState<Date | undefined>(() =>
		procedure.editValues.procedureDate ? parseISO(procedure.editValues.procedureDate) : undefined,
	);
	const [assistantRows, setAssistantRows] = useState<{ id: string; name: string }[]>(() =>
		procedure.editValues.assistants
			.split(",")
			.map((name) => name.trim())
			.filter(Boolean)
			.map((name, assistantIndex) => ({ id: `assistant-${assistantIndex}`, name })),
	);
	const enteredAssistants = assistantRows.filter((assistantRow) => assistantRow.name.trim());
	const selectedAssistantSummary =
		enteredAssistants.length > 1
			? `${enteredAssistants[0].name.trim()} +${enteredAssistants.length - 1} more`
			: enteredAssistants[0]?.name.trim();

	function handleAddAssistantRow() {
		nextAssistantRowNumberRef.current += 1;

		setAssistantRows((prev) => [
			...prev,
			{
				id: `${generatedAttachmentRowId}-assistant-${nextAssistantRowNumberRef.current}`,
				name: "",
			},
		]);
	}

	function handleAssistantNameChange(assistantRowId: string, name: string) {
		setAssistantRows((prev) =>
			prev.map((assistantRow) =>
				assistantRow.id === assistantRowId ? { ...assistantRow, name } : assistantRow,
			),
		);
	}

	function handleRemoveAssistantRow(assistantRowId: string) {
		setAssistantRows((prev) => prev.filter((assistantRow) => assistantRow.id !== assistantRowId));
	}
	const [procedureAttachmentRows, setProcedureAttachmentRows] = useState<AttachmentFormRow[]>(() =>
		getProcedureAttachmentRows(procedure),
	);

	function handleAddProcedureAttachmentRow() {
		nextAttachmentRowNumberRef.current += 1;

		setProcedureAttachmentRows((prev) => [
			...prev,
			{
				id: `${generatedAttachmentRowId}-attachment-${nextAttachmentRowNumberRef.current}`,
				name: "",
				recordId: "",
			},
		]);
	}

	function handleRemoveProcedureAttachmentRow(attachmentRowId: string) {
		setProcedureAttachmentRows((prev) =>
			prev.filter((attachmentRow) => attachmentRow.id !== attachmentRowId),
		);
	}

	return (
		<form id={procedureDetailsFormId} onSubmit={onSubmit} className="flex flex-col gap-12">
			<input type="hidden" name="updatedAt" value={originalUpdatedAt} />
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
						<span className="text-gray-400">Procedure ID:</span>
						<CopyIdButton id={procedure.procedureId} />
					</div>
					{procedure.encounterId ? (
						<div className="flex items-center gap-2">
							<span className="text-gray-400">Encounter ID:</span>
							<CopyIdButton id={procedure.encounterId} />
						</div>
					) : null}
				</div>

				<div className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
					<div className="flex flex-col gap-2 sm:col-span-2">
						<Label htmlFor="edit-procedure-name" className={procedureDetailsFieldLabelClassName}>
							Procedure<span className={procedureDetailsRequiredLabelClassName}>(required)</span>
						</Label>
						<Input
							id="edit-procedure-name"
							name="procedureName"
							defaultValue={procedure.name}
							className={procedureDetailsFieldControlClassName}
							required
						/>
					</div>

					<div className="flex flex-col gap-2">
						<Label
							htmlFor="edit-procedure-indication"
							className={procedureDetailsFieldLabelClassName}
						>
							Indication<span className={procedureDetailsRequiredLabelClassName}>(optional)</span>
						</Label>
						<Input
							id="edit-procedure-indication"
							name="indication"
							defaultValue={procedure.editValues.indication}
							className={procedureDetailsFieldControlClassName}
						/>
					</div>

					<div className="flex flex-col gap-2">
						<Label htmlFor="edit-procedure-status" className={procedureDetailsFieldLabelClassName}>
							Status<span className={procedureDetailsRequiredLabelClassName}>(required)</span>
						</Label>
						<Select name="status" defaultValue={procedure.status} required>
							<SelectTrigger
								id="edit-procedure-status"
								className={`${procedureDetailsFieldControlClassName} w-full`}
							>
								<SelectValue placeholder="Select status" />
							</SelectTrigger>
							<SelectContent>
								<SelectGroup>
									{procedureStatuses.map((status) => (
										<SelectItem key={status} value={status}>
											{status}
										</SelectItem>
									))}
								</SelectGroup>
							</SelectContent>
						</Select>
					</div>

					<div className="flex flex-col gap-2">
						<Label htmlFor="edit-procedure-date" className={procedureDetailsFieldLabelClassName}>
							Date<span className={procedureDetailsRequiredLabelClassName}>(required)</span>
						</Label>
						<input
							type="hidden"
							name="procedureDate"
							value={procedureDate ? format(procedureDate, "yyyy-MM-dd") : ""}
						/>
						<Popover>
							<PopoverTrigger asChild>
								<Button
									id="edit-procedure-date"
									type="button"
									variant="outline"
									data-empty={!procedureDate}
									className={`${procedureDetailsFieldControlClassName} flex w-full justify-between font-normal data-[empty=true]:text-gray-400 hover:bg-white active:scale-100`}
								>
									{procedureDate ? format(procedureDate, "PPP") : "Select procedure date"}
									<RiCalendarLine className="size-4 text-gray-600" aria-hidden="true" />
								</Button>
							</PopoverTrigger>
							<PopoverContent className="p-0">
								<Calendar
									mode="single"
									selected={procedureDate}
									onSelect={setProcedureDate}
									autoFocus
								/>
							</PopoverContent>
						</Popover>
					</div>

					<div className="flex flex-col gap-2">
						<Label
							htmlFor="edit-procedure-physician"
							className={procedureDetailsFieldLabelClassName}
						>
							Physician<span className={procedureDetailsRequiredLabelClassName}>(required)</span>
						</Label>
						<Input
							id="edit-procedure-physician"
							name="physician"
							defaultValue={procedure.editValues.physician}
							className={procedureDetailsFieldControlClassName}
							required
						/>
					</div>

					<div className="flex flex-col gap-2">
						<Label
							htmlFor="edit-procedure-assistants"
							className={procedureDetailsFieldLabelClassName}
						>
							Assistants<span className={procedureDetailsRequiredLabelClassName}>(required)</span>
						</Label>
						<input
							type="hidden"
							name="assistants"
							value={enteredAssistants.map((assistantRow) => assistantRow.name.trim()).join(", ")}
						/>
						<Popover>
							<PopoverTrigger
								id="edit-procedure-assistants"
								className={`${procedureDetailsFieldControlClassName} group flex w-full items-center justify-between gap-4 rounded-md border px-3 py-2 text-left outline-none focus-visible:border-gray-400 focus-visible:ring-3 focus-visible:ring-gray-100`}
							>
								<span
									className={
										selectedAssistantSummary
											? "truncate text-sm text-gray-700"
											: "truncate text-sm font-normal text-gray-400"
									}
								>
									{selectedAssistantSummary ?? "Enter assistants"}
								</span>
								<RiArrowDownSLine
									className="size-5 shrink-0 text-gray-500 transition-transform group-data-[state=open]:rotate-180"
									aria-hidden="true"
								/>
							</PopoverTrigger>
							<PopoverContent
								align="end"
								className="flex flex-col gap-2 rounded-[0.625rem] p-1.5 text-sm text-gray-600"
							>
								{assistantRows.map((assistantRow, assistantIndex) => (
									<div
										key={assistantRow.id}
										className="flex h-9 items-center justify-between rounded-[0.375rem] border border-gray-200 pl-3 pr-1.5"
									>
										<input
											type="text"
											aria-label={`Assistant ${assistantIndex + 1} name`}
											placeholder="Enter assistant name"
											value={assistantRow.name}
											onChange={(event) =>
												handleAssistantNameChange(assistantRow.id, event.target.value)
											}
											className="min-w-0 flex-1 bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-400"
										/>
										<Button
											type="button"
											variant="ghost"
											size="icon"
											aria-label={`Remove assistant ${assistantIndex + 1}`}
											onClick={() => handleRemoveAssistantRow(assistantRow.id)}
											className="size-6 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200"
										>
											<RiCloseLine className="size-4" aria-hidden="true" />
										</Button>
									</div>
								))}
								<Button
									type="button"
									onClick={handleAddAssistantRow}
									variant="ghost"
									className="flex w-full justify-between bg-gray-100 px-3 text-left text-gray-600 hover:bg-gray-200 border-0 font-normal hover:text-gray-600 focus-visible:border-0 active:scale-100"
								>
									<span>Add more</span>
									<RiAddLine className="size-5" aria-hidden="true" />
								</Button>
							</PopoverContent>
						</Popover>
					</div>

					<div className="flex flex-col gap-2">
						<Label
							htmlFor="edit-procedure-facility"
							className={procedureDetailsFieldLabelClassName}
						>
							Facility<span className={procedureDetailsRequiredLabelClassName}>(required)</span>
						</Label>
						<Input
							id="edit-procedure-facility"
							name="facility"
							defaultValue={procedure.editValues.facility}
							className={procedureDetailsFieldControlClassName}
							required
						/>
					</div>

					<div className="flex flex-col gap-2 sm:col-span-2">
						<Label
							htmlFor="edit-procedure-clinical-note"
							className={procedureDetailsFieldLabelClassName}
						>
							Clinical notes
							<span className={procedureDetailsRequiredLabelClassName}>(optional)</span>
						</Label>
						<Textarea
							id="edit-procedure-clinical-note"
							name="clinicalNote"
							defaultValue={procedure.editValues.clinicalNote}
							className="min-h-28 bg-white text-sm text-gray-700 placeholder:text-gray-400"
						/>
					</div>
				</div>
			</div>

			<div className="flex flex-col gap-6">
				{procedureAttachmentRows.map((attachmentRow, attachmentIndex) => (
					<AttachmentFormFields
						key={attachmentRow.id}
						attachmentRow={attachmentRow}
						attachmentIndex={attachmentIndex}
						fieldLabelClassName={procedureDetailsFieldLabelClassName}
						requiredLabelClassName={procedureDetailsRequiredLabelClassName}
						fieldControlClassName={procedureDetailsFieldControlClassName}
						onRemoveAttachmentRow={handleRemoveProcedureAttachmentRow}
					/>
				))}

				<div>
					<Button
						type="button"
						variant="outline"
						className="bg-white text-gray-600"
						onClick={handleAddProcedureAttachmentRow}
					>
						<RiAddLine className="size-5" aria-hidden="true" />
						Add related record
					</Button>
				</div>
			</div>
		</form>
	);
}

function getProcedureAttachmentRows(procedure: ProcedureDetailsType): AttachmentFormRow[] {
	const relatedAttachmentRecords = [
		{ kind: "diagnosis", name: "Diagnosis", record: procedure.relatedRecords.diagnosis },
		{ kind: "medication", name: "Medication", record: procedure.relatedRecords.medication },
	];

	return relatedAttachmentRecords
		.filter(
			(
				relatedAttachmentRecord,
			): relatedAttachmentRecord is {
				kind: string;
				name: string;
				record: ProcedureDetailsRelatedRecord;
			} => Boolean(relatedAttachmentRecord.record),
		)
		.map((relatedAttachmentRecord) => ({
			id: `attachment-${relatedAttachmentRecord.kind}-${relatedAttachmentRecord.record.id}`,
			name: relatedAttachmentRecord.name,
			recordId: relatedAttachmentRecord.record.id,
		}));
}

function ProcedureDetailItem({ label, value }: { label: string; value: string }) {
	return (
		<div className="flex flex-col gap-2 no-line-height">
			<span className="text-gray-400">{label}</span>
			<span className="font-medium text-gray-600">{value || EMPTY_VALUE}</span>
		</div>
	);
}

function ProcedureDetailListItem({ label, values }: { label: string; values: string[] }) {
	return (
		<div className="flex flex-col gap-2 no-line-height">
			<span className="text-gray-400">{label}</span>
			{values.length > 0 ? (
				<ul className="list-disc pl-5 font-medium text-gray-600">
					{values.map((value) => (
						<li key={value}>{value}</li>
					))}
				</ul>
			) : (
				<span className="font-medium text-gray-600">{EMPTY_VALUE}</span>
			)}
		</div>
	);
}

function ProcedureRelatedRecords({
	relatedRecords,
}: {
	relatedRecords: ProcedureDetailsType["relatedRecords"];
}) {
	const sections = [
		{ title: "Diagnosis", record: relatedRecords.diagnosis },
		{ title: "Medication", record: relatedRecords.medication },
	].filter((section): section is { title: string; record: ProcedureDetailsRelatedRecord } =>
		Boolean(section.record),
	);

	if (sections.length === 0) {
		return null;
	}

	return (
		<div className="flex flex-col gap-4">
			{sections.map((section) => (
				<ProcedureRelatedRecordSection
					key={section.title}
					title={section.title}
					record={section.record}
				/>
			))}
		</div>
	);
}

function ProcedureRelatedRecordSection({
	title,
	record,
}: {
	title: string;
	record: ProcedureDetailsRelatedRecord;
}) {
	const [isRelatedProcedureRecordExpanded, setIsRelatedProcedureRecordExpanded] = useState(false);
	const sectionId = useId();
	const titleId = `${sectionId}-title`;
	const panelId = `${sectionId}-panel`;

	return (
		<section className="flex flex-col rounded-xl border border-gray-200 p-4">
			<Button
				type="button"
				onClick={() => setIsRelatedProcedureRecordExpanded((prev) => !prev)}
				aria-expanded={isRelatedProcedureRecordExpanded}
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
						isRelatedProcedureRecordExpanded ? "rotate-180" : "",
					)}
					aria-hidden="true"
				/>
			</Button>
			<div
				id={panelId}
				className={cn(
					"grid overflow-hidden transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none",
					isRelatedProcedureRecordExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
				)}
				aria-hidden={!isRelatedProcedureRecordExpanded}
				inert={!isRelatedProcedureRecordExpanded}
			>
				<div className="min-h-0 overflow-hidden">
					<div
						role="region"
						aria-labelledby={titleId}
						className="mt-5 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
					>
						<div className="flex min-w-0 flex-wrap items-center gap-2">
							<span className="min-w-0 truncate font-medium text-gray-600">{record.name}</span>
							<StatusBadge status={record.status} className="shrink-0" />
						</div>
						<CopyIdButton id={record.id} />
					</div>
				</div>
			</div>
		</section>
	);
}

function ProcedureHistorySection({ history }: { history: ProcedureDetailsHistoryEvent[] }) {
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
				<ProcedureHistoryCard key={historyEvent.id} historyEvent={historyEvent} />
			))}
		</div>
	);
}

function ProcedureHistoryCard({ historyEvent }: { historyEvent: ProcedureDetailsHistoryEvent }) {
	const [isProcedureHistoryExpanded, setIsProcedureHistoryExpanded] = useState(false);
	const sectionId = useId();
	const titleId = `${sectionId}-title`;
	const panelId = `${sectionId}-panel`;
	const changeCount =
		historyEvent.items.filter((item) => item.label !== "Clinical note").length || 1;

	return (
		<section className="flex flex-col rounded-xl border border-gray-200 p-4">
			<Button
				type="button"
				onClick={() => setIsProcedureHistoryExpanded((prev) => !prev)}
				aria-expanded={isProcedureHistoryExpanded}
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
						isProcedureHistoryExpanded ? "rotate-180" : "",
					)}
					aria-hidden="true"
				/>
			</Button>
			<div
				id={panelId}
				className={cn(
					"grid overflow-hidden transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none",
					isProcedureHistoryExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
				)}
				aria-hidden={!isProcedureHistoryExpanded}
				inert={!isProcedureHistoryExpanded}
			>
				<div className="min-h-0 overflow-hidden">
					<div role="region" aria-labelledby={titleId} className="mt-4">
						<dl className="grid grid-cols-[8.75rem_1fr] gap-x-4 gap-y-2">
							{historyEvent.items.map((item) =>
								item.label === "Clinical note" ? (
									<Fragment key={`${historyEvent.id}-${item.label}`}>
										<dt className="col-span-2 text-gray-400">{item.label}</dt>
										<dd className="col-span-2 flex flex-col gap-2 text-gray-700">
											{item.value === "" && (
												<>
													<span className="text-gray-400 line-through">{item.previousValue}</span>
													<span className="w-fit rounded-md bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
														Removed
													</span>
												</>
											)}
											{item.previousValue === "" && item.value}
											{item.previousValue !== "" && item.value !== "" && (
												<>
													<div className="rounded-lg bg-gray-50 px-3 py-2">
														<p className="text-xs font-medium text-gray-400 uppercase">Before</p>
														<p className="text-gray-400">{item.previousValue}</p>
													</div>
													<div className="rounded-lg border border-gray-200 px-3 py-2">
														<p className="text-xs font-medium text-gray-400 uppercase">After</p>
														<p>{item.value}</p>
													</div>
												</>
											)}
										</dd>
									</Fragment>
								) : (
									<Fragment key={`${historyEvent.id}-${item.label}`}>
										<dt className="text-gray-400">{item.label}</dt>
										<dd className="flex flex-wrap items-center gap-2 text-gray-700">
											{item.value === "" && (
												<>
													<span className="text-gray-400 line-through">{item.previousValue}</span>
													<span className="rounded-md bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
														Removed
													</span>
												</>
											)}
											{item.previousValue === "" && item.value}
											{item.previousValue !== "" && item.value !== "" && (
												<>
													<span className="text-gray-400">{item.previousValue}</span>
													<RiArrowRightLine className="size-4 shrink-0" aria-hidden="true" />
													<span className="sr-only">{" changed to "}</span>
													<span>{item.value}</span>
												</>
											)}
										</dd>
									</Fragment>
								),
							)}
						</dl>
					</div>
				</div>
			</div>
		</section>
	);
}

function ProcedureDetailsFallback() {
	return (
		<div className="flex flex-col gap-8" aria-busy="true" aria-live="polite">
			<div className="flex flex-wrap gap-6">
				<div className="h-6 w-36 animate-pulse rounded-md bg-gray-100" />
				<div className="h-6 w-40 animate-pulse rounded-md bg-gray-100" />
			</div>
			<div className="flex flex-col gap-6">
				<div className="h-7 w-52 animate-pulse rounded-md bg-gray-100" />
				<div className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
					{Array.from({ length: 10 }).map((_, index) => (
						<div key={index} className="flex flex-col gap-2">
							<div className="h-4 w-28 animate-pulse rounded bg-gray-100" />
							<div className="h-5 w-44 animate-pulse rounded bg-gray-100" />
						</div>
					))}
				</div>
			</div>
			{Array.from({ length: 3 }).map((_, index) => (
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
