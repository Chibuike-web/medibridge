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
import type {
	MedicationDetailsHistoryEvent,
	MedicationDetailsType,
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
import { updatePatientMedicationAction } from "@/features/patients/server/update-patient-medication-action";
import { medicationRoutes, medicationStatuses } from "@/features/patients/server/schemas";

type MedicationDetailsDrawerProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	medication: MedicationDetailsType | null;
	isLoading: boolean;
	onMedicationUpdated: () => void;
};

const EMPTY_VALUE = "-";
const medicationDetailsFormId = "medication-details-form";
const medicationDetailsFieldLabelClassName =
	"inline-flex items-baseline gap-0.5 text-sm font-medium text-gray-700";
const medicationDetailsRequiredLabelClassName = "font-normal text-gray-400";
const medicationDetailsFieldControlClassName =
	"h-9 border-gray-200 bg-white text-sm text-gray-700 placeholder:text-gray-400";

export function MedicationDetailsDrawer({
	open,
	onOpenChange,
	medication,
	isLoading,
	onMedicationUpdated,
}: MedicationDetailsDrawerProps) {
	const router = useRouter();
	const { data: activeMemberRole } = authClient.useActiveMemberRole();
	const canArchive = activeMemberRole?.role === "owner" || activeMemberRole?.role === "admin";
	const [medicationDetailsMode, setMedicationDetailsMode] = useState<"view" | "edit">("view");
	const [formError, setFormError] = useState("");
	const [isPending, startTransition] = useTransition();
	const [isDiscontinueDialogOpen, setIsDiscontinueDialogOpen] = useState(false);
	const [isArchiveDialogOpen, setIsArchiveDialogOpen] = useState(false);

	function handleMedicationDetailsModeChange(nextMode: "view" | "edit") {
		setFormError("");
		setMedicationDetailsMode(nextMode);
	}

	function handleMedicationDetailsOpenChange(nextOpen: boolean) {
		if (!nextOpen) {
			handleMedicationDetailsModeChange("view");
		}

		onOpenChange(nextOpen);
	}

	function handleSave(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();

		if (!medication) return;

		setFormError("");
		const formData = new FormData(event.currentTarget);

		startTransition(async () => {
			const result = await updatePatientMedicationAction(medication.medicationId, formData);

			if (result.status === "unauthorized") {
				router.refresh();
				return;
			}

			if (result.status !== "success") {
				setFormError(result.error);
				return;
			}

			setMedicationDetailsMode("view");
			onMedicationUpdated();
		});
	}

	const isEditingMedicationDetails = medicationDetailsMode === "edit" && Boolean(medication);

	return (
		<Drawer open={open} onOpenChange={handleMedicationDetailsOpenChange} direction="right">
			<DrawerContent className="overflow-hidden rounded-3xl text-sm data-[vaul-drawer-direction=right]:top-4 data-[vaul-drawer-direction=right]:right-4 data-[vaul-drawer-direction=right]:bottom-4 data-[vaul-drawer-direction=right]:h-auto data-[vaul-drawer-direction=right]:w-[37.5rem]">
				<DrawerHeader className="flex-row items-center justify-between border-b border-gray-200 text-left">
					<DrawerTitle className="flex-1 leading-[1.2] text-gray-800">
						{isEditingMedicationDetails ? "Edit medication details" : "View medication details"}
					</DrawerTitle>
					{medication && !isEditingMedicationDetails ? (
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="ghost" size="icon" aria-label="Medication actions">
									<RiMore2Fill aria-hidden="true" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent
								align="end"
								className="w-50 rounded-xl bg-white text-sm text-gray-700"
							>
								<DropdownMenuItem
									className="rounded-lg"
									onSelect={() => handleMedicationDetailsModeChange("edit")}
								>
									<RiEdit2Line aria-hidden="true" />
									Edit
								</DropdownMenuItem>
								<DropdownMenuItem className="rounded-lg">
									<RiShare2Line aria-hidden="true" />
									Export
								</DropdownMenuItem>
								{medication.status === "Active" ? (
									<>
										<DropdownMenuItem className="rounded-lg">
											<RiCheckLine aria-hidden="true" />
											Mark as completed
										</DropdownMenuItem>
										<DropdownMenuItem
											className="rounded-lg text-rose-600 focus:bg-rose-50 focus:text-rose-600"
											onSelect={() => setIsDiscontinueDialogOpen(true)}
										>
											<RiCloseLine aria-hidden="true" className="text-current" />
											Discontinue
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
						<Button variant="ghost" size="icon" aria-label="Close medication details">
							<RiCloseLine aria-hidden="true" />
						</Button>
					</DrawerClose>
					<DrawerDescription className="sr-only">
						{isEditingMedicationDetails
							? "Edit the selected medication details."
							: "Showing details for the medication you selected."}
					</DrawerDescription>
				</DrawerHeader>

				<div className="min-h-0 overflow-y-auto px-4 py-5 text-sm">
					{isLoading ? (
						<MedicationDetailsFallback />
					) : isEditingMedicationDetails && medication ? (
						<MedicationDetailsEditForm
							medication={medication}
							formError={formError}
							onFormErrorDismiss={() => setFormError("")}
							onSubmit={handleSave}
						/>
					) : medication ? (
						<div className="flex flex-col gap-10">
							<MedicationDetailsOverview medication={medication} />
							<MedicationHistorySection history={medication.history} />
						</div>
					) : (
						<div className="rounded-2xl border border-gray-200 p-5 text-gray-500">
							Medication details could not be found.
						</div>
					)}
				</div>

				{isEditingMedicationDetails ? (
					<DrawerFooter className="border-t border-gray-200 text-sm">
						<div className="flex flex-col gap-2 lg:flex-row lg:self-end">
							<Button
								type="button"
								variant="outline"
								onClick={() => handleMedicationDetailsModeChange("view")}
							>
								Cancel
							</Button>
							<Button type="submit" form={medicationDetailsFormId} disabled={isPending}>
								{isPending ? "Saving…" : "Save changes"}
							</Button>
						</div>
					</DrawerFooter>
				) : null}
			</DrawerContent>
			<AlertDialog open={isDiscontinueDialogOpen} onOpenChange={setIsDiscontinueDialogOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Discontinue medication?</AlertDialogTitle>
						<Button
							type="button"
							variant="ghost"
							size="icon"
							aria-label="Close discontinue medication dialog"
							onClick={() => setIsDiscontinueDialogOpen(false)}
						>
							<RiCloseLine aria-hidden="true" />
						</Button>
					</AlertDialogHeader>
					<AlertDialogDescription>
						This medication will be removed from the patient’s active medication list. The
						medication record, related encounters, labs, and full activity history will be retained
						and can be restored at any time.
					</AlertDialogDescription>
					<AlertDialogFooter className="sm:justify-end">
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<Button
							type="button"
							className="bg-rose-500 text-white hover:bg-rose-600"
							onClick={() => setIsDiscontinueDialogOpen(false)}
						>
							Discontinue medication
						</Button>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
			<AlertDialog open={isArchiveDialogOpen} onOpenChange={setIsArchiveDialogOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Archive medication</AlertDialogTitle>
						<Button
							type="button"
							variant="ghost"
							size="icon"
							aria-label="Close archive medication dialog"
							onClick={() => setIsArchiveDialogOpen(false)}
						>
							<RiCloseLine aria-hidden="true" />
						</Button>
					</AlertDialogHeader>
					<AlertDialogDescription>
						This medication will be removed from the patient’s active problem list. The record, its
						related medications, labs, imaging and full activity history are retained and can be
						restored at any time.
					</AlertDialogDescription>
					<AlertDialogFooter className="sm:justify-end">
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<Button type="button" onClick={() => setIsArchiveDialogOpen(false)}>
							Archive medication
						</Button>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</Drawer>
	);
}

function MedicationDetailsOverview({ medication }: { medication: MedicationDetailsType }) {
	return (
		<div className="flex flex-col gap-8">
			<div className="flex flex-col gap-4">
				<div className="flex flex-wrap items-center gap-x-8 gap-y-3 text-nowrap">
					<div className="flex items-center gap-2">
						<span className="text-gray-400">Medication ID:</span>
						<CopyIdButton id={medication.medicationId} />
					</div>
					{medication.encounterId ? (
						<div className="flex items-center gap-2">
							<span className="text-gray-400">Encounter ID:</span>
							<CopyIdButton id={medication.encounterId} />
						</div>
					) : null}
				</div>
				<p className="flex flex-wrap items-center gap-2 font-medium">
					<span className="text-gray-600">Created by {medication.createdBy}</span>
					<span aria-hidden="true" className="size-1 rounded-full bg-gray-300" />
					<span className="text-gray-400">{medication.createdAt}</span>
				</p>
			</div>

			<div className="flex flex-col gap-6">
				<div className="flex items-center gap-3">
					<h2 className="text-lg font-semibold text-gray-800">{medication.name}</h2>
					<StatusBadge status={medication.status} />
				</div>

				<div className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
					<MedicationDetailItem label="Dose" value={medication.dose} />
					<MedicationDetailItem label="Route" value={medication.route} />
					<MedicationDetailItem label="Frequency" value={medication.frequency} />
					<MedicationDetailItem label="Indication" value={medication.indication} />
					<MedicationDetailItem label="Prescribed by" value={medication.prescribedBy} />
					<MedicationDetailItem label="Started at" value={medication.startedAt} />
					<MedicationDetailItem label="Duration" value={medication.duration} />
				</div>
			</div>
		</div>
	);
}

function MedicationDetailsEditForm({
	medication,
	formError,
	onFormErrorDismiss,
	onSubmit,
}: {
	medication: MedicationDetailsType;
	formError: string;
	onFormErrorDismiss: () => void;
	onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
	const generatedAttachmentRowId = useId();
	const nextAttachmentRowNumberRef = useRef(0);
	const [startedAt, setStartedAt] = useState<Date | undefined>(() =>
		medication.editValues.startedAt ? parseISO(medication.editValues.startedAt) : undefined,
	);
	const [medicationAttachmentRows, setMedicationAttachmentRows] = useState<AttachmentFormRow[]>([]);

	function handleAddMedicationAttachmentRow() {
		nextAttachmentRowNumberRef.current += 1;

		setMedicationAttachmentRows((prev) => [
			...prev,
			{
				id: `${generatedAttachmentRowId}-attachment-${nextAttachmentRowNumberRef.current}`,
				name: "",
				recordId: "",
			},
		]);
	}

	function handleRemoveMedicationAttachmentRow(attachmentRowId: string) {
		setMedicationAttachmentRows((prev) =>
			prev.filter((attachmentRow) => attachmentRow.id !== attachmentRowId),
		);
	}

	return (
		<form id={medicationDetailsFormId} onSubmit={onSubmit} className="flex flex-col gap-12">
			<input type="hidden" name="updatedAt" value={medication.editValues.updatedAt} />
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
						<span className="text-gray-400">Medication ID:</span>
						<CopyIdButton id={medication.medicationId} />
					</div>
					{medication.encounterId ? (
						<div className="flex items-center gap-2">
							<span className="text-gray-400">Encounter ID:</span>
							<CopyIdButton id={medication.encounterId} />
						</div>
					) : null}
				</div>

				<div className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
					<div className="flex flex-col gap-2 sm:col-span-2">
						<Label htmlFor="edit-medication-name" className={medicationDetailsFieldLabelClassName}>
							Medication<span className={medicationDetailsRequiredLabelClassName}>(required)</span>
						</Label>
						<Input
							id="edit-medication-name"
							name="medicationName"
							defaultValue={medication.name}
							className={medicationDetailsFieldControlClassName}
							required
						/>
					</div>

					<div className="flex flex-col gap-2">
						<Label
							htmlFor="edit-medication-indication"
							className={medicationDetailsFieldLabelClassName}
						>
							Indication<span className={medicationDetailsRequiredLabelClassName}>(required)</span>
						</Label>
						<Input
							id="edit-medication-indication"
							name="indication"
							defaultValue={medication.editValues.indication}
							className={medicationDetailsFieldControlClassName}
							required
						/>
					</div>

					<div className="flex flex-col gap-2">
						<Label
							htmlFor="edit-medication-status"
							className={medicationDetailsFieldLabelClassName}
						>
							Status<span className={medicationDetailsRequiredLabelClassName}>(required)</span>
						</Label>
						<Select name="status" defaultValue={medication.status} required>
							<SelectTrigger
								id="edit-medication-status"
								className={`${medicationDetailsFieldControlClassName} w-full`}
							>
								<SelectValue placeholder="Select status" />
							</SelectTrigger>
							<SelectContent>
								<SelectGroup>
									{medicationStatuses.map((status) => (
										<SelectItem key={status} value={status}>
											{status}
										</SelectItem>
									))}
								</SelectGroup>
							</SelectContent>
						</Select>
					</div>

					<div className="flex flex-col gap-2">
						<Label htmlFor="edit-medication-dose" className={medicationDetailsFieldLabelClassName}>
							Dose<span className={medicationDetailsRequiredLabelClassName}>(required)</span>
						</Label>
						<Input
							id="edit-medication-dose"
							name="dose"
							defaultValue={medication.editValues.dose}
							className={medicationDetailsFieldControlClassName}
							required
						/>
					</div>

					<div className="flex flex-col gap-2">
						<Label htmlFor="edit-medication-route" className={medicationDetailsFieldLabelClassName}>
							Route<span className={medicationDetailsRequiredLabelClassName}>(required)</span>
						</Label>
						<Select name="route" defaultValue={medication.editValues.route || undefined} required>
							<SelectTrigger
								id="edit-medication-route"
								className={`${medicationDetailsFieldControlClassName} w-full`}
							>
								<SelectValue placeholder="Select route" />
							</SelectTrigger>
							<SelectContent>
								<SelectGroup>
									{medicationRoutes.map((route) => (
										<SelectItem key={route} value={route}>
											{route}
										</SelectItem>
									))}
								</SelectGroup>
							</SelectContent>
						</Select>
					</div>

					<div className="flex flex-col gap-2">
						<Label
							htmlFor="edit-medication-prescribed-by"
							className={medicationDetailsFieldLabelClassName}
						>
							Prescribed by
							<span className={medicationDetailsRequiredLabelClassName}>(required)</span>
						</Label>
						<Input
							id="edit-medication-prescribed-by"
							name="prescribedBy"
							defaultValue={medication.editValues.prescribedBy}
							className={medicationDetailsFieldControlClassName}
							required
						/>
					</div>

					<div className="flex flex-col gap-2">
						<Label
							htmlFor="edit-medication-frequency"
							className={medicationDetailsFieldLabelClassName}
						>
							Frequency<span className={medicationDetailsRequiredLabelClassName}>(required)</span>
						</Label>
						<Input
							id="edit-medication-frequency"
							name="frequency"
							defaultValue={medication.editValues.frequency}
							className={medicationDetailsFieldControlClassName}
							required
						/>
					</div>

					<div className="flex flex-col gap-2">
						<Label
							htmlFor="edit-medication-duration"
							className={medicationDetailsFieldLabelClassName}
						>
							Duration<span className={medicationDetailsRequiredLabelClassName}>(required)</span>
						</Label>
						<Input
							id="edit-medication-duration"
							name="duration"
							defaultValue={medication.editValues.duration}
							className={medicationDetailsFieldControlClassName}
							required
						/>
					</div>

					<div className="flex flex-col gap-2">
						<Label
							htmlFor="edit-medication-started-at"
							className={medicationDetailsFieldLabelClassName}
						>
							Started at<span className={medicationDetailsRequiredLabelClassName}>(required)</span>
						</Label>
						<input
							type="hidden"
							name="startedAt"
							value={startedAt ? format(startedAt, "yyyy-MM-dd") : ""}
						/>
						<Popover>
							<PopoverTrigger asChild>
								<Button
									id="edit-medication-started-at"
									type="button"
									variant="outline"
									data-empty={!startedAt}
									className={`${medicationDetailsFieldControlClassName} flex w-full justify-between font-normal data-[empty=true]:text-gray-400 hover:bg-white active:scale-100`}
								>
									{startedAt ? format(startedAt, "PPP") : "Select start date"}
									<RiCalendarLine className="size-4 text-gray-600" aria-hidden="true" />
								</Button>
							</PopoverTrigger>
							<PopoverContent align="end" className="p-0">
								<Calendar
									mode="single"
									selected={startedAt}
									onSelect={setStartedAt}
									disabled={{ after: new Date() }}
									autoFocus
								/>
							</PopoverContent>
						</Popover>
					</div>

					<div className="flex flex-col gap-2 sm:col-span-2">
						<Label
							htmlFor="edit-medication-clinical-note"
							className={medicationDetailsFieldLabelClassName}
						>
							Clinical notes
							<span className={medicationDetailsRequiredLabelClassName}>(optional)</span>
						</Label>
						<Textarea
							id="edit-medication-clinical-note"
							name="clinicalNote"
							defaultValue={medication.editValues.clinicalNote}
							className="min-h-28 bg-white text-sm text-gray-700 placeholder:text-gray-400"
						/>
					</div>
				</div>
			</div>

			<div className="flex flex-col gap-6">
				{medicationAttachmentRows.map((attachmentRow, attachmentIndex) => (
					<AttachmentFormFields
						key={attachmentRow.id}
						attachmentRow={attachmentRow}
						attachmentIndex={attachmentIndex}
						fieldLabelClassName={medicationDetailsFieldLabelClassName}
						requiredLabelClassName={medicationDetailsRequiredLabelClassName}
						fieldControlClassName={medicationDetailsFieldControlClassName}
						onRemoveAttachmentRow={handleRemoveMedicationAttachmentRow}
					/>
				))}

				<div>
					<Button
						type="button"
						variant="outline"
						className="bg-white text-gray-600"
						onClick={handleAddMedicationAttachmentRow}
					>
						<RiAddLine className="size-5" aria-hidden="true" />
						Add related record
					</Button>
				</div>
			</div>
		</form>
	);
}

function MedicationDetailItem({ label, value }: { label: string; value: string }) {
	return (
		<div className="flex flex-col gap-2 no-line-height">
			<span className="text-gray-400">{label}</span>
			<span className="font-medium text-gray-600">{value || EMPTY_VALUE}</span>
		</div>
	);
}

function MedicationHistorySection({ history }: { history: MedicationDetailsHistoryEvent[] }) {
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
				<MedicationHistoryCard key={historyEvent.id} historyEvent={historyEvent} />
			))}
		</div>
	);
}

function MedicationHistoryCard({ historyEvent }: { historyEvent: MedicationDetailsHistoryEvent }) {
	const [isMedicationHistoryExpanded, setIsMedicationHistoryExpanded] = useState(false);
	const sectionId = useId();
	const titleId = `${sectionId}-title`;
	const panelId = `${sectionId}-panel`;
	const changeCount =
		historyEvent.items.filter((item) => item.label !== "Clinical note").length || 1;

	return (
		<section className="flex flex-col rounded-xl border border-gray-200 p-4">
			<Button
				type="button"
				onClick={() => setIsMedicationHistoryExpanded((prev) => !prev)}
				aria-expanded={isMedicationHistoryExpanded}
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
						isMedicationHistoryExpanded ? "rotate-180" : "",
					)}
					aria-hidden="true"
				/>
			</Button>
			<div
				id={panelId}
				className={cn(
					"grid overflow-hidden transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none",
					isMedicationHistoryExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
				)}
				aria-hidden={!isMedicationHistoryExpanded}
				inert={!isMedicationHistoryExpanded}
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

function MedicationDetailsFallback() {
	return (
		<div className="flex flex-col gap-8" aria-busy="true" aria-live="polite">
			<div className="flex flex-wrap gap-6">
				<div className="h-6 w-36 animate-pulse rounded-md bg-gray-100" />
				<div className="h-6 w-40 animate-pulse rounded-md bg-gray-100" />
			</div>
			<div className="flex flex-col gap-6">
				<div className="h-7 w-44 animate-pulse rounded-md bg-gray-100" />
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
