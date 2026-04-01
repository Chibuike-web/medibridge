import { RecentPatientType } from "./types";

export const recentPatients: RecentPatientType[] = [
	{
		name: "Nuray Aksoy",
		createdAt: "2025-04-20T14:30:00",
		patientId: "A123456",
		gender: "Female",
		age: 26,
	},
	{
		name: "Ravi Patel",
		createdAt: "2025-04-17T14:30:00",
		patientId: "B234567",
		gender: "Male",
		age: 30,
	},
	{
		name: "Natalie Nowak",
		createdAt: "2025-04-21T14:30:00",
		patientId: "C345678",
		gender: "Female",
		age: 29,
	},
	{
		name: "Jumo Osmondi",
		createdAt: "2025-04-17T14:30:00",
		patientId: "D456789",
		gender: "Male",
		age: 35,
	},
];

const patientRecordSeed: RecentPatientType[] = [
	{
		name: "James Brown",
		patientId: "A123456",
		gender: "Male",
		age: 30,
		createdAt: "2025-04-05T14:30:00",
	},
	{
		name: "Sophia Williams",
		patientId: "B234567",
		gender: "Female",
		age: 26,
		createdAt: "2025-04-06T15:30:00",
	},
	{
		name: "Arthur Taylor",
		patientId: "C345678",
		gender: "Male",
		age: 30,
		createdAt: "2025-04-07T16:30:00",
	},
	{
		name: "Emma Wright",
		patientId: "D456789",
		gender: "Female",
		age: 30,
		createdAt: "2025-04-08T17:30:00",
	},
	{
		name: "Chibuike Maduabuchi",
		patientId: "E567890",
		gender: "Male",
		age: 38,
		createdAt: "2025-04-09T18:30:00",
	},
	{
		name: "Laura Perez",
		patientId: "F678901",
		gender: "Female",
		age: 26,
		createdAt: "2025-04-10T19:30:00",
	},
	{
		name: "Wei Chen",
		patientId: "G789012",
		gender: "Male",
		age: 24,
		createdAt: "2025-04-10T19:30:00",
	},
	{
		name: "Lena Muller",
		patientId: "H890123",
		gender: "Female",
		age: 34,
		createdAt: "2025-04-10T19:30:00",
	},
	{
		name: "Jumo Osmondi",
		patientId: "I901234",
		gender: "Male",
		age: 30,
		createdAt: "2025-04-10T19:30:00",
	},
	{
		name: "Natalie Nowak",
		patientId: "J012345",
		gender: "Female",
		age: 30,
		createdAt: "2025-04-10T19:30:00",
	},
	{
		name: "Ravi Patel",
		patientId: "K123456",
		gender: "Male",
		age: 30,
		createdAt: "2025-04-10T19:30:00",
	},
	{
		name: "Ravi Patel",
		patientId: "K123456",
		gender: "Male",
		age: 30,
		createdAt: "2025-04-10T19:30:00",
	},
	{
		name: "Ravi Patel",
		patientId: "K123456",
		gender: "Male",
		age: 30,
		createdAt: "2025-04-10T19:30:00",
	},
	{
		name: "Ravi Patel",
		patientId: "K123456",
		gender: "Male",
		age: 30,
		createdAt: "2025-04-10T19:30:00",
	},
];

export const patientRecords = Array.from({ length: 7 }, () => patientRecordSeed).flat();
