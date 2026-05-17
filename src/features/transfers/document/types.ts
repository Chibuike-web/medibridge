export type TransferPacketRecord = {
	id: string;
	label: string;
	status: "Included" | "Excluded" | "Pending";
};

export type PersonalInformation = {
	firstName: string;
	middleName: string;
	lastName: string;

	patientId: string;

	age: number;
	dateOfBirth: string;

	sex: "Male" | "Female";
	maritalStatus: string;

	nationalId: string;
};

export type ContactInformation = {
	phoneNumber: string;
	emailAddress: string;

	residentialAddress: string;

	stateOfOrigin: string;
	countryOfOrigin: string;
};

export type EmergencyContact = {
	firstName: string;
	middleName: string;
	lastName: string;

	relationship: string;

	phoneNumber: string;
};

export type PhysicalInformation = {
	height: string;
	weight: string;

	bloodGroup: string;
	genotype: string;
};

export type TransferPacket = {
	patientId: string;
	patientName: string;

	receivingHospitalName: string;
	receivingHospitalEmail: string;

	transferNote: string;

	personalInformation: PersonalInformation;

	contactInformation: ContactInformation;

	emergencyContact: EmergencyContact;

	physicalInformation: PhysicalInformation;

	records: TransferPacketRecord[];
};
