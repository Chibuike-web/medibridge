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
	ImmunizationDetailsHistoryEvent,
	ImmunizationDetailsType,
} from "@/features/patients/types";
import { cn } from "@/lib/utils/cn";
import { RiArrowDownSLine, RiCalendarLine, RiCloseLine, RiEditLine } from "@remixicon/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { format } from "date-fns";
import { useId, useState } from "react";

type ImmunizationDetailsDrawerProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	immunization: ImmunizationDetailsType | null;
	isLoading: boolean;
};

const EMPTY_VALUE = "-";
const immunizationDetailsFormId = "immunization-details-form";
const immunizationDetailsFieldLabelClassName =
	"inline-flex items-baseline gap-0.5 text-sm font-medium text-gray-700";
const immunizationDetailsRequiredLabelClassName = "font-normal text-gray-400";
const immunizationDetailsFieldControlClassName =
	"h-9 border-gray-200 bg-white text-sm text-gray-700 placeholder:text-gray-400";

export function ImmunizationDetailsDrawer({
	open,
	onOpenChange,
	immunization,
	isLoading,
}: ImmunizationDetailsDrawerProps) {
	const [immunizationDetailsMode, setImmunizationDetailsMode] = useState<"view" | "edit">("view");

	function handleImmunizationDetailsOpenChange(nextOpen: boolean) {
		if (!nextOpen) {
			setImmunizationDetailsMode("view");
		}

		onOpenChange(nextOpen);
	}

	const isEditingImmunizationDetails = immunizationDetailsMode === "edit" && Boolean(immunization);

	return (
		<Drawer open={open} onOpenChange={handleImmunizationDetailsOpenChange} direction="right">
			<DrawerContent className="overflow-hidden rounded-3xl text-sm data-[vaul-drawer-direction=right]:top-4 data-[vaul-drawer-direction=right]:right-4 data-[vaul-drawer-direction=right]:bottom-4 data-[vaul-drawer-direction=right]:h-auto data-[vaul-drawer-direction=right]:w-[50rem]">
				<DrawerHeader className="flex-row items-center justify-between border-b border-gray-200 px-6 py-5 text-left">
					<DrawerTitle className="text-base leading-[1.2] text-gray-800">
						{isEditingImmunizationDetails
							? "Edit immunization details"
							: "View immunization details"}
					</DrawerTitle>
					<DrawerClose aria-label="Close immunization details">
						<RiCloseLine className="size-5" aria-hidden="true" />
					</DrawerClose>
					<DrawerDescription className="sr-only">
						{isEditingImmunizationDetails
							? "Edit the selected immunization details."
							: "Showing details for the immunization you selected."}
					</DrawerDescription>
				</DrawerHeader>

				<div className="min-h-0 overflow-y-auto px-6 py-8 text-sm">
					{isLoading ? (
						<ImmunizationDetailsFallback />
					) : isEditingImmunizationDetails && immunization ? (
						<ImmunizationDetailsEditForm immunization={immunization} />
					) : immunization ? (
						<div className="flex flex-col gap-10">
							<ImmunizationDetailsOverview
								immunization={immunization}
								onEditImmunizationDetails={() => setImmunizationDetailsMode("edit")}
							/>
							<ImmunizationHistorySection history={immunization.history} />
						</div>
					) : (
						<div className="rounded-2xl border border-gray-200 p-5 text-gray-500">
							Immunization details could not be found.
						</div>
					)}
				</div>

				<DrawerFooter className="border-t border-gray-200 px-6 py-5 text-sm">
					{isEditingImmunizationDetails ? (
						<div className="flex flex-col gap-x-4 gap-y-2 lg:flex-row lg:self-end">
							<Button
								type="button"
								variant="outline"
								className="text-sm"
								onClick={() => setImmunizationDetailsMode("view")}
							>
								Cancel
							</Button>
							<Button
								type="button"
								form={immunizationDetailsFormId}
								className="bg-gray-800 text-sm"
								onClick={() => setImmunizationDetailsMode("view")}
							>
								Save changes
							</Button>
						</div>
					) : (
						<div className="flex flex-col gap-x-4 gap-y-2 lg:flex-row lg:self-end">
							<Button type="button" variant="outline" className="text-sm">
								Mark as completed
							</Button>
							<Button className="bg-rose-500 text-sm text-white hover:bg-rose-600">
								Discontinue immunization
							</Button>
						</div>
					)}
				</DrawerFooter>
			</DrawerContent>
		</Drawer>
	);
}

