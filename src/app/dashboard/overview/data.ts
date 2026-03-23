export type RecentPatientType = {
	name: string;
	createdAt: string;
	patientId: string;
	gender: string;
	age: number;
};

export type RecentTrasferType = {
	name: string;
	requestedAt: string;
	patientId: string;
	targetHospital: string;
	status: "Approved" | "Pending" | "Failed" | "Completed";
};

export const recentPatients: RecentPatientType[] = [
	{
		name: "Nuray Aksoy",
		createdAt: "2025-04-20T14:30:00",
		patientId: "E567890",
		gender: "Female",
		age: 26,
	},
	{
		name: "Ravi Patel",
		createdAt: "2025-04-17T14:30:00",
		patientId: "F678901",
		gender: "Male",
		age: 30,
	},
	{
		name: "Natalie Nowak",
		createdAt: "2025-04-21T14:30:00",
		patientId: "G789012",
		gender: "Female",
		age: 29,
	},
	{
		name: "Jumo Osmondi",
		createdAt: "2025-04-17T14:30:00",
		patientId: "H890123",
		gender: "Male",
		age: 35,
	},
];

export const statusStyles = {
	pending: "bg-amber-50 text-amber-700",
	approved: "bg-blue-50 text-blue-700",
	completed: "bg-green-50 text-green-700",
	failed: "bg-red-50 text-red-700",
};

export const recentTransfers = [
	{
		name: "James Brown",
		requestedAt: "2025-04-17T16:30:00",
		patientId: "A123456",
		targetHospital: "Enugu State Teaching Hospital, Parklane",
		status: "Approved",
	},
	{
		name: "Sophie Williams",
		requestedAt: "2025-04-18T17:30:00",
		patientId: "B234567",
		targetHospital: "Lagos University Teaching Hospital (LUTH), Lagos",
		status: "Pending",
	},
	{
		name: "Arthur Taylor",
		requestedAt: "2025-04-19T18:30:00",
		patientId: "C345678",
		targetHospital: "Ahmadu Bello University Teaching Hospital",
		status: "Failed",
	},
	{
		name: "Emma Wright",
		requestedAt: "2025-04-20T19:30:00",
		patientId: "D456789",
		targetHospital: "University College Hospital (UCH), Ibadan",
		status: "Completed",
	},
];
