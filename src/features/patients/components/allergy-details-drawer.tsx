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
import { authClient } from "@/lib/better-auth/auth.client";
import {
	RiAddLine,
	RiArchiveLine,
	RiArrowDownSLine,
	RiArrowRightLine,
	RiCloseLine,
	RiEdit2Line,
	RiErrorWarningFill,
	RiMore2Fill,
	RiShare2Line,
} from "@remixicon/react";
import { Fragment, useId, useRef, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { updatePatientAllergyAction } from "@/features/patients/server/update-patient-allergy-action";
import { allergySeverities, allergyStatuses } from "@/features/patients/server/schemas";

type AllergyDetailsDrawerProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	allergy: AllergyDetailsType | null;
	isLoading: boolean;
	onAllergyUpdated: () => void;
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
	onAllergyUpdated,
}: AllergyDetailsDrawerProps) {
	const router = useRouter();
	const { data: activeMemberRole } = authClient.useActiveMemberRole();
	const canArchive = activeMemberRole?.role === "owner" || activeMemberRole?.role === "admin";
	const [allergyDetailsMode, setAllergyDetailsMode] = useState<"view" | "edit">("view");
	const [formError, setFormError] = useState("");
	const [isPending, startTransition] = useTransition();
	const [isArchiveDialogOpen, setIsArchiveDialogOpen] = useState(false);

	function handleAllergyDetailsModeChange(nextMode: "view" | "edit") {
		setFormError("");
		setAllergyDetailsMode(nextMode);
	}

	function handleAllergyDetailsOpenChange(nextOpen: boolean) {
		if (!nextOpen) {
			handleAllergyDetailsModeChange("view");
		}

		onOpenChange(nextOpen);
	}

	function handleSave(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();

		if (!allergy) return;

		setFormError("");
		const formData = new FormData(event.currentTarget);

		startTransition(async () => {
			const result = await updatePatientAllergyAction(allergy.allergyId, formData);

			if (result.status === "unauthorized") {
				router.refresh();
				return;
			}

			if (result.status !== "success") {
				setFormError(result.error);
				return;
			}

			setAllergyDetailsMode("view");
			onAllergyUpdated();
		});
	}

	const isEditingAllergyDetails = allergyDetailsMode === "edit" && Boolean(allergy);

	return (
		<Drawer open={open} onOpenChange={handleAllergyDetailsOpenChange} direction="right">
			<DrawerContent className="overflow-hidden rounded-3xl text-sm data-[vaul-drawer-direction=right]:top-4 data-[vaul-drawer-direction=right]:right-4 data-[vaul-drawer-direction=right]:bottom-4 data-[vaul-drawer-direction=right]:h-auto data-[vaul-drawer-direction=right]:w-[37.5rem]">
				<DrawerHeader className="flex-row items-center justify-between border-b border-gray-200 text-left">
					<DrawerTitle className="flex-1 leading-[1.2] text-gray-800">
						{isEditingAllergyDetails ? "Edit allergies details" : "Allergy details"}
					</DrawerTitle>
					{allergy && !isEditingAllergyDetails ? (
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="ghost" size="icon" aria-label="Allergy actions">
									<RiMore2Fill aria-hidden="true" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent
								align="end"
								className="w-50 rounded-xl bg-white text-sm text-gray-700"
							>
								<DropdownMenuItem
									className="rounded-lg"
									onSelect={() => handleAllergyDetailsModeChange("edit")}
								>
									<RiEdit2Line aria-hidden="true" />
									Edit
								</DropdownMenuItem>
								<DropdownMenuItem className="rounded-lg">
									<RiShare2Line aria-hidden="true" />
									Export
								</DropdownMenuItem>
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
						<Button variant="ghost" size="icon" aria-label="Close allergy details">
							<RiCloseLine aria-hidden="true" />
						</Button>
					</DrawerClose>
					<DrawerDescription className="sr-only">
						{isEditingAllergyDetails
							? "Edit the selected allergy details."
							: "Showing details for the allergy you selected."}
					</DrawerDescription>
				</DrawerHeader>

				<div className="min-h-0 overflow-y-auto px-4 py-5 text-sm">
					{isLoading ? (
						<AllergyDetailsFallback />
					) : isEditingAllergyDetails && allergy ? (
						<AllergyDetailsEditForm
							key={allergy.allergyId}
							allergy={allergy}
							formError={formError}
							onFormErrorDismiss={() => setFormError("")}
							onSubmit={handleSave}
						/>
					) : allergy ? (
						<div className="flex flex-col gap-10">
							<AllergyDetailsOverview allergy={allergy} />
							<AllergyHistorySection history={allergy.history} />
						</div>
					) : (
						<div className="rounded-2xl border border-gray-200 p-5 text-gray-500">
							Allergy details could not be found.
						</div>
					)}
				</div>

				{isEditingAllergyDetails ? (
					<DrawerFooter className="border-t border-gray-200 text-sm">
						<div className="flex flex-col gap-2 lg:flex-row lg:self-end">
							<Button
								type="button"
								variant="outline"
								onClick={() => handleAllergyDetailsModeChange("view")}
							>
								Cancel
							</Button>
							<Button type="submit" form={allergyDetailsFormId} disabled={isPending}>
								{isPending ? <PixelLoader label="Saving…" /> : "Save changes"}
							</Button>
						</div>
					</DrawerFooter>
				) : null}
			</DrawerContent>
			<AlertDialog open={isArchiveDialogOpen} onOpenChange={setIsArchiveDialogOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Archive allergy</AlertDialogTitle>
						<Button
							type="button"
							variant="ghost"
							size="icon"
							aria-label="Close archive allergy dialog"
							onClick={() => setIsArchiveDialogOpen(false)}
						>
							<RiCloseLine aria-hidden="true" />
						</Button>
					</AlertDialogHeader>
					<AlertDialogDescription>
						This allergy will be removed from the patient’s active problem list. The record, its
						related medications, labs, imaging and full activity history are retained and can be
						restored at any time.
					</AlertDialogDescription>
					<AlertDialogFooter className="sm:justify-end">
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<Button type="button" onClick={() => setIsArchiveDialogOpen(false)}>
							Archive allergy
						</Button>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</Drawer>
	);
}

function AllergyDetailsOverview({ allergy }: { allergy: AllergyDetailsType }) {
	return (
		<div className="flex flex-col gap-8">
			<div className="flex flex-col gap-4">
				<div className="flex flex-wrap items-center gap-x-8 gap-y-3 text-nowrap">
					<div className="flex items-center gap-2">
						<span className="text-gray-400">Allergy ID:</span>
						<CopyIdButton id={allergy.allergyId} />
					</div>
					{allergy.encounterId ? (
						<div className="flex items-center gap-2">
							<span className="text-gray-400">Encounter ID:</span>
							<CopyIdButton id={allergy.encounterId} />
						</div>
					) : null}
				</div>
				<p className="flex flex-wrap items-center gap-2 font-medium">
					<span className="text-gray-600">Created by {allergy.createdBy}</span>
					<span aria-hidden="true" className="size-1 rounded-full bg-gray-300" />
					<span className="text-gray-400">{allergy.createdAt}</span>
				</p>
			</div>

			<div className="flex flex-col gap-6">
				<div className="flex items-center gap-3">
					<h2 className="text-base font-semibold text-gray-800">{allergy.allergen}</h2>
					<StatusBadge status={allergy.status} />
				</div>

				<div className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
					<AllergyDetailItem label="Severity" value={allergy.severity} />
					<AllergyDetailItem label="Reaction" value={allergy.reaction} />
					<AllergyDetailItem label="Clinical notes" value={allergy.clinicalNote} />
				</div>
			</div>
		</div>
	);
}

function AllergyDetailsEditForm({
	allergy,
	formError,
	onFormErrorDismiss,
	onSubmit,
}: {
	allergy: AllergyDetailsType;
	formError: string;
	onFormErrorDismiss: () => void;
	onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
	const [originalUpdatedAt] = useState(() => allergy.editValues.updatedAt);
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
		<form id={allergyDetailsFormId} onSubmit={onSubmit} className="flex flex-col gap-12">
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
						<span className="text-gray-400">Allergy ID:</span>
						<CopyIdButton id={allergy.allergyId} />
					</div>
					{allergy.encounterId ? (
						<div className="flex items-center gap-2">
							<span className="text-gray-400">Encounter ID:</span>
							<CopyIdButton id={allergy.encounterId} />
						</div>
					) : null}
				</div>

				<div className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
					<div className="flex flex-col gap-2 sm:col-span-2">
						<Label htmlFor="edit-allergy-allergen" className={allergyDetailsFieldLabelClassName}>
							Allergen<span className={allergyDetailsRequiredLabelClassName}>(required)</span>
						</Label>
						<Input
							id="edit-allergy-allergen"
							name="allergen"
							defaultValue={allergy.allergen}
							className={allergyDetailsFieldControlClassName}
							required
						/>
					</div>

					<div className="flex flex-col gap-2">
						<Label htmlFor="edit-allergy-severity" className={allergyDetailsFieldLabelClassName}>
							Severity<span className={allergyDetailsRequiredLabelClassName}>(required)</span>
						</Label>
						<Select name="severity" defaultValue={allergy.severity} required>
							<SelectTrigger
								id="edit-allergy-severity"
								className={`${allergyDetailsFieldControlClassName} w-full`}
							>
								<SelectValue placeholder="Select severity" />
							</SelectTrigger>
							<SelectContent>
								<SelectGroup>
									{allergySeverities.map((severity) => (
										<SelectItem key={severity} value={severity}>
											{severity}
										</SelectItem>
									))}
								</SelectGroup>
							</SelectContent>
						</Select>
					</div>

					<div className="flex flex-col gap-2">
						<Label htmlFor="edit-allergy-status" className={allergyDetailsFieldLabelClassName}>
							Status<span className={allergyDetailsRequiredLabelClassName}>(required)</span>
						</Label>
						<Select name="status" defaultValue={allergy.status} required>
							<SelectTrigger
								id="edit-allergy-status"
								className={`${allergyDetailsFieldControlClassName} w-full`}
							>
								<SelectValue placeholder="Select status" />
							</SelectTrigger>
							<SelectContent>
								<SelectGroup>
									{allergyStatuses.map((status) => (
										<SelectItem key={status} value={status}>
											{status}
										</SelectItem>
									))}
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
							defaultValue={allergy.editValues.reaction}
							required
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
							defaultValue={allergy.editValues.clinicalNote}
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
						className="bg-white text-gray-600"
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
			<span className="font-medium text-gray-600">{value || EMPTY_VALUE}</span>
		</div>
	);
}

function AllergyHistorySection({ history }: { history: AllergyDetailsHistoryEvent[] }) {
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
			</div>{" "}
			{history.map((historyEvent) => (
				<AllergyHistoryCard key={historyEvent.id} historyEvent={historyEvent} />
			))}
		</div>
	);
}

function AllergyHistoryCard({ historyEvent }: { historyEvent: AllergyDetailsHistoryEvent }) {
	const [isAllergyHistoryExpanded, setIsAllergyHistoryExpanded] = useState(false);
	const sectionId = useId();
	const titleId = `${sectionId}-title`;
	const panelId = `${sectionId}-panel`;
	const changeCount =
		historyEvent.items.filter((item) => item.label !== "Clinical note").length || 1;

	return (
		<section className="flex flex-col rounded-xl border border-gray-200 p-4">
			<Button
				type="button"
				onClick={() => setIsAllergyHistoryExpanded((prev) => !prev)}
				aria-expanded={isAllergyHistoryExpanded}
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
						isAllergyHistoryExpanded ? "rotate-180" : "",
					)}
					aria-hidden="true"
				/>
			</Button>
			<div
				id={panelId}
				className={cn(
					"grid overflow-hidden transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none",
					isAllergyHistoryExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
				)}
				aria-hidden={!isAllergyHistoryExpanded}
				inert={!isAllergyHistoryExpanded}
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

function AllergyDetailsFallback() {
	return (
		<div className="flex flex-col gap-8" aria-busy="true" aria-live="polite">
			<div className="flex flex-wrap gap-6">
				<div className="h-6 w-36 animate-pulse rounded-md bg-gray-100" />
				<div className="h-6 w-40 animate-pulse rounded-md bg-gray-100" />
			</div>
			<div className="flex flex-col gap-6">
				<div className="h-7 w-44 animate-pulse rounded-md bg-gray-100" />
				<div className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
					{Array.from({ length: 7 }).map((_, index) => (
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