function ImmunizationDetailsOverview({
	immunization,
	onEditImmunizationDetails,
}: {
	immunization: ImmunizationDetailsType;
	onEditImmunizationDetails: () => void;
}) {
	return (
		<div className="flex flex-col gap-10">
			<div className="flex flex-wrap items-center gap-x-8 gap-y-3 text-nowrap">
				<div className="flex items-center gap-2">
					<span className="text-gray-400">Immunization ID:</span>
					<CopyIdButton id={immunization.immunizationId} className="text-sm" />
				</div>
				{immunization.encounterId ? (
					<div className="flex items-center gap-2">
						<span className="text-gray-400">Encounter ID:</span>
						<CopyIdButton id={immunization.encounterId} className="text-sm" />
					</div>
				) : null}
			</div>

			<div className="flex flex-col gap-6">
				<div className="flex flex-wrap items-center justify-between gap-4">
					<div className="flex items-center gap-3">
						<h2 className="text-lg font-semibold text-gray-800">{immunization.vaccineName}</h2>
						<StatusBadge status={immunization.status} />
					</div>
					<button
						type="button"
						onClick={onEditImmunizationDetails}
						className="inline-flex items-center gap-2 text-sm font-medium text-gray-400 transition hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-300"
					>
						<RiEditLine className="size-4" aria-hidden="true" />
						Edit
					</button>
				</div>

				<div className="grid grid-cols-1 gap-x-16 gap-y-6 sm:grid-cols-2">
					<ImmunizationDetailItem label="Series Type" value={immunization.seriesType} />
					<ImmunizationDetailItem label="Current dose" value={immunization.currentDose} />
					<ImmunizationDetailItem label="Total Doses" value={immunization.totalDoses} />
					<ImmunizationDetailItem label="Date administered" value={immunization.dateAdministered} />
					<ImmunizationDetailItem label="Administered by" value={immunization.administeredBy} />
					<ImmunizationDetailItem label="Created at" value={immunization.createdAt} />
					<ImmunizationDetailItem label="Created by" value={immunization.createdBy} />
					<ImmunizationDetailItem label="Updated at" value={immunization.updatedAt} />
					<ImmunizationDetailItem label="Updated by" value={immunization.updatedBy} />
					<ImmunizationDetailItem label="Clinical notes" value={immunization.clinicalNote} />
				</div>
			</div>
		</div>
	);
}

