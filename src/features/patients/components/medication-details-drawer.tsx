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
	MedicationDetailsHistoryEvent,
	MedicationDetailsType,
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

type MedicationDetailsDrawerProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	medication: MedicationDetailsType | null;
	isLoading: boolean;
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
}: MedicationDetailsDrawerProps) {
	const [medicationDetailsMode, setMedicationDetailsMode] = useState<"view" | "edit">("view");

	function handleMedicationDetailsOpenChange(nextOpen: boolean) {
		if (!nextOpen) {
			setMedicationDetailsMode("view");
		}

		onOpenChange(nextOpen);
	}

	const isEditingMedicationDetails = medicationDetailsMode === "edit" && Boolean(medication);

	return (
		<Drawer open={open} onOpenChange={handleMedicationDetailsOpenChange} direction="right">
			<DrawerContent className="overflow-hidden rounded-3xl text-sm data-[vaul-drawer-direction=right]:top-4 data-[vaul-drawer-direction=right]:right-4 data-[vaul-drawer-direction=right]:bottom-4 data-[vaul-drawer-direction=right]:h-auto data-[vaul-drawer-direction=right]:w-[50rem]">
				<DrawerHeader className="flex-row items-center justify-between border-b border-gray-200 px-6 py-5 text-left">
					<DrawerTitle className="text-base leading-[1.2] text-gray-800">
						{isEditingMedicationDetails ? "Edit medication details" : "View medication details"}
					</DrawerTitle>
					<DrawerClose aria-label="Close medication details">
						<RiCloseLine className="size-5" aria-hidden="true" />
					</DrawerClose>
					<DrawerDescription className="sr-only">
						{isEditingMedicationDetails
							? "Edit the selected medication details."
							: "Showing details for the medication you selected."}
					</DrawerDescription>
				</DrawerHeader>

				<div className="min-h-0 overflow-y-auto px-6 py-8 text-sm">
					{isLoading ? (
						<MedicationDetailsFallback />
					) : isEditingMedicationDetails && medication ? (
						<MedicationDetailsEditForm medication={medication} />
					) : medication ? (
						<div className="flex flex-col gap-10">
							<MedicationDetailsOverview
								medication={medication}
								onEditMedicationDetails={() => setMedicationDetailsMode("edit")}
							/>
							<MedicationHistorySection history={medication.history} />
						</div>
					) : (
						<div className="rounded-2xl border border-gray-200 p-5 text-gray-500">
							Medication details could not be found.
						</div>
					)}
				</div>

				<DrawerFooter className="border-t border-gray-200 px-6 py-5 text-sm">
					{isEditingMedicationDetails ? (
						<div className="flex flex-col gap-x-4 gap-y-2 lg:flex-row lg:self-end">
							<Button
								type="button"
								variant="outline"
								className="text-sm"
								onClick={() => setMedicationDetailsMode("view")}
							>
								Cancel
							</Button>
							<Button
								type="button"
								form={medicationDetailsFormId}
								className="bg-gray-800 text-sm"
								onClick={() => setMedicationDetailsMode("view")}
							>
								Save changes
							</Button>
						</div>
					) : medication?.status === "Active" ? (
						<div className="flex flex-col gap-x-4 gap-y-2 lg:flex-row lg:self-end">
							<Button type="button" variant="outline" className="text-sm">
								Mark as completed
							</Button>
							<Button className="bg-rose-500 text-sm text-white hover:bg-rose-600">
								Discontinue medication
							</Button>
						</div>
					) : (
						<div className="flex flex-col gap-x-4 gap-y-2 lg:flex-row lg:self-end">
							<DrawerClose asChild>
								<Button variant="outline" className="text-sm">
									Cancel
								</Button>
							</DrawerClose>
							<Button className="bg-gray-800 text-sm">Archive medication</Button>
						</div>
					)}
				</DrawerFooter>
			</DrawerContent>
		</Drawer>
	);
}

