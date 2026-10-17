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
import { Fragment, useId, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { updatePatientImmunizationAction } from "@/features/patients/server/update-patient-immunization-action";
import { immunizationSeriesTypes, immunizationStatuses } from "@/features/patients/server/schemas";

type ImmunizationDetailsDrawerProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	immunization: ImmunizationDetailsType | null;
	isLoading: boolean;
	onImmunizationUpdated: () => void;
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
	onImmunizationUpdated,
}: ImmunizationDetailsDrawerProps) {
	const router = useRouter();
	const { data: activeMemberRole } = authClient.useActiveMemberRole();
	const canArchive = activeMemberRole?.role === "owner" || activeMemberRole?.role === "admin";
	const [immunizationDetailsMode, setImmunizationDetailsMode] = useState<"view" | "edit">("view");
	const [formError, setFormError] = useState("");
	const [isPending, startTransition] = useTransition();
	const [isDiscontinueDialogOpen, setIsDiscontinueDialogOpen] = useState(false);
	const [isArchiveDialogOpen, setIsArchiveDialogOpen] = useState(false);

	function handleImmunizationDetailsModeChange(nextMode: "view" | "edit") {
		setFormError("");
		setImmunizationDetailsMode(nextMode);
	}

	function handleImmunizationDetailsOpenChange(nextOpen: boolean) {
		if (!nextOpen) {
			handleImmunizationDetailsModeChange("view");
		}

		onOpenChange(nextOpen);
	}

	function handleSave(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();

		if (!immunization) return;

		setFormError("");
		const formData = new FormData(event.currentTarget);

		startTransition(async () => {
			const result = await updatePatientImmunizationAction(immunization.immunizationId, formData);

			if (result.status === "unauthorized") {
				router.refresh();
				return;
			}

			if (result.status !== "success") {
				setFormError(result.error);
				return;
			}

			setImmunizationDetailsMode("view");
			onImmunizationUpdated();
		});
	}

	const isEditingImmunizationDetails = immunizationDetailsMode === "edit" && Boolean(immunization);

	return (
		<Drawer open={open} onOpenChange={handleImmunizationDetailsOpenChange} direction="right">
			<DrawerContent className="overflow-hidden rounded-3xl text-sm data-[vaul-drawer-direction=right]:top-4 data-[vaul-drawer-direction=right]:right-4 data-[vaul-drawer-direction=right]:bottom-4 data-[vaul-drawer-direction=right]:h-auto data-[vaul-drawer-direction=right]:w-[37.5rem]">
				<DrawerHeader className="flex-row items-center justify-between border-b border-gray-200 text-left">
					<DrawerTitle className="flex-1 leading-[1.2] text-gray-800">
						{isEditingImmunizationDetails
							? "Edit immunization details"
							: "Immunization details"}
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
								className="w-50 rounded-xl bg-white text-sm text-gray-700"
							>
								<DropdownMenuItem
									className="rounded-lg"
									onSelect={() => handleImmunizationDetailsModeChange("edit")}
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
						<ImmunizationDetailsEditForm
							key={immunization.immunizationId}
							immunization={immunization}
							formError={formError}
							onFormErrorDismiss={() => setFormError("")}
							onSubmit={handleSave}
						/>
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
								onClick={() => handleImmunizationDetailsModeChange("view")}
							>
								Cancel
							</Button>
							<Button type="submit" form={immunizationDetailsFormId} disabled={isPending}>
								{isPending ? "Saving…" : "Save changes"}
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
						<CopyIdButton id={immunization.immunizationId} />
					</div>
					{immunization.encounterId ? (
						<div className="flex items-center gap-2">
							<span className="text-gray-400">Encounter ID:</span>
							<CopyIdButton id={immunization.encounterId} />
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
					<h2 className="text-base font-semibold text-gray-800">{immunization.vaccineName}</h2>
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

function ImmunizationDetailsEditForm({
	immunization,
	formError,
	onFormErrorDismiss,
	onSubmit,
}: {
	immunization: ImmunizationDetailsType;
	formError: string;
	onFormErrorDismiss: () => void;
	onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
	const [originalUpdatedAt] = useState(() => immunization.editValues.updatedAt);
	const [administeredAt, setAdministeredAt] = useState<Date | undefined>(() =>
		immunization.editValues.dateAdministered
			? parseISO(immunization.editValues.dateAdministered)
			: undefined,
	);

	return (
		<form id={immunizationDetailsFormId} onSubmit={onSubmit} className="flex flex-col gap-12">
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
						<span className="text-gray-400">Immunization ID:</span>
						<CopyIdButton id={immunization.immunizationId} />
					</div>
					{immunization.encounterId ? (
						<div className="flex items-center gap-2">
							<span className="text-gray-400">Encounter ID:</span>
							<CopyIdButton id={immunization.encounterId} />
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
							required
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
						<Select
							name="seriesType"
							defaultValue={immunization.editValues.seriesType || undefined}
						>
							<SelectTrigger
								id="edit-immunization-series-type"
								className={`${immunizationDetailsFieldControlClassName} w-full`}
							>
								<SelectValue placeholder="Select Series Type" />
							</SelectTrigger>
							<SelectContent>
								<SelectGroup>
									{immunizationSeriesTypes.map((seriesType) => (
										<SelectItem key={seriesType} value={seriesType}>
											{seriesType}
										</SelectItem>
									))}
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
							type="number"
							min={1}
							defaultValue={immunization.editValues.currentDose}
							className={immunizationDetailsFieldControlClassName}
							required
						/>
					</div>

					<div className="flex flex-col gap-2">
						<Label
							htmlFor="edit-immunization-total-doses"
							className={immunizationDetailsFieldLabelClassName}
						>
							Total doses
							<span className={immunizationDetailsRequiredLabelClassName}>(required)</span>
						</Label>
						<Input
							id="edit-immunization-total-doses"
							name="totalDoses"
							type="number"
							min={1}
							defaultValue={immunization.editValues.totalDoses}
							className={immunizationDetailsFieldControlClassName}
							required
						/>
					</div>

					<div className="flex flex-col gap-2">
						<Label
							htmlFor="edit-immunization-status"
							className={immunizationDetailsFieldLabelClassName}
						>
							Status<span className={immunizationDetailsRequiredLabelClassName}>(required)</span>
						</Label>
						<Select name="status" defaultValue={immunization.status} required>
							<SelectTrigger
								id="edit-immunization-status"
								className={`${immunizationDetailsFieldControlClassName} w-full`}
							>
								<SelectValue placeholder="Select status" />
							</SelectTrigger>
							<SelectContent>
								<SelectGroup>
									{immunizationStatuses.map((status) => (
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
							htmlFor="edit-immunization-date-administered"
							className={immunizationDetailsFieldLabelClassName}
						>
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
									id="edit-immunization-date-administered"
									type="button"
									variant="outline"
									data-empty={!administeredAt}
									className={`${immunizationDetailsFieldControlClassName} flex w-full justify-between font-normal data-[empty=true]:text-gray-400 hover:bg-white active:scale-100`}
								>
									{administeredAt ? format(administeredAt, "PPP") : "Select administration date"}
									<RiCalendarLine className="size-4 text-gray-600" aria-hidden="true" />
								</Button>
							</PopoverTrigger>
							<PopoverContent className="p-0">
								<Calendar
									mode="single"
									defaultMonth={administeredAt}
									selected={administeredAt}
									onSelect={setAdministeredAt}
									disabled={{ after: new Date() }}
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
							defaultValue={immunization.editValues.administeredBy}
							className={immunizationDetailsFieldControlClassName}
							required
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
							defaultValue={immunization.editValues.clinicalNote}
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
	const changeCount =
		historyEvent.items.filter((item) => item.label !== "Clinical note").length || 1;

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
						{changeCount} {changeCount === 1 ? "change" : "changes"}
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
