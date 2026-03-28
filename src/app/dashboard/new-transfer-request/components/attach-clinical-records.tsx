"use client";

import { Dispatch, SetStateAction } from "react";
import { RiArrowDownSLine } from "@remixicon/react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { MultiSelectItem } from "@/components/multi-select-item";
import { clinicalRecords } from "../data";
import { EMPTY_PATIENT_DATA, PatientData, PatientDataType } from "../types";

type AttachClinicalRecordsProps = {
	activePatient: string;
	currentData: PatientData;
	setPatientData: Dispatch<SetStateAction<PatientDataType>>;
};

export function AttachClinicalRecords({
	activePatient,
	currentData,
	setPatientData,
}: AttachClinicalRecordsProps) {
	const currentPatientRecords = currentData.records;

	function toggleRecord(id: string, label: string) {
		setPatientData((prev) => {
			const isExists = currentPatientRecords.some((item) => item.id === id);

			const newRecords = isExists
				? currentPatientRecords.filter((item) => item.id !== id)
				: [...currentPatientRecords, { id, label }];
			return {
				...prev,
				[activePatient]: {
					...(prev[activePatient] || EMPTY_PATIENT_DATA),
					records: newRecords,
				},
			};
		});
	}

	return (
		<div className="mt-8 flex flex-col gap-3.5 items-start">
			<span className="text-gray-800 text-base block">Attach Clinical Records</span>

			<Popover>
				<PopoverTrigger className="group flex h-11 items-center justify-between gap-4 w-full border border-input px-4 py-2 text-left outline-0 rounded-md focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50">
					{currentPatientRecords.length === 0 ? (
						<div className="text-gray-500 whitespace-nowrap overflow-hidden gap-2 ">
							<span className="w-full shrink-0">Select patient records</span>
						</div>
					) : (
						<div className="flex gap-1.5 items-center text-sm text-foreground">
							<span className="flex items-center">{currentPatientRecords[0].label}</span>
							{currentPatientRecords.length - 1 > 0 && (
								<span> +{currentPatientRecords.length - 1} more</span>
							)}
						</div>
					)}
					<RiArrowDownSLine className="size-5 text-gray-400 shrink-0 transition-transform group-data-[state=open]:rotate-180" />
				</PopoverTrigger>

				<PopoverContent sideOffset={8} className="flex flex-col gap-1 rounded-2xl p-2 ">
					{clinicalRecords.map(({ id, label }) => (
						<MultiSelectItem
							key={id}
							isSelected={currentPatientRecords.some((item) => item.id === id)}
							onClick={() => toggleRecord(id, label)}
						>
							{label}
						</MultiSelectItem>
					))}
				</PopoverContent>
			</Popover>
		</div>
	);
}
