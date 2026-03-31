export type ClinicalRecord = {
	id: string;
	label: string;
};

export type PatientData = {
	records: ClinicalRecord[];
	hospitalName: string;
	hospitalEmail: string;
	notes: string;
};

export type PatientDataType = Record<string, PatientData>;

export const EMPTY_PATIENT_DATA: PatientData = {
	records: [],
	hospitalName: "",
	hospitalEmail: "",
	notes: "",
};

export type RecentTransferType = {
	name: string;
	requestedAt: string;
	patientId: string;
	targetHospital: string;
	status: "Approved" | "Pending" | "Failed" | "Completed";
};
