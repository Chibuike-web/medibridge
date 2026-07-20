"use client";

import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	RiCalendarLine,
	RiCloseLine,
	RiEditLine,
	RiMore2Fill,
	RiShare2Line,
} from "@remixicon/react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { useOptimistic, useState, useTransition } from "react";
import type { SyntheticEvent } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { updatePatientPersonalInformationAction } from "@/features/patients/server/actions";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { DetailItem, DetailsSection } from "./detail-fields";

type PersonalInformationItem = {
	label: string;
	value: string | number;
};

const personalInformationFormId = "personal-information-form";

export function PersonalInformation({
	patientId,
	personalInformation,
}: {
	patientId: string;
	personalInformation: PersonalInformationItem[];
}) {
	const [isPersonalInformationDialogOpen, setIsPersonalInformationDialogOpen] = useState(false);
	const [personalInformationError, setPersonalInformationError] = useState("");
	const [optimisticPersonalInformation, setOptimisticPersonalInformation] =
		useOptimistic(personalInformation);
	const [isUpdatingPersonalInformation, startUpdatePersonalInformationTransition] = useTransition();
	const currentDateOfBirth = getPersonalInformationValue(
		optimisticPersonalInformation,
		"Date of birth",
	);
	const currentSex = getSelectValue(
		getPersonalInformationValue(optimisticPersonalInformation, "Sex"),
	);
	const currentMaritalStatus = getSelectValue(
		getPersonalInformationValue(optimisticPersonalInformation, "Marital status"),
	);
	const [dob, setDob] = useState<Date | undefined>(getDateFromDisplayValue(currentDateOfBirth));
	const [selectedSex, setSelectedSex] = useState(currentSex);
	const [selectedMaritalStatus, setSelectedMaritalStatus] = useState(currentMaritalStatus);

	function handlePersonalInformationSubmit(event: SyntheticEvent<HTMLFormElement, SubmitEvent>) {
		event.preventDefault();

		const formData = new FormData(event.currentTarget);
		const validationError = validatePersonalInformationFormData(formData);

		if (validationError) {
			setPersonalInformationError(validationError);
			return;
		}

		const nextPersonalInformation = getNextPersonalInformation(formData);
		setIsPersonalInformationDialogOpen(false);

		startUpdatePersonalInformationTransition(async () => {
			setPersonalInformationError("");
			setOptimisticPersonalInformation(nextPersonalInformation);

			const result = await updatePatientPersonalInformationAction(patientId, formData);

			if (!result.ok) {
				setPersonalInformationError(result.message);
				setIsPersonalInformationDialogOpen(true);
			}
		});
	}

	const action = (
		<DropdownMenu>
			<DropdownMenuTrigger
				type="button"
				className="group inline-flex size-9 items-center justify-center text-gray-500"
				aria-label="Open actions for Personal Information"
			>
				<span className="inline-flex size-8 items-center justify-center rounded-md transition-colors group-hover:bg-gray-100 group-hover:text-gray-800">
					<RiMore2Fill className="size-5" aria-hidden />
				</span>
			</DropdownMenuTrigger>
			<DropdownMenuContent
				align="end"
				className="w-[13.75rem] rounded-xl border-white/20 bg-gray-800 text-sm text-white ring ring-gray-800"
			>
				<DropdownMenuItem
					onSelect={(e) => {
						e.preventDefault();
						setIsPersonalInformationDialogOpen(true);
					}}
					className="flex items-center gap-3 rounded-lg text-white focus:bg-white/10 focus:text-white py-2"
				>
					<RiEditLine className="text-white" />
					<span>Edit info</span>
				</DropdownMenuItem>

				<DropdownMenuItem className="gap-3 rounded-lg text-white focus:bg-white/10 focus:text-white py-2">
					<RiShare2Line className="text-white" />
					<span>Export info</span>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);

	return (
		<>
			<DetailsSection title="Personal Information" action={action}>
				{optimisticPersonalInformation.map((item) => (
					<DetailItem key={item.label} label={item.label} value={item.value} />
				))}
			</DetailsSection>

			<Dialog
				open={isPersonalInformationDialogOpen}
				onOpenChange={setIsPersonalInformationDialogOpen}
			>
				<DialogContent className="max-w-[50rem]">
					<DialogHeader className="h-16 px-6 border-b border-gray-200">
						<DialogTitle>Edit Personal Information</DialogTitle>
						<DialogDescription className="sr-only">
							Form for editing personal information such as name, age, sex, and marital status.
						</DialogDescription>
						<DialogClose>
							<RiCloseLine className="size-6" />
						</DialogClose>
					</DialogHeader>

					<form
						id={personalInformationFormId}
						onSubmit={handlePersonalInformationSubmit}
						className="grid grid-cols-[repeat(auto-fill,minmax(18rem,1fr))] gap-x-4 gap-y-6 px-6 pt-6 text-sm text-gray-800"
					>
						<input
							type="hidden"
							name="patientDisplayId"
							value={getPersonalInformationValue(optimisticPersonalInformation, "Patient ID")}
						/>
						{personalInformationError ? (
							<p className="col-span-full text-sm font-medium text-red-600">
								{personalInformationError}
							</p>
						) : null}
						<div className="flex flex-col gap-2">
							<Label>First name</Label>
							<Input
								id="firstName"
								name="firstName"
								placeholder="e.g. Chinenye"
								type="text"
								defaultValue={getPersonalInformationValue(
									optimisticPersonalInformation,
									"First name",
								)}
							/>
						</div>
						<div className="flex flex-col gap-2">
							<Label>Middle name</Label>
							<Input
								id="middleName"
								name="middleName"
								placeholder="e.g. Ada"
								type="text"
								defaultValue={getPersonalInformationValue(
									optimisticPersonalInformation,
									"Middle name",
								)}
							/>
						</div>
						<div className="flex flex-col gap-2">
							<Label>Last name</Label>
							<Input
								id="lastName"
								name="lastName"
								placeholder="e.g. Okafor"
								type="text"
								defaultValue={getPersonalInformationValue(
									optimisticPersonalInformation,
									"Last name",
								)}
							/>
						</div>
						<div className="flex flex-col gap-2">
							<Label>Age</Label>
							<Input
								id="age"
								name="age"
								placeholder="e.g. 32"
								type="number"
								defaultValue={getPersonalInformationValue(optimisticPersonalInformation, "Age")}
							/>
						</div>
						<div className="flex flex-col gap-2">
							<Label>Date of Birth</Label>
							<input
								type="hidden"
								name="dateOfBirth"
								value={dob ? format(dob, "yyyy-MM-dd") : ""}
							/>

							<Popover>
								<PopoverTrigger asChild>
									<Button
										variant="outline"
										data-empty={!dob}
										className="flex w-full justify-between font-normal data-[empty=true]:text-muted-foreground active:scale-100 hover:bg-transparent"
									>
										{dob ? format(dob, "PPP") : <span>Select date of birth</span>}
										<RiCalendarLine className="size-4 text-gray-600" />
									</Button>
								</PopoverTrigger>

								<PopoverContent className="p-0">
									<Calendar
										mode="single"
										defaultMonth={dob}
										selected={dob}
										onSelect={setDob}
										autoFocus
									/>
								</PopoverContent>
							</Popover>
						</div>

						<div className="flex flex-col gap-2">
							<Label>Sex</Label>
							<input type="hidden" name="sex" value={selectedSex} />

							<Select value={selectedSex} onValueChange={setSelectedSex}>
								<SelectTrigger className="h-9 w-full">
									<SelectValue placeholder="Select sex" />
								</SelectTrigger>
								<SelectContent>
									<SelectGroup>
										<SelectItem value="male">
											Male
										</SelectItem>
										<SelectItem value="female">
											Female
										</SelectItem>
										<SelectItem value="other">
											Other
										</SelectItem>
									</SelectGroup>
								</SelectContent>
							</Select>
						</div>
						<div className="flex flex-col gap-2">
							<Label>Marital Status</Label>
							<input type="hidden" name="maritalStatus" value={selectedMaritalStatus} />

							<Select value={selectedMaritalStatus} onValueChange={setSelectedMaritalStatus}>
								<SelectTrigger className="w-full h-9">
									<SelectValue placeholder="Select marital status" />
								</SelectTrigger>

								<SelectContent>
									<SelectGroup>
										<SelectItem value="single">
											Single
										</SelectItem>
										<SelectItem value="married">
											Married
										</SelectItem>
										<SelectItem value="divorced">
											Divorced
										</SelectItem>
										<SelectItem value="widowed">
											Widowed
										</SelectItem>
									</SelectGroup>
								</SelectContent>
							</Select>
						</div>

						<div className="flex flex-col gap-2">
							<Label>National ID</Label>
							<Input
								id="nationalId"
								name="nationalId"
								placeholder="e.g. NIN-12345678901"
								type="text"
								defaultValue={getPersonalInformationValue(
									optimisticPersonalInformation,
									"National ID",
								)}
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
								className="text-sm"
								type="submit"
								form={personalInformationFormId}
								disabled={isUpdatingPersonalInformation}
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

function getNextPersonalInformation(formData: FormData): PersonalInformationItem[] {
	const firstName = getFormValue(formData, "firstName");
	const middleName = getFormValue(formData, "middleName");
	const lastName = getFormValue(formData, "lastName");
	const patientDisplayId = getFormValue(formData, "patientDisplayId");
	const age = getFormValue(formData, "age");
	const dateOfBirth = getFormValue(formData, "dateOfBirth");
	const sex = getFormValue(formData, "sex");
	const maritalStatus = getFormValue(formData, "maritalStatus");
	const nationalId = getFormValue(formData, "nationalId");

	return [
		{ label: "First name", value: firstName },
		{ label: "Middle name", value: emptyDisplayValue(middleName) },
		{ label: "Last name", value: lastName },
		{ label: "Patient ID", value: patientDisplayId },
		{ label: "Age", value: emptyDisplayValue(age) },
		{ label: "Date of birth", value: emptyDisplayValue(dateOfBirth) },
		{ label: "Sex", value: formatDisplayValue(sex) },
		{ label: "Marital status", value: formatDisplayValue(maritalStatus) },
		{ label: "National ID", value: emptyDisplayValue(nationalId) },
	];
}

function validatePersonalInformationFormData(formData: FormData) {
	const firstName = getFormValue(formData, "firstName");
	const lastName = getFormValue(formData, "lastName");

	if (!firstName) return "First name is required.";
	if (!lastName) return "Last name is required.";

	return "";
}

function getPersonalInformationValue(
	personalInformation: PersonalInformationItem[],
	label: string,
) {
	const value = personalInformation.find((item) => item.label === label)?.value;

	if (value === undefined || value === "-") return "";

	return String(value);
}

function getFormValue(formData: FormData, name: string) {
	const value = formData.get(name);

	return typeof value === "string" ? value.trim() : "";
}

function getDateFromDisplayValue(value: string) {
	if (!value) return undefined;

	const date = new Date(value);

	return Number.isNaN(date.getTime()) ? undefined : date;
}

function getSelectValue(value: string) {
	if (!value) return "";

	return value.toLowerCase().replaceAll(" ", "_");
}

function emptyDisplayValue(value: string) {
	return value || "-";
}

function formatDisplayValue(value: string) {
	if (!value) return "-";

	const normalizedValue = value.replaceAll("_", " ");

	return normalizedValue.charAt(0).toUpperCase() + normalizedValue.slice(1).toLowerCase();
}
