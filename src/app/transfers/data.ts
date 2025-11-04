export const patients = [
	{ name: "Alice Johnson", hospitalId: "A123456", dob: "1982-05-14" },
	{ name: "Brian Smith", hospitalId: "B234567", dob: "1982-05-14" },
	{ name: "Clara Davis", hospitalId: "C345678", dob: "1982-05-14" },
	{ name: "David Martinez", hospitalId: "D456789", dob: "1982-05-14" },
	{ name: "Emma Thompson", hospitalId: "E567890", dob: "1982-05-14" },
	{ name: "Frank Wilson", hospitalId: "F678901", dob: "1982-05-14" },
	{ name: "Grace Lee", hospitalId: "B234567", dob: "1982-05-14" },
	{ name: "Henry Clark", hospitalId: "B234567", dob: "1982-05-14" },
	{ name: "Isabella Turner", hospitalId: "B234567", dob: "1982-05-14" },
	{ name: "Jack Walker", hospitalId: "B234567", dob: "1982-05-14" },
];

export type Step = {
	label: string;
	status: "completed" | "current" | "upcoming";
};

export const initialSteps: Step[] = [
	{ label: "Patient Selection", status: "current" },
	{ label: "Hospital Info", status: "upcoming" },
	{ label: "Attach Records", status: "upcoming" },
	{ label: "Review & Send", status: "upcoming" },
];