function ImmunizationDetailsEditForm({ immunization }: { immunization: ImmunizationDetailsType }) {
	const [administeredAt, setAdministeredAt] = useState<Date | undefined>(() =>
		parseImmunizationDisplayDate(immunization.dateAdministered),
	);

	return (
		<form id={immunizationDetailsFormId} className="flex flex-col gap-12">
			<div className="flex flex-col gap-8">
				<div className="flex flex-wrap items-center gap-x-8 gap-y-3 text-nowrap">
					<div className="flex items-center gap-2">
						<span className="text-gray-400">Immunization ID:</span>
						<CopyIdButton id={immunization.immunizationId} className="text-sm" />
					</div>
					{immunization.encounterId ? (
						<div className="flex items-center gap-2">
							<span className="text-gray-400">Encounter ID:</span>
							<CopyIdButton id={immunization.encounterId} className="text-sm" />
						</div>
					) : null}
				</div>

				<div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2">
					<div className="flex flex-col gap-2 sm:col-span-2">
						<Label
							htmlFor="edit-immunization-vaccine-name"
							className={immunizationDetailsFieldLabelClassName}
						>
							Vaccine name
							<span className={immunizationDetailsRequiredLabelClassName}>(required)</span>
						</Label>
						<Input
							id="edit-immunization-vaccine-name"
							name="vaccineName"
							defaultValue={immunization.vaccineName}
							className={immunizationDetailsFieldControlClassName}
						/>
					</div>

					<div className="flex flex-col gap-2">
						<Label
							htmlFor="edit-immunization-series-type"
							className={immunizationDetailsFieldLabelClassName}
						>
							Series Type
							<span className={immunizationDetailsRequiredLabelClassName}>(optional)</span>
						</Label>
						<Select defaultValue={getImmunizationSelectValue(immunization.seriesType)}>
							<SelectTrigger
								id="edit-immunization-series-type"
								className={`${immunizationDetailsFieldControlClassName} w-full`}
							>
								<SelectValue placeholder="Select Series Type" />
							</SelectTrigger>
							<SelectContent>
								<SelectGroup>
									<SelectItem value="primary">
										Primary
									</SelectItem>
									<SelectItem value="booster">
										Booster
									</SelectItem>
								</SelectGroup>
							</SelectContent>
						</Select>
					</div>

					<div className="flex flex-col gap-2">
						<Label
							htmlFor="edit-immunization-current-dose"
							className={immunizationDetailsFieldLabelClassName}
						>
							Current dose
							<span className={immunizationDetailsRequiredLabelClassName}>(required)</span>
						</Label>
						<Input
							id="edit-immunization-current-dose"
							name="currentDose"
							defaultValue={immunization.currentDose}
							className={immunizationDetailsFieldControlClassName}
						/>
					</div>

					<div className="flex flex-col gap-2">
						<Label
							htmlFor="edit-immunization-total-dosage"
							className={immunizationDetailsFieldLabelClassName}
						>
							Total Dosage
							<span className={immunizationDetailsRequiredLabelClassName}>(required)</span>
						</Label>
						<Input
							id="edit-immunization-total-dosage"
							name="totalDosage"
							defaultValue={immunization.totalDoses}
							className={immunizationDetailsFieldControlClassName}
						/>
					</div>

					<div className="flex flex-col gap-2">
						<Label
							htmlFor="edit-immunization-status"
							className={immunizationDetailsFieldLabelClassName}
						>
							Status<span className={immunizationDetailsRequiredLabelClassName}>(required)</span>
						</Label>
						<Select defaultValue={getImmunizationSelectValue(immunization.status)}>
							<SelectTrigger
								id="edit-immunization-status"
								className={`${immunizationDetailsFieldControlClassName} w-full`}
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
									<SelectItem value="cancelled">
										Cancelled
									</SelectItem>
									<SelectItem value="discontinued">
										Discontinued
									</SelectItem>
								</SelectGroup>
							</SelectContent>
						</Select>
					</div>

					<div className="flex flex-col gap-2">
						<Label className={immunizationDetailsFieldLabelClassName}>
							Date administered
							<span className={immunizationDetailsRequiredLabelClassName}>(required)</span>
						</Label>
						<input
							type="hidden"
							name="dateAdministered"
							value={administeredAt ? format(administeredAt, "yyyy-MM-dd") : ""}
						/>
						<Popover>
							<PopoverTrigger asChild>
								<Button
									type="button"
									variant="outline"
									data-empty={!administeredAt && !immunization.dateAdministered}
									className={`${immunizationDetailsFieldControlClassName} flex w-full justify-between font-normal data-[empty=true]:text-gray-400 hover:bg-white active:scale-100`}
								>
									{administeredAt
										? format(administeredAt, "PPP")
										: immunization.dateAdministered || "Select administration date"}
									<RiCalendarLine className="size-4 text-gray-600" aria-hidden="true" />
								</Button>
							</PopoverTrigger>
							<PopoverContent className="p-0">
								<Calendar
									mode="single"
									defaultMonth={administeredAt}
									selected={administeredAt}
									onSelect={setAdministeredAt}
									autoFocus
								/>
							</PopoverContent>
						</Popover>
					</div>

					<div className="flex flex-col gap-2">
						<Label
							htmlFor="edit-immunization-administered-by"
							className={immunizationDetailsFieldLabelClassName}
						>
							Administered by
							<span className={immunizationDetailsRequiredLabelClassName}>(required)</span>
						</Label>
						<Input
							id="edit-immunization-administered-by"
							name="administeredBy"
							defaultValue={immunization.administeredBy}
							className={immunizationDetailsFieldControlClassName}
						/>
					</div>

					<div className="flex flex-col gap-2 sm:col-span-2">
						<Label
							htmlFor="edit-immunization-clinical-note"
							className={immunizationDetailsFieldLabelClassName}
						>
							Clinical notes
							<span className={immunizationDetailsRequiredLabelClassName}>(optional)</span>
						</Label>
						<Textarea
							id="edit-immunization-clinical-note"
							name="clinicalNote"
							defaultValue={immunization.clinicalNote}
							className="min-h-28 bg-white text-sm text-gray-700 placeholder:text-gray-400"
						/>
					</div>
				</div>
			</div>
		</form>
	);
}

