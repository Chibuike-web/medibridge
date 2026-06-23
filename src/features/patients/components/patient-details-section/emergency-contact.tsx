"use client";

import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
	DialogClose,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { RiEditLine, RiMore2Fill, RiShare2Line, RiCloseLine } from "@remixicon/react";

import { useOptimistic, useState, useTransition } from "react";
import type { SyntheticEvent } from "react";
import { DetailItem, DetailsSection } from "./detail-fields";
import { updatePatientEmergencyContactAction } from "@/features/patients/server/actions";

type EmergencyContactItem = {
	label: string;
	value: string | number;
};

export function EmergencyContact({
	patientId,
	emergencyContact,
}: {
	patientId: string;
	emergencyContact: EmergencyContactItem[];
}) {
	const emergencyContactFormId = "emergency-contact-form";
	const [isEmergencyContactDialogOpen, setIsEmergencyContactDialogOpen] =
		useState(false);
	const [emergencyContactError, setEmergencyContactError] = useState("");
	const [optimisticEmergencyContact, setOptimisticEmergencyContact] =
		useOptimistic(emergencyContact);
	const [isUpdatingEmergencyContact, startUpdateEmergencyContactTransition] =
		useTransition();

	function handleEmergencyContactSubmit(
		event: SyntheticEvent<HTMLFormElement, SubmitEvent>,
	) {
		event.preventDefault();

		const formData = new FormData(event.currentTarget);
		const validationError = validateEmergencyContactFormData(formData);

		if (validationError) {
			setEmergencyContactError(validationError);
			return;
		}

		const nextEmergencyContact = getNextEmergencyContact(formData);

		setIsEmergencyContactDialogOpen(false);

		startUpdateEmergencyContactTransition(async () => {
			setEmergencyContactError("");
			setOptimisticEmergencyContact(nextEmergencyContact);

			const result = await updatePatientEmergencyContactAction(
				patientId,
				formData,
			);

			if (!result.ok) {
				setEmergencyContactError(result.message);
				setIsEmergencyContactDialogOpen(true);
			}
		});
	}

	const action = (
		<DropdownMenu>
			<DropdownMenuTrigger
				type="button"
				className="inline-flex size-9 items-center justify-center rounded-md border border-transparent text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
				aria-label="Open actions for Emergency Contact"
			>
				<RiMore2Fill className="size-5" aria-hidden />
			</DropdownMenuTrigger>
			<DropdownMenuContent
				align="end"
				className="w-[13.75rem] rounded-xl border-white/20 bg-gray-800 text-sm text-white ring ring-gray-800"
			>
				<DropdownMenuItem
					onSelect={(e) => {
						e.preventDefault();
						setIsEmergencyContactDialogOpen(true);
					}}
					className="flex items-center gap-3 rounded-lg py-2 text-white focus:bg-white/10 focus:text-white"
				>
					<RiEditLine className="text-white" />
					<span>Edit info</span>
				</DropdownMenuItem>
				<DropdownMenuItem className="gap-3 rounded-lg py-2 text-white focus:bg-white/10 focus:text-white">
					<RiShare2Line className="text-white" />
					<span>Export info</span>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);

	return (
		<>
			<DetailsSection title="Emergency Contact" action={action}>
				{optimisticEmergencyContact.map((item) => (
					<DetailItem key={item.label} label={item.label} value={item.value} />
				))}
			</DetailsSection>

			<Dialog
				open={isEmergencyContactDialogOpen}
				onOpenChange={setIsEmergencyContactDialogOpen}
			>
				<DialogContent className="max-w-[50rem]">
					<DialogHeader className="h-16 px-6 border-b border-gray-200">
						<DialogTitle>Edit Emergency Contact</DialogTitle>

						<DialogDescription className="sr-only">
							Form for editing emergency contact details.
						</DialogDescription>

						<DialogClose>
							<RiCloseLine className="size-6" />
						</DialogClose>
					</DialogHeader>

					<form
						id={emergencyContactFormId}
						onSubmit={handleEmergencyContactSubmit}
						className="grid grid-cols-[repeat(auto-fill,minmax(18rem,1fr))] gap-x-4 gap-y-6 px-6 pt-6 text-sm text-gray-800"
					>
						<input type="hidden" name="patientId" value={patientId} />

						{emergencyContactError ? (
							<div className="col-span-full rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
								{emergencyContactError}
							</div>
						) : null}

						<div className="flex flex-col gap-2">
							<Label htmlFor="emergency-first-name">First name</Label>
							<Input
								id="emergency-first-name"
								name="firstName"
								defaultValue={getEmergencyContactValue(
									optimisticEmergencyContact,
									"First name",
								)}
								placeholder="e.g. Ifeoma"
							/>
						</div>

						<div className="flex flex-col gap-2">
							<Label htmlFor="emergency-middle-name">Middle name</Label>
							<Input
								id="emergency-middle-name"
								name="middleName"
								defaultValue={getEmergencyContactValue(
									optimisticEmergencyContact,
									"Middle name",
								)}
								placeholder="e.g. Nneka"
							/>
						</div>

						<div className="flex flex-col gap-2">
							<Label htmlFor="emergency-last-name">Last name</Label>
							<Input
								id="emergency-last-name"
								name="lastName"
								defaultValue={getEmergencyContactValue(
									optimisticEmergencyContact,
									"Last name",
								)}
								placeholder="e.g. Okafor"
							/>
						</div>

						<div className="flex flex-col gap-2">
							<Label htmlFor="emergency-relationship">Relationship</Label>
							<Input
								id="emergency-relationship"
								name="relationship"
								defaultValue={getEmergencyContactValue(
									optimisticEmergencyContact,
									"Relationship",
								)}
								placeholder="e.g. Sister, spouse, guardian"
							/>
						</div>

						<div className="flex flex-col gap-2">
							<Label htmlFor="emergency-phone-number">Phone number</Label>
							<Input
								id="emergency-phone-number"
								name="phoneNumber"
								defaultValue={getEmergencyContactValue(
									optimisticEmergencyContact,
									"Phone",
								)}
								type="tel"
								placeholder="e.g. +234 803 456 7890"
							/>
						</div>
					</form>

					<DialogFooter className="mt-16 border-t border-gray-200 text-sm">
						<div className="flex gap-4 ml-auto">
							<DialogClose asChild>
								<Button variant="outline" className="text-sm">
									Cancel
								</Button>
							</DialogClose>

							<Button
								type="submit"
								form={emergencyContactFormId}
								disabled={isUpdatingEmergencyContact}
								className="text-sm"
							>
								Save changes
							</Button>
						</div>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}

function getNextEmergencyContact(formData: FormData): EmergencyContactItem[] {
	return [
		{ label: "First name", value: formatDisplayValue(formData.get("firstName")) },
		{ label: "Middle name", value: formatDisplayValue(formData.get("middleName")) },
		{ label: "Last name", value: formatDisplayValue(formData.get("lastName")) },
		{
			label: "Relationship",
			value: formatSentenceCaseValue(formData.get("relationship")),
		},
		{ label: "Phone", value: formatDisplayValue(formData.get("phoneNumber")) },
	];
}

function validateEmergencyContactFormData(formData: FormData) {
	if (!getFormValue(formData.get("firstName"))) {
		return "First name is required.";
	}

	if (!getFormValue(formData.get("lastName"))) {
		return "Last name is required.";
	}

	return "";
}

function getEmergencyContactValue(
	emergencyContact: EmergencyContactItem[],
	label: string,
) {
	const value = emergencyContact.find((item) => item.label === label)?.value;

	return value === "-" ? "" : String(value ?? "");
}

function getFormValue(value: FormDataEntryValue | null) {
	return typeof value === "string" ? value.trim() : "";
}

function formatDisplayValue(value: FormDataEntryValue | null) {
	const nextValue = getFormValue(value);

	return nextValue || "-";
}

function formatSentenceCaseValue(value: FormDataEntryValue | null) {
	const nextValue = getFormValue(value).replaceAll("_", " ");

	if (!nextValue) {
		return "-";
	}

	return nextValue.charAt(0).toUpperCase() + nextValue.slice(1).toLowerCase();
}
