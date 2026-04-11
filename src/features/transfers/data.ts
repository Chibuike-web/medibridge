import { ClinicalRecord, type TransferType } from "./types";

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