function ImmunizationDetailItem({ label, value }: { label: string; value: string }) {
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

function ImmunizationHistorySection({ history }: { history: ImmunizationDetailsHistoryEvent[] }) {
	return (
		<div className="flex flex-col gap-[14px]">
			<div className="flex items-center justify-between w-full">
				<p className="text-base font-semibold">History</p>
				<button className="text-gray-400">View more</button>
			</div>
			{history.map((historyEvent) => (
				<ImmunizationHistoryCard key={historyEvent.id} historyEvent={historyEvent} />
			))}
		</div>
	);
}

function ImmunizationHistoryCard({
	historyEvent,
}: {
	historyEvent: ImmunizationDetailsHistoryEvent;
}) {
	const [isImmunizationHistoryExpanded, setIsImmunizationHistoryExpanded] = useState(true);
	const shouldReduceMotion = useReducedMotion();
	const sectionId = useId();
	const titleId = `${sectionId}-title`;
	const panelId = `${sectionId}-panel`;

	return (
		<section className="flex flex-col rounded-2xl border border-gray-200 p-5">
			<button
				type="button"
				onClick={() => setIsImmunizationHistoryExpanded((prev) => !prev)}
				aria-expanded={isImmunizationHistoryExpanded}
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
						isImmunizationHistoryExpanded ? "rotate-180" : "",
					)}
					aria-hidden="true"
				/>
			</button>
			<AnimatePresence initial={false}>
				{isImmunizationHistoryExpanded ? (
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
								<ImmunizationDetailItem
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

function ImmunizationDetailsFallback() {
	return (
		<div className="flex flex-col gap-8" aria-busy="true" aria-live="polite">
			<div className="flex flex-wrap gap-6">
				<div className="h-6 w-44 animate-pulse rounded-md bg-gray-100" />
				<div className="h-6 w-40 animate-pulse rounded-md bg-gray-100" />
			</div>
			<div className="flex flex-col gap-6">
				<div className="h-7 w-48 animate-pulse rounded-md bg-gray-100" />
				<div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
					{Array.from({ length: 10 }).map((_, index) => (
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

function getImmunizationSelectValue(value: string) {
	return value.toLowerCase().replaceAll(" ", "-");
}

function parseImmunizationDisplayDate(value: string) {
	if (!value || value === EMPTY_VALUE) return undefined;

	const normalizedValue = value.replace(/(\d+)(st|nd|rd|th)/i, "$1");
	const date = new Date(normalizedValue);

	if (Number.isNaN(date.getTime())) return undefined;

	return date;
}
