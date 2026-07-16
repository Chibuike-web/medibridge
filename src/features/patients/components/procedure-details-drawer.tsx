"use client";

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
import {
	RiAddLine,
	RiArrowDownSLine,
	RiCalendarLine,
	RiCloseLine,
	RiEditLine,
} from "@remixicon/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { format } from "date-fns";
import { useId, useRef, useState } from "react";

type ProcedureDetailsDrawerProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	procedure: ProcedureDetailsType | null;
	isLoading: boolean;
};

const EMPTY_VALUE = "-";
const procedureDetailsFormId = "procedure-details-form";
const procedureDetailsFieldLabelClassName =
	"inline-flex items-baseline gap-0.5 text-sm font-medium text-gray-700";
const procedureDetailsRequiredLabelClassName = "font-normal text-gray-400";
const procedureDetailsFieldControlClassName =
	"h-9 border-gray-200 bg-white text-sm text-gray-700 shadow-xs placeholder:text-gray-400";

export function ProcedureDetailsDrawer({
	open,
	onOpenChange,
	procedure,
	isLoading,
}: ProcedureDetailsDrawerProps) {
	const [procedureDetailsMode, setProcedureDetailsMode] = useState<"view" | "edit">("view");

	function handleProcedureDetailsOpenChange(nextOpen: boolean) {
		if (!nextOpen) {
			setProcedureDetailsMode("view");
		}

		onOpenChange(nextOpen);
	}

	const isEditingProcedureDetails = procedureDetailsMode === "edit" && Boolean(procedure);

	return (
		<Drawer open={open} onOpenChange={handleProcedureDetailsOpenChange} direction="right">
			<DrawerContent className="overflow-hidden rounded-3xl text-sm data-[vaul-drawer-direction=right]:top-4 data-[vaul-drawer-direction=right]:right-4 data-[vaul-drawer-direction=right]:bottom-4 data-[vaul-drawer-direction=right]:h-auto data-[vaul-drawer-direction=right]:w-[50rem]">
				<DrawerHeader className="flex-row items-center justify-between border-b border-gray-200 px-6 py-5 text-left">
					<DrawerTitle className="text-base leading-[1.2] text-gray-800">
						{isEditingProcedureDetails ? "Edit procedure details" : "View procedure details"}
					</DrawerTitle>
					<DrawerClose aria-label="Close procedure details">
						<RiCloseLine className="size-5" aria-hidden="true" />
					</DrawerClose>
					<DrawerDescription className="sr-only">
						{isEditingProcedureDetails
							? "Edit the selected procedure details."
							: "Showing details for the procedure you selected."}
					</DrawerDescription>
				</DrawerHeader>

				<div className="min-h-0 overflow-y-auto px-6 py-8 text-sm">
					{isLoading ? (
						<ProcedureDetailsFallback />
					) : isEditingProcedureDetails && procedure ? (
						<ProcedureDetailsEditForm procedure={procedure} />
					) : procedure ? (
						<div className="flex flex-col gap-10">
							<ProcedureDetailsOverview
								procedure={procedure}
								onEditProcedureDetails={() => setProcedureDetailsMode("edit")}
							/>
							<ProcedureRelatedRecords relatedRecords={procedure.relatedRecords} />
							<ProcedureHistorySection history={procedure.history} />
						</div>
					) : (
						<div className="rounded-2xl border border-gray-200 p-5 text-gray-500">
							Procedure details could not be found.
						</div>
					)}
				</div>

				<DrawerFooter className="border-t border-gray-200 px-6 py-5 text-sm">
					{isEditingProcedureDetails ? (
						<div className="flex flex-col gap-x-4 gap-y-2 lg:flex-row lg:self-end">
							<Button
								type="button"
								variant="outline"
								className="text-sm"
								onClick={() => setProcedureDetailsMode("view")}
							>
								Cancel
							</Button>
							<Button
								type="button"
								form={procedureDetailsFormId}
								className="bg-gray-800 text-sm"
								onClick={() => setProcedureDetailsMode("view")}
							>
								Save changes
							</Button>
						</div>
					) : procedure?.status === "Pending" ? (
						<div className="flex flex-col gap-x-4 gap-y-2 lg:flex-row lg:self-end">
							<Button type="button" variant="outline" className="text-sm">
								Cancel procedure
							</Button>
							<Button className="bg-gray-800 text-sm">Mark as completed</Button>
						</div>
					) : (
						<div className="flex flex-col gap-x-4 gap-y-2 lg:flex-row lg:self-end">
							<DrawerClose asChild>
								<Button variant="outline" className="text-sm">
									Cancel
								</Button>
							</DrawerClose>
							<Button className="bg-gray-800 text-sm">Archive procedure</Button>
						</div>
					)}
				</DrawerFooter>
			</DrawerContent>
		</Drawer>
	);
}

