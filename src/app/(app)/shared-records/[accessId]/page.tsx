import { Suspense } from "react";
import { RiInformationLine } from "@remixicon/react";
import { SharedRecordsClient } from "./shared-records-client";
import {
	getSharedSection,
	type SharedPatient,
	type SharedPatientDetailSection,
	type SharedSection,
} from "./shared-record-sections";
import { SharedTabs } from "./shared-tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { hasVerifiedExternalAccessSession } from "@/lib/api/external-access-session";
import { getInitials } from "@/lib/utils/get-initials";
import { redirect } from "next/navigation";

export const metadata = {
	title: "Shared Patient Record",
};

type SharedRecordsPageProps = Pick<PageProps<"/shared-records/[accessId]">, "params"> & {
	searchParams: Promise<{ section?: string }>;
};

export default async function SharedRecordsPage({ params, searchParams }: SharedRecordsPageProps) {
	return (
		<div className="min-h-dvh bg-white text-gray-800">
			<Suspense fallback={<SharedRecordsPageSkeleton />}>
				<SharedRecordsContent params={params} searchParams={searchParams} />
			</Suspense>
		</div>
	);
}

async function SharedRecordsContent({ params, searchParams }: SharedRecordsPageProps) {
	const [{ accessId }, { section }] = await Promise.all([params, searchParams]);
	const hasVerifiedAccessSession = await hasVerifiedExternalAccessSession(accessId);

	if (!hasVerifiedAccessSession) {
		redirect(`/verify-access/${accessId}`);
	}

	const activeSection = getSharedSection(section);
	const sharedRecord = await getSharedRecord(accessId);

	return (
		<>
			<SharedAccessBanner />
			<PatientHeader patient={sharedRecord.patient} />
			<nav className="border-b border-gray-200" aria-label="Shared record sections">
				<SharedTabs activeSection={activeSection} />
			</nav>
			<SharedRecordsClient
				patientDetailsSections={sharedRecord.patientDetailsSections}
				activeSection={activeSection}
			/>
		</>
	);
}

async function getSharedRecord(accessId: string): Promise<{
	patient: SharedPatient;
	patientDetailsSections: SharedPatientDetailSection[];
}> {
	return {
		patient: {
			name: "Chibuike T. Maduabuchi",
			sex: "Male",
			email: "chibuikemaduabuchi2023@gmail.com",
			phoneNumber: "1234567890",
			address: "12 Allen Avenue, Ikeja, Lagos, Nigeria",
		},
		patientDetailsSections: [
			{
				title: "Personal Information",
				items: [
					{ label: "First Name", value: "Chibuike" },
					{ label: "Middle Name", value: "T." },
					{ label: "Last Name", value: "Maduabuchi" },
					{ label: "Access ID", value: accessId },
					{ label: "Age", value: 32 },
					{ label: "Date of Birth", value: "1994-02-10" },
					{ label: "Sex", value: "Male" },
					{ label: "Marital Status", value: "Single" },
				],
			},
			{
				title: "Contact Information",
				items: [
					{ label: "Phone Number", value: "1234567890" },
					{ label: "Email Address", value: "chibuikemaduabuchi2023@gmail.com" },
					{ label: "Residential Address", value: "12 Allen Avenue, Ikeja, Lagos, Nigeria" },
					{ label: "State of Origin", value: "Lagos State" },
					{ label: "Country of Origin", value: "Nigeria" },
				],
			},
			{
				title: "Emergency Contact",
				items: [
					{ label: "First Name", value: "Emmanuel" },
					{ label: "Last Name", value: "Okafor" },
					{ label: "Relationship", value: "Brother" },
					{ label: "Phone Number", value: "+2348098765432" },
				],
			},
			{
				title: "Physical Information",
				items: [
					{ label: "Height", value: "175 cm" },
					{ label: "Weight", value: "68 kg" },
					{ label: "Blood Group", value: "O+" },
					{ label: "Genotype", value: "AA" },
				],
			},
		],
	};
}

