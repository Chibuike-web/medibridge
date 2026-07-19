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
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { RiEditLine, RiMore2Fill, RiShare2Line, RiCloseLine } from "@remixicon/react";

import { useOptimistic, useState, useTransition } from "react";
import type { SyntheticEvent } from "react";
import { DetailItem, DetailsSection } from "./detail-fields";
import { updatePatientPhysicalInformationAction } from "@/features/patients/server/actions";

type PhysicalInformationItem = {
	label: string;
	value: string | number;
};

export function PhysicalInformation({
	patientId,
	physicalInformation,
}: {
	patientId: string;
	physicalInformation: PhysicalInformationItem[];
}) {
	const physicalInformationFormId = "physical-information-form";
	const [isPhysicalInformationDialogOpen, setIsPhysicalInformationDialogOpen] =
		useState(false);
	const [physicalInformationError, setPhysicalInformationError] = useState("");
	const [optimisticPhysicalInformation, setOptimisticPhysicalInformation] =
		useOptimistic(physicalInformation);
	const [isUpdatingPhysicalInformation, startUpdatePhysicalInformationTransition] =
		useTransition();

	function handlePhysicalInformationSubmit(
		event: SyntheticEvent<HTMLFormElement, SubmitEvent>,
	) {
		event.preventDefault();

		const formData = new FormData(event.currentTarget);
		const nextPhysicalInformation = getNextPhysicalInformation(formData);

		setIsPhysicalInformationDialogOpen(false);

		startUpdatePhysicalInformationTransition(async () => {
			setPhysicalInformationError("");
			setOptimisticPhysicalInformation(nextPhysicalInformation);

			const result = await updatePatientPhysicalInformationAction(
				patientId,
				formData,
			);

			if (!result.ok) {
				setPhysicalInformationError(result.message);
				setIsPhysicalInformationDialogOpen(true);
			}
		});
	}

	const action = (
		<DropdownMenu>
			<DropdownMenuTrigger
				type="button"
				className="group inline-flex size-9 items-center justify-center text-gray-500"
				aria-label="Open actions for Physical Information"
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
						setIsPhysicalInformationDialogOpen(true);
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
			<DetailsSection title="Physical Information" action={action}>
				{optimisticPhysicalInformation.map((item) => (
					<DetailItem key={item.label} label={item.label} value={item.value} />
				))}
			</DetailsSection>
			<Dialog
				open={isPhysicalInformationDialogOpen}
				onOpenChange={setIsPhysicalInformationDialogOpen}
			>
				<DialogContent className="max-w-[50rem]">
					<DialogHeader className="h-16 px-6 border-b border-gray-200">
						<DialogTitle>Edit Physical Information</DialogTitle>
						<DialogDescription className="sr-only">
							Form for editing physical information such as height, weight, blood group, and
							genotype.
						</DialogDescription>
						<DialogClose>
							<RiCloseLine className="size-6" />
						</DialogClose>
					</DialogHeader>

					<form
						id={physicalInformationFormId}
						onSubmit={handlePhysicalInformationSubmit}
						className="grid grid-cols-[repeat(auto-fill,minmax(18rem,1fr))] gap-x-4 gap-y-6 px-6 pt-6 text-sm text-gray-800"
					>
						<input type="hidden" name="patientId" value={patientId} />

						{physicalInformationError ? (
							<div className="col-span-full rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
								{physicalInformationError}
							</div>
						) : null}

						<div className="flex flex-col gap-2">
							<Label htmlFor="physical-height">Height</Label>
							<Input
								id="physical-height"
								name="height"
								defaultValue={getPhysicalInformationValue(
									optimisticPhysicalInformation,
									"Height",
								)}
								placeholder="e.g. 172 cm"
								type="number"
							/>
						</div>

						<div className="flex flex-col gap-2">
							<Label htmlFor="physical-weight">Weight</Label>
							<Input
								id="physical-weight"
								name="weight"
								defaultValue={getPhysicalInformationValue(
									optimisticPhysicalInformation,
									"Weight",
								)}
								placeholder="e.g. 68 kg"
								type="number"
							/>
						</div>

						<div className="flex flex-col gap-2">
							<Label>Blood group</Label>
							<Select
								name="bloodGroup"
								defaultValue={getPhysicalInformationValue(
									optimisticPhysicalInformation,
									"Blood group",
								)}
							>
								<SelectTrigger className="w-full">
									<SelectValue placeholder="Select blood group" />
								</SelectTrigger>
								<SelectContent className="p-1 rounded-[0.625rem]">
									<SelectGroup>
										<SelectItem value="A+">A+</SelectItem>
										<SelectItem value="A-">A-</SelectItem>
										<SelectItem value="B+">B+</SelectItem>
										<SelectItem value="B-">B-</SelectItem>
										<SelectItem value="AB+">AB+</SelectItem>
										<SelectItem value="AB-">AB-</SelectItem>
										<SelectItem value="O+">O+</SelectItem>
										<SelectItem value="O-">O-</SelectItem>
									</SelectGroup>
								</SelectContent>
							</Select>
						</div>

						<div className="flex flex-col gap-2">
							<Label>Genotype</Label>
							<Select
								name="genotype"
								defaultValue={getPhysicalInformationValue(
									optimisticPhysicalInformation,
									"Genotype",
								)}
							>
								<SelectTrigger className="w-full">
									<SelectValue placeholder="Select genotype" />
								</SelectTrigger>
								<SelectContent className="p-1 rounded-[0.625rem]">
									<SelectGroup>
										<SelectItem value="AA">AA</SelectItem>
										<SelectItem value="AS">AS</SelectItem>
										<SelectItem value="SS">SS</SelectItem>
										<SelectItem value="AC">AC</SelectItem>
										<SelectItem value="SC">SC</SelectItem>
									</SelectGroup>
								</SelectContent>
							</Select>
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
								form={physicalInformationFormId}
								disabled={isUpdatingPhysicalInformation}
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

function getNextPhysicalInformation(
	formData: FormData,
): PhysicalInformationItem[] {
	return [
		{ label: "Height", value: formatDisplayValue(formData.get("height")) },
		{ label: "Weight", value: formatDisplayValue(formData.get("weight")) },
		{ label: "Blood group", value: formatDisplayValue(formData.get("bloodGroup")) },
		{ label: "Genotype", value: formatDisplayValue(formData.get("genotype")) },
	];
}

function getPhysicalInformationValue(
	physicalInformation: PhysicalInformationItem[],
	label: string,
) {
	const value = physicalInformation.find((item) => item.label === label)?.value;

	return value === "-" ? "" : String(value ?? "");
}

function getFormValue(value: FormDataEntryValue | null) {
	return typeof value === "string" ? value.trim() : "";
}

function formatDisplayValue(value: FormDataEntryValue | null) {
	const nextValue = getFormValue(value);

	return nextValue || "-";
}
