import { Suspense } from "react";
import { RiArrowLeftLine, RiArrowRightSLine } from "@remixicon/react";
import { patients } from "@/features/patients/data";
import { diagnoses } from "@/features/patients/diagnoses-data";
import { DiagnosesTable } from "@/features/patients/components/diagnoses-table";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { CopyIdButton } from "@/components/copy-id-button";
import { SectionTabs } from "../../../../../../features/patients/components/section-tabs";
import { PatientOverviewSection } from "@/features/patients/components/patient-overview-section";
import { PatientDetailsSection } from "@/features/patients/components/patient-details-section/patient-details-section";
import { AllergiesTable } from "@/features/patients/components/allergies-table";
import { ImmunizationsTable } from "@/features/patients/components/immunizations-table";
import { ProceduresTable } from "@/features/patients/components/procedures-table";
import { MedicationsTable } from "@/features/patients/components/medications-table";
import { EncountersTable } from "@/features/patients/components/encounters-table";
import { LabTestsTable } from "@/features/patients/components/lab-tests-table";
import { ImagingTable } from "@/features/patients/components/imaging-table";
import { PatientAvatarMenu } from "@/features/patients/components/patient-avatar-menu";
import { getPatientById } from "@/lib/api/get-patient-by-id";
import { getPatientEncounters } from "@/lib/api/get-patient-encounters";
import { verifySession } from "@/lib/api/verify-session";

export const metadata = {
	title: "Patient",
};

export default async function PatientPage({
	searchParams,
	params,
}: {
	searchParams: Promise<{ section: string }>;
	params: Promise<{ patientId: string }>;
}) {
	await verifySession();

	return (
		<div className="flex h-full min-h-0 flex-col overflow-hidden">
			<div className="shrink-0">
				<nav
					aria-label="Breadcrumb"
					className="flex items-center gap-2 border-b border-gray-200 px-6 py-5"
				>
					<Link href="/dashboard/patients" className="flex items-center gap-2 shrink-0">
						<RiArrowLeftLine aria-hidden="true" /> <span>Patients</span>
					</Link>
					<RiArrowRightSLine aria-hidden="true" />
					<Suspense fallback={<BreadCrumbSkeleton />}>
						<BreadCrumb searchParams={searchParams} params={params} />
					</Suspense>
				</nav>
				<Suspense fallback={<HeaderSkeleton />}>
					<Header params={params} />
				</Suspense>
			</div>
			<Main searchParams={searchParams} params={params} />
		</div>
	);
}

async function BreadCrumb({
	searchParams,
	params,
}: {
	searchParams: Promise<{ section: string }>;
	params: Promise<{ patientId: string }>;
}) {
	const [{ section }, { patientId }] = await Promise.all([searchParams, params]);

	const patient = await getPatientById(patientId);
	return (
		<>
			<span className="shrink-0">
				{patient?.firstName} {patient?.lastName}
			</span>
			<RiArrowRightSLine aria-hidden="true" />
			<span className="font-semibold shrink-0">{formatPatientSectionLabel(section)}</span>
		</>
	);
}

async function Header({ params }: { params: Promise<{ patientId: string }> }) {
	const { patientId } = await params;
	const patient = await getPatientById(patientId);
	const patientName = `${patient?.firstName} ${patient?.lastName}`;
	return (
		<div className="flex items-center gap-3 border-b border-gray-200 px-6 py-3.5 text-sm">
			<PatientAvatarMenu patientName={patientName ?? ""} />

			<div className="flex flex-col gap-4">
				<div className="flex items-center gap-2.5">
					<h1 className="text-xl font-semibold">{patientName}</h1>
					<StatusBadge status="Active" />
				</div>
				<div className="flex items-center gap-4">
					<div className="flex items-center shrink-0 gap-1">
						<span className="text-gray-400">Sex:</span>
						<span className="font-semibold text-gray-600">Male</span>
					</div>
					<div className="flex items-center shrink-0 gap-1">
						<span>Patient ID:</span>
						<CopyIdButton id={patient?.patientId as string} className="min-w-0" />
					</div>

					<div className="flex items-center shrink-0 gap-1">
						<span className="text-gray-400">Email:</span>
						<span className="font-semibold text-gray-600">{patient?.email}</span>
					</div>
					<div className="flex items-center shrink-0 gap-1">
						<span className="text-gray-400">Phone Number:</span>
						<span className="font-semibold text-gray-600">{patient?.phoneNumber}</span>
					</div>
					<div className="flex items-center shrink-0 gap-1">
						<span className="text-gray-400">Address:</span>
						<span className="font-semibold text-gray-600">{patient?.address} </span>
					</div>
				</div>
			</div>
		</div>
	);
}

function Main({
	searchParams,
	params,
}: {
	searchParams: Promise<{ section: string }>;
	params: Promise<{ patientId: string }>;
}) {
	return (
		<div className="flex min-h-0 flex-1 flex-col">
			<Suspense fallback={<SectionTabsSkeleton />}>
				<SectionTabs />
			</Suspense>
			<div className="min-h-0 flex-1 overflow-y-auto">
				<Suspense fallback={null}>
					<SectionContent searchParams={searchParams} params={params} />
				</Suspense>
			</div>
		</div>
	);
}

