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
		receivingHospitalName: "Enugu State Teaching Hospital",
		receivingHospitalEmail: "referrals@enuguteachinghospital.ng",
		transferNote:
			"Patient is being referred with the selected clinical records attached for continuity of care and further review.",
		records: [
			{ id: "patient-details", label: "Patient Details", status: "Included" },
			{ id: "medical-history", label: "Medical History", status: "Included" },
			{ id: "medications", label: "Medications", status: "Included" },
			{ id: "labs", label: "Labs", status: "Included" },
		],
	};
}
