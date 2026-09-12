"use client";

import { useId, useState, useTransition } from "react";
import { RiCloseLine } from "@remixicon/react";
import { Button } from "@/components/ui/button";
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
import {
	Drawer,
	DrawerClose,
	DrawerContent,
	DrawerDescription,
	DrawerFooter,
	DrawerHeader,
	DrawerTitle,
} from "@/components/ui/drawer";
import { createPatientVitalAction } from "@/features/patients/server/create-patient-vital-action";
import type { VitalEncounterOption, VitalType } from "@/features/patients/types";

const fieldLabelClassName = "inline-flex items-baseline gap-0.5 text-sm font-medium text-gray-700";
const optionalLabelClassName = "font-normal text-gray-400";
const fieldControlClassName =
	"h-9 border-gray-200 bg-white text-sm text-gray-700 placeholder:text-gray-400";

const numericVitalFields = [
	["heartRate", "Heart rate (bpm)", "72"],
	["respiratoryRate", "Respiratory rate (breaths/min)", "16"],
	["temperature", "Temperature (°C)", "37.0"],
	["oxygenSaturation", "Oxygen saturation (%)", "98"],
	["weight", "Weight (kg)", "70"],
	["bmi", "BMI (kg/m²)", "22.9"],
] as const;

export function CreateVitalsDrawer({
	open,
	onOpenChange,
	patientId,
	encounterOptions,
	onCreated,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	patientId: string;
	encounterOptions: VitalEncounterOption[];
	onCreated: (vital: VitalType) => void;
}) {
	const formId = useId();
	const [formError, setFormError] = useState("");
	const [isPending, startTransition] = useTransition();
	const hasEncounterOptions = encounterOptions.length > 0;

	function handleCreate(formData: FormData) {
		setFormError("");
		startTransition(async () => {
			const result = await createPatientVitalAction(patientId, formData);

			if (!result.ok) {
				setFormError(result.message);
				return;
			}

			onOpenChange(false);
			onCreated(result.vital);
		});
	}

	return (
		<Drawer direction="right" open={open} onOpenChange={onOpenChange}>
			<DrawerContent className="overflow-hidden rounded-3xl text-sm data-[vaul-drawer-direction=right]:top-4 data-[vaul-drawer-direction=right]:right-4 data-[vaul-drawer-direction=right]:bottom-4 data-[vaul-drawer-direction=right]:h-auto data-[vaul-drawer-direction=right]:w-[50rem]">
				<DrawerHeader className="flex-row items-center justify-between border-b border-gray-200 text-left">
					<DrawerTitle className="leading-[1.2] text-gray-800">Add vitals</DrawerTitle>
					<DrawerClose aria-label="Close add vitals drawer">
						<RiCloseLine className="size-6" aria-hidden="true" />
					</DrawerClose>
					<DrawerDescription className="sr-only">
						Record a set of patient measurements.
					</DrawerDescription>
				</DrawerHeader>
				<form
					id={formId}
					action={handleCreate}
					className="grid min-h-0 flex-1 content-start gap-6 overflow-y-auto px-6 py-8 text-sm sm:grid-cols-2"
				>
					<div className="flex flex-col gap-2 sm:col-span-2">
						<Label htmlFor={`${formId}-encounter`} className={fieldLabelClassName}>
							Encounter <span className={optionalLabelClassName}>(required)</span>
						</Label>
						<Select name="encounterId" required>
							<SelectTrigger
								id={`${formId}-encounter`}
								className="w-full data-[placeholder]:text-gray-400"
								disabled={!hasEncounterOptions}
							>
								<SelectValue placeholder="Select encounter" />
							</SelectTrigger>
							<SelectContent>
								<SelectGroup>
									{encounterOptions.map((encounter) => (
										<SelectItem key={encounter.encounterId} value={encounter.encounterId}>
											{encounter.encounterType} on {encounter.encounterDateLabel}
										</SelectItem>
									))}
								</SelectGroup>
							</SelectContent>
						</Select>
						{hasEncounterOptions ? null : (
							<p className="text-gray-500">Create an encounter before recording vitals.</p>
						)}
					</div>
					<div className="flex flex-col gap-2">
						<Label htmlFor={`${formId}-bp`} className={fieldLabelClassName}>
							Blood pressure (mmHg) <span className={optionalLabelClassName}>(required)</span>
						</Label>
						<Input
							id={`${formId}-bp`}
							name="bloodPressure"
							className={fieldControlClassName}
							placeholder="e.g. 120/80"
							pattern="[0-9]{2,3}/[0-9]{2,3}"
							title="Enter systolic/diastolic, for example 120/80"
							required
						/>
					</div>
					<div className="flex flex-col gap-2">
						<Label htmlFor={`${formId}-recordedAt`} className={fieldLabelClassName}>
							Encounter date <span className={optionalLabelClassName}>(optional)</span>
						</Label>
						<Input
							id={`${formId}-recordedAt`}
							name="recordedAt"
							type="datetime-local"
							className={fieldControlClassName}
						/>
					</div>
					{numericVitalFields.map(([name, label, placeholder]) => (
						<div key={name} className="flex flex-col gap-2">
							<Label htmlFor={`${formId}-${name}`} className={fieldLabelClassName}>
								{label} <span className={optionalLabelClassName}>(required)</span>
							</Label>
							<Input
								id={`${formId}-${name}`}
								name={name}
								className={fieldControlClassName}
								type="number"
								step="any"
								min="0.1"
								max={name === "oxygenSaturation" ? 100 : undefined}
								placeholder={`e.g. ${placeholder}`}
								required
							/>
						</div>
					))}
					<div className="flex flex-col gap-2 sm:col-span-2">
						<Label htmlFor={`${formId}-notes`} className={fieldLabelClassName}>
							Clinical notes <span className={optionalLabelClassName}>(optional)</span>
						</Label>
						<Textarea
							id={`${formId}-notes`}
							name="notes"
							className="min-h-28 bg-white text-sm text-gray-700 placeholder:text-gray-400"
							placeholder="Add observations or context about these measurements"
						/>
					</div>
					{formError ? <p className="text-red-600 sm:col-span-2">{formError}</p> : null}
				</form>
				<DrawerFooter className="flex-col gap-2 border-t border-gray-200 text-sm lg:flex-row lg:justify-end">
					<DrawerClose asChild>
						<Button type="button" variant="outline">
							Cancel
						</Button>
					</DrawerClose>
					<Button type="submit" form={formId} disabled={isPending || !hasEncounterOptions}>
						Add vitals
					</Button>
				</DrawerFooter>
			</DrawerContent>
		</Drawer>
	);
}
