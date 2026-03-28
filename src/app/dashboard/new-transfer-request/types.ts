export type ClinicalRecord = {
	id: string;
	label: string;
};

export type PatientData = {
	records: ClinicalRecord[];
	format: number | null;
	hospitalName: string;
	hospitalEmail: string;
	notes: string;
};

export type PatientDataType = Record<string, PatientData>;

export const EMPTY_PATIENT_DATA: PatientData = {
	records: [],
	format: null,
	hospitalName: "",
	hospitalEmail: "",
	notes: "",
};