function SharedAccessBanner() {
	return (
		<div className="bg-[#fff3c4] text-[#b94600]">
			<div className="mx-auto flex w-full max-w-7xl items-center gap-3 px-6 py-4 ">
				<RiInformationLine className="shrink-0" aria-hidden="true" />
				<div className="flex flex-col gap-1 text-sm leading-5">
					<p className="font-semibold">Shared Patient Record</p>
					<p>
						You are viewing a patient record securely shared by{" "}
						<span className="font-semibold">Lagos State University Teaching Hospital.</span> This
						session is <span className="font-semibold">view-only</span> and expires on{" "}
						<span className="font-semibold">12 Jan 2027 at 11:59 PM.</span>
					</p>
				</div>
			</div>
		</div>
	);
}

function PatientHeader({ patient }: { patient: SharedPatient }) {
	return (
		<header className="border-b border-gray-200">
			<div className="mx-auto flex w-full max-w-7xl items-center gap-5 px-6 py-3.5">
				<Avatar className="size-16 border border-gray-200 bg-gray-100 text-gray-700 relative">
					<AvatarFallback className="bg-gray-100 text-2xl font-semibold text-gray-700">
						{getInitials(patient.name)}
					</AvatarFallback>
				</Avatar>

				<div className="min-w-0">
					<h1 className="text-xl font-semibold text-gray-900">{patient.name}</h1>
					<div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
						<HeaderMeta label="Sex" value={patient.sex} />
						<HeaderMeta label="Email" value={patient.email} />
						<HeaderMeta label="Phone Number" value={patient.phoneNumber} />
						<HeaderMeta label="Address" value={patient.address} />
					</div>
				</div>
			</div>
		</header>
	);
}

function HeaderMeta({ label, value }: { label: string; value: string }) {
	return (
		<p className="flex items-center gap-2">
			<span className="text-gray-400">{label}:</span>
			<span className="font-semibold text-gray-600">{value}</span>
		</p>
	);
}

function SharedRecordsPageSkeleton() {
	return (
		<div aria-busy="true">
			<div className="bg-[#fff3c4]">
				<div className="mx-auto flex w-full max-w-7xl items-center gap-3 px-6 py-4">
					<div className="size-6 shrink-0 rounded-full bg-[#f6d878]" />
					<div className="flex flex-1 flex-col gap-2">
						<div className="h-4 w-44 rounded bg-[#f6d878]" />
						<div className="h-4 w-full max-w-3xl rounded bg-[#f6d878]" />
					</div>
				</div>
			</div>
			<header className="border-b border-gray-200">
				<div className="mx-auto flex w-full max-w-7xl items-center gap-5 px-6 py-3.5">
					<div className="size-16 rounded-full bg-gray-100" />
					<div className="min-w-0 flex-1">
						<div className="h-5 w-64 rounded bg-gray-100" />
						<div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
							<div className="h-4 w-20 rounded bg-gray-100" />
							<div className="h-4 w-56 rounded bg-gray-100" />
							<div className="h-4 w-36 rounded bg-gray-100" />
							<div className="h-4 w-72 rounded bg-gray-100" />
						</div>
					</div>
				</div>
			</header>
			<div className="border-b border-gray-200">
				<div className="mx-auto flex w-full max-w-7xl gap-4 px-6 py-3">
					<div className="h-4 w-28 rounded bg-gray-100" />
					<div className="h-4 w-24 rounded bg-gray-100" />
					<div className="h-4 w-24 rounded bg-gray-100" />
					<div className="h-4 w-32 rounded bg-gray-100" />
				</div>
			</div>
			<main className="mx-auto w-full max-w-7xl px-6 py-9">
				<div className="h-6 w-40 rounded bg-gray-100" />
				<div className="mt-6 grid gap-3">
					<div className="h-12 rounded bg-gray-100" />
					<div className="h-12 rounded bg-gray-100" />
					<div className="h-12 rounded bg-gray-100" />
				</div>
			</main>
		</div>
	);
}
