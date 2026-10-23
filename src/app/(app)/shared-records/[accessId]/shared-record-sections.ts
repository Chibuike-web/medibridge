import type { PatientRecordAccessSection } from "@/db/schemas";

export const sharedSections: { id: PatientRecordAccessSection; label: string }[] = [
	{ id: "patient-details", label: "Patient Details" },
	{ id: "diagnoses", label: "Diagnoses" },
	{ id: "allergies", label: "Allergies" },
	{ id: "immunizations", label: "Immunization" },
	{ id: "procedures", label: "Procedures" },
	{ id: "medications", label: "Medications" },
	{ id: "lab-tests", label: "Lab Tests" },
	{ id: "imaging", label: "Imaging" },
];

export type SharedPatient = {
	name: string;
	sex: string;
	age: string;
};
