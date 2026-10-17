"use client";

import { useId, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
	RiArchiveLine,
	RiCalendarLine,
	RiCloseLine,
	RiEditLine,
	RiErrorWarningFill,
	RiMore2Fill,
	RiShare2Line,
} from "@remixicon/react";
import { CopyIdButton } from "@/components/copy-id-button";
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
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { DetailItem, DetailsSection } from "./patient-details-section/detail-fields";
import { updatePatientEncounterAction } from "@/features/patients/server/update-patient-encounter-action";
import { encounterDepartments, encounterTypes } from "@/features/patients/server/schemas";
import { authClient } from "@/lib/better-auth/auth.client";

const fieldLabelClassName = "inline-flex items-baseline gap-0.5 text-sm font-medium text-gray-700";
const optionalLabelClassName = "font-normal text-gray-400";
const fieldControlClassName =
	"h-9 border-gray-200 bg-white text-sm text-gray-700 placeholder:text-gray-400";

export function EncounterOverview({
	encounter,
	encounterDayLabel,
}: {
	encounter: {
		encounterId: string;
		patientId: string;
		encounterType: string;
		department: string;
		physician: string;
		encounterDate: Date;
		reason: string | null;
		createdBy: string;
		createdAtLabel: string;
		updatedAt: Date;
	};
	encounterDayLabel: string;
}) {
	const router = useRouter();
	const formId = useId();
	const { data: activeMemberRole } = authClient.useActiveMemberRole();
	const canArchive = activeMemberRole?.role === "owner" || activeMemberRole?.role === "admin";
	const [isEditEncounterDrawerOpen, setIsEditEncounterDrawerOpen] = useState(false);
	const [isArchiveDialogOpen, setIsArchiveDialogOpen] = useState(false);
	const [formError, setFormError] = useState("");
	const [selectedEncounterDate, setSelectedEncounterDate] = useState(encounter.encounterDate);
	const [openedUpdatedAt, setOpenedUpdatedAt] = useState(encounter.updatedAt.toISOString());
	const [isPending, startTransition] = useTransition();

	function handleSave(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setFormError("");
		const encounterDate = new Date(encounter.encounterDate);
		encounterDate.setFullYear(
			selectedEncounterDate.getFullYear(),
			selectedEncounterDate.getMonth(),
			selectedEncounterDate.getDate(),
		);
		const formData = new FormData(event.currentTarget);
		formData.set("encounterDate", encounterDate.toISOString());

		startTransition(async () => {
			const result = await updatePatientEncounterAction(encounter.encounterId, formData);

			if (result.status === "unauthorized") {
				router.refresh();
				return;
			}

			if (result.status === "failed") {
				setFormError(result.error);
				return;
			}

			setIsEditEncounterDrawerOpen(false);
		});
	}

	return (
		<>
			<DetailsSection
				title="Overview"
				action={
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								variant="ghost"
								size="icon"
								className="text-gray-500"
								aria-label="Encounter actions"
							>
								<RiMore2Fill aria-hidden="true" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent
							align="end"
							className="w-50 rounded-xl border-white/20 bg-gray-800 text-sm text-white ring ring-gray-800"
						>
							<DropdownMenuItem
								onSelect={() => {
									setFormError("");
									setSelectedEncounterDate(encounter.encounterDate);
									setOpenedUpdatedAt(encounter.updatedAt.toISOString());
									setIsEditEncounterDrawerOpen(true);
								}}
								className="flex items-center rounded-lg py-2 text-white focus:bg-white/10 focus:text-white"
							>
								<RiEditLine className="text-white" />
								<span>Edit</span>
							</DropdownMenuItem>
							<DropdownMenuItem className="flex items-center rounded-lg py-2 text-white focus:bg-white/10 focus:text-white">
								<RiShare2Line className="text-white" />
								<span>Export</span>
							</DropdownMenuItem>
							{canArchive ? (
								<>
									<DropdownMenuSeparator className="bg-white/10" />
									<DropdownMenuItem
										onSelect={() => setIsArchiveDialogOpen(true)}
										className="flex items-center rounded-lg py-2 text-white focus:bg-white/10 focus:text-white"
									>
										<RiArchiveLine className="text-white" />
										<span>Archive</span>
									</DropdownMenuItem>
								</>
							) : null}
						</DropdownMenuContent>
					</DropdownMenu>
				}
			>
				<DetailItem label="Encounter type" value={encounter.encounterType} />
				<DetailItem label="Department" value={encounter.department} />
				<DetailItem label="Physician" value={encounter.physician} />
				<DetailItem label="Encounter date" value={encounterDayLabel} />
				<div className="flex flex-col items-start gap-2">
					<span className="text-sm text-gray-400">Encounter ID</span>
					<CopyIdButton id={encounter.encounterId} />
				</div>
				<div className="flex flex-col items-start gap-2">
					<span className="text-sm text-gray-400">Patient ID</span>
					<CopyIdButton id={encounter.patientId} />
				</div>
				<DetailItem label="Reason for encounter" value={encounter.reason} />
				<DetailItem label="Created by" value={encounter.createdBy} />
				<DetailItem label="Created at" value={encounter.createdAtLabel} />
			</DetailsSection>
			<Drawer
				direction="right"
				open={isEditEncounterDrawerOpen}
				onOpenChange={setIsEditEncounterDrawerOpen}
			>
				<DrawerContent className="overflow-hidden rounded-3xl text-sm data-[vaul-drawer-direction=right]:top-4 data-[vaul-drawer-direction=right]:right-4 data-[vaul-drawer-direction=right]:bottom-4 data-[vaul-drawer-direction=right]:h-auto data-[vaul-drawer-direction=right]:w-[37.5rem]">
					<DrawerHeader className="flex-row items-center justify-between border-b border-gray-200 text-left">
						<DrawerTitle className="leading-[1.2] text-gray-800">Edit encounter</DrawerTitle>
						<DrawerClose asChild>
							<Button variant="ghost" size="icon" aria-label="Close edit encounter drawer">
								<RiCloseLine aria-hidden="true" />
							</Button>
						</DrawerClose>
						<DrawerDescription className="sr-only">
							Change the details recorded for this encounter.
						</DrawerDescription>
					</DrawerHeader>
					<form
						id={formId}
						onSubmit={handleSave}
						className="grid min-h-0 flex-1 content-start gap-x-4 gap-y-6 overflow-y-auto px-4 py-5 text-sm sm:grid-cols-2"
					>
						<input type="hidden" name="updatedAt" value={openedUpdatedAt} />
						{formError && (
							<div
								key={formError}
								ref={(banner) => banner?.scrollIntoView({ behavior: "smooth", block: "center" })}
								role="alert"
								className="flex items-start gap-2 rounded-xl bg-red-50 px-3 py-3 text-left text-sm font-medium text-red-700 sm:col-span-2"
							>
								<RiErrorWarningFill className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
								<p className="min-w-0 flex-1 text-pretty">{formError}</p>
								<Button
									type="button"
									variant="ghost"
									size="icon"
									className="ml-auto -my-1 size-6 rounded-full text-red-700 hover:bg-red-100 hover:text-red-700"
									aria-label="Dismiss error"
									onClick={() => setFormError("")}
								>
									<RiCloseLine aria-hidden="true" />
								</Button>
							</div>
						)}
						<div className="flex flex-col gap-2">
							<Label htmlFor={`${formId}-type`} className={fieldLabelClassName}>
								Encounter type <span className={optionalLabelClassName}>(required)</span>
							</Label>
							<Select name="encounterType" defaultValue={encounter.encounterType} required>
								<SelectTrigger id={`${formId}-type`} className="w-full">
									<SelectValue placeholder="Select encounter type" />
								</SelectTrigger>
								<SelectContent>
									<SelectGroup>
										{encounterTypes.map((encounterType) => (
											<SelectItem key={encounterType} value={encounterType}>
												{encounterType}
											</SelectItem>
										))}
									</SelectGroup>
								</SelectContent>
							</Select>
						</div>
						<div className="flex flex-col gap-2">
							<Label htmlFor={`${formId}-department`} className={fieldLabelClassName}>
								Department <span className={optionalLabelClassName}>(required)</span>
							</Label>
							<Select name="department" defaultValue={encounter.department} required>
								<SelectTrigger id={`${formId}-department`} className="w-full">
									<SelectValue placeholder="Select department" />
								</SelectTrigger>
								<SelectContent>
									<SelectGroup>
										{encounterDepartments.map((department) => (
											<SelectItem key={department} value={department}>
												{department}
											</SelectItem>
										))}
									</SelectGroup>
								</SelectContent>
							</Select>
						</div>
						<div className="flex flex-col gap-2">
							<Label htmlFor={`${formId}-physician`} className={fieldLabelClassName}>
								Physician <span className={optionalLabelClassName}>(required)</span>
							</Label>
							<Input
								id={`${formId}-physician`}
								name="physician"
								defaultValue={encounter.physician}
								className={fieldControlClassName}
								placeholder="Dr. Chinenye Okafor"
								required
							/>
						</div>
						<div className="flex flex-col gap-2">
							<Label htmlFor={`${formId}-date`} className={fieldLabelClassName}>
								Encounter date <span className={optionalLabelClassName}>(required)</span>
							</Label>
							<Popover>
								<PopoverTrigger asChild>
									<Button
										id={`${formId}-date`}
										type="button"
										variant="outline"
										className={`${fieldControlClassName} flex w-full justify-between font-normal hover:bg-white active:scale-100`}
									>
										{format(selectedEncounterDate, "PPP")}
										<RiCalendarLine className="size-4 text-gray-600" aria-hidden="true" />
									</Button>
								</PopoverTrigger>
								<PopoverContent align="end" className="p-0">
									<Calendar
										mode="single"
										required
										selected={selectedEncounterDate}
										onSelect={setSelectedEncounterDate}
										defaultMonth={selectedEncounterDate}
										disabled={{ after: new Date() }}
										autoFocus
									/>
								</PopoverContent>
							</Popover>
						</div>
						<div className="flex flex-col gap-2 sm:col-span-2">
							<Label htmlFor={`${formId}-reason`} className={fieldLabelClassName}>
								Reason for encounter <span className={optionalLabelClassName}>(optional)</span>
							</Label>
							<Textarea
								id={`${formId}-reason`}
								name="reason"
								defaultValue={encounter.reason ?? ""}
								className="min-h-28 bg-white text-sm text-gray-700 placeholder:text-gray-400"
								placeholder="Chest pain for 2 days"
							/>
						</div>
					</form>
					<DrawerFooter className="flex-col gap-2 border-t border-gray-200 text-sm lg:flex-row lg:justify-end">
						<DrawerClose asChild>
							<Button type="button" variant="outline">
								Cancel
							</Button>
						</DrawerClose>
						<Button type="submit" form={formId} disabled={isPending}>
							{isPending ? "Saving…" : "Save changes"}
						</Button>
					</DrawerFooter>
				</DrawerContent>
			</Drawer>
			<AlertDialog open={isArchiveDialogOpen} onOpenChange={setIsArchiveDialogOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Archive encounter</AlertDialogTitle>
						<Button
							type="button"
							variant="ghost"
							size="icon"
							aria-label="Close archive encounter dialog"
							onClick={() => setIsArchiveDialogOpen(false)}
						>
							<RiCloseLine aria-hidden="true" />
						</Button>
					</AlertDialogHeader>
					<AlertDialogDescription>
						This encounter will be removed from the patient’s encounter list. Its vitals, records and
						details are retained and can be restored at any time.
					</AlertDialogDescription>
					<AlertDialogFooter className="sm:justify-end">
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<Button type="button" onClick={() => setIsArchiveDialogOpen(false)}>
							Archive encounter
						</Button>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
