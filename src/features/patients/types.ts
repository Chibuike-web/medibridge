export type RecentPatientType = {
	name: string;
	createdAt: string;
	patientId: string;
	gender: "Male" | "Female";
	age: number;
};

export type PatientListItemType = RecentPatientType;

export type PatientGenderFilter = "" | "male" | "female";

export type PatientAgeGroupFilter =
	| ""
	| "children"
	| "teenagers"
	| "young-adults"
	| "adults"
	| "seniors";

export type DiagnosisType = {
	name: string;
	diagnosedAtLabel: string;
	diagnosedAtSortValue: string;
	lastReviewedLabel: string;
	lastReviewedSortValue: string;
	diagnosisId: string;
	createdAtLabel: string;
	createdAtSortValue: string;
	status: "Active" | "Resolved";
};

export type DiagnosisDetailsRelatedRecord = {
	id: string;
	name: string;
	status: string;
};

export type DiagnosisDetailsHistoryEvent = {
	id: string;
	title: string;
	timestamp: string;
	items: {
		label: string;
		value: string;
	}[];
};

export type DiagnosisDetailsType = {
	diagnosisId: string;
	encounterId: string | null;
	name: string;
	status: "Active" | "Resolved";
	severityStage: string;
	diagnosedAt: string;
	createdAt: string;
	updatedAt: string;
	lastReviewedAt: string;
	diagnosedBy: string;
	createdBy: string;
	updatedBy: string;
	clinicalNote: string;
	history: DiagnosisDetailsHistoryEvent[];
	relatedRecords: {
		medications: DiagnosisDetailsRelatedRecord[];
		labTests: DiagnosisDetailsRelatedRecord[];
		imaging: DiagnosisDetailsRelatedRecord[];
		procedures: DiagnosisDetailsRelatedRecord[];
	};
};

export type DiagnosisStatusFilter = "active" | "resolved";

export type AllergyType = {
	allergen: string;
	allergyId: string;
	reaction: string;
	createdAtLabel: string;
	createdAtSortValue: string;
	severity: "Mild" | "Moderate" | "Severe";
	status: "Active" | "Inactive";
};

export type AllergyDetailsHistoryEvent = {
	id: string;
	title: string;
	timestamp: string;
	items: {
		label: string;
		value: string;
	}[];
};

export type AllergyDetailsType = {
	allergyId: string;
	encounterId: string | null;
	allergen: string;
	reaction: string;
	severity: "Mild" | "Moderate" | "Severe";
	status: "Active" | "Inactive";
	createdAt: string;
	updatedAt: string;
	createdBy: string;
	updatedBy: string;
	clinicalNote: string;
	history: AllergyDetailsHistoryEvent[];
};

export type AllergyStatusFilter = "active" | "inactive";

export type AllergySeverityFilter = "mild" | "moderate" | "severe";

export type ImmunizationType = {
	vaccineName: string;
	immunizationId: string;
	dose: string;
	createdAtLabel: string;
	createdAtSortValue: string;
	status: "Active" | "Completed" | "Cancelled" | "Discontinued";
};

export type ImmunizationStatusFilter = "active" | "completed" | "cancelled" | "discontinued";

export type ImmunizationDetailsHistoryEvent = {
	id: string;
	title: string;
	timestamp: string;
	items: {
		label: string;
		value: string;
	}[];
};

