export type ClinicalRecord = {
	id: string;
	label: string;
};

export type ClinicalRecordItem = {
	id: string;
	name: string;
	type?: string;
	createdAt?: string;
};

export type PatientTransferData = {
	hospitalName: string;
	hospitalEmail: string;
	notes?: string;
};

export type PatientTransferDataByPatientId = Record<string, PatientTransferData>;
export type AttachedClinicalRecordsType = Record<string, ClinicalRecordItem[]>;
export type TransferContent = {
	contentType: string;
	recordId: string;
	recordName: string | null;
	status: string | null;
};

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
	targetHospitalAdminName: string | null;
	targetHospitalAdminEmail: string | null;
};

export type TransferStatusFilter = TransferType["status"];

export type TransferDetailsType = TransferType & {
	requestedBy: string | null;
	createdBy: string | null;
	updatedBy: string | null;
	transferContent: TransferContent[];
};
