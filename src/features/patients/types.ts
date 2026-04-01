export type RecentPatientType = {
	name: string;
	createdAt: string;
	patientId: string;
	gender: "Male" | "Female";
	age: number;
};

export type PatientRecordType = RecentPatientType;
