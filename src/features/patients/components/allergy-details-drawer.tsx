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
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { AllergyDetailsHistoryEvent, AllergyDetailsType } from "@/features/patients/types";
import {
	AttachmentFormFields,
	type AttachmentFormRow,
} from "@/features/patients/components/attachment-form-fields";
import { cn } from "@/lib/utils/cn";
import { RiAddLine, RiArrowDownSLine, RiCloseLine, RiEditLine } from "@remixicon/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useId, useRef, useState } from "react";

type AllergyDetailsDrawerProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	allergy: AllergyDetailsType | null;
	isLoading: boolean;
};

const EMPTY_VALUE = "-";
const allergyDetailsFormId = "allergy-details-form";
const allergyDetailsFieldLabelClassName =
	"inline-flex items-baseline gap-0.5 text-sm font-medium text-gray-700";
const allergyDetailsRequiredLabelClassName = "font-normal text-gray-400";
const allergyDetailsFieldControlClassName =
	"h-9 border-gray-200 bg-white text-sm text-gray-700 placeholder:text-gray-400";

export function AllergyDetailsDrawer({
	open,
	onOpenChange,
	allergy,
	isLoading,
}: AllergyDetailsDrawerProps) {
	const [allergyDetailsMode, setAllergyDetailsMode] = useState<"view" | "edit">("view");

	function handleAllergyDetailsOpenChange(nextOpen: boolean) {
		if (!nextOpen) {
			setAllergyDetailsMode("view");
		}

		onOpenChange(nextOpen);
	}

	const isEditingAllergyDetails = allergyDetailsMode === "edit" && Boolean(allergy);

	return (
		<Drawer open={open} onOpenChange={handleAllergyDetailsOpenChange} direction="right">
			<DrawerContent className="overflow-hidden rounded-3xl text-sm data-[vaul-drawer-direction=right]:top-4 data-[vaul-drawer-direction=right]:right-4 data-[vaul-drawer-direction=right]:bottom-4 data-[vaul-drawer-direction=right]:h-auto data-[vaul-drawer-direction=right]:w-[50rem]">
				<DrawerHeader className="flex-row items-center justify-between border-b border-gray-200 px-6 py-5 text-left">
					<DrawerTitle className="text-base leading-[1.2] text-gray-800">
						{isEditingAllergyDetails ? "Edit allergies details" : "View allergies details"}
					</DrawerTitle>
					<DrawerClose aria-label="Close allergy details">
						<RiCloseLine className="size-5" aria-hidden="true" />
					</DrawerClose>
					<DrawerDescription className="sr-only">
						{isEditingAllergyDetails
							? "Edit the selected allergy details."
							: "Showing details for the allergy you selected."}
					</DrawerDescription>
				</DrawerHeader>

				<div className="min-h-0 overflow-y-auto px-6 py-8 text-sm">
					{isLoading ? (
						<AllergyDetailsFallback />
					) : isEditingAllergyDetails && allergy ? (
						<AllergyDetailsEditForm allergy={allergy} />
					) : allergy ? (
						<div className="flex flex-col gap-10">
							<AllergyDetailsOverview
								allergy={allergy}
								onEditAllergyDetails={() => setAllergyDetailsMode("edit")}
							/>
							<AllergyHistorySection history={allergy.history} />
						</div>
					) : (
						<div className="rounded-2xl border border-gray-200 p-5 text-gray-500">
							Allergy details could not be found.
						</div>
					)}
				</div>

				<DrawerFooter className="border-t border-gray-200 px-6 py-5 text-sm">
					{isEditingAllergyDetails ? (
						<div className="flex flex-col gap-x-4 gap-y-2 lg:flex-row lg:self-end">
							<Button
								type="button"
								variant="outline"
								className="text-sm"
								onClick={() => setAllergyDetailsMode("view")}
							>
								Cancel
							</Button>
							<Button
								type="button"
								form={allergyDetailsFormId}
								className="bg-gray-800 text-sm"
								onClick={() => setAllergyDetailsMode("view")}
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
							<Button className="bg-gray-800 text-sm">Archive allergy</Button>
						</div>
					)}
				</DrawerFooter>
			</DrawerContent>
		</Drawer>
	);
}

