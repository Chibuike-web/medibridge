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
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { nigerianStates } from "@/features/patients/utils/nigerian-states";
import { Button } from "@/components/ui/button";
import { useOptimistic, useState, useTransition } from "react";
import type { SyntheticEvent } from "react";
import { RiCloseLine, RiEditLine, RiMore2Fill, RiShare2Line } from "@remixicon/react";
import { DetailItem, DetailsSection } from "./detail-fields";
import { updatePatientContactInformationAction } from "@/features/patients/server/update-patient-contact-information-action";

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
	const [isContactInformationDialogOpen, setIsContactInformationDialogOpen] = useState(false);
	const [contactInformationError, setContactInformationError] = useState("");
	const [optimisticContactInformation, setOptimisticContactInformation] =
		useOptimistic(contactInformation);
	const [isPending, startTransition] = useTransition();
	const savedStateOfOrigin = getContactInformationValue(
		optimisticContactInformation,
		"State of origin",
	);
	const savedCountryOfOrigin = getContactInformationValue(
		optimisticContactInformation,
		"Country of origin",
	);
	const [selectedStateOfOrigin, setSelectedStateOfOrigin] = useState("");
	const [selectedCountryOfOrigin, setSelectedCountryOfOrigin] = useState("");

	function handleContactInformationSubmit(event: SyntheticEvent<HTMLFormElement, SubmitEvent>) {
		event.preventDefault();

		const formData = new FormData(event.currentTarget);
		const validationError = validateContactInformationFormData(formData);

		if (validationError) {
			setContactInformationError(validationError);
			return;
		}

		const nextContactInformation = getNextContactInformation(formData);

		setIsContactInformationDialogOpen(false);

		startTransition(async () => {
			setContactInformationError("");
			setOptimisticContactInformation(nextContactInformation);

			const result = await updatePatientContactInformationAction(patientId, formData);

			if (result.status === "failed") {
				setContactInformationError(result.error);
				setIsContactInformationDialogOpen(true);
			}
		});
	}

	const action = (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant="ghost"
					size="icon"
					className="text-gray-500"
					aria-label="Open actions for Contact Information"
				>
					<RiMore2Fill aria-hidden="true" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent
				align="end"
				className="w-50 rounded-xl border-white/20 bg-gray-800 text-sm text-white ring ring-gray-800"
			>
				<DropdownMenuItem
					onSelect={(e) => {
						e.preventDefault();
						setSelectedStateOfOrigin(
							nigerianStates.find(
								(state) =>
									state.toLowerCase() ===
									savedStateOfOrigin
										.trim()
										.toLowerCase()
										.replace(/\s+state$/, ""),
							) ?? "",
						);
						setSelectedCountryOfOrigin(
							savedCountryOfOrigin.trim().toLowerCase() === "nigeria" ? "Nigeria" : "",
						);
						setIsContactInformationDialogOpen(true);
					}}
					className="flex items-center rounded-lg py-2 text-white focus:bg-white/10 focus:text-white"
				>
					<RiEditLine className="text-white" />
					<span>Edit info</span>
				</DropdownMenuItem>
				<DropdownMenuItem className="rounded-lg py-2 text-white focus:bg-white/10 focus:text-white">
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
				<DialogContent className="max-w-[37.5rem]">
					<DialogHeader className="py-4">
						<DialogTitle>Edit Contact Information</DialogTitle>

						<DialogDescription className="sr-only">
							Form for editing contact details such as phone number, email, and address.
						</DialogDescription>

						<DialogClose asChild>
							<Button
								variant="ghost"
								size="icon"
								aria-label="Close edit contact information dialog"
							>
								<RiCloseLine aria-hidden="true" />
							</Button>
						</DialogClose>
					</DialogHeader>

					<form
						id={contactInformationFormId}
						onSubmit={handleContactInformationSubmit}
						className="grid grid-cols-1 gap-x-4 gap-y-6 px-4 py-5 sm:grid-cols-2 text-sm text-gray-800"
					>
						<input type="hidden" name="patientId" value={patientId} />

						{contactInformationError ? (
							<div
								role="alert"
								className="col-span-full flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
							>
								<span className="min-w-0 flex-1">{contactInformationError}</span>
								<Button
									type="button"
									variant="ghost"
									size="icon"
									className="ml-auto -my-1 size-6 rounded-full"
									aria-label="Dismiss error message"
									onClick={() => setContactInformationError("")}
								>
									<RiCloseLine aria-hidden="true" />
								</Button>
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
							<Label htmlFor="contact-residential-address">Residential address</Label>
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
							<input
								type="hidden"
								name="stateOfOrigin"
								value={selectedStateOfOrigin || savedStateOfOrigin}
							/>
							<Select value={selectedStateOfOrigin} onValueChange={setSelectedStateOfOrigin}>
								<SelectTrigger id="contact-state-of-origin" className="w-full">
									<SelectValue placeholder="Select state" />
								</SelectTrigger>
								<SelectContent>
									<SelectGroup>
										{nigerianStates.map((state) => (
											<SelectItem key={state} value={state}>
												{state}
											</SelectItem>
										))}
									</SelectGroup>
								</SelectContent>
							</Select>
						</div>

						<div className="flex flex-col gap-2">
							<Label htmlFor="contact-country-of-origin">Country of origin</Label>
							<input
								type="hidden"
								name="countryOfOrigin"
								value={selectedCountryOfOrigin || savedCountryOfOrigin}
							/>
							<Select value={selectedCountryOfOrigin} onValueChange={setSelectedCountryOfOrigin}>
								<SelectTrigger id="contact-country-of-origin" className="w-full">
									<SelectValue placeholder="Select country" />
								</SelectTrigger>
								<SelectContent>
									<SelectGroup>
										<SelectItem value="Nigeria">Nigeria</SelectItem>
									</SelectGroup>
								</SelectContent>
							</Select>
						</div>
					</form>

					<DialogFooter className="text-sm">
						<div className="flex gap-2 ml-auto">
							<DialogClose asChild>
								<Button variant="outline">Cancel</Button>
							</DialogClose>

							<Button type="submit" form={contactInformationFormId} disabled={isPending}>
								Save changes
							</Button>
						</div>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}

function getNextContactInformation(formData: FormData): ContactInformationItem[] {
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

function getContactInformationValue(contactInformation: ContactInformationItem[], label: string) {
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
