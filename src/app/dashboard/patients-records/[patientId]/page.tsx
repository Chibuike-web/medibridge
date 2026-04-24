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

export default function PatientPage({
	searchParams,
	params,
}: {
	searchParams: Promise<{ section: string }>;
	params: Promise<{ patientId: string }>;
}) {
	return (
		<div>
			<div>
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
		<div>
			<Suspense fallback={null}>
				<SectionTabs />
			</Suspense>
			<Suspense fallback={null}>
				<SectionContent searchParams={searchParams} params={params} />
			</Suspense>
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
	if (section === "diagnoses") {
		return <DiagnosesSection section={section} patientId={patientId} />;
	}

	if (section === "allergies") {
		return <AllergiesSection section={section} patientId={patientId} />;
	}

	if (section === "immunization") {
		return <ImmunizationSection section={section} patientId={patientId} />;
	}

	if (section === "procedures") {
		return <ProceduresSection section={section} patientId={patientId} />;
	}

	if (section === "medications") {
		return <MedicationsSection section={section} patientId={patientId} />;
	}

	if (section === "encounters") {
		return <EncountersSection section={section} patientId={patientId} />;
	}

	if (section === "lab-tests") {
		return <LabTestsSection section={section} patientId={patientId} />;
	}

	if (section === "imaging") {
		return <ImagingSection section={section} patientId={patientId} />;
	}
}

type PatientSectionProps = {
	section: string;
	patientId: string;
};

function DiagnosesSection({ section, patientId }: PatientSectionProps) {
	if (diagnoses.length === 0) {
		return renderEmptyState(
			"No Diagnoses yet",
			"No diagnoses have been recorded for this patient.",
			"Add diagnosis",
		);
	}

	return (
		<DiagnosesTable patientId={patientId} section={section} />
	);
}

function AllergiesSection({ section, patientId }: PatientSectionProps) {
	const allergies: unknown[] = [];

	if (allergies.length === 0) {
		return renderEmptyState(
			"No Allergies yet",
			"No allergies have been recorded for this patient.",
			"Add allergy",
		);
	}

	return (
		<div className="px-6 py-3">
			{section}:{patientId} allergies table
		</div>
	);
}

function ImmunizationSection({ section, patientId }: PatientSectionProps) {
	const immunizations: unknown[] = [];

	if (immunizations.length === 0) {
		return renderEmptyState(
			"No Immunization yet",
			"No immunizations have been recorded for this patient.",
			"Add immunization",
		);
	}

	return (
		<div className="px-6 py-3">
			{section}:{patientId} immunization table
		</div>
	);
}

function ProceduresSection({ section, patientId }: PatientSectionProps) {
	const procedures: unknown[] = [];

	if (procedures.length === 0) {
		return renderEmptyState(
			"No Procedures yet",
			"No procedures have been recorded for this patient.",
			"Add procedures",
		);
	}

	return (
		<div className="px-6 py-3">
			{section}:{patientId} procedures table
		</div>
	);
}

function MedicationsSection({ section, patientId }: PatientSectionProps) {
	const medications: unknown[] = [];

	if (medications.length === 0) {
		return renderEmptyState(
			"No Medications yet",
			"This patient has no recorded medications.",
			"Add medication",
		);
	}

	return (
		<div className="px-6 py-3">
			{section}:{patientId} medications table
		</div>
	);
}

function EncountersSection({ section, patientId }: PatientSectionProps) {
	const encounters: unknown[] = [];

	if (encounters.length === 0) {
		return renderEmptyState(
			"No Encounters yet",
			"No encounters have been recorded for this patient.",
			"Add encounter",
		);
	}

	return (
		<div className="px-6 py-3">
			{section}:{patientId} encounters table
		</div>
	);
}

function LabTestsSection({ section, patientId }: PatientSectionProps) {
	const labTests: unknown[] = [];

	if (labTests.length === 0) {
		return renderEmptyState(
			"No lab tests yet",
			"No lab tests have been recorded for this patient.",
			"Add lab tests",
		);
	}

	return (
		<div className="px-6 py-3">
			{section}:{patientId} lab tests table
		</div>
	);
}

function ImagingSection({ section, patientId }: PatientSectionProps) {
	const imagingStudies: unknown[] = [];

	if (imagingStudies.length === 0) {
		return renderEmptyState(
			"No Imaging yet",
			"No Imaging have been recorded for this patient.",
			"Add imaging",
		);
	}

	return (
		<div className="px-6 py-3">
			{section}:{patientId} imaging table
		</div>
	);
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
