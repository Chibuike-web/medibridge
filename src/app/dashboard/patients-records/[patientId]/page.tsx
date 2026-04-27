import { Suspense } from "react";
import { RiArrowLeftLine, RiArrowRightSLine } from "@remixicon/react";
import { patients } from "@/features/transfers/data";
import { diagnoses } from "@/features/patients/diagnoses-data";
import { DiagnosesTable } from "@/features/patients/components/diagnoses-table";
import Link from "next/link";
import Image from "next/image";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { getInitials } from "@/lib/utils/get-initials";
import { StatusBadge } from "@/components/status-badge";
import { CopyIdButton } from "@/components/copy-id-button";
import { SectionTabs } from "../../../../features/patients/components/section-tabs";
import { PatientSectionProps } from "@/features/patients/types";
import { PatientOverviewSection } from "@/features/patients/components/patient-overview-section";
import { PatientDetailsSection } from "@/features/patients/components/patient-details-section";

export default function PatientPage({
	searchParams,
	params,
}: {
	searchParams: Promise<{ section: string }>;
	params: Promise<{ patientId: string }>;
}) {
	return (
		<div className="flex h-full min-h-0 flex-col overflow-hidden">
			<div className="shrink-0">
				<nav
					aria-label="Breadcrumb"
					className="flex items-center gap-2 border-b border-gray-200 px-6 py-5"
				>
					<Link href="/dashboard/patients-records" className="flex items-center gap-2 shrink-0">
						<RiArrowLeftLine aria-hidden="true" /> <span>Patient Record</span>
					</Link>
					<RiArrowRightSLine aria-hidden="true" />
					<Suspense>
						<BreadCrumb searchParams={searchParams} params={params} />
					</Suspense>
				</nav>
				<Suspense>
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

	const patientName = patients.find((p) => p.patientId === patientId)?.name;

	return (
		<>
			<span className="shrink-0">{patientName}</span>
			<RiArrowRightSLine aria-hidden="true" />
			<span className="font-semibold shrink-0">{formatSectionLabel(section)}</span>
		</>
	);
}

async function Header({ params }: { params: Promise<{ patientId: string }> }) {
	const { patientId } = await params;
	const patientName = patients.find((p) => p.patientId === patientId)?.name;
	return (
		<div className="flex items-center gap-3 border-b border-gray-200 px-6 py-3.5 text-sm">
			<Avatar className="size-16 border border-gray-200 bg-gray-100 text-gray-700">
				<AvatarFallback className="bg-gray-100 text-2xl font-semibold text-gray-700">
					{getInitials(patientName ?? "")}
				</AvatarFallback>
			</Avatar>

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
						<CopyIdButton id="PAT-101" />
					</div>

					<div className="flex items-center shrink-0 gap-1">
						<span className="text-gray-400">Email:</span>
						<span className="font-semibold text-gray-600">chibuikemaduabuchi2023@gmail.com</span>
					</div>
					<div className="flex items-center shrink-0 gap-1">
						<span className="text-gray-400">Phone Number:</span>
						<span className="font-semibold text-gray-600">1234567890</span>
					</div>
					<div className="flex items-center shrink-0 gap-1">
						<span className="text-gray-400">Address:</span>
						<span className="font-semibold text-gray-600">
							12 Allen Avenue, Ikeja, Lagos, Nigeria
						</span>
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
			<Suspense fallback={null}>
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

function renderSectionContent(section: string, patientId: string) {
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
	const allergies: unknown[] = [];

	if (allergies.length === 0) {
		return renderEmptyState(
			"No Allergies yet",
			"No allergies have been recorded for this patient.",
			"Add allergy",
		);
	}

	return <div className="px-6 py-3">{patientId} allergies table</div>;
}

function ImmunizationSection({ patientId }: { patientId: string }) {
	const immunizations: unknown[] = [];

	if (immunizations.length === 0) {
		return renderEmptyState(
			"No Immunization yet",
			"No immunizations have been recorded for this patient.",
			"Add immunization",
		);
	}

	return <div className="px-6 py-3">{patientId} immunization table</div>;
}

function ProceduresSection({ patientId }: { patientId: string }) {
	const procedures: unknown[] = [];

	if (procedures.length === 0) {
		return renderEmptyState(
			"No Procedures yet",
			"No procedures have been recorded for this patient.",
			"Add procedures",
		);
	}

	return <div className="px-6 py-3">:{patientId} procedures table</div>;
}

function MedicationsSection({ patientId }: { patientId: string }) {
	const medications: unknown[] = [];

	if (medications.length === 0) {
		return renderEmptyState(
			"No Medications yet",
			"This patient has no recorded medications.",
			"Add medication",
		);
	}

	return <div className="px-6 py-3">{patientId} medications table</div>;
}

function EncountersSection({ patientId }: { patientId: string }) {
	const encounters: unknown[] = [];

	if (encounters.length === 0) {
		return renderEmptyState(
			"No Encounters yet",
			"No encounters have been recorded for this patient.",
			"Add encounter",
		);
	}

	return <div className="px-6 py-3">{patientId} encounters table</div>;
}

function LabTestsSection({ patientId }: { patientId: string }) {
	const labTests: unknown[] = [];

	if (labTests.length === 0) {
		return renderEmptyState(
			"No lab tests yet",
			"No lab tests have been recorded for this patient.",
			"Add lab tests",
		);
	}

	return <div className="px-6 py-3">{patientId} lab tests table</div>;
}

function ImagingSection({ patientId }: { patientId: string }) {
	const imagingStudies: unknown[] = [];

	if (imagingStudies.length === 0) {
		return renderEmptyState(
			"No Imaging yet",
			"No Imaging have been recorded for this patient.",
			"Add imaging",
		);
	}

	return <div className="px-6 py-3">{patientId} imaging table</div>;
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
		<div className="flex min-h-[calc(100vh-220px)] items-center justify-center px-6 py-12">
			<div className="relative flex w-[500px] max-w-full items-end justify-center">
				<Image
					src="/assets/empty-state.svg"
					alt=""
					aria-hidden="true"
					width={500}
					height={336}
					className="h-auto w-[500px] max-w-full"
				/>
				<div className="absolute inset-x-0 bottom-0 z-10 flex flex-col items-center text-center">
					<h2 className="mb-4 text-2xl font-semibold text-gray-900">{title}</h2>
					<p className="mb-8 max-w-[32rem] text-pretty text-gray-500">{description}</p>
					<Button size="lg" type="button">
						{action}
					</Button>
				</div>
			</div>
		</div>
	);
}

function formatSectionLabel(value: string) {
	return value
		.split("-")
		.filter(Boolean)
		.map((word) => word[0].toUpperCase() + word.slice(1))
		.join(" ");
}