function AllergyDetailsOverview({
	allergy,
	onEditAllergyDetails,
}: {
	allergy: AllergyDetailsType;
	onEditAllergyDetails: () => void;
}) {
	return (
		<div className="flex flex-col gap-10">
			<div className="flex flex-wrap items-center gap-x-8 gap-y-3 text-nowrap">
				<div className="flex items-center gap-2">
					<span className="text-gray-400">Allergy ID:</span>
					<CopyIdButton id={allergy.allergyId} className="text-sm" />
				</div>
				{allergy.encounterId ? (
					<div className="flex items-center gap-2">
						<span className="text-gray-400">Encounter ID:</span>
						<CopyIdButton id={allergy.encounterId} className="text-sm" />
					</div>
				) : null}
			</div>

			<div className="flex flex-col gap-6">
				<div className="flex flex-wrap items-center justify-between gap-4">
					<div className="flex items-center gap-3">
						<h2 className="text-lg font-semibold text-gray-800">{allergy.allergen}</h2>
						<StatusBadge status={allergy.status} />
					</div>
					<button
						type="button"
						onClick={onEditAllergyDetails}
						className="inline-flex items-center gap-2 text-sm font-medium text-gray-400 transition hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-300"
					>
						<RiEditLine className="size-4" aria-hidden="true" />
						Edit
					</button>
				</div>

				<div className="grid grid-cols-1 gap-x-16 gap-y-6 sm:grid-cols-2">
					<AllergyDetailItem label="Severity" value={allergy.severity} />
					<AllergyDetailItem label="Reaction" value={allergy.reaction} />
					<AllergyDetailItem label="Created at" value={allergy.createdAt} />
					<AllergyDetailItem label="Created by" value={allergy.createdBy} />
					<AllergyDetailItem label="Updated by" value={allergy.updatedBy} />
					<AllergyDetailItem label="Updated at" value={allergy.updatedAt} />
					<AllergyDetailItem label="Clinical notes" value={allergy.clinicalNote} />
				</div>
			</div>
		</div>
	);
}

function AllergyDetailsEditForm({ allergy }: { allergy: AllergyDetailsType }) {
	const generatedAttachmentRowId = useId();
	const nextAttachmentRowNumberRef = useRef(0);
	const [allergyAttachmentRows, setAllergyAttachmentRows] = useState<AttachmentFormRow[]>([]);

	function handleAddAllergyAttachmentRow() {
		nextAttachmentRowNumberRef.current += 1;

		setAllergyAttachmentRows((prev) => [
			...prev,
			{
				id: `${generatedAttachmentRowId}-attachment-${nextAttachmentRowNumberRef.current}`,
				name: "",
				recordId: "",
			},
		]);
	}

	function handleRemoveAllergyAttachmentRow(attachmentRowId: string) {
		setAllergyAttachmentRows((prev) =>
			prev.filter((attachmentRow) => attachmentRow.id !== attachmentRowId),
		);
	}

	return (
		<form id={allergyDetailsFormId} className="flex flex-col gap-12">
			<div className="flex flex-col gap-8">
				<div className="flex flex-wrap items-center gap-x-8 gap-y-3 text-nowrap">
					<div className="flex items-center gap-2">
						<span className="text-gray-400">Allergy ID:</span>
						<CopyIdButton id={allergy.allergyId} className="text-sm" />
					</div>
					{allergy.encounterId ? (
						<div className="flex items-center gap-2">
							<span className="text-gray-400">Encounter ID:</span>
							<CopyIdButton id={allergy.encounterId} className="text-sm" />
						</div>
					) : null}
				</div>

				<div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2">
					<div className="flex flex-col gap-2 sm:col-span-2">
						<Label htmlFor="edit-allergy-allergen" className={allergyDetailsFieldLabelClassName}>
							Allergen<span className={allergyDetailsRequiredLabelClassName}>(required)</span>
						</Label>
						<Input
							id="edit-allergy-allergen"
							name="allergen"
							defaultValue={allergy.allergen}
							className={allergyDetailsFieldControlClassName}
						/>
					</div>

					<div className="flex flex-col gap-2">
						<Label htmlFor="edit-allergy-severity" className={allergyDetailsFieldLabelClassName}>
							Severity<span className={allergyDetailsRequiredLabelClassName}>(required)</span>
						</Label>
						<Select defaultValue={allergy.severity.toLowerCase()}>
							<SelectTrigger
								id="edit-allergy-severity"
								className={`${allergyDetailsFieldControlClassName} w-full`}
							>
								<SelectValue placeholder="Select severity" />
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
								</SelectGroup>
							</SelectContent>
						</Select>
					</div>

					<div className="flex flex-col gap-2">
						<Label htmlFor="edit-allergy-status" className={allergyDetailsFieldLabelClassName}>
							Status<span className={allergyDetailsRequiredLabelClassName}>(required)</span>
						</Label>
						<Select defaultValue={allergy.status.toLowerCase()}>
							<SelectTrigger
								id="edit-allergy-status"
								className={`${allergyDetailsFieldControlClassName} w-full`}
							>
								<SelectValue placeholder="Select status" />
							</SelectTrigger>
							<SelectContent className="rounded-xl border-gray-200 p-1 text-sm text-gray-700 shadow-xl">
								<SelectGroup>
									<SelectItem value="active" className="rounded-md px-3 h-9">
										Active
									</SelectItem>
									<SelectItem value="inactive" className="rounded-md px-3 h-9">
										Inactive
									</SelectItem>
								</SelectGroup>
							</SelectContent>
						</Select>
					</div>

					<div className="flex flex-col gap-2 sm:col-span-2">
						<Label htmlFor="edit-allergy-reaction" className={allergyDetailsFieldLabelClassName}>
							Reaction<span className={allergyDetailsRequiredLabelClassName}>(required)</span>
						</Label>
						<Textarea
							id="edit-allergy-reaction"
							name="reaction"
							defaultValue={allergy.reaction}
							className="min-h-28 bg-white text-sm text-gray-700 placeholder:text-gray-400"
						/>
					</div>

					<div className="flex flex-col gap-2 sm:col-span-2">
						<Label
							htmlFor="edit-allergy-clinical-note"
							className={allergyDetailsFieldLabelClassName}
						>
							Clinical notes
							<span className={allergyDetailsRequiredLabelClassName}>(optional)</span>
						</Label>
						<Textarea
							id="edit-allergy-clinical-note"
							name="clinicalNote"
							defaultValue={allergy.clinicalNote}
							className="min-h-28 bg-white text-sm text-gray-700 placeholder:text-gray-400"
						/>
					</div>
				</div>
			</div>

			<div className="flex flex-col gap-6">
				{allergyAttachmentRows.map((attachmentRow, attachmentIndex) => (
					<AttachmentFormFields
						key={attachmentRow.id}
						attachmentRow={attachmentRow}
						attachmentIndex={attachmentIndex}
						fieldLabelClassName={allergyDetailsFieldLabelClassName}
						requiredLabelClassName={allergyDetailsRequiredLabelClassName}
						fieldControlClassName={allergyDetailsFieldControlClassName}
						onRemoveAttachmentRow={handleRemoveAllergyAttachmentRow}
					/>
				))}

				<div>
					<Button
						type="button"
						variant="outline"
						className="border-gray-200 bg-white text-sm text-gray-600 "
						onClick={handleAddAllergyAttachmentRow}
					>
						<RiAddLine className="size-5" aria-hidden="true" />
						Add related record
					</Button>
				</div>
			</div>
		</form>
	);
}

