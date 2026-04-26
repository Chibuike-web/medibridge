import { ClinicalRecord, ClinicalRecordItem, type TransferType } from "./types";

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
		id: "diagnoses",
		label: "Diagnoses",
	},
	{
		id: "allergies",
		label: "Allergies",
	},
	{
		id: "immunizations",
		label: "Immunizations",
	},
	{
		id: "procedures",
		label: "Procedures",
	},
	{
		id: "medications",
		label: "Medications",
	},
	{
		id: "labs",
		label: "Labs",
	},
	{
		id: "imaging",
		label: "Imaging",
	},
];

export const diagnosesRecords: ClinicalRecordItem[] = [
	{
		id: "DX-1001",
		name: "Type 2 diabetes mellitus",
		createdAt: "2026-01-14T09:20:00",
	},
	{
		id: "DX-1002",
		name: "Essential hypertension",
		createdAt: "2026-01-22T11:45:00",
	},
	{
		id: "DX-1003",
		name: "Mild intermittent asthma",
		createdAt: "2026-02-03T14:10:00",
	},
	{
		id: "DX-1004",
		name: "Iron deficiency anemia",
		createdAt: "2026-02-18T08:35:00",
	},
	{
		id: "DX-1005",
		name: "Chronic kidney disease stage 2",
		createdAt: "2026-03-06T16:05:00",
	},
];

export const allergiesRecords: ClinicalRecordItem[] = [
	{
		id: "ALG-1001",
		name: "Penicillin allergy",
		createdAt: "2026-01-10T10:15:00",
	},
	{
		id: "ALG-1002",
		name: "Peanut allergy",
		createdAt: "2026-01-28T13:40:00",
	},
	{
		id: "ALG-1003",
		name: "Latex sensitivity",
		createdAt: "2026-02-09T09:05:00",
	},
	{
		id: "ALG-1004",
		name: "Shellfish allergy",
		createdAt: "2026-02-21T15:25:00",
	},
	{
		id: "ALG-1005",
		name: "Sulfonamide allergy",
		createdAt: "2026-03-12T11:30:00",
	},
];

export const immunizationsRecords: ClinicalRecordItem[] = [
	{
		id: "IMM-1001",
		name: "Influenza vaccine",
		createdAt: "2026-01-08T08:45:00",
	},
	{
		id: "IMM-1002",
		name: "COVID-19 booster",
		createdAt: "2026-01-19T12:10:00",
	},
	{
		id: "IMM-1003",
		name: "Tetanus-diphtheria vaccine",
		createdAt: "2026-02-04T10:50:00",
	},
	{
		id: "IMM-1004",
		name: "Hepatitis B vaccine",
		createdAt: "2026-02-25T14:35:00",
	},
	{
		id: "IMM-1005",
		name: "Pneumococcal vaccine",
		createdAt: "2026-03-15T09:55:00",
	},
];

export const proceduresRecords: ClinicalRecordItem[] = [
	{
		id: "PRC-1001",
		name: "Appendectomy",
		createdAt: "2026-01-12T16:20:00",
	},
	{
		id: "PRC-1002",
		name: "Colonoscopy",
		createdAt: "2026-01-31T09:30:00",
	},
	{
		id: "PRC-1003",
		name: "Wound debridement",
		createdAt: "2026-02-11T13:15:00",
	},
	{
		id: "PRC-1004",
		name: "Central venous catheter insertion",
		createdAt: "2026-02-27T17:05:00",
	},
	{
		id: "PRC-1005",
		name: "Dialysis catheter placement",
		createdAt: "2026-03-20T08:25:00",
	},
];

