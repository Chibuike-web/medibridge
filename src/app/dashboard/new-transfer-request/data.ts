import { ClinicalRecord } from "./types";

export const patients = [
	{ name: "Alice Johnson", patientId: "A123456" },
	{ name: "Brian Smith", patientId: "B234567" },
	{ name: "Clara Davis", patientId: "C345678" },
	{ name: "David Martinez", patientId: "D456789" },
	{ name: "Emma Thompson", patientId: "E567890" },
	{ name: "Frank Wilson", patientId: "F678901" },
	{ name: "Grace Lee", patientId: "G789012" },
	{ name: "Henry Clark", patientId: "H890123" },
	{ name: "Isabella Turner", patientId: "I901234" },
	{ name: "Jack Walker", patientId: "J012345" },
];

export const clinicalRecords: ClinicalRecord[] = [
	{
		id: "patientDetails",
		label: "Patient Details",
	},
	{
		id: "medicalHistory",
		label: "Medical History",
	},
	{
		id: "medications",
		label: "Medications",
	},
	{
		id: "encounters",
		label: "Encounters",
	},
	{
		id: "labs",
		label: "Labs",
	},
	{
		id: "imaging",
		label: "Imaging",
	},
	{
		id: "documents",
		label: "Documents",
	},
];

export const formats = ["PDF", "Image", "Word"];
