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
	id: string;
	patientName: string;
	patientFirstName: string;
	patientMiddleName: string | null;
	patientLastName: string;
	patientId: string;
	status: "pending" | "rejected" | "completed" | "failed" | "cancelled";
	requestedAt: string;
	targetHospitalName: string;
};
