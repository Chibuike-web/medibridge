"use client";

import { CopyIdButton } from "@/components/copy-id-button";
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
import { Textarea } from "@/components/ui/textarea";
import type { VitalType } from "@/features/patients/types";
import { authClient } from "@/lib/better-auth/auth.client";
import { cn } from "@/lib/utils/cn";
import { RiArrowDownSLine, RiCloseLine, RiEditLine } from "@remixicon/react";
import { format } from "date-fns";
import { useId, useState } from "react";

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
	const isEditingVitalDetails = vitalDetailsMode === "edit" && Boolean(vital);

	function handleVitalDetailsOpenChange(nextOpen: boolean) {
		if (!nextOpen) {
			setVitalDetailsMode("view");
		}

		onOpenChange(nextOpen);
	}

	return (
		<Drawer open={open} onOpenChange={handleVitalDetailsOpenChange} direction="right">
			<DrawerContent className="overflow-hidden rounded-3xl text-sm data-[vaul-drawer-direction=right]:top-4 data-[vaul-drawer-direction=right]:right-4 data-[vaul-drawer-direction=right]:bottom-4 data-[vaul-drawer-direction=right]:h-auto data-[vaul-drawer-direction=right]:w-[50rem]">
				<DrawerHeader className="flex-row items-center justify-between border-b border-gray-200 px-6 py-5 text-left">
					<DrawerTitle className="text-base leading-[1.2] text-gray-800">
						{isEditingVitalDetails ? "Edit vitals details" : "View vitals details"}
					</DrawerTitle>
					<DrawerClose aria-label="Close vitals details">
						<RiCloseLine className="size-5" aria-hidden="true" />
					</DrawerClose>
					<DrawerDescription className="sr-only">
						{isEditingVitalDetails
							? "Edit the selected vital readings."
							: "Showing the selected vital readings."}
					</DrawerDescription>
				</DrawerHeader>

				<div className="min-h-0 overflow-y-auto px-6 py-8 text-sm">
					{isEditingVitalDetails && vital ? (
						<VitalDetailsEditForm vital={vital} />
					) : vital ? (
						<div className="flex flex-col gap-10">
							<VitalDetailsOverview
								vital={vital}
								onEditVitalDetails={() => setVitalDetailsMode("edit")}
							/>
							<VitalHistorySection vital={vital} />
						</div>
					) : (
						<div className="rounded-2xl border border-gray-200 p-5 text-gray-500">
							Vital details could not be found.
						</div>
					)}
				</div>

				<DrawerFooter className="border-t border-gray-200 p-5 text-sm">
					{isEditingVitalDetails ? (
						<div className="flex flex-col gap-2 lg:flex-row lg:self-end">
							<Button type="button" variant="outline" onClick={() => setVitalDetailsMode("view")}>
								Cancel
							</Button>
							<Button
								type="button"
								form={vitalDetailsFormId}
								className="bg-gray-800"
								onClick={() => setVitalDetailsMode("view")}
							>
								Save changes
							</Button>
						</div>
					) : (
						<div className="flex flex-col gap-2 lg:flex-row lg:self-end">
							<DrawerClose asChild>
								<Button type="button" variant="outline">
									Cancel
								</Button>
							</DrawerClose>
							{vital && canArchive ? <Button className="bg-gray-800">Archive vitals</Button> : null}
						</div>
					)}
				</DrawerFooter>
			</DrawerContent>
		</Drawer>
	);
}

