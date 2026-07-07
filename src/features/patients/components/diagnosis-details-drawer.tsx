"use client";

import { CopyIdButton } from "@/components/copy-id-button";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
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
import {
	AttachmentFormFields,
	type AttachmentFormRow,
} from "@/features/patients/components/attachment-form-fields";
import type {
	DiagnosisDetailsHistoryEvent,
	DiagnosisDetailsRelatedRecord,
	DiagnosisDetailsType,
} from "@/features/patients/types";
import { cn } from "@/lib/utils/cn";
import {
	RiAddLine,
	RiArrowDownSLine,
	RiCalendarLine,
	RiCloseLine,
	RiEditLine,
} from "@remixicon/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useId, useState } from "react";

type DiagnosisDetailsDrawerProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	diagnosis: DiagnosisDetailsType | null;
	isLoading: boolean;
};

const EMPTY_VALUE = "-";
const diagnosisDetailsFormId = "diagnosis-details-form";
const diagnosisDetailsFieldLabelClassName =
	"inline-flex items-baseline gap-0.5 text-sm font-medium text-gray-700";
const diagnosisDetailsRequiredLabelClassName = "font-normal text-gray-400";
const diagnosisDetailsFieldControlClassName =
	"h-9 border-gray-200 bg-white text-sm text-gray-700 shadow-xs placeholder:text-gray-400";

export function DiagnosisDetailsDrawer({
	open,
	onOpenChange,
	diagnosis,
	isLoading,
}: DiagnosisDetailsDrawerProps) {
	const [diagnosisDetailsMode, setDiagnosisDetailsMode] = useState<"view" | "edit">("view");

	function handleDiagnosisDetailsOpenChange(nextOpen: boolean) {
		if (!nextOpen) {
			setDiagnosisDetailsMode("view");
		}

		onOpenChange(nextOpen);
	}

	const isEditingDiagnosisDetails = diagnosisDetailsMode === "edit" && Boolean(diagnosis);

	return (
		<Drawer open={open} onOpenChange={handleDiagnosisDetailsOpenChange} direction="right">
			<DrawerContent className="overflow-hidden rounded-3xl text-sm data-[vaul-drawer-direction=right]:top-4 data-[vaul-drawer-direction=right]:right-4 data-[vaul-drawer-direction=right]:bottom-4 data-[vaul-drawer-direction=right]:h-auto data-[vaul-drawer-direction=right]:w-[50rem]">
				<DrawerHeader className="flex-row items-center justify-between border-b border-gray-200 px-6 py-5 text-left">
					<DrawerTitle className="text-lg leading-[1.2] text-gray-800">
						{isEditingDiagnosisDetails ? "Edit diagnosis details" : "View diagnosis details"}
					</DrawerTitle>
					<DrawerClose aria-label="Close diagnosis details">
						<RiCloseLine className="size-5" aria-hidden="true" />
					</DrawerClose>
					<DrawerDescription className="sr-only">
						{isEditingDiagnosisDetails
							? "Edit the selected diagnosis details."
							: "Showing details for the diagnosis you selected."}
					</DrawerDescription>
				</DrawerHeader>

				<div className="min-h-0 overflow-y-auto px-6 py-8 text-sm">
					{isLoading ? (
						<DiagnosisDetailsFallback />
					) : isEditingDiagnosisDetails && diagnosis ? (
						<DiagnosisDetailsEditForm diagnosis={diagnosis} />
					) : diagnosis ? (
						<div className="flex flex-col gap-12">
							<DiagnosisDetailsOverview
								diagnosis={diagnosis}
								onEditDiagnosisDetails={() => setDiagnosisDetailsMode("edit")}
							/>
							<DiagnosisHistorySection history={diagnosis.history} />
							<DiagnosisRelatedRecords relatedRecords={diagnosis.relatedRecords} />
						</div>
					) : (
						<div className="rounded-2xl border border-gray-200 p-5 text-gray-500">
							Diagnosis details could not be found.
						</div>
					)}
				</div>

				<DrawerFooter className="border-t border-gray-200 px-6 py-5 text-sm">
					{isEditingDiagnosisDetails ? (
						<div className="flex flex-col gap-x-4 gap-y-2 lg:flex-row lg:self-end">
							<Button
								type="button"
								variant="outline"
								className="text-sm"
								onClick={() => setDiagnosisDetailsMode("view")}
							>
								Cancel
							</Button>
							<Button
								type="button"
								form={diagnosisDetailsFormId}
								className="bg-gray-800 text-sm"
								onClick={() => setDiagnosisDetailsMode("view")}
							>
								Save changes
							</Button>
						</div>
					) : (
						<div className="flex flex-col gap-x-4 gap-y-2 lg:flex-row lg:self-end">
							<DrawerClose asChild>
								<Button variant="outline" className="text-sm">
									Cancel
								</Button>
							</DrawerClose>
							<Button className="bg-gray-800 text-sm">Archive diagnosis</Button>
						</div>
					)}
				</DrawerFooter>
			</DrawerContent>
		</Drawer>
	);
}

