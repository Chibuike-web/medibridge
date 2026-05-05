export type ClinicalRecord = {
	id: string;
	label: string;
};

export type ClinicalRecordItem = {
	id: string;
	name: string;
	createdAt: string;
};

export type PatientTransferData = {
	hospitalName: string;
	hospitalEmail: string;
	notes?: string;
};

export type PatientTransferDataByPatientId = Record<string, PatientTransferData>;
export type AttachedClinicalRecordsType = Record<string, ClinicalRecord[]>;

export const EMPTY_PATIENT_TRANSFER_DATA: PatientTransferData = {
	hospitalName: "",
	hospitalEmail: "",
	notes: "",
};

export type TransferType = {
	name: string;
	transferId: string;
	requestedAt: string;
	patientId: string;
	targetHospital: string;
	status: "Completed" | "Failed" | "Rejected" | "Cancelled" | "Pending";
};
