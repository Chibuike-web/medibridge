"use client";

import { useState } from "react";
import { RiArrowLeftLine, RiArrowRightSLine, RiCloseLine } from "@remixicon/react";
import {
	Drawer,
	DrawerClose,
	DrawerContent,
	DrawerDescription,
	DrawerHeader,
	DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { EncounterRecordFormView, type EncounterRecordType } from "./encounter-record-form-views";

type CreateEncounterDrawerProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

const encounterRecordOptions: ReadonlyArray<{
	id: EncounterRecordType;
	title: string;
	formTitle: string;
	description: string;
}> = [
	{
		id: "vitals",
		title: "Vitals",
		formTitle: "Add vitals",
		description: "Record measurements such as blood pressure, temperature, pulse, and weight.",
	},
	{
		id: "medication",
		title: "Medications",
		formTitle: "Add medication",
		description:
			"Document medications prescribed, administered, or reviewed during this encounter.",
	},
	{
		id: "allergies",
		title: "Allergies",
		formTitle: "Add allergy",
		description: "Record known allergies and any newly identified reactions.",
	},
	{
		id: "diagnoses",
		title: "Diagnoses",
		formTitle: "Add diagnosis",
		description:
			"Capture clinical assessments, conditions, or diagnoses made during the encounter.",
	},
	{
		id: "immunizations",
		title: "Immunizations",
		formTitle: "Add immunization",
		description: "Record vaccines administered or reviewed.",
	},
	{
		id: "imaging",
		title: "Imaging",
		formTitle: "Add imaging",
		description: "Attach or document imaging studies and reports.",
	},
	{
		id: "lab-tests",
		title: "Lab tests",
		formTitle: "Add lab test",
		description: "Add laboratory findings relevant to this visit.",
	},
];

export function CreateEncounterDrawer({ open, onOpenChange }: CreateEncounterDrawerProps) {
	const [selectedEncounterRecordType, setSelectedEncounterRecordType] =
		useState<EncounterRecordType | null>(null);

	const activeRecordOption = encounterRecordOptions.find(
		(recordOption) => recordOption.id === selectedEncounterRecordType,
	);

	function handleOpenChange(isCreateEncounterDrawerOpen: boolean) {
		if (!isCreateEncounterDrawerOpen) {
			setSelectedEncounterRecordType(null);
		}

		onOpenChange(isCreateEncounterDrawerOpen);
	}

	return (
		<Drawer open={open} onOpenChange={handleOpenChange} direction="right">
			<DrawerContent className="overflow-hidden rounded-3xl text-sm data-[vaul-drawer-direction=right]:top-4 data-[vaul-drawer-direction=right]:right-4 data-[vaul-drawer-direction=right]:bottom-4 data-[vaul-drawer-direction=right]:h-auto data-[vaul-drawer-direction=right]:w-[50rem]">
				{selectedEncounterRecordType === null ? (
					<>
						<DrawerHeader className="flex-row items-center justify-between border-b border-gray-200 text-left">
							<DrawerTitle className="leading-[1.2] text-gray-800">Create encounter</DrawerTitle>
							<DrawerClose
								aria-label="Close create encounter drawer"
								className="cursor-pointer rounded-md hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-400"
							>
								<RiCloseLine className="size-5" aria-hidden="true" />
							</DrawerClose>
							<DrawerDescription className="sr-only">
								Choose a clinical record to add to this encounter.
							</DrawerDescription>
						</DrawerHeader>

						<div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-8">
							{encounterRecordOptions.map((recordOption) => (
								<Button
									key={recordOption.id}
									type="button"
									variant="outline"
									className="flex w-full justify-between gap-4 rounded-xl bg-white px-5 py-4 text-left hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-400 h-auto whitespace-normal font-normal focus-visible:border-gray-200 focus-visible:outline-solid focus-visible:ring-0 has-[>svg:last-child]:pr-5"
									onClick={() => setSelectedEncounterRecordType(recordOption.id)}
								>
									<span className="min-w-0">
										<span className="block text-sm font-semibold text-gray-600">
											{recordOption.title}
										</span>
										<span className="mt-1 block text-sm font-normal text-gray-400">
											{recordOption.description}
										</span>
									</span>
									<RiArrowRightSLine className="size-5 shrink-0 text-gray-400" aria-hidden="true" />
								</Button>
							))}
						</div>
					</>
				) : (
					<>
						<DrawerHeader className="flex-row items-center border-b border-gray-200 text-left">
							<DrawerTitle asChild>
								<Button
									type="button"
									variant="ghost"
									className="-m-2 flex w-fit gap-4 p-2 leading-[1.2] text-gray-800 hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-400 h-auto whitespace-normal border-0 hover:text-gray-800 focus-visible:border-0 focus-visible:outline-solid focus-visible:ring-0 has-[>svg:first-child]:pl-2"
									onClick={() => setSelectedEncounterRecordType(null)}
								>
									<RiArrowLeftLine className="size-5 text-gray-600" aria-hidden="true" />
									<span>{activeRecordOption?.formTitle}</span>
								</Button>
							</DrawerTitle>
							<DrawerDescription className="sr-only">
								Complete the form to add this record to the encounter.
							</DrawerDescription>
						</DrawerHeader>

						<EncounterRecordFormView
							key={selectedEncounterRecordType}
							recordType={selectedEncounterRecordType}
						/>
					</>
				)}
			</DrawerContent>
		</Drawer>
	);
}
