export type RecentPatientType = {
	name: string;
	createdAt: string;
	patientId: string;
	gender: "Male" | "Female";
	age: number;
};

export type PatientRecordType = RecentPatientType;

export type DiagnosisType = {
	name: string;
	onsetLabel: string;
	onsetSortValue: string;
	lastReviewedLabel: string;
	lastReviewedSortValue: string;
	diagnosisId: string;
	clinicalSummary: string;
	status: "Active" | "Resolved";
};

export type PatientSectionProps = {
	section: string;
	patientId: string;
};
