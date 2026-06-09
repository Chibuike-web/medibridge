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
import { getPatientProfile } from "@/lib/api/get-patient-profile";
import { cn } from "@/lib/utils/cn";
import { notFound } from "next/navigation";

type OverviewItem = {
	label: string;
	value: string | number;
};

type RecentDiagnosis = {
	name: string;
	diagnosedAt: string;
	lastReviewed: string;
	id: string;
	createdAt: string;
	status: "Active" | "Resolved";
};

type RecentAllergy = {
	allergen: string;
	id: string;
	reaction: string;
	createdAt: string;
	severity: string;
	status: "Active" | "Inactive";
};

export async function PatientOverviewSection({ patientId }: { patientId: string }) {
	const profile = await getPatientProfile(patientId);

	if (!profile) {
		notFound();
	}

	return (
		<div className="p-8">
			<div className="mx-auto max-w-7xl">
				<h1 className="mb-6 text-xl font-semibold text-gray-800">Patient Overview</h1>
				<div className="flex flex-col gap-10">
					<PersonalInformation personalInfo={profile.overviewPersonalInformation} />
					<MedicalInformation medicalInfo={profile.overviewMedicalInformation} />
					<RecentDiagnoses recentDiagnoses={profile.recentDiagnoses} />
					<RecentAllergies recentAllergies={profile.recentAllergies} />
				</div>
			</div>
		</div>
	);
}

function PersonalInformation({ personalInfo }: { personalInfo: OverviewItem[] }) {
	return (
		<div className="rounded-xl bg-gray-50 ring ring-gray-200">
			<div className="p-4">
				<h2 className="font-semibold text-lg text-gray-600 no-line-height">Personal Information</h2>
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

function MedicalInformation({ medicalInfo }: { medicalInfo: OverviewItem[] }) {
	return (
		<div className="rounded-xl bg-gray-50 ring ring-gray-200">
			<div className="p-4">
				<h2 className="font-semibold text-lg text-gray-600 no-line-height">Medical Information</h2>
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

function RecentDiagnoses({ recentDiagnoses }: { recentDiagnoses: RecentDiagnosis[] }) {
	return (
		<div className="flex flex-col gap-4">
			<h2 className="font-semibold text-lg text-gray-600 no-line-height">Recent Diagnoses</h2>
			<div className="overflow-hidden rounded-xl ring ring-gray-200">
				<Table className="border-separate border-spacing-0 bg-white">
					<TableHeader className="bg-gray-50">
						<TableRow className="hover:bg-transparent">
							{recentDiagnosisHeaders.map((h) => (
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
								<TableCell className="px-4 h-14 font-medium text-gray-700">
									{diagnosis.name}
								</TableCell>
								<TableCell className="px-4 h-14 text-gray-500">{diagnosis.diagnosedAt}</TableCell>
								<TableCell className="px-4 h-14 text-gray-500">{diagnosis.lastReviewed}</TableCell>
								<TableCell className="px-4 h-14 font-medium text-gray-600">
									<CopyIdButton id={diagnosis.id} />
								</TableCell>
								<TableCell className="px-4 h-14 text-gray-500">{diagnosis.createdAt}</TableCell>
								<TableCell className={cn("px-4 h-14", index === 0 && "rounded-tr-xl")}>
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

function RecentAllergies({ recentAllergies }: { recentAllergies: RecentAllergy[] }) {
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
								<TableCell className="px-4 h-14 font-medium text-gray-700">
									{allergy.allergen}
								</TableCell>
								<TableCell className="px-4 h-14 font-medium text-gray-600">
									<CopyIdButton id={allergy.id} />
								</TableCell>
								<TableCell className="px-4 h-14 text-gray-500">{allergy.reaction}</TableCell>
								<TableCell className="px-4 h-14 text-gray-500">{allergy.createdAt}</TableCell>
								<TableCell className="px-4 h-14 text-gray-500">{allergy.severity}</TableCell>
								<TableCell className={cn("px-4 h-14", index === 0 && "rounded-tr-xl")}>
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

const recentDiagnosisHeaders = [
	{ label: "Diagnosis name", key: "name" },
	{ label: "Diagnosed At", key: "diagnosedAt" },
	{ label: "Last Reviewed", key: "lastReviewed" },
	{ label: "Diagnosis ID", key: "id" },
	{ label: "Created At", key: "createdAt" },
	{ label: "Status", key: "status" },
];

const recentAllergyHeaders = [
	{ label: "Allergen", key: "allergen" },
	{ label: "Allergy ID", key: "id" },
	{ label: "Reaction", key: "reaction" },
	{ label: "Created at", key: "createdAt" },
	{ label: "Severity", key: "severity" },
	{ label: "Status", key: "status" },
];