export type ImmunizationDetailsType = {
	immunizationId: string;
	encounterId: string | null;
	vaccineName: string;
	seriesType: string;
	currentDose: string;
	totalDoses: string;
	status: "Active" | "Completed" | "Cancelled" | "Discontinued";
	dateAdministered: string;
	administeredBy: string;
	createdAt: string;
	updatedAt: string;
	createdBy: string;
	updatedBy: string;
	clinicalNote: string;
	history: ImmunizationDetailsHistoryEvent[];
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

export type ProcedureStatusFilter = "pending" | "completed" | "cancelled";

export type ProcedureDetailsHistoryEvent = {
	id: string;
	title: string;
	timestamp: string;
	items: {
		label: string;
		value: string;
	}[];
};

export type ProcedureDetailsRelatedRecord = {
	id: string;
	name: string;
	status: string;
};

export type ProcedureDetailsType = {
	procedureId: string;
	encounterId: string | null;
	name: string;
	indication: string;
	status: "Pending" | "Completed" | "Cancelled";
	procedureDate: string;
	performedBy: string;
	assistants: string[];
	facility: string;
	plannedDate: string;
	plannedPhysician: string;
	plannedAssistants: string[];
	plannedFacility: string;
	clinicalNote: string;
	createdAt: string;
	updatedAt: string;
	createdBy: string;
	updatedBy: string;
	relatedRecords: {
		diagnosis: ProcedureDetailsRelatedRecord | null;
		medication: ProcedureDetailsRelatedRecord | null;
	};
	history: ProcedureDetailsHistoryEvent[];
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

export type MedicationStatusFilter = "active" | "completed" | "discontinued";

export type MedicationDetailsHistoryEvent = {
	id: string;
	title: string;
	timestamp: string;
	items: {
		label: string;
		value: string;
	}[];
};

export type MedicationDetailsType = {
	medicationId: string;
	encounterId: string | null;
	name: string;
	dose: string;
	route: string;
	indication: string;
	status: "Active" | "Completed" | "Discontinued";
	frequency: string;
	duration: string;
	prescribedBy: string;
	startedAt: string;
	createdAt: string;
	updatedAt: string;
	createdBy: string;
	clinicalNote: string;
	history: MedicationDetailsHistoryEvent[];
};

export type EncounterType = {
	encounterDateLabel: string;
	encounterDateSortValue: string;
	createdAtLabel: string;
	createdAtSortValue: string;
	updatedAtLabel: string;
	updatedAtSortValue: string;
	createdBy: string;
	updatedBy: string;
	encounterType:
		| "Emergency Visit"
		| "Routine Checkup"
		| "Follow-up Visit"
		| "Outpatient Visit";
	encounterId: string;
	department: string;
	physician: string;
	patientId: string;
};

export type EncounterTypeFilter =
	| "emergency-visit"
	| "routine-checkup"
	| "follow-up-visit"
	| "outpatient-visit";

export type EncounterDepartmentFilter =
	| "emergency-medicine"
	| "general-medicine"
	| "cardiology"
	| "endocrinology"
	| "family-medicine"
	| "nephrology";

export type LabTestType = {
	test: string;
	testName: string;
	labId: string;
	encounterId: string | null;
	result: string;
	specimen: string;
	referenceRange: string;
	interpretation: string;
	flag: string;
	orderedAtValue: string;
	orderedAtLabel: string;
	orderedAtSortValue: string;
	orderedBy: string;
	createdAtLabel: string;
	createdAtSortValue: string;
	updatedAtLabel: string;
	updatedAtSortValue: string;
	createdBy: string;
	updatedBy: string;
	status: "Pending" | "Completed" | "Cancelled";
	clinicalNote: string;
	fileName: string;
	fileUrl: string;
	fileSize: string;
	fileType: string;
};

export type LabTestStatusFilter = "pending" | "completed" | "cancelled";

export type LabTestFlagFilter =
	| "within-range"
	| "abnormal"
	| "high"
	| "low"
	| "critical"
	| "pending"
	| "borderline"
	| "invalid"
	| "cancelled"
	| "inconclusive";

export type ImagingType = {
	study: string;
	imagingId: string;
	encounterId: string;
	modality: "CT" | "MRI" | "Ultrasound" | "X-ray";
	region: string;
	impression: string;
	orderedAtLabel: string;
	orderedAtValue: string;
	orderedAtSortValue: string;
	orderedBy: string;
	reportedBy: string;
	status: "Pending" | "Completed" | "Cancelled";
	clinicalNote: string;
	fileName: string;
	fileUrl: string;
	fileSize: string;
	fileType: string;
	createdBy: string;
	updatedBy: string;
	createdAtLabel: string;
	updatedAtLabel: string;
};

export type ImagingStatusFilter = "pending" | "completed" | "cancelled";

export type ImagingModalityFilter = "ct" | "mri" | "ultrasound" | "x-ray";

export type PatientSectionProps = {
	section: string;
	patientId: string;
};
