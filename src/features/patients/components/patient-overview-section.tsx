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
import { cn } from "@/lib/utils/cn";

export function PatientOverviewSection({ patientId }: { patientId: string }) {
	return (
		<div className="p-8">
			<div className="mx-auto max-w-7xl">
				<h1 className="mb-6 text-xl font-semibold text-gray-800">Patient Overview</h1>
				<div className="flex flex-col gap-10">
					<PersonalInformation />
					<MedicalInformation />
					<RecentDiagnoses />
					<RecentAllergies />
				</div>
			</div>
		</div>
	);
}

function PersonalInformation() {
	return (
		<div className="rounded-xl bg-gray-50 ring ring-gray-200">
			<div className="p-4">
				<h2 className="font-semibold text-lg text-gray-600 no-line-height">
					Personal Information
				</h2>
			</div>
			<div className="grid grid-cols-[repeat(auto-fill,minmax(20rem,1fr))] gap-6 rounded-xl bg-white p-4 ring ring-gray-200">
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
		<div className="rounded-xl bg-gray-50 ring ring-gray-200">
			<div className="p-4">
				<h2 className="font-semibold text-lg text-gray-600 no-line-height">
					Medical Information
				</h2>
			</div>
			<div className="grid grid-cols-[repeat(auto-fill,minmax(20rem,1fr))] gap-6 rounded-xl bg-white p-4 ring ring-gray-200">
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
			<h2 className="font-semibold text-lg text-gray-600 no-line-height">Recent Diagnoses</h2>
			<div className="overflow-hidden rounded-xl ring ring-gray-200">
				<Table className="border-separate border-spacing-0 bg-white">
					<TableHeader className="bg-gray-50">
						<TableRow className="hover:bg-transparent">
							{recentdiagnosisHeaders.map((h) => (
								<TableHead key={h.key} className="h-12 px-4 text-sm font-medium text-gray-600">
									{h.label}
								</TableHead>
							))}
						</TableRow>
					</TableHeader>
					<TableBody className="rounded-xl ring ring-gray-200">
						{recentDiagnoses.map((diagnosis, index) => (
							<TableRow
								key={diagnosis.id}
								className="[&>td]:border-b [&>td]:border-gray-200 last:[&>td]:border-b-0 hover:bg-transparent"
							>
								<TableCell className="px-4 py-4 font-medium text-gray-700">
									{diagnosis.name}
								</TableCell>
								<TableCell className="px-4 py-4 text-gray-500">{diagnosis.onset}</TableCell>
								<TableCell className="px-4 py-4 text-gray-500">{diagnosis.lastReviewed}</TableCell>
								<TableCell className="px-4 py-4 font-medium text-gray-600">
									<CopyIdButton id={diagnosis.id} />
								</TableCell>
								<TableCell className="px-4 py-4 text-gray-500">{diagnosis.createdAt}</TableCell>
								<TableCell className={cn("px-4 py-4", index === 0 && "rounded-tr-xl")}>
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

function RecentAllergies() {
	return (
		<div className="flex flex-col gap-4">
			<h2 className="font-semibold text-lg text-gray-600 no-line-height">Recent Allergies</h2>
			<div className="overflow-hidden rounded-xl ring ring-gray-200">
				<Table className="border-separate border-spacing-0 bg-white">
					<TableHeader className="bg-gray-50">
						<TableRow className="hover:bg-transparent">
							{recentAllergyHeaders.map((h) => (
								<TableHead key={h.key} className="h-12 px-4 text-sm font-medium text-gray-600">
									{h.label}
								</TableHead>
							))}
						</TableRow>
					</TableHeader>
					<TableBody className="rounded-xl ring ring-gray-200">
						{recentAllergies.map((allergy, index) => (
							<TableRow
								key={`${allergy.id}-${allergy.allergen}-${index}`}
								className="[&>td]:border-b [&>td]:border-gray-200 last:[&>td]:border-b-0 hover:bg-transparent"
							>
								<TableCell className="px-4 py-4 font-medium text-gray-700">
									{allergy.allergen}
								</TableCell>
								<TableCell className="px-4 py-4 font-medium text-gray-600">
									<CopyIdButton id={allergy.id} />
								</TableCell>
								<TableCell className="px-4 py-4 text-gray-500">{allergy.reaction}</TableCell>
								<TableCell className="px-4 py-4 text-gray-500">{allergy.createdAt}</TableCell>
								<TableCell className="px-4 py-4 text-gray-500">{allergy.severity}</TableCell>
								<TableCell className={cn("px-4 py-4", index === 0 && "rounded-tr-xl")}>
									<StatusBadge status={allergy.status} />
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

const recentAllergies = [
	{
		allergen: "Penicillin",
		id: "ALG-101",
		reaction: "Generalized rash",
		createdAt: "17th Apr 2024, 12:30PM",
		severity: "Mild",
		status: "Active",
	},
	{
		allergen: "Sulfonamides",
		id: "ALG-101",
		reaction: "Facial swelling",
		createdAt: "17th Apr 2024, 12:30PM",
		severity: "Mild",
		status: "Inactive",
	},
	{
		allergen: "Ibuprofen",
		id: "ALG-101",
		reaction: "Nausea, abdominal pain",
		createdAt: "17th Apr 2024, 12:30PM",
		severity: "Mild",
		status: "Active",
	},
	{
		allergen: "Ibuprofen",
		id: "ALG-101",
		reaction: "Nausea, abdominal pain",
		createdAt: "17th Apr 2024, 12:30PM",
		severity: "Mild",
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

export const recentAllergyHeaders = [
	{ label: "Allergen", key: "allergen" },
	{ label: "Allergy ID", key: "id" },
	{ label: "Reaction", key: "reaction" },
	{ label: "Created at", key: "createdAt" },
	{ label: "Severity", key: "severity" },
	{ label: "Status", key: "status" },
];
