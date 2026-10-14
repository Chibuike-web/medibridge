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
	ImmunizationDetailsHistoryEvent,
	ImmunizationDetailsType,
} from "@/features/patients/types";
import { cn } from "@/lib/utils/cn";
import { authClient } from "@/lib/better-auth/auth.client";
import {
	RiArchiveLine,
	RiArrowDownSLine,
	RiCalendarLine,
	RiCheckLine,
	RiCloseLine,
	RiEdit2Line,
	RiMore2Fill,
	RiShare2Line,
} from "@remixicon/react";
import { format } from "date-fns";
import { Fragment, useId, useState } from "react";

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
	const { data: activeMemberRole } = authClient.useActiveMemberRole();
	const canArchive = activeMemberRole?.role === "owner" || activeMemberRole?.role === "admin";
	const [immunizationDetailsMode, setImmunizationDetailsMode] = useState<"view" | "edit">("view");
	const [isDiscontinueDialogOpen, setIsDiscontinueDialogOpen] = useState(false);
	const [isArchiveDialogOpen, setIsArchiveDialogOpen] = useState(false);

	function handleImmunizationDetailsOpenChange(nextOpen: boolean) {
		if (!nextOpen) {
			setImmunizationDetailsMode("view");
		}

		onOpenChange(nextOpen);
	}

	const isEditingImmunizationDetails = immunizationDetailsMode === "edit" && Boolean(immunization);

	return (
		<Drawer open={open} onOpenChange={handleImmunizationDetailsOpenChange} direction="right">
			<DrawerContent className="overflow-hidden rounded-3xl text-sm data-[vaul-drawer-direction=right]:top-4 data-[vaul-drawer-direction=right]:right-4 data-[vaul-drawer-direction=right]:bottom-4 data-[vaul-drawer-direction=right]:h-auto data-[vaul-drawer-direction=right]:w-[37.5rem]">
				<DrawerHeader className="flex-row items-center justify-between border-b border-gray-200 text-left">
					<DrawerTitle className="flex-1 leading-[1.2] text-gray-800">
						{isEditingImmunizationDetails
							? "Edit immunization details"
							: "View immunization details"}
					</DrawerTitle>
					{immunization && !isEditingImmunizationDetails ? (
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="ghost" size="icon" aria-label="Immunization actions">
									<RiMore2Fill aria-hidden="true" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent
								align="end"
								className="w-50 rounded-xl border-gray-200 bg-white text-sm text-gray-700 shadow-xl"
							>
								<DropdownMenuItem
									className="rounded-lg"
									onSelect={() => setImmunizationDetailsMode("edit")}
								>
									<RiEdit2Line aria-hidden="true" />
									Edit
								</DropdownMenuItem>
								<DropdownMenuItem className="rounded-lg">
									<RiShare2Line aria-hidden="true" />
									Export
								</DropdownMenuItem>
								{immunization.status === "Active" ? (
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
						<Button variant="ghost" size="icon" aria-label="Close immunization details">
							<RiCloseLine aria-hidden="true" />
						</Button>
					</DrawerClose>
					<DrawerDescription className="sr-only">
						{isEditingImmunizationDetails
							? "Edit the selected immunization details."
							: "Showing details for the immunization you selected."}
					</DrawerDescription>
				</DrawerHeader>

				<div className="min-h-0 overflow-y-auto px-4 py-5 text-sm">
					{isLoading ? (
						<ImmunizationDetailsFallback />
					) : isEditingImmunizationDetails && immunization ? (
						<ImmunizationDetailsEditForm immunization={immunization} />
					) : immunization ? (
						<div className="flex flex-col gap-10">
							<ImmunizationDetailsOverview immunization={immunization} />
							<ImmunizationHistorySection history={immunization.history} />
						</div>
					) : (
						<div className="rounded-2xl border border-gray-200 p-5 text-gray-500">
							Immunization details could not be found.
						</div>
					)}
				</div>

				{isEditingImmunizationDetails ? (
					<DrawerFooter className="border-t border-gray-200 text-sm">
						<div className="flex flex-col gap-2 lg:flex-row lg:self-end">
							<Button
								type="button"
								variant="outline"
								onClick={() => setImmunizationDetailsMode("view")}
							>
								Cancel
							</Button>
							<Button
								type="button"
								form={immunizationDetailsFormId}
								onClick={() => setImmunizationDetailsMode("view")}
							>
								Save changes
							</Button>
						</div>
					</DrawerFooter>
				) : null}
			</DrawerContent>
			<AlertDialog open={isDiscontinueDialogOpen} onOpenChange={setIsDiscontinueDialogOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Discontinue immunization?</AlertDialogTitle>
						<Button
							type="button"
							variant="ghost"
							size="icon"
							aria-label="Close discontinue immunization dialog"
							onClick={() => setIsDiscontinueDialogOpen(false)}
						>
							<RiCloseLine aria-hidden="true" />
						</Button>
					</AlertDialogHeader>
					<AlertDialogDescription>
						This immunization will be removed from the patient’s active immunization list. The
						immunization record, related encounters, and full activity history will be retained and
						can be restored at any time.
					</AlertDialogDescription>
					<AlertDialogFooter className="sm:justify-end">
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<Button
							type="button"
							className="bg-rose-500 text-white hover:bg-rose-600"
							onClick={() => setIsDiscontinueDialogOpen(false)}
						>
							Discontinue immunization
						</Button>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
			<AlertDialog open={isArchiveDialogOpen} onOpenChange={setIsArchiveDialogOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Archive immunization</AlertDialogTitle>
						<Button
							type="button"
							variant="ghost"
							size="icon"
							aria-label="Close archive immunization dialog"
							onClick={() => setIsArchiveDialogOpen(false)}
						>
							<RiCloseLine aria-hidden="true" />
						</Button>
					</AlertDialogHeader>
					<AlertDialogDescription>
						This immunization will be removed from the patient’s active problem list. The record,
						its related medications, labs, imaging and full activity history are retained and can be
						restored at any time.
					</AlertDialogDescription>
					<AlertDialogFooter className="sm:justify-end">
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<Button type="button" onClick={() => setIsArchiveDialogOpen(false)}>
							Archive immunization
						</Button>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</Drawer>
	);
}

function ImmunizationDetailsOverview({ immunization }: { immunization: ImmunizationDetailsType }) {
	return (
		<div className="flex flex-col gap-8">
			<div className="flex flex-col gap-4">
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
				<p className="flex flex-wrap items-center gap-2 font-medium">
					<span className="text-gray-600">Created by {immunization.createdBy}</span>
					<span aria-hidden="true" className="size-1 rounded-full bg-gray-300" />
					<span className="text-gray-400">{immunization.createdAt}</span>
				</p>
			</div>

			<div className="flex flex-col gap-6">
				<div className="flex items-center gap-3">
					<h2 className="text-lg font-semibold text-gray-800">{immunization.vaccineName}</h2>
					<StatusBadge status={immunization.status} />
				</div>

				<div className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
					<ImmunizationDetailItem label="Series Type" value={immunization.seriesType} />
					<ImmunizationDetailItem label="Current dose" value={immunization.currentDose} />
					<ImmunizationDetailItem label="Total Doses" value={immunization.totalDoses} />
					<ImmunizationDetailItem label="Date administered" value={immunization.dateAdministered} />
					<ImmunizationDetailItem label="Administered by" value={immunization.administeredBy} />
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

				<div className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
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
									<SelectItem value="primary">Primary</SelectItem>
									<SelectItem value="booster">Booster</SelectItem>
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
									<SelectItem value="active">Active</SelectItem>
									<SelectItem value="completed">Completed</SelectItem>
									<SelectItem value="cancelled">Cancelled</SelectItem>
									<SelectItem value="discontinued">Discontinued</SelectItem>
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
			<span className="font-medium text-gray-600">{value || EMPTY_VALUE}</span>
		</div>
	);
}

function ImmunizationHistorySection({ history }: { history: ImmunizationDetailsHistoryEvent[] }) {
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
	const [isImmunizationHistoryExpanded, setIsImmunizationHistoryExpanded] = useState(false);
	const sectionId = useId();
	const titleId = `${sectionId}-title`;
	const panelId = `${sectionId}-panel`;

	return (
		<section className="flex flex-col rounded-xl border border-gray-200 p-4">
			<Button
				type="button"
				onClick={() => setIsImmunizationHistoryExpanded((prev) => !prev)}
				aria-expanded={isImmunizationHistoryExpanded}
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
						{historyEvent.items.length} {historyEvent.items.length === 1 ? "change" : "changes"}
					</span>
				</p>
				<RiArrowDownSLine
					className={cn(
						"size-5 shrink-0 transition-transform duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none",
						isImmunizationHistoryExpanded ? "rotate-180" : "",
					)}
					aria-hidden="true"
				/>
			</Button>
			<div
				id={panelId}
				className={cn(
					"grid overflow-hidden transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none",
					isImmunizationHistoryExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
				)}
				aria-hidden={!isImmunizationHistoryExpanded}
				inert={!isImmunizationHistoryExpanded}
			>
				<div className="min-h-0 overflow-hidden">
					<div role="region" aria-labelledby={titleId} className="mt-4">
						<dl className="grid grid-cols-[8.75rem_1fr] gap-x-4 gap-y-2">
							{historyEvent.items.map((item) => (
								<Fragment key={`${historyEvent.id}-${item.label}`}>
									<dt className="text-gray-400">{item.label}</dt>
									<dd className="text-gray-700">{item.value || EMPTY_VALUE}</dd>
								</Fragment>
							))}
						</dl>
					</div>
				</div>
			</div>
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
				<div className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
					{Array.from({ length: 10 }).map((_, index) => (
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
