import { CopyIdButton } from "@/components/copy-id-button";
import { StatusBadge } from "@/components/status-badge";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";

export function PatientOverviewSection({ patientId }: { patientId: string }) {
	return (
		<div className="p-8">
			<div className="mx-auto max-w-[1280px]">
				<h1 className="text-gray-800 font-semibold text-[20px] mb-6">Patient Overview</h1>
				<div className="flex flex-col gap-10">
					<PersonalInformation />
					<MedicalInformation />
					<RecentDiagnoses />
				</div>
			</div>
		</div>
	);
}

function PersonalInformation() {
	return (
		<div className="bg-gray-50 rounded-[12px] ring ring-gray-200">
			<div className="p-4">
				<h2 className="font-semibold text-gray-600 text-[18px] no-line-height">
					Personal Information
				</h2>
			</div>
			<div className="bg-white ring ring-gray-200 grid grid-cols-[repeat(auto-fill,minmax(20rem,1fr))] p-4 gap-6 rounded-[12px]">
				{personalInfo.map((p) => (
					<div key={p.label} className="flex flex-col gap-4 w-full">
						<div className="text-sm font-normal text-gray-400 no-line-height">{p.label}</div>
						<div className="text-sm font-semibold text-gray-600 no-line-height">{p.value}</div>
					</div>
				))}
			</div>
		</div>
	);
}

function MedicalInformation() {
	return (
		<div className="bg-gray-50 rounded-[12px] ring ring-gray-200">
			<div className="p-4">
				<h2 className="font-semibold text-gray-600 text-[18px] no-line-height">
					Medical Information
				</h2>
			</div>
			<div className="bg-white ring ring-gray-200 grid grid-cols-[repeat(auto-fill,minmax(20rem,1fr))] p-4 gap-6 rounded-[12px]">
				{medicalInfo.map((p) => (
					<div key={p.label} className="flex flex-col gap-4 w-full">
						<div className="text-sm font-normal text-gray-400 no-line-height">{p.label}</div>
						<div className="text-sm font-semibold text-gray-600 no-line-height">{p.value}</div>
					</div>
				))}
			</div>
		</div>
	);
}

function RecentDiagnoses() {
	return (
		<div className="flex flex-col gap-4">
			<h2 className="font-semibold text-gray-600 text-[18px] no-line-height">Recent Diagnoses</h2>
			<div className="overflow-hidden rounded-[12px] ring ring-gray-200">
				<Table className="bg-white">
					<TableHeader className="bg-gray-50">
						<TableRow className="hover:bg-transparent">
							{recentdiagnosisHeaders.map((h) => (
								<TableHead key={h.key} className="h-12 px-4 text-sm font-medium text-gray-600">
									{h.label}
								</TableHead>
							))}
						</TableRow>
					</TableHeader>
					<TableBody>
						{recentDiagnoses.map((diagnosis) => (
							<TableRow key={diagnosis.id} className="hover:bg-transparent">
								<TableCell className="px-4 py-4 font-medium text-gray-700">
									{diagnosis.name}
								</TableCell>
								<TableCell className="px-4 py-4 text-gray-500">{diagnosis.onset}</TableCell>
								<TableCell className="px-4 py-4 text-gray-500">{diagnosis.lastReviewed}</TableCell>
								<TableCell className="px-4 py-4 font-medium text-gray-600">
									<CopyIdButton id={diagnosis.id} />
								</TableCell>
								<TableCell className="px-4 py-4 text-gray-500">{diagnosis.createdAt}</TableCell>
								<TableCell className="px-4 py-4">
									<StatusBadge status={diagnosis.status} />
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>
		</div>
	);
}

const personalInfo = [
	{ label: "Full Name", value: "Timothy Chibuike Maduabuchi" },
	{ label: "Age", value: 100 },
	{ label: "Sex", value: "Male" },
	{ label: "Patient ID", value: "ABC29495" },
	{ label: "Blood Group", value: "O+" },
	{ label: "Date of Birth", value: "1926-02-10" },
	{ label: "Phone Number", value: "07083369340" },
	{ label: "Email Address", value: "chibuikemaduabuchi2023@gmail.com" },
	{ label: "Residential Address", value: "12 Allen Avenue, Ikeja, Lagos, Nigeria" },
];

const medicalInfo = [
	{ label: "Height", value: "175 cm" },
	{ label: "Weight", value: "68 kg" },
	{ label: "Genotype", value: "AA" },
	{ label: "Blood Pressure", value: "124/80 mmHg" },
	{ label: "Body Mass Index", value: "22.4" },
	{
		label: "Primary Care Physician",
		value: "Dr. A. Adeyemi (Internal Medicine), Dr. S. Okonkwo (Cardiology – co-managing)",
	},
];

const recentDiagnoses = [
	{
		name: "Hypertension",
		onset: "March 2019",
		lastReviewed: "December 2025",
		id: "DIA-101",
		createdAt: "17th Apr 2024, 12:30PM",
		status: "Active",
	},
	{
		name: "Type 2 Diabetes Mellitus",
		onset: "January 2020",
		lastReviewed: "November 2025",
		id: "DIA-102",
		createdAt: "17th Apr 2024, 12:30PM",
		status: "Resolved",
	},
	{
		name: "Chronic Kidney Disease",
		onset: "June 2022",
		lastReviewed: "October 2025",
		id: "DIA-103",
		createdAt: "17th Apr 2024, 12:30PM",
		status: "Active",
	},
	{
		name: "Asthma",
		onset: "April 2015",
		lastReviewed: "January 2026",
		id: "DIA-104",
		createdAt: "17th Apr 2024, 12:30PM",
		status: "Active",
	},
];

export const recentdiagnosisHeaders = [
	{ label: "Diagnosis name", key: "name" },
	{ label: "Onset", key: "onset" },
	{ label: "Last reviewed", key: "lastReviewed" },
	{ label: "Diagnosis ID", key: "id" },
	{ label: "Created at", key: "createdAt" },
	{ label: "Status", key: "status" },
];
