"use client";

import { CheckButton } from "@/components/check-button";
import { formats } from "../data";
import { EMPTY_PATIENT_DATA, PatientDataType } from "../types";
import { Dispatch, SetStateAction } from "react";

export function SendAs({
	activePatient,
	currentData,
	setPatientData,
}: {
	activePatient: string;
	currentData: PatientDataType[string];
	setPatientData: Dispatch<SetStateAction<PatientDataType>>;
}) {
	const selectedFormat = currentData.format;

	const selectFileFormat = (index: number) => {
		setPatientData((prev) => ({
			...prev,
			[activePatient]: {
				...(prev[activePatient] || EMPTY_PATIENT_DATA),
				format: index,
			},
		}));
	};
	return (
		<div className="mt-8 flex flex-col gap-3.5 items-start">
			<span className="text-gray-800 text-base block">Send as</span>

			<div className="flex gap-3 flex-wrap">
				{formats.map((format, index) => (
					<CheckButton
						key={index}
						isSelected={selectedFormat === index}
						onClick={() => selectFileFormat(index)}
					>
						{format}
					</CheckButton>
				))}
			</div>
		</div>
	);
}