function DiagnosisDetailsOverview({
	diagnosis,
	onEditDiagnosisDetails,
}: {
	diagnosis: DiagnosisDetailsType;
	onEditDiagnosisDetails: () => void;
}) {
	return (
		<div className="flex flex-col gap-10">
			<div className="flex flex-wrap items-center gap-x-8 gap-y-3 text-nowrap">
				<div className="flex items-center gap-2">
					<span className="text-gray-400">Diagnosis ID:</span>
					<CopyIdButton id={diagnosis.diagnosisId} className="text-sm" />
				</div>
				<div className="flex items-center gap-2">
					{diagnosis.encounterId ? (
						<>
							<span className="text-gray-400">Encounter ID:</span>
							<CopyIdButton id={diagnosis.encounterId} className="text-sm" />
						</>
					) : null}
				</div>
			</div>

			<div className="flex flex-col gap-6">
				<div className="flex flex-wrap items-center justify-between gap-4">
					<div className="flex items-center gap-3">
						<h2 className="text-xl font-semibold text-gray-800">{diagnosis.name}</h2>
						<StatusBadge status={diagnosis.status} />
					</div>
					<button
						type="button"
						onClick={onEditDiagnosisDetails}
						className="inline-flex items-center gap-2 text-sm font-medium text-gray-400 transition hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-300"
					>
						<RiEditLine className="size-4" aria-hidden="true" />
						Edit
					</button>
				</div>

				<div className="grid grid-cols-1 gap-x-16 gap-y-6 sm:grid-cols-2">
					<DiagnosisDetailItem label="Severity/Stage" value={diagnosis.severityStage} />
					<DiagnosisDetailItem label="Diagnosed at" value={diagnosis.diagnosedAt} />
					<DiagnosisDetailItem label="Created at" value={diagnosis.createdAt} />
					<DiagnosisDetailItem label="Diagnosed by" value={diagnosis.diagnosedBy} />
					<DiagnosisDetailItem label="Updated by" value={diagnosis.updatedBy} />
					<DiagnosisDetailItem label="Updated At" value={diagnosis.updatedAt} />
					<DiagnosisDetailItem label="Last reviewed" value={diagnosis.lastReviewedAt} />
					<DiagnosisDetailItem label="Clinical note" value={diagnosis.clinicalNote} />
				</div>
			</div>
		</div>
	);
}