function ProcedureDetailsOverview({
	procedure,
	onEditProcedureDetails,
}: {
	procedure: ProcedureDetailsType;
	onEditProcedureDetails: () => void;
}) {
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
		<div className="flex flex-col gap-10">
			<div className="flex flex-wrap items-center gap-x-8 gap-y-3 text-nowrap">
				<div className="flex items-center gap-2">
					<span className="text-gray-400">Procedure ID:</span>
					<CopyIdButton id={procedure.procedureId} className="text-sm" />
				</div>
				{procedure.encounterId ? (
					<div className="flex items-center gap-2">
						<span className="text-gray-400">Encounter ID:</span>
						<CopyIdButton id={procedure.encounterId} className="text-sm" />
					</div>
				) : null}
			</div>

			<div className="flex flex-col gap-6">
				<div className="flex flex-wrap items-center justify-between gap-4">
					<div className="flex items-center gap-3">
						<h2 className="text-lg font-semibold text-gray-800">{procedure.name}</h2>
						<StatusBadge status={procedure.status} />
					</div>
					<button
						type="button"
						onClick={onEditProcedureDetails}
						className="inline-flex items-center gap-2 text-sm font-medium text-gray-400 transition hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-300"
					>
						<RiEditLine className="size-4" aria-hidden="true" />
						Edit
					</button>
				</div>

				<div className="grid grid-cols-1 gap-x-16 gap-y-6 sm:grid-cols-2">
					<ProcedureDetailItem label="Indication" value={procedure.indication} />
					<ProcedureDetailItem label={dateLabel} value={primaryDate} />
					<ProcedureDetailItem label={physicianLabel} value={primaryPhysician} />
					<ProcedureDetailListItem label={assistantLabel} values={primaryAssistants} />
					<ProcedureDetailItem label={facilityLabel} value={primaryFacility} />
					<ProcedureDetailItem label="Clinical notes" value={procedure.clinicalNote} />
					<ProcedureDetailItem label="Created by" value={procedure.createdBy} />
					<ProcedureDetailItem label="Created at" value={procedure.createdAt} />
					<ProcedureDetailItem label="Updated by" value={procedure.updatedBy} />
					<ProcedureDetailItem label="Updated at" value={procedure.updatedAt} />
				</div>
			</div>
		</div>
	);
}