function AllergyDetailItem({ label, value }: { label: string; value: string }) {
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

function AllergyHistorySection({ history }: { history: AllergyDetailsHistoryEvent[] }) {
	return (
		<div className="flex flex-col gap-[14px]">
			<div className="flex items-center justify-between w-full">
				<p className="text-base font-semibold">History</p>
				<button className="text-gray-400">View more</button>
			</div>{" "}
			{history.map((historyEvent) => (
				<AllergyHistoryCard key={historyEvent.id} historyEvent={historyEvent} />
			))}
		</div>
	);
}

function AllergyHistoryCard({ historyEvent }: { historyEvent: AllergyDetailsHistoryEvent }) {
	const [isAllergyHistoryExpanded, setIsAllergyHistoryExpanded] = useState(true);
	const shouldReduceMotion = useReducedMotion();
	const sectionId = useId();
	const titleId = `${sectionId}-title`;
	const panelId = `${sectionId}-panel`;

	return (
		<section className="flex flex-col rounded-2xl border border-gray-200 p-5">
			<button
				type="button"
				onClick={() => setIsAllergyHistoryExpanded((prev) => !prev)}
				aria-expanded={isAllergyHistoryExpanded}
				aria-controls={panelId}
				className="flex w-full items-center justify-between gap-4 text-left"
			>
				<p>
					<span id={titleId} className="font-semibold text-gray-800">
						{historyEvent.title}
					</span>{" "}
					<span className="text-sm text-gray-400"> on {historyEvent.timestamp}</span>
				</p>
				<RiArrowDownSLine
					className={cn(
						"size-5 shrink-0 transition-transform duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none",
						isAllergyHistoryExpanded ? "rotate-180" : "",
					)}
					aria-hidden="true"
				/>
			</button>
			<AnimatePresence initial={false}>
				{isAllergyHistoryExpanded ? (
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
								<AllergyDetailItem
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

function AllergyDetailsFallback() {
	return (
		<div className="flex flex-col gap-8" aria-busy="true" aria-live="polite">
			<div className="flex flex-wrap gap-6">
				<div className="h-6 w-36 animate-pulse rounded-md bg-gray-100" />
				<div className="h-6 w-40 animate-pulse rounded-md bg-gray-100" />
			</div>
			<div className="flex flex-col gap-6">
				<div className="h-7 w-44 animate-pulse rounded-md bg-gray-100" />
				<div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
					{Array.from({ length: 7 }).map((_, index) => (
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
