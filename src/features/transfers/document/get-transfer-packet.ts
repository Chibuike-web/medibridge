import { TransferPacket } from "./types";

function titleCase(value: string) {
	return value
		.split("-")
		.filter(Boolean)
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join(" ");
}

export async function getTransferPacket({
	patientId,
	patientName,
}: {
	patientId: string;
	patientName: string;
}): Promise<TransferPacket> {
	return {
		patientId,
		patientName: titleCase(patientName),

		receivingHospitalName: "University College Hospital (UCH), Ibadan",
		receivingHospitalEmail: "referrals@uchibadan.org.ng",

		transferNote:
			"Patient is being referred with attached clinical records for continuity of care, specialist review, and further management.",

		personalInformation: {
			firstName: "Timothy",
			middleName: "Chibuike",
			lastName: "Maduabuchi",

			patientId: "PIA-101",

			age: 100,
			dateOfBirth: "1926-02-10",

			sex: "Male",
			maritalStatus: "Single",

			nationalId: "1234567890",
		},

		contactInformation: {
			phoneNumber: "+2348012345678",
			emailAddress: "timothy.maduabuchi@example.com",

			residentialAddress: "12 Allen Avenue, Ikeja, Lagos, Nigeria",

			stateOfOrigin: "Enugu State",
			countryOfOrigin: "Nigeria",
		},

		emergencyContact: {
			firstName: "Emmanuel",
			middleName: "Okereke",
			lastName: "Okafor",

			relationship: "Brother",

			phoneNumber: "+2348098765432",
		},

		physicalInformation: {
			height: "175 cm",
			weight: "68 kg",

			bloodGroup: "O+",
			genotype: "AA",
		},

		records: [
			{
				id: "patient-details",
				label: "Patient Details",
				status: "Included",
			},
			{
				id: "medical-history",
				label: "Medical History",
				status: "Included",
			},
			{
				id: "medications",
				label: "Medications",
				status: "Included",
			},
			{
				id: "labs",
				label: "Laboratory Results",
				status: "Included",
			},
			{
				id: "imaging",
				label: "Imaging",
				status: "Included",
			},
		],
	};
}