export const medicationsRecords: ClinicalRecordItem[] = [
	{
		id: "MED-1001",
		name: "Metformin 500 mg",
		createdAt: "2026-01-16T09:00:00",
	},
	{
		id: "MED-1002",
		name: "Lisinopril 10 mg",
		createdAt: "2026-01-24T10:45:00",
	},
	{
		id: "MED-1003",
		name: "Salbutamol inhaler",
		createdAt: "2026-02-06T12:20:00",
	},
	{
		id: "MED-1004",
		name: "Ferrous sulfate 325 mg",
		createdAt: "2026-02-19T15:10:00",
	},
	{
		id: "MED-1005",
		name: "Atorvastatin 20 mg",
		createdAt: "2026-03-09T11:15:00",
	},
];

export const labsRecords: ClinicalRecordItem[] = [
	{
		id: "LAB-1001",
		name: "Complete blood count",
		createdAt: "2026-01-17T07:55:00",
	},
	{
		id: "LAB-1002",
		name: "Comprehensive metabolic panel",
		createdAt: "2026-01-26T08:20:00",
	},
	{
		id: "LAB-1003",
		name: "HbA1c",
		createdAt: "2026-02-07T09:35:00",
	},
	{
		id: "LAB-1004",
		name: "Lipid panel",
		createdAt: "2026-02-24T10:05:00",
	},
	{
		id: "LAB-1005",
		name: "Urinalysis",
		createdAt: "2026-03-11T08:15:00",
	},
];

export const imagingRecords: ClinicalRecordItem[] = [
	{
		id: "IMG-1001",
		name: "Chest X-ray",
		createdAt: "2026-01-18T13:25:00",
	},
	{
		id: "IMG-1002",
		name: "Abdominal ultrasound",
		createdAt: "2026-01-30T11:05:00",
	},
	{
		id: "IMG-1003",
		name: "CT head without contrast",
		createdAt: "2026-02-13T16:40:00",
	},
	{
		id: "IMG-1004",
		name: "MRI lumbar spine",
		createdAt: "2026-02-28T14:00:00",
	},
	{
		id: "IMG-1005",
		name: "Echocardiogram",
		createdAt: "2026-03-18T10:30:00",
	},
];

export const clinicalRecordItemsByType: Record<string, ClinicalRecordItem[]> = {
	diagnoses: diagnosesRecords,
	allergies: allergiesRecords,
	immunizations: immunizationsRecords,
	procedures: proceduresRecords,
	medications: medicationsRecords,
	labs: labsRecords,
	imaging: imagingRecords,
};

export const recentTransfers: TransferType[] = [
	{
		name: "James Brown",
		transferId: "TRF-1001",
		requestedAt: "2025-04-17T16:30:00",
		patientId: "A123456",
		targetHospital: "Enugu State Teaching Hospital, Parklane",
		status: "Failed",
	},
	{
		name: "Sophie Williams",
		transferId: "TRF-1002",
		requestedAt: "2025-04-18T17:30:00",
		patientId: "B234567",
		targetHospital: "Lagos University Teaching Hospital (LUTH), Lagos",
		status: "Completed",
	},
	{
		name: "Arthur Taylor",
		transferId: "TRF-1003",
		requestedAt: "2025-04-19T18:30:00",
		patientId: "C345678",
		targetHospital: "Ahmadu Bello University Teaching Hospital",
		status: "Pending",
	},
	{
		name: "Emma Wright",
		transferId: "TRF-1004",
		patientId: "D456789",
		requestedAt: "2025-04-20T19:30:00",
		targetHospital: "University College Hospital (UCH), Ibadan",
		status: "Rejected",
	},
	{
		name: "Emma Wright",
		transferId: "TRF-1005",
		patientId: "D456789",
		requestedAt: "2025-04-20T19:30:00",
		targetHospital: "University College Hospital (UCH), Ibadan",
		status: "Completed",
	},
	{
		name: "Emma Wright",
		transferId: "TRF-1006",
		patientId: "D456789",
		requestedAt: "2025-04-20T19:30:00",
		targetHospital: "University College Hospital (UCH), Ibadan",
		status: "Cancelled",
	},
];