function VitalDetailsOverview({
	vital,
	onEditVitalDetails,
}: {
	vital: VitalType;
	onEditVitalDetails: () => void;
}) {
	return (
		<section className="flex flex-col gap-10" aria-labelledby="vital-details-heading">
			<div className="flex flex-wrap items-center gap-x-8 gap-y-3 text-nowrap">
				<div className="flex items-center gap-2">
					<span className="text-gray-400">Vital ID:</span>
					<CopyIdButton id={vital.vitalId} className="text-sm" />
				</div>
				<div className="flex items-center gap-2">
					<span className="text-gray-400">Encounter ID:</span>
					<CopyIdButton id={vital.encounterId} className="text-sm" />
				</div>
			</div>

			<div className="flex flex-col gap-6">
				<div className="flex flex-wrap items-center justify-between gap-4">
					<h2 id="vital-details-heading" className="text-lg font-semibold text-gray-800">
						{vital.encounterType}
					</h2>
					<button
						type="button"
						onClick={onEditVitalDetails}
						className="inline-flex items-center gap-2 text-sm font-medium text-gray-400 transition hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-300"
					>
						<RiEditLine className="size-4" aria-hidden="true" />
						Edit
					</button>
				</div>

				<div className="grid grid-cols-1 gap-x-16 gap-y-6 sm:grid-cols-2">
					{getVitalDetailItems(vital).map((item) => (
						<VitalDetailItem key={item.label} label={item.label} value={item.value} />
					))}
					<VitalDetailItem
						label="Note"
						value={vital.notes || EMPTY_VALUE}
						className="sm:col-span-2"
					/>
				</div>
			</div>
		</section>
	);
}

function VitalDetailsEditForm({ vital }: { vital: VitalType }) {
	return (
		<form id={vitalDetailsFormId} className="flex flex-col gap-8">
			<div className="flex flex-wrap items-center gap-x-8 gap-y-3 text-nowrap">
				<div className="flex items-center gap-2">
					<span className="text-gray-400">Vital ID:</span>
					<CopyIdButton id={vital.vitalId} className="text-sm" />
				</div>
				<div className="flex items-center gap-2">
					<span className="text-gray-400">Encounter ID:</span>
					<CopyIdButton id={vital.encounterId} className="text-sm" />
				</div>
			</div>

			<div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2">
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

function VitalHistorySection({ vital }: { vital: VitalType }) {
	return (
		<section className="flex flex-col gap-[14px]">
			<h2 className="text-base font-semibold text-gray-800">History</h2>
			<VitalHistoryCard vital={vital} />
		</section>
	);
}

function VitalHistoryCard({ vital }: { vital: VitalType }) {
	const [isVitalHistoryExpanded, setIsVitalHistoryExpanded] = useState(true);
	const sectionId = useId();
	const titleId = `${sectionId}-title`;
	const panelId = `${sectionId}-panel`;

	return (
		<section className="flex flex-col rounded-2xl border border-gray-200 p-5">
			<button
				type="button"
				onClick={() => setIsVitalHistoryExpanded((prev) => !prev)}
				aria-expanded={isVitalHistoryExpanded}
				aria-controls={panelId}
				className="flex w-full items-center justify-between gap-4 text-left"
			>
				<p>
					<span id={titleId} className="font-semibold text-gray-800">
						Created
					</span>{" "}
					<span className="text-sm text-gray-400">
						on {format(vital.createdAt, "d MMMM yyyy 'at' h:mm a")}
					</span>
				</p>
				<RiArrowDownSLine
					className={cn(
						"size-5 shrink-0 transition-transform duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none",
						isVitalHistoryExpanded ? "rotate-180" : "",
					)}
					aria-hidden="true"
				/>
			</button>
			<div
				id={panelId}
				className={cn(
					"grid overflow-hidden transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none",
					isVitalHistoryExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
				)}
				aria-hidden={!isVitalHistoryExpanded}
				inert={!isVitalHistoryExpanded}
			>
				<div className="min-h-0 overflow-hidden">
					<div
						role="region"
						aria-labelledby={titleId}
						className="mt-6 grid grid-cols-1 gap-x-16 gap-y-5 sm:grid-cols-2"
					>
						{getVitalDetailItems(vital).map((item) => (
							<VitalDetailItem key={item.label} label={item.label} value={item.value} />
						))}
						<VitalDetailItem
							label="Note"
							value={vital.notes || EMPTY_VALUE}
							className="sm:col-span-2"
						/>
					</div>
				</div>
			</div>
		</section>
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
			<span className="font-semibold text-gray-600">{value || EMPTY_VALUE}</span>
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
		{ label: "Created by", value: vital.createdBy },
		{ label: "Created at", value: format(vital.createdAt, "d MMMM yyyy") },
	];
}