async function SectionContent({
	searchParams,
	params,
}: {
	searchParams: Promise<{ section: string }>;
	params: Promise<{ patientId: string }>;
}) {
	const [{ section }, { patientId }] = await Promise.all([searchParams, params]);

	return renderSectionContent(section, patientId);
}

async function renderSectionContent(section: string, patientId: string) {
	if (section === "patient-overview") {
		return <PatientOverviewSection patientId={patientId} />;
	}
	if (section === "patient-details") {
		return <PatientDetailsSection patientId={patientId} />;
	}

	if (section === "diagnoses") {
		return <DiagnosesSection patientId={patientId} />;
	}

	if (section === "allergies") {
		return <AllergiesSection patientId={patientId} />;
	}

	if (section === "immunization") {
		return <ImmunizationSection patientId={patientId} />;
	}

	if (section === "procedures") {
		return <ProceduresSection patientId={patientId} />;
	}

	if (section === "medications") {
		return <MedicationsSection patientId={patientId} />;
	}

	if (section === "encounters") {
		return <EncountersSection patientId={patientId} />;
	}

	if (section === "lab-tests") {
		return <LabTestsSection patientId={patientId} />;
	}

	if (section === "imaging") {
		return <ImagingSection patientId={patientId} />;
	}

	if (section === "documents") {
		return <DocumentsSection patientId={patientId} />;
	}
}

function DiagnosesSection({ patientId }: { patientId: string }) {
	if (diagnoses.length === 0) {
		return renderEmptyState(
			"No Diagnoses yet",
			"No diagnoses have been recorded for this patient.",
			"Add diagnosis",
		);
	}

	return <DiagnosesTable patientId={patientId} />;
}

function AllergiesSection({ patientId }: { patientId: string }) {
	return <AllergiesTable patientId={patientId} />;
}

function ImmunizationSection({ patientId }: { patientId: string }) {
	return <ImmunizationsTable patientId={patientId} />;
}

function ProceduresSection({ patientId }: { patientId: string }) {
	return <ProceduresTable patientId={patientId} />;
}

function MedicationsSection({ patientId }: { patientId: string }) {
	return <MedicationsTable patientId={patientId} />;
}

async function EncountersSection({ patientId }: { patientId: string }) {
	const encounters = await getPatientEncounters(patientId);

	if (encounters.length === 0) {
		return renderEmptyState(
			"No Encounters yet",
			"No encounters have been recorded for this patient.",
			"Add encounter",
		);
	}

	return <EncountersTable patientId={patientId} encounters={encounters} />;
}

function LabTestsSection({ patientId }: { patientId: string }) {
	return <LabTestsTable patientId={patientId} />;
}

function ImagingSection({ patientId }: { patientId: string }) {
	return <ImagingTable patientId={patientId} />;
}

function DocumentsSection({ patientId }: { patientId: string }) {
	const documents: unknown[] = [];

	if (documents.length === 0) {
		return renderEmptyState(
			"No Documents yet",
			"No documents have been recorded for this patient.",
			"Add document",
		);
	}

	return <div className="px-6 py-3">{patientId} documents table</div>;
}

function renderEmptyState(title: string, description: string, action: string) {
	return (
		<div className="flex min-h-[calc(100vh-13.75rem)] items-center justify-center px-6 py-12">
			<div className="relative flex w-[31.25rem] max-w-full items-end justify-center">
				<Image
					src="/assets/empty-state.svg"
					alt=""
					aria-hidden="true"
					width={500}
					height={336}
					className="h-auto w-[31.25rem] max-w-full"
				/>
				<div className="absolute inset-x-0 bottom-0 z-10 flex flex-col items-center text-center">
					<h2 className="mb-4 text-2xl font-semibold text-gray-800">{title}</h2>
					<p className="mb-8 max-w-[32rem] text-pretty text-gray-500">{description}</p>
					<Button size="lg" type="button">
						{action}
					</Button>
				</div>
			</div>
		</div>
	);
}

function formatPatientSectionLabel(value: string) {
	return value
		.split("-")
		.filter(Boolean)
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(" ");
}

function BreadCrumbSkeleton() {
	return (
		<div className="flex items-center gap-2">
			<div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
			<div className="h-4 w-4 animate-pulse rounded bg-gray-200" />
			<div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
		</div>
	);
}

function HeaderSkeleton() {
	return (
		<div className="flex items-center gap-3 border-b border-gray-200 px-6 py-3.5">
			<div className="size-14 animate-pulse rounded-full bg-gray-200" />

			<div className="flex flex-col gap-4 flex-1">
				<div className="h-7 w-52 animate-pulse rounded bg-gray-200" />

				<div className="flex gap-4">
					<div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
					<div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
					<div className="h-4 w-48 animate-pulse rounded bg-gray-200" />
				</div>
			</div>
		</div>
	);
}

function SectionTabsSkeleton() {
	return (
		<div className="flex gap-3 border-b border-gray-200 px-6 py-3">
			{Array.from({ length: 6 }).map((_, index) => (
				<div key={index} className="h-9 w-28 animate-pulse rounded-lg bg-gray-200" />
			))}
		</div>
	);
}