const transferSeed: TransferType[] = [
	{
		name: "James Brown",
		transferId: "TRF-2001",
		patientId: "A123456",
		targetHospital: "University College Hospital (UCH), Ibadan",
		requestedAt: "2024-04-17T12:30:00",
		status: "Rejected",
	},
	{
		name: "Sphia Williams",
		transferId: "TRF-2002",
		patientId: "B234567",
		targetHospital: "Lagos University Teaching Hospital (LUTH), Lagos",
		requestedAt: "2024-04-17T12:30:00",
		status: "Cancelled",
	},
	{
		name: "Arthur Taylor",
		transferId: "TRF-2003",
		patientId: "C345678",
		targetHospital: "Ahmadu Bello University Teaching Hospital (ABUTH), Zaria",
		requestedAt: "2024-04-17T12:30:00",
		status: "Pending",
	},
	{
		name: "Emma Wright",
		transferId: "TRF-2004",
		patientId: "D456789",
		targetHospital: "Obafemi Awolowo University Teaching Hospitals Complex (OAUTHC), Ile-Ife",
		requestedAt: "2024-04-17T12:30:00",
		status: "Failed",
	},
	{
		name: "Chibuike Maduabuchi",
		transferId: "TRF-2005",
		patientId: "E567890",
		targetHospital: "University of Nigeria Teaching Hospital (UNTH), Enugu",
		requestedAt: "2024-04-17T12:30:00",
		status: "Rejected",
	},
	{
		name: "Laura Perez",
		transferId: "TRF-2006",
		patientId: "G789012",
		targetHospital: "National Hospital, Abuja",
		requestedAt: "2024-04-17T12:30:00",
		status: "Cancelled",
	},
	{
		name: "Wei Chen",
		transferId: "TRF-2007",
		patientId: "G789012",
		targetHospital: "Federal Medical Centre (FMC)",
		requestedAt: "2024-04-17T12:30:00",
		status: "Completed",
	},
	{
		name: "Lena Muller",
		transferId: "TRF-2008",
		patientId: "H890123",
		targetHospital: "Lagos State University Teaching Hospital (LASUTH), Ikeja",
		requestedAt: "2024-04-17T12:30:00",
		status: "Failed",
	},
	{
		name: "Jumo Osmondi",
		transferId: "TRF-2009",
		patientId: "I901234",
		targetHospital: "Gbagada General Hospita",
		requestedAt: "2024-04-17T12:30:00",
		status: "Rejected",
	},
	{
		name: "Natalie Nowak",
		transferId: "TRF-2010",
		patientId: "J012345",
		targetHospital: "Abia State Specialist Hospital, Umuahia",
		requestedAt: "2024-04-17T12:30:00",
		status: "Cancelled",
	},
	{
		name: "Ravi Patel",
		transferId: "TRF-2011",
		patientId: "K123456",
		targetHospital: "Borno State Specialist Hospital, Maiduguri",
		requestedAt: "2024-04-17T12:30:00",
		status: "Completed",
	},
	{
		name: "Ravi Patel",
		transferId: "TRF-2012",
		patientId: "K123456",
		targetHospital: "Borno State Specialist Hospital, Maiduguri",
		requestedAt: "2024-04-17T12:30:00",
		status: "Failed",
	},
	{
		name: "Ravi Patel",
		transferId: "TRF-2013",
		patientId: "K123456",
		targetHospital: "Borno State Specialist Hospital, Maiduguri",
		requestedAt: "2024-04-17T12:30:00",
		status: "Rejected",
	},
	{
		name: "Ravi Patel",
		transferId: "TRF-2014",
		patientId: "K123456",
		targetHospital: "Borno State Specialist Hospital, Maiduguri",
		requestedAt: "2024-04-17T12:30:00",
		status: "Rejected",
	},
];

export const transferRecords = Array.from({ length: 7 }, () => transferSeed).flat();
