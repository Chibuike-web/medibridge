"use client";

import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useOptimistic, useState, useTransition } from "react";
import type { SyntheticEvent } from "react";
import { RiCloseLine, RiEditLine, RiMore2Fill, RiShare2Line } from "@remixicon/react";
import { DetailItem, DetailsSection } from "./detail-fields";
import { updatePatientContactInformationAction } from "@/features/patients/server/actions";

type ContactInformationItem = {
	label: string;
	value: string | number;
};

export function ContactInformation({
	patientId,
	contactInformation,
}: {
	patientId: string;
	contactInformation: ContactInformationItem[];
}) {
	const contactInformationFormId = "contact-information-form";
	const [isContactInformationDialogOpen, setIsContactInformationDialogOpen] =
		useState(false);
	const [contactInformationError, setContactInformationError] = useState("");
	const [optimisticContactInformation, setOptimisticContactInformation] =
		useOptimistic(contactInformation);
	const [
		isUpdatingContactInformation,
		startUpdateContactInformationTransition,
	] = useTransition();

	function handleContactInformationSubmit(
		event: SyntheticEvent<HTMLFormElement, SubmitEvent>,
	) {
		event.preventDefault();

		const formData = new FormData(event.currentTarget);
		const validationError = validateContactInformationFormData(formData);

		if (validationError) {
			setContactInformationError(validationError);
			return;
		}

		const nextContactInformation = getNextContactInformation(formData);

		setIsContactInformationDialogOpen(false);

		startUpdateContactInformationTransition(async () => {
			setContactInformationError("");
			setOptimisticContactInformation(nextContactInformation);

			const result = await updatePatientContactInformationAction(
				patientId,
				formData,
			);

			if (!result.ok) {
				setContactInformationError(result.message);
				setIsContactInformationDialogOpen(true);
			}
		});
	}

	const action = (
		<DropdownMenu>
			<DropdownMenuTrigger
				type="button"
				className="inline-flex size-9 items-center justify-center rounded-md border border-transparent text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
				aria-label="Open actions for Contact Information"
			>
				<RiMore2Fill className="size-5" aria-hidden />
			</DropdownMenuTrigger>
			<DropdownMenuContent
				align="end"
				className="w-[13.75rem] rounded-xl border border-white/20 bg-gray-800 text-sm text-white ring ring-gray-800"
			>
				<DropdownMenuItem
					onSelect={(e) => {
						e.preventDefault();
						setIsContactInformationDialogOpen(true);
					}}
					className="flex items-center gap-3 rounded-lg py-2 text-white focus:bg-white/10 focus:text-white"
				>
					<RiEditLine className="text-white" />
					<span>Edit info</span>
				</DropdownMenuItem>
				<DropdownMenuItem className="flex items-center gap-3 rounded-lg py-2 text-white focus:bg-white/10 focus:text-white">
					<RiShare2Line className="text-white" />
					<span>Export info</span>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);

	return (
		<>
			<DetailsSection title="Contact Information" action={action}>
				{optimisticContactInformation.map((item) => (
					<DetailItem key={item.label} label={item.label} value={item.value} />
				))}
			</DetailsSection>
			<Dialog
				open={isContactInformationDialogOpen}
				onOpenChange={setIsContactInformationDialogOpen}
			>
				<DialogContent className="max-w-[50rem]">
					<DialogHeader className="h-16 px-6 border-b border-gray-200">
						<DialogTitle>Edit Contact Information</DialogTitle>

						<DialogDescription className="sr-only">
							Form for editing contact details such as phone number, email, and address.
						</DialogDescription>

						<DialogClose>
							<RiCloseLine className="size-6" />
						</DialogClose>
					</DialogHeader>

					<form
						id={contactInformationFormId}
						onSubmit={handleContactInformationSubmit}
						className="grid grid-cols-[repeat(auto-fill,minmax(18rem,1fr))] gap-x-4 gap-y-6 px-6 pt-6 text-sm text-gray-800"
					>
						<input type="hidden" name="patientId" value={patientId} />

						{contactInformationError ? (
							<div className="col-span-full rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
								{contactInformationError}
							</div>
						) : null}

						<div className="flex flex-col gap-2">
							<Label htmlFor="contact-phone-number">Phone number</Label>
							<Input
								id="contact-phone-number"
								name="phoneNumber"
								defaultValue={getContactInformationValue(
									optimisticContactInformation,
									"Phone number",
								)}
								placeholder="e.g. +234 801 234 5678"
								type="tel"
							/>
						</div>

						<div className="flex flex-col gap-2">
							<Label htmlFor="contact-email-address">Email address</Label>
							<Input
								id="contact-email-address"
								name="emailAddress"
								defaultValue={getContactInformationValue(
									optimisticContactInformation,
									"Email address",
								)}
								placeholder="e.g. chinenye.okafor@example.com"
								type="email"
							/>
						</div>

						<div className="flex flex-col gap-2">
							<Label htmlFor="contact-residential-address">
								Residential address
							</Label>
							<Input
								id="contact-residential-address"
								name="residentialAddress"
								defaultValue={getContactInformationValue(
									optimisticContactInformation,
									"Residential address",
								)}
								placeholder="e.g. 14 Hospital Road, Enugu"
								type="text"
							/>
						</div>

						<div className="flex flex-col gap-2">
							<Label htmlFor="contact-state-of-origin">State of origin</Label>
							<Input
								id="contact-state-of-origin"
								name="stateOfOrigin"
								defaultValue={getContactInformationValue(
									optimisticContactInformation,
									"State of origin",
								)}
								placeholder="e.g. Enugu"
								type="text"
							/>
						</div>

						<div className="flex flex-col gap-2">
							<Label htmlFor="contact-country-of-origin">Country of origin</Label>
							<Input
								id="contact-country-of-origin"
								name="countryOfOrigin"
								defaultValue={getContactInformationValue(
									optimisticContactInformation,
									"Country of origin",
								)}
								placeholder="e.g. Nigeria"
								type="text"
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
								form={contactInformationFormId}
								disabled={isUpdatingContactInformation}
								className="text-sm"
							>
								Save
							</Button>
						</div>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}

function getNextContactInformation(
	formData: FormData,
): ContactInformationItem[] {
	return [
		{ label: "Phone number", value: formatDisplayValue(formData.get("phoneNumber")) },
		{ label: "Email address", value: formatDisplayValue(formData.get("emailAddress")) },
		{
			label: "Residential address",
			value: formatDisplayValue(formData.get("residentialAddress")),
		},
		{ label: "State of origin", value: formatDisplayValue(formData.get("stateOfOrigin")) },
		{ label: "Country of origin", value: formatDisplayValue(formData.get("countryOfOrigin")) },
	];
}

function validateContactInformationFormData(formData: FormData) {
	const emailAddress = getFormValue(formData.get("emailAddress"));

	if (emailAddress && !emailAddress.includes("@")) {
		return "Enter a valid email address.";
	}

	return "";
}

function getContactInformationValue(
	contactInformation: ContactInformationItem[],
	label: string,
) {
	const value = contactInformation.find((item) => item.label === label)?.value;

	return value === "-" ? "" : String(value ?? "");
}

function getFormValue(value: FormDataEntryValue | null) {
	return typeof value === "string" ? value.trim() : "";
}

function formatDisplayValue(value: FormDataEntryValue | null) {
	const nextValue = getFormValue(value);

	return nextValue || "-";
}