function ProcedureDetailsEditForm({ procedure }: { procedure: ProcedureDetailsType }) {
	const generatedAttachmentRowId = useId();
	const nextAttachmentRowNumberRef = useRef(0);
	const [procedureDate, setProcedureDate] = useState<Date | undefined>();
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
		<form id={procedureDetailsFormId} className="flex flex-col gap-12">
			<div className="flex flex-col gap-8">
				<div className="flex flex-wrap items-center gap-x-8 gap-y-3 text-nowrap">
					<div className="flex items-center gap-2">
						<span className="text-gray-400">Procedure ID:</span>
						<CopyIdButton id={procedure.procedureId} className="text-sm" />
					</div>
					{procedure.encounterId ? (
						<div className="flex items-center gap-2">
							<span className="text-gray-400">Encounter ID:</span>
							<CopyIdButton id={procedure.encounterId} className="text-sm" />
						</div>
					) : null}
				</div>

				<div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2">
					<div className="flex flex-col gap-2 sm:col-span-2">
						<Label htmlFor="edit-procedure-name" className={procedureDetailsFieldLabelClassName}>
							Procedure<span className={procedureDetailsRequiredLabelClassName}>(required)</span>
						</Label>
						<Input
							id="edit-procedure-name"
							name="procedureName"
							defaultValue={procedure.name}
							className={procedureDetailsFieldControlClassName}
						/>
					</div>

					<div className="flex flex-col gap-2">
						<Label
							htmlFor="edit-procedure-indication"
							className={procedureDetailsFieldLabelClassName}
						>
							Indication<span className={procedureDetailsRequiredLabelClassName}>(required)</span>
						</Label>
						<Input
							id="edit-procedure-indication"
							name="indication"
							defaultValue={procedure.indication}
							className={procedureDetailsFieldControlClassName}
						/>
					</div>

					<div className="flex flex-col gap-2">
						<Label htmlFor="edit-procedure-status" className={procedureDetailsFieldLabelClassName}>
							Status<span className={procedureDetailsRequiredLabelClassName}>(required)</span>
						</Label>
						<Select defaultValue={procedure.status.toLowerCase()}>
							<SelectTrigger
								id="edit-procedure-status"
								className={`${procedureDetailsFieldControlClassName} w-full`}
							>
								<SelectValue placeholder="Select status" />
							</SelectTrigger>
							<SelectContent className="rounded-xl border-gray-200 p-1 text-sm text-gray-700 shadow-xl">
								<SelectGroup>
									<SelectItem value="pending" className="h-9 rounded-md px-3">
										Pending
									</SelectItem>
									<SelectItem value="completed" className="h-9 rounded-md px-3">
										Completed
									</SelectItem>
									<SelectItem value="cancelled" className="h-9 rounded-md px-3">
										Cancelled
									</SelectItem>
								</SelectGroup>
							</SelectContent>
						</Select>
					</div>

					<div className="flex flex-col gap-2">
						<Label className={procedureDetailsFieldLabelClassName}>
							Date<span className={procedureDetailsRequiredLabelClassName}>(required)</span>
						</Label>
						<Popover>
							<PopoverTrigger asChild>
								<Button
									type="button"
									variant="outline"
									data-empty={!procedureDate && procedure.procedureDate === EMPTY_VALUE}
									className={`${procedureDetailsFieldControlClassName} flex w-full justify-between font-normal data-[empty=true]:text-gray-400 hover:bg-white active:scale-100`}
								>
									{procedureDate
										? format(procedureDate, "PPP")
										: procedure.procedureDate !== EMPTY_VALUE
											? procedure.procedureDate
											: procedure.plannedDate}
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
							defaultValue={
								procedure.performedBy !== EMPTY_VALUE
									? procedure.performedBy
									: procedure.plannedPhysician
							}
							className={procedureDetailsFieldControlClassName}
						/>
					</div>

					<div className="flex flex-col gap-2">
						<Label
							htmlFor="edit-procedure-assistants"
							className={procedureDetailsFieldLabelClassName}
						>
							Assistants<span className={procedureDetailsRequiredLabelClassName}>(required)</span>
						</Label>
						<Select defaultValue={procedure.assistants[0] ?? procedure.plannedAssistants[0] ?? ""}>
							<SelectTrigger
								id="edit-procedure-assistants"
								className={`${procedureDetailsFieldControlClassName} w-full`}
							>
								<SelectValue placeholder="Enter assistants" />
							</SelectTrigger>
							<SelectContent className="rounded-xl border-gray-200 p-1 text-sm text-gray-700 shadow-xl">
								<SelectGroup>
									{[...new Set([...procedure.assistants, ...procedure.plannedAssistants])]
										.filter(Boolean)
										.map((assistant) => (
											<SelectItem key={assistant} value={assistant} className="h-9 rounded-md px-3">
												{assistant}
											</SelectItem>
										))}
								</SelectGroup>
							</SelectContent>
						</Select>
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
							defaultValue={
								procedure.facility !== EMPTY_VALUE ? procedure.facility : procedure.plannedFacility
							}
							className={procedureDetailsFieldControlClassName}
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
							defaultValue={procedure.clinicalNote}
							className="min-h-28 border-gray-200 bg-white text-sm text-gray-700 shadow-xs placeholder:text-gray-400"
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
						className="border-gray-200 bg-white text-sm text-gray-600 shadow-xs"
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
			{label === "Status" ? (
				<StatusBadge status={value || EMPTY_VALUE} className="w-max" />
			) : (
				<span className="font-semibold text-gray-600">{value || EMPTY_VALUE}</span>
			)}
		</div>
	);
}

