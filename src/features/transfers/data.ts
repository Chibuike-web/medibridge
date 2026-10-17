import type { ClinicalRecord } from "./types";

export const clinicalRecords: ClinicalRecord[] = [
	{ id: "patient-details", label: "Patient Details" },
	{ id: "diagnoses", label: "Diagnoses" },
	{ id: "allergies", label: "Allergies" },
	{ id: "immunizations", label: "Immunizations" },
	{ id: "procedures", label: "Procedures" },
	{ id: "medications", label: "Medications" },
	{ id: "lab-tests", label: "Labs" },
	{ id: "imaging", label: "Imaging" },
];

export const patientDetailSections = [
	{ id: "personal-information", label: "Personal Information" },
	{ id: "contact-information", label: "Contact Information" },
	{ id: "emergency-contact", label: "Emergency Contact" },
	{ id: "physical-information", label: "Physical Information" },
];