function MedicationDetailsOverview({
	medication,
	onEditMedicationDetails,
}: {
	medication: MedicationDetailsType;
	onEditMedicationDetails: () => void;
}) {
	return (
		<div className="flex flex-col gap-10">
			<div className="flex flex-wrap items-center gap-x-8 gap-y-3 text-nowrap">
				<div className="flex items-center gap-2">
					<span className="text-gray-400">Medication ID:</span>
					<CopyIdButton id={medication.medicationId} className="text-sm" />
				</div>
				{medication.encounterId ? (
					<div className="flex items-center gap-2">
						<span className="text-gray-400">Encounter ID:</span>
						<CopyIdButton id={medication.encounterId} className="text-sm" />
					</div>
				) : null}
			</div>

			<div className="flex flex-col gap-6">
				<div className="flex flex-wrap items-center justify-between gap-4">
					<div className="flex items-center gap-3">
						<h2 className="text-lg font-semibold text-gray-800">{medication.name}</h2>
						<StatusBadge status={medication.status} />
					</div>
					<button
						type="button"
						onClick={onEditMedicationDetails}
						className="inline-flex items-center gap-2 text-sm font-medium text-gray-400 transition hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-300"
					>
						<RiEditLine className="size-4" aria-hidden="true" />
						Edit
					</button>
				</div>

				<div className="grid grid-cols-1 gap-x-16 gap-y-6 sm:grid-cols-2">
					<MedicationDetailItem label="Dose" value={medication.dose} />
					<MedicationDetailItem label="Route" value={medication.route} />
					<MedicationDetailItem label="Frequency" value={medication.frequency} />
					<MedicationDetailItem label="Indication" value={medication.indication} />
					<MedicationDetailItem label="Prescribed by" value={medication.prescribedBy} />
					<MedicationDetailItem label="Started at" value={medication.startedAt} />
					<MedicationDetailItem label="Duration" value={medication.duration} />
					<MedicationDetailItem label="Created by" value={medication.createdBy} />
					<MedicationDetailItem label="Created at" value={medication.createdAt} />
					<MedicationDetailItem label="Updated at" value={medication.updatedAt} />
				</div>
			</div>
		</div>
	);
}

