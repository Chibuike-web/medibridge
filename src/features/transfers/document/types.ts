export type TransferPacketRecord = {
	id: string;
	label: string;
	status: string;
};

export type TransferPacket = {
	patientId: string;
	patientName: string;
	receivingHospitalName: string;
	receivingHospitalEmail: string;
	transferNote: string;
	records: TransferPacketRecord[];
};
