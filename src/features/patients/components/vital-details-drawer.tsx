"use client";

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
import { Textarea } from "@/components/ui/textarea";
import type { VitalType } from "@/features/patients/types";
import { authClient } from "@/lib/better-auth/auth.client";
import { cn } from "@/lib/utils/cn";
import {
	RiArchiveLine,
	RiCloseLine,
	RiEdit2Line,
	RiMore2Fill,
	RiShare2Line,
} from "@remixicon/react";
import { format } from "date-fns";
import { useState } from "react";

const EMPTY_VALUE = "-";
const vitalDetailsFormId = "vital-details-form";
const vitalDetailsFieldLabelClassName =
	"inline-flex items-baseline gap-0.5 text-sm font-medium text-gray-700";
const vitalDetailsOptionalLabelClassName = "font-normal text-gray-400";
const vitalDetailsFieldControlClassName =
	"h-9 border-gray-200 bg-white text-sm text-gray-700 placeholder:text-gray-400";

export function VitalDetailsDrawer({
	open,
	onOpenChange,
	vital,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	vital: VitalType | null;
}) {
	const { data: activeMemberRole } = authClient.useActiveMemberRole();
	const canArchive = activeMemberRole?.role === "owner" || activeMemberRole?.role === "admin";
	const [vitalDetailsMode, setVitalDetailsMode] = useState<"view" | "edit">("view");
	const [isArchiveDialogOpen, setIsArchiveDialogOpen] = useState(false);
	const isEditingVitalDetails = vitalDetailsMode === "edit" && Boolean(vital);

	function handleVitalDetailsOpenChange(nextOpen: boolean) {
		if (!nextOpen) {
			setVitalDetailsMode("view");
		}

		onOpenChange(nextOpen);
	}

	return (
		<Drawer open={open} onOpenChange={handleVitalDetailsOpenChange} direction="right">
			<DrawerContent className="overflow-hidden rounded-3xl text-sm data-[vaul-drawer-direction=right]:top-4 data-[vaul-drawer-direction=right]:right-4 data-[vaul-drawer-direction=right]:bottom-4 data-[vaul-drawer-direction=right]:h-auto data-[vaul-drawer-direction=right]:w-[37.5rem]">
				<DrawerHeader className="flex-row items-center justify-between border-b border-gray-200 text-left">
					<DrawerTitle className="flex-1 leading-[1.2] text-gray-800">
						{isEditingVitalDetails ? "Edit vitals details" : "Vitals details"}
					</DrawerTitle>
					{vital && !isEditingVitalDetails ? (
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="ghost" size="icon" aria-label="Vitals actions">
									<RiMore2Fill aria-hidden="true" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent
								align="end"
								className="w-50 rounded-xl bg-white text-sm text-gray-700"
							>
								<DropdownMenuItem
									className="rounded-lg"
									onSelect={() => setVitalDetailsMode("edit")}
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
						<Button variant="ghost" size="icon" aria-label="Close vitals details">
							<RiCloseLine aria-hidden="true" />
						</Button>
					</DrawerClose>
					<DrawerDescription className="sr-only">
						{isEditingVitalDetails
							? "Edit the selected vital readings."
							: "Showing the selected vital readings."}
					</DrawerDescription>
				</DrawerHeader>

				<div className="min-h-0 overflow-y-auto px-4 py-5 text-sm">
					{isEditingVitalDetails && vital ? (
						<VitalDetailsEditForm vital={vital} />
					) : vital ? (
						<VitalDetailsOverview vital={vital} />
					) : (
						<div className="rounded-2xl border border-gray-200 p-5 text-gray-500">
							Vital details could not be found.
						</div>
					)}
				</div>

				{isEditingVitalDetails ? (
					<DrawerFooter className="border-t border-gray-200 text-sm">
						<div className="flex flex-col gap-2 lg:flex-row lg:self-end">
							<Button type="button" variant="outline" onClick={() => setVitalDetailsMode("view")}>
								Cancel
							</Button>
							<Button
								type="button"
								form={vitalDetailsFormId}
								onClick={() => setVitalDetailsMode("view")}
							>
								Save changes
							</Button>
						</div>
					</DrawerFooter>
				) : null}
			</DrawerContent>
			<AlertDialog open={isArchiveDialogOpen} onOpenChange={setIsArchiveDialogOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Archive vitals</AlertDialogTitle>
						<Button
							type="button"
							variant="ghost"
							size="icon"
							aria-label="Close archive vitals dialog"
							onClick={() => setIsArchiveDialogOpen(false)}
						>
							<RiCloseLine aria-hidden="true" />
						</Button>
					</AlertDialogHeader>
					<AlertDialogDescription>
						These readings will be removed from the patient’s vitals chart and table. They are
						retained and can be restored at any time.
					</AlertDialogDescription>
					<AlertDialogFooter className="sm:justify-end">
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<Button type="button" onClick={() => setIsArchiveDialogOpen(false)}>
							Archive vitals
						</Button>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</Drawer>
	);
}

function VitalDetailsOverview({ vital }: { vital: VitalType }) {
	return (
		<div className="flex flex-col gap-8">
			<div className="flex flex-col gap-4">
				<div className="flex flex-wrap items-center gap-x-8 gap-y-3 text-nowrap">
					<div className="flex items-center gap-2">
						<span className="text-gray-400">Vital ID:</span>
						<CopyIdButton id={vital.vitalId} />
					</div>
					{vital.encounterId ? (
						<div className="flex items-center gap-2">
							<span className="text-gray-400">Encounter ID:</span>
							<CopyIdButton id={vital.encounterId} />
						</div>
					) : null}
				</div>
				<p className="flex flex-wrap items-center gap-2 font-medium">
					<span className="text-gray-600">Created by {vital.createdBy}</span>
					<span aria-hidden="true" className="size-1 rounded-full bg-gray-300" />
					<span className="text-gray-400">
						{format(vital.createdAt, "d MMMM yyyy 'at' h:mm a")}
					</span>
				</p>
			</div>

			<div className="flex flex-col gap-6">
				<h2 className="text-base font-semibold text-gray-800">{vital.encounterType ?? "Vitals"}</h2>

				<div className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
					{getVitalDetailItems(vital).map((item) => (
						<VitalDetailItem key={item.label} label={item.label} value={item.value} />
					))}
					<VitalDetailItem
						label="Clinical note"
						value={vital.notes || EMPTY_VALUE}
						className="sm:col-span-2"
					/>
				</div>
			</div>
		</div>
	);
}

function VitalDetailsEditForm({ vital }: { vital: VitalType }) {
	return (
		<form id={vitalDetailsFormId} className="flex flex-col gap-8">
			<div className="flex flex-wrap items-center gap-x-8 gap-y-3 text-nowrap">
				<div className="flex items-center gap-2">
					<span className="text-gray-400">Vital ID:</span>
					<CopyIdButton id={vital.vitalId} />
				</div>
				{vital.encounterId ? (
					<div className="flex items-center gap-2">
						<span className="text-gray-400">Encounter ID:</span>
						<CopyIdButton id={vital.encounterId} />
					</div>
				) : null}
			</div>

			<div className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
				<VitalDetailsNumberField label="Systolic" name="systolic" defaultValue={vital.systolic} />
				<VitalDetailsNumberField
					label="Diastolic"
					name="diastolic"
					defaultValue={vital.diastolic}
				/>
				<VitalDetailsNumberField
					label="Heart rate"
					name="heartRate"
					defaultValue={vital.heartRate}
				/>
				<VitalDetailsNumberField
					label="Respiratory rate"
					name="respiratoryRate"
					defaultValue={vital.respiratoryRate}
				/>
				<VitalDetailsNumberField
					label="Temperature"
					name="temperature"
					defaultValue={vital.temperature}
					step="0.1"
				/>
				<VitalDetailsNumberField
					label="Oxygen saturation"
					name="oxygenSaturation"
					defaultValue={vital.oxygenSaturation}
					step="0.1"
				/>
				<VitalDetailsNumberField
					label="Weight"
					name="weight"
					defaultValue={vital.weight}
					step="0.1"
				/>
				<VitalDetailsNumberField label="BMI" name="bmi" defaultValue={vital.bmi} step="0.1" />
				<div className="flex flex-col gap-2 sm:col-span-2">
					<Label htmlFor="edit-vital-notes" className={vitalDetailsFieldLabelClassName}>
						Note<span className={vitalDetailsOptionalLabelClassName}>(optional)</span>
					</Label>
					<Textarea
						id="edit-vital-notes"
						name="notes"
						defaultValue={vital.notes}
						className="min-h-28 bg-white text-sm text-gray-700 placeholder:text-gray-400"
					/>
				</div>
			</div>
		</form>
	);
}

function VitalDetailsNumberField({
	label,
	name,
	defaultValue,
	step = "1",
}: {
	label: string;
	name: string;
	defaultValue: number;
	step?: string;
}) {
	const id = `edit-vital-${name}`;

	return (
		<div className="flex flex-col gap-2">
			<Label htmlFor={id} className={vitalDetailsFieldLabelClassName}>
				{label}
				<span className={vitalDetailsOptionalLabelClassName}>(required)</span>
			</Label>
			<Input
				id={id}
				name={name}
				type="number"
				defaultValue={defaultValue}
				step={step}
				className={vitalDetailsFieldControlClassName}
			/>
		</div>
	);
}

function VitalDetailItem({
	label,
	value,
	className,
}: {
	label: string;
	value: string;
	className?: string;
}) {
	return (
		<div className={cn("flex flex-col gap-2 no-line-height", className)}>
			<span className="text-gray-400">{label}</span>
			<span className="font-medium text-gray-600">{value || EMPTY_VALUE}</span>
		</div>
	);
}

function getVitalDetailItems(vital: VitalType) {
	return [
		{ label: "Blood pressure", value: `${vital.systolic}/${vital.diastolic} mmHg` },
		{ label: "Heart rate", value: `${vital.heartRate} bpm` },
		{ label: "Respiratory rate", value: `${vital.respiratoryRate} breaths/min` },
		{ label: "Temperature", value: `${vital.temperature} °C` },
		{ label: "Oxygen saturation", value: `${vital.oxygenSaturation}%` },
		{ label: "Weight", value: `${vital.weight} kg` },
		{ label: "Body mass index", value: vital.bmi.toFixed(1) },
		{ label: "Encounter date", value: format(vital.recordedAt, "d MMMM yyyy") },
	];
}
