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

export type AllergyType = {
	allergen: string;
	allergyId: string;
	reaction: string;
	createdAtLabel: string;
	createdAtSortValue: string;
	severity: "Mild" | "Moderate" | "Severe";
	status: "Active" | "Inactive";
};

export type ImmunizationType = {
	vaccineName: string;
	immunizationId: string;
	dose: string;
	createdAtLabel: string;
	createdAtSortValue: string;
	status: "Active" | "Completed" | "Discontinued";
};

export type ProcedureType = {
	procedure: string;
	procedureId: string;
	createdAtLabel: string;
	createdAtSortValue: string;
	indication: string;
	facility: string;
	status: "Pending" | "Completed" | "Cancelled";
};

export type MedicationType = {
	medication: string;
	dose: string;
	route: string;
	medicationId: string;
	indication: string;
	createdAtLabel: string;
	createdAtSortValue: string;
	status: "Active" | "Completed" | "Discontinued";
};

export type LabTestType = {
	test: string;
	labId: string;
	referenceRange: string;
	interpretation: string;
	createdAtLabel: string;
	createdAtSortValue: string;
	status: "Pending" | "Completed" | "Cancelled";
};

export type ImagingType = {
	study: string;
	imagingId: string;
	modality: "CT" | "MRI" | "Ultrasound" | "X-ray";
	region: string;
	impression: string;
	orderedAtLabel: string;
	orderedAtSortValue: string;
	status: "Pending" | "Completed" | "Cancelled";
};

export type PatientSectionProps = {
	section: string;
	patientId: string;
};
