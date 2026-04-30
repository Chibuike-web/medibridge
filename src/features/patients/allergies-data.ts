import { AllergyType } from "./types";

const allergySeed: AllergyType[] = [
	{
		allergen: "Penicillin",
		allergyId: "ALLE-101",
		reaction: "Generalized rash",
		createdAtLabel: "17th Apr 2024, 12:30PM",
		createdAtSortValue: "2024-04-17T12:30:00.000Z",
		severity: "Mild",
		status: "Active",
	},
	{
		allergen: "Sulfonamides",
		allergyId: "ALLE-101",
		reaction: "Facial swelling",
		createdAtLabel: "17th Apr 2024, 12:30PM",
		createdAtSortValue: "2024-04-17T12:30:00.000Z",
		severity: "Mild",
		status: "Inactive",
	},
	{
		allergen: "Ibuprofen",
		allergyId: "ALLE-101",
		reaction: "Nausea, abdominal pain",
		createdAtLabel: "17th Apr 2024, 12:30PM",
		createdAtSortValue: "2024-04-17T12:30:00.000Z",
		severity: "Mild",
		status: "Active",
	},
	{
		allergen: "Ibuprofen",
		allergyId: "ALLE-101",
		reaction: "Nausea, abdominal pain",
		createdAtLabel: "17th Apr 2024, 12:30PM",
		createdAtSortValue: "2024-04-17T12:30:00.000Z",
		severity: "Mild",
		status: "Active",
	},
	{
		allergen: "Ibuprofen",
		allergyId: "ALLE-101",
		reaction: "Nausea, abdominal pain",
		createdAtLabel: "17th Apr 2024, 12:30PM",
		createdAtSortValue: "2024-04-17T12:30:00.000Z",
		severity: "Mild",
		status: "Active",
	},
	{
		allergen: "Ibuprofen",
		allergyId: "ALLE-101",
		reaction: "Nausea, abdominal pain",
		createdAtLabel: "17th Apr 2024, 12:30PM",
		createdAtSortValue: "2024-04-17T12:30:00.000Z",
		severity: "Mild",
		status: "Active",
	},
];

export const allergies: AllergyType[] = Array.from({ length: 7 }, () => allergySeed).flat();