function ProcedureDetailListItem({ label, values }: { label: string; values: string[] }) {
	return (
		<div className="flex flex-col gap-2 no-line-height">
			<span className="text-gray-400">{label}</span>
			{values.length > 0 ? (
				<ul className="list-disc pl-5 font-semibold text-gray-600">
					{values.map((value) => (
						<li key={value}>{value}</li>
					))}
				</ul>
			) : (
				<span className="font-semibold text-gray-600">{EMPTY_VALUE}</span>
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
	const [isRelatedProcedureRecordExpanded, setIsRelatedProcedureRecordExpanded] = useState(true);
	const shouldReduceMotion = useReducedMotion();
	const sectionId = useId();
	const titleId = `${sectionId}-title`;
	const panelId = `${sectionId}-panel`;

	return (
		<section className="flex flex-col rounded-2xl border border-gray-200 p-5">
			<button
				type="button"
				onClick={() => setIsRelatedProcedureRecordExpanded((prev) => !prev)}
				aria-expanded={isRelatedProcedureRecordExpanded}
				aria-controls={panelId}
				className="flex w-full items-center justify-between gap-4 text-left"
			>
				<span id={titleId} className="text-base font-semibold text-gray-800">
					{title}
				</span>
				<RiArrowDownSLine
					className={cn(
						"size-5 shrink-0 transition-transform duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none",
						isRelatedProcedureRecordExpanded ? "rotate-180" : "",
					)}
					aria-hidden="true"
				/>
			</button>
			<AnimatePresence initial={false}>
				{isRelatedProcedureRecordExpanded ? (
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
							className="mt-5 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
						>
							<div className="flex min-w-0 flex-wrap items-center gap-2">
								<span className="min-w-0 truncate font-semibold text-gray-600">{record.name}</span>
								<StatusBadge status={record.status} className="shrink-0" />
							</div>
							<CopyIdButton id={record.id} className="text-sm" />
						</div>
					</motion.div>
				) : null}
			</AnimatePresence>
		</section>
	);
}

function ProcedureHistorySection({ history }: { history: ProcedureDetailsHistoryEvent[] }) {
	return (
		<div className="flex flex-col gap-[14px]">
			<div className="flex items-center justify-between w-full">
				<p className="text-base font-semibold">History</p>
				<button className="text-gray-400">View more</button>
			</div>
			{history.map((historyEvent) => (
				<ProcedureHistoryCard key={historyEvent.id} historyEvent={historyEvent} />
			))}
		</div>
	);
}

function ProcedureHistoryCard({ historyEvent }: { historyEvent: ProcedureDetailsHistoryEvent }) {
	const [isProcedureHistoryExpanded, setIsProcedureHistoryExpanded] = useState(true);
	const shouldReduceMotion = useReducedMotion();
	const sectionId = useId();
	const titleId = `${sectionId}-title`;
	const panelId = `${sectionId}-panel`;

	return (
		<section className="flex flex-col rounded-2xl border border-gray-200 p-5">
			<button
				type="button"
				onClick={() => setIsProcedureHistoryExpanded((prev) => !prev)}
				aria-expanded={isProcedureHistoryExpanded}
				aria-controls={panelId}
				className="flex w-full items-center justify-between gap-4 text-left"
			>
				<p>
					{" "}
					<span id={titleId} className="font-semibold text-gray-800">
						{historyEvent.title}
					</span>{" "}
					<span className="text-sm text-gray-400">on {historyEvent.timestamp}</span>
				</p>
				<RiArrowDownSLine
					className={cn(
						"size-5 shrink-0 transition-transform duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none",
						isProcedureHistoryExpanded ? "rotate-180" : "",
					)}
					aria-hidden="true"
				/>
			</button>
			<AnimatePresence initial={false}>
				{isProcedureHistoryExpanded ? (
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
							{historyEvent.items.map((item) =>
								item.label.includes("Assistant") || item.label === "Team/Assistants" ? (
									<ProcedureDetailListItem
										key={`${historyEvent.id}-${item.label}`}
										label={item.label}
										values={
											item.value === EMPTY_VALUE
												? []
												: item.value.split(",").map((value) => value.trim())
										}
									/>
								) : (
									<ProcedureDetailItem
										key={`${historyEvent.id}-${item.label}`}
										label={item.label}
										value={item.value}
									/>
								),
							)}
						</div>
					</motion.div>
				) : null}
			</AnimatePresence>
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
				<div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
					{Array.from({ length: 10 }).map((_, index) => (
						<div key={index} className="flex flex-col gap-2">
							<div className="h-4 w-28 animate-pulse rounded bg-gray-100" />
							<div className="h-5 w-44 animate-pulse rounded bg-gray-100" />
						</div>
					))}
				</div>
			</div>
			{Array.from({ length: 3 }).map((_, index) => (
				<div key={index} className="flex flex-col gap-4 rounded-2xl border border-gray-200 p-5">
					<div className="h-5 w-48 animate-pulse rounded bg-gray-100" />
					<div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
						<div className="h-5 w-40 animate-pulse rounded bg-gray-100" />
						<div className="h-5 w-36 animate-pulse rounded bg-gray-100" />
					</div>
				</div>
			))}
		</div>
	);
}