function MedicationDetailsEditForm({ medication }: { medication: MedicationDetailsType }) {
	const generatedAttachmentRowId = useId();
	const nextAttachmentRowNumberRef = useRef(0);
	const [startedAt, setStartedAt] = useState<Date | undefined>();
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
		<form id={medicationDetailsFormId} className="flex flex-col gap-12">
			<div className="flex flex-col gap-8">
				<div className="flex flex-wrap items-center gap-x-8 gap-y-3 text-nowrap">
					<div className="flex items-center gap-2">
						<span className="text-gray-400">Medication ID:</span>
						<CopyIdButton id={medication.medicationId} className="text-sm" />
					</div>
					{medication.encounterId ? (
						<div className="flex items-center gap-2">
							<span className="text-gray-400">Encounter ID:</span>
							<CopyIdButton id={medication.encounterId} className="text-sm" />
						</div>
					) : null}
				</div>

				<div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2">
					<div className="flex flex-col gap-2 sm:col-span-2">
						<Label htmlFor="edit-medication-name" className={medicationDetailsFieldLabelClassName}>
							Medication<span className={medicationDetailsRequiredLabelClassName}>(required)</span>
						</Label>
						<Input
							id="edit-medication-name"
							name="medicationName"
							defaultValue={medication.name}
							className={medicationDetailsFieldControlClassName}
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
							defaultValue={medication.indication}
							className={medicationDetailsFieldControlClassName}
						/>
					</div>

					<div className="flex flex-col gap-2">
						<Label
							htmlFor="edit-medication-status"
							className={medicationDetailsFieldLabelClassName}
						>
							Status<span className={medicationDetailsRequiredLabelClassName}>(required)</span>
						</Label>
						<Select defaultValue={medication.status.toLowerCase()}>
							<SelectTrigger
								id="edit-medication-status"
								className={`${medicationDetailsFieldControlClassName} w-full`}
							>
								<SelectValue placeholder="Select status" />
							</SelectTrigger>
							<SelectContent>
								<SelectGroup>
									<SelectItem value="active">
										Active
									</SelectItem>
									<SelectItem value="completed">
										Completed
									</SelectItem>
									<SelectItem value="discontinued">
										Discontinued
									</SelectItem>
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
							defaultValue={medication.dose}
							className={medicationDetailsFieldControlClassName}
						/>
					</div>

					<div className="flex flex-col gap-2">
						<Label htmlFor="edit-medication-route" className={medicationDetailsFieldLabelClassName}>
							Route<span className={medicationDetailsRequiredLabelClassName}>(required)</span>
						</Label>
						<Select defaultValue={medication.route.toLowerCase()}>
							<SelectTrigger
								id="edit-medication-route"
								className={`${medicationDetailsFieldControlClassName} w-full`}
							>
								<SelectValue placeholder="Select route" />
							</SelectTrigger>
							<SelectContent>
								<SelectGroup>
									<SelectItem value="oral">
										Oral
									</SelectItem>
									<SelectItem value="iv">
										IV
									</SelectItem>
									<SelectItem value="inhalation">
										Inhalation
									</SelectItem>
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
							defaultValue={medication.prescribedBy}
							className={medicationDetailsFieldControlClassName}
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
							defaultValue={medication.frequency}
							className={medicationDetailsFieldControlClassName}
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
							defaultValue={medication.duration}
							className={medicationDetailsFieldControlClassName}
						/>
					</div>

					<div className="flex flex-col gap-2">
						<Label className={medicationDetailsFieldLabelClassName}>
							Started at<span className={medicationDetailsRequiredLabelClassName}>(required)</span>
						</Label>
						<Popover>
							<PopoverTrigger asChild>
								<Button
									type="button"
									variant="outline"
									data-empty={!startedAt && medication.startedAt === EMPTY_VALUE}
									className={`${medicationDetailsFieldControlClassName} flex w-full justify-between font-normal data-[empty=true]:text-gray-400 hover:bg-white active:scale-100`}
								>
									{startedAt ? format(startedAt, "PPP") : medication.startedAt}
									<RiCalendarLine className="size-4 text-gray-600" aria-hidden="true" />
								</Button>
							</PopoverTrigger>
							<PopoverContent className="p-0">
								<Calendar mode="single" selected={startedAt} onSelect={setStartedAt} autoFocus />
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
							defaultValue={medication.clinicalNote}
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
						className="border-gray-200 bg-white text-sm text-gray-600 "
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
			{label === "Status" ? (
				<StatusBadge status={value || EMPTY_VALUE} className="w-max" />
			) : (
				<span className="font-semibold text-gray-600">{value || EMPTY_VALUE}</span>
			)}
		</div>
	);
}

function MedicationHistorySection({ history }: { history: MedicationDetailsHistoryEvent[] }) {
	return (
		<div className="flex flex-col gap-[14px]">
			<div className="flex items-center justify-between w-full">
				<p className="text-base font-semibold">History</p>
				<button className="text-gray-400">View more</button>
			</div>
			{history.map((historyEvent) => (
				<MedicationHistoryCard key={historyEvent.id} historyEvent={historyEvent} />
			))}
		</div>
	);
}

function MedicationHistoryCard({ historyEvent }: { historyEvent: MedicationDetailsHistoryEvent }) {
	const [isMedicationHistoryExpanded, setIsMedicationHistoryExpanded] = useState(true);
	const shouldReduceMotion = useReducedMotion();
	const sectionId = useId();
	const titleId = `${sectionId}-title`;
	const panelId = `${sectionId}-panel`;

	return (
		<section className="flex flex-col rounded-2xl border border-gray-200 p-5">
			<button
				type="button"
				onClick={() => setIsMedicationHistoryExpanded((prev) => !prev)}
				aria-expanded={isMedicationHistoryExpanded}
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
						isMedicationHistoryExpanded ? "rotate-180" : "",
					)}
					aria-hidden="true"
				/>
			</button>
			<AnimatePresence initial={false}>
				{isMedicationHistoryExpanded ? (
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
								<MedicationDetailItem
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

function MedicationDetailsFallback() {
	return (
		<div className="flex flex-col gap-8" aria-busy="true" aria-live="polite">
			<div className="flex flex-wrap gap-6">
				<div className="h-6 w-36 animate-pulse rounded-md bg-gray-100" />
				<div className="h-6 w-40 animate-pulse rounded-md bg-gray-100" />
			</div>
			<div className="flex flex-col gap-6">
				<div className="h-7 w-44 animate-pulse rounded-md bg-gray-100" />
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
