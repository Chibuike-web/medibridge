export type SharedSection =
	| "patient-details"
	| "diagnoses"
	| "allergies"
	| "immunization"
	| "procedures"
	| "medications"
	| "lab-tests"
	| "imaging";

export const sharedSections: { id: SharedSection; label: string }[] = [
	{ id: "patient-details", label: "Patient Details" },
	{ id: "diagnoses", label: "Diagnoses" },
	{ id: "allergies", label: "Allergies" },
	{ id: "immunization", label: "Immunization" },
	{ id: "procedures", label: "Procedures" },
	{ id: "medications", label: "Medications" },
	{ id: "lab-tests", label: "Lab Tests" },
	{ id: "imaging", label: "Imaging" },
];

export function getSharedSection(value: string | undefined): SharedSection {
	return sharedSections.some((section) => section.id === value)
		? (value as SharedSection)
		: "diagnoses";
}

export type SharedPatient = {
	name: string;
	sex: string;
	email: string;
	phoneNumber: string;
	address: string;
};

export type SharedPatientDetailSection = {
	title: string;
	items: {
		label: string;
		value: string | number | null | undefined;
	}[];
};
