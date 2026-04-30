import { ImmunizationType } from "./types";

const immunizationSeed: ImmunizationType[] = [
	{
		vaccineName: "BCG",
		immunizationId: "IMM-101",
		dose: "1",
		createdAtLabel: "17th Apr 2024, 12:30PM",
		createdAtSortValue: "2024-04-17T12:30:00.000Z",
		status: "Active",
	},
	{
		vaccineName: "OPV (Oral Polio Vaccine)",
		immunizationId: "IMM-101",
		dose: "1",
		createdAtLabel: "17th Apr 2024, 12:30PM",
		createdAtSortValue: "2024-04-17T12:30:00.000Z",
		status: "Completed",
	},
	{
		vaccineName: "Tetanus (Td booster)",
		immunizationId: "IMM-101",
		dose: "2",
		createdAtLabel: "17th Apr 2024, 12:30PM",
		createdAtSortValue: "2024-04-17T12:30:00.000Z",
		status: "Active",
	},
	{
		vaccineName: "Hepatitis B",
		immunizationId: "IMM-101",
		dose: "Booster",
		createdAtLabel: "17th Apr 2024, 12:30PM",
		createdAtSortValue: "2024-04-17T12:30:00.000Z",
		status: "Discontinued",
	},
	{
		vaccineName: "Yellow Fever",
		immunizationId: "IMM-101",
		dose: "Single dose",
		createdAtLabel: "17th Apr 2024, 12:30PM",
		createdAtSortValue: "2024-04-17T12:30:00.000Z",
		status: "Discontinued",
	},
];

export const immunizations: ImmunizationType[] = Array.from(
	{ length: 7 },
	() => immunizationSeed,
).flat();