function DiagnosisDetailsEditForm({ diagnosis }: { diagnosis: DiagnosisDetailsType }) {
	const generatedAttachmentRowId = useId();
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
		<form id={diagnosisDetailsFormId} className="flex flex-col gap-12">
			<div className="flex flex-col gap-8">
				<div className="flex flex-wrap items-center gap-x-8 gap-y-3 text-nowrap">
					<div className="flex items-center gap-2">
						<span className="text-gray-400">Diagnosis ID:</span>
						<CopyIdButton id={diagnosis.diagnosisId} className="text-sm" />
					</div>
					{diagnosis.encounterId ? (
						<div className="flex items-center gap-2">
							<span className="text-gray-400">Encounter ID:</span>
							<CopyIdButton id={diagnosis.encounterId} className="text-sm" />
						</div>
					) : null}
				</div>

				<div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2">
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
						/>
					</div>

					<div className="flex flex-col gap-2">
						<Label
							htmlFor="edit-diagnosis-severity"
							className={diagnosisDetailsFieldLabelClassName}
						>
							Severity/Stage
							<span className={diagnosisDetailsRequiredLabelClassName}>(required)</span>
						</Label>
						<Select defaultValue={getDiagnosisSelectValue(diagnosis.severityStage)}>
							<SelectTrigger
								id="edit-diagnosis-severity"
								className={`${diagnosisDetailsFieldControlClassName} w-full`}
							>
								<SelectValue placeholder="Select severity or stage" />
							</SelectTrigger>
							<SelectContent className="rounded-xl border-gray-200 p-1 text-sm text-gray-700 shadow-xl">
								<SelectGroup>
									<SelectItem value="mild" className="rounded-md px-3 h-9">
										Mild
									</SelectItem>
									<SelectItem value="moderate" className="rounded-md px-3 h-9">
										Moderate
									</SelectItem>
									<SelectItem value="severe" className="rounded-md px-3 h-9">
										Severe
									</SelectItem>
									<SelectItem value="stage-1" className="rounded-md px-3 h-9">
										Stage 1
									</SelectItem>
									<SelectItem value="stage-2" className="rounded-md px-3 h-9">
										Stage 2
									</SelectItem>
									<SelectItem value="stage-3" className="rounded-md px-3 h-9">
										Stage 3
									</SelectItem>
								</SelectGroup>
							</SelectContent>
						</Select>
					</div>

					<div className="flex flex-col gap-2">
						<Label htmlFor="edit-diagnosis-status" className={diagnosisDetailsFieldLabelClassName}>
							Status<span className={diagnosisDetailsRequiredLabelClassName}>(required)</span>
						</Label>
						<Select defaultValue={diagnosis.status.toLowerCase()}>
							<SelectTrigger
								id="edit-diagnosis-status"
								className={`${diagnosisDetailsFieldControlClassName} w-full`}
							>
								<SelectValue placeholder="Select status" />
							</SelectTrigger>
							<SelectContent className="rounded-xl border-gray-200 p-1 text-sm text-gray-700 shadow-xl">
								<SelectGroup>
									<SelectItem value="active" className="rounded-md px-3 h-9">
										Active
									</SelectItem>
									<SelectItem value="resolved" className="rounded-md px-3 h-9">
										Resolved
									</SelectItem>
								</SelectGroup>
							</SelectContent>
						</Select>
					</div>

					<div className="flex flex-col gap-2">
						<Label className={diagnosisDetailsFieldLabelClassName}>
							Diagnosed at
							<span className={diagnosisDetailsRequiredLabelClassName}>(required)</span>
						</Label>
						<Popover>
							<PopoverTrigger asChild>
								<Button
									type="button"
									variant="outline"
									className={`${diagnosisDetailsFieldControlClassName} flex w-full justify-between font-normal hover:bg-white active:scale-100`}
								>
									{diagnosis.diagnosedAt || "Select diagnosis date"}
									<RiCalendarLine className="size-4 text-gray-600" aria-hidden="true" />
								</Button>
							</PopoverTrigger>
							<PopoverContent className="w-72 p-3 text-sm text-gray-500">
								Date editing is visual only for now.
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
							defaultValue={diagnosis.diagnosedBy}
							className={diagnosisDetailsFieldControlClassName}
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
							defaultValue={diagnosis.clinicalNote}
							className="border-gray-200 bg-white text-sm text-gray-700 shadow-xs placeholder:text-gray-400"
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
						className="border-gray-200 bg-white text-sm text-gray-600 shadow-xs"
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

function getDiagnosisSelectValue(value: string) {
	return value.toLowerCase().replaceAll("/", "-").replaceAll(" ", "-");
}

function DiagnosisDetailItem({ label, value }: { label: string; value: string }) {
	return (
		<div className="flex flex-col gap-2">
			<span className="text-gray-400">{label}</span>
			{label === "Status" ? (
				<StatusBadge status={value || EMPTY_VALUE} className="w-max" />
			) : (
				<span className="font-semibold text-gray-600">{value || EMPTY_VALUE}</span>
			)}
		</div>
	);
}

function DiagnosisHistorySection({ history }: { history: DiagnosisDetailsHistoryEvent[] }) {
	return (
		<div className="flex flex-col gap-[14px]">
			<div className="flex items-center justify-between w-full">
				<p className="text-[18px] font-semibold">History</p>
				<button className="text-gray-400">View more</button>
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
	const [isDiagnosisHistoryExpanded, setIsDiagnosisHistoryExpanded] = useState(true);
	const shouldReduceMotion = useReducedMotion();
	const sectionId = useId();
	const titleId = `${sectionId}-title`;
	const panelId = `${sectionId}-panel`;

	return (
		<section className="flex flex-col rounded-2xl border border-gray-200 p-5">
			<button
				type="button"
				onClick={() => setIsDiagnosisHistoryExpanded((prev) => !prev)}
				aria-expanded={isDiagnosisHistoryExpanded}
				aria-controls={panelId}
				className="flex w-full items-center justify-between gap-4 text-left"
			>
				<p className="text-base">
					<span id={titleId} className="font-semibold text-gray-800">
						{historyEvent.title}{" "}
					</span>
					<span className="text-gray-400">on {historyEvent.timestamp}</span>
				</p>
				<RiArrowDownSLine
					className={cn(
						"size-5 shrink-0 transition-transform duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none",
						isDiagnosisHistoryExpanded ? "rotate-180" : "",
					)}
					aria-hidden="true"
				/>
			</button>
			<AnimatePresence initial={false}>
				{isDiagnosisHistoryExpanded ? (
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
								<DiagnosisDetailItem
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
				<p className="text-[18px] font-semibold">Related records</p>
				<button className="text-gray-400">View more</button>
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
	const [isRelatedRecordSectionExpanded, setIsRelatedRecordSectionExpanded] = useState(true);
	const shouldReduceMotion = useReducedMotion();
	const sectionId = useId();
	const titleId = `${sectionId}-title`;
	const panelId = `${sectionId}-panel`;

	return (
		<section className="flex flex-col rounded-2xl border border-gray-200 p-5">
			<button
				type="button"
				onClick={() => setIsRelatedRecordSectionExpanded((prev) => !prev)}
				aria-expanded={isRelatedRecordSectionExpanded}
				aria-controls={panelId}
				className="flex w-full items-center justify-between gap-4 text-left"
			>
				<span id={titleId} className="text-base font-semibold text-gray-800">
					{title}
				</span>
				<RiArrowDownSLine
					className={cn(
						"size-5 shrink-0 transition-transform duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none",
						isRelatedRecordSectionExpanded ? "rotate-180" : "",
					)}
					aria-hidden="true"
				/>
			</button>
			<AnimatePresence initial={false}>
				{isRelatedRecordSectionExpanded ? (
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
						<div aria-labelledby={titleId} className="mt-5 flex flex-col gap-4">
							{records.map((record) => (
								<div
									key={record.id}
									className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
								>
									<div className="flex w-full items-center gap-2">
										<span className="min-w-0 truncate font-semibold text-gray-600">
											{record.name}
										</span>
										<StatusBadge status={record.status} className="shrink-0" />
									</div>
									<CopyIdButton id={record.id} className="text-sm" />
								</div>
							))}
						</div>
					</motion.div>
				) : null}
			</AnimatePresence>
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
				<div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
					{Array.from({ length: 8 }).map((_, index) => (
						<div key={index} className="flex flex-col gap-2">
							<div className="h-4 w-28 animate-pulse rounded bg-gray-100" />
							<div className="h-5 w-44 animate-pulse rounded bg-gray-100" />
						</div>
					))}
				</div>
			</div>
			{Array.from({ length: 2 }).map((_, index) => (
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
