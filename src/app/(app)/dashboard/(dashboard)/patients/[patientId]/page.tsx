import { Suspense } from "react";
import { RiArrowLeftLine, RiArrowRightSLine } from "@remixicon/react";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { CopyIdButton } from "@/components/copy-id-button";
import { SectionTabs, type PatientSection } from "@/features/patients/components/section-tabs";
import { PatientOverviewSection } from "@/features/patients/components/patient-overview-section";
import { PatientDetailsSection } from "@/features/patients/components/patient-details-section/patient-details-section";
import { PatientAvatarMenu } from "@/features/patients/components/patient-avatar-menu";
import { getPatientById } from "@/lib/api/get-patient-by-id";
import { getPatientAllergies } from "@/lib/api/get-patient-allergies";
import { getPatientDiagnoses } from "@/lib/api/get-patient-diagnoses";
import { getPatientEncounters } from "@/lib/api/get-patient-encounters";
import { getPatientImaging } from "@/lib/api/get-patient-imaging";
import { getPatientImmunizations } from "@/lib/api/get-patient-immunizations";
import { getPatientLabTests } from "@/lib/api/get-patient-lab-tests";
import { getPatientMedications } from "@/lib/api/get-patient-medications";
import { getPatientProcedures } from "@/lib/api/get-patient-procedures";
import { verifySession } from "@/lib/api/verify-session";
import {
	AllergiesClient,
	DiagnosesClient,
	EncountersClient,
	ImagingClient,
	ImmunizationsClient,
	LabTestsClient,
	MedicationsClient,
	ProceduresClient,
} from "./patient-section-table-clients";

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

	if (!patient) {
		notFound();
	}

	return (
		<>
			<span className="shrink-0">
				{patient.firstName} {patient.lastName}
			</span>
			<RiArrowRightSLine aria-hidden="true" />
			<span className="font-semibold shrink-0">{formatPatientSectionLabel(section)}</span>
		</>
	);
}

async function Header({ params }: { params: Promise<{ patientId: string }> }) {
	const { patientId } = await params;
	const patient = await getPatientById(patientId);

	if (!patient) {
		notFound();
	}

	const patientName = `${patient.firstName} ${patient.lastName}`;
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
						<span className="font-semibold text-gray-600">{patient.sex ?? "-"}</span>
					</div>
					<div className="flex items-center shrink-0 gap-1">
						<span>Patient ID:</span>
						<CopyIdButton id={patient.patientId} className="min-w-0" />
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

async function Main({
	searchParams,
	params,
}: {
	searchParams: Promise<{ section: string }>;
	params: Promise<{ patientId: string }>;
}) {
	const { section } = await searchParams;

	return (
		<div className="flex min-h-0 flex-1 flex-col">
			<Suspense fallback={<SectionTabsSkeleton />}>
				<SectionTabs activeSection={section as PatientSection} />
			</Suspense>
			<div className="min-h-0 flex-1 overflow-y-auto">
				<Suspense fallback={<SectionContentSkeleton section={section} />}>
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

async function DiagnosesSection({ patientId }: { patientId: string }) {
	const { diagnoses, totalDiagnoses } = await getPatientDiagnoses(patientId);

	if (diagnoses.length === 0) {
		return renderEmptyState(
			"No Diagnoses yet",
			"No diagnoses have been recorded for this patient.",
			"Add diagnosis",
		);
	}

	return (
		<DiagnosesClient
			patientId={patientId}
			diagnoses={diagnoses}
			page={1}
			limit={14}
			totalPages={Math.ceil(totalDiagnoses / 14) || 1}
		/>
	);
}

async function AllergiesSection({ patientId }: { patientId: string }) {
	const { allergies, totalAllergies } = await getPatientAllergies(patientId);

	if (allergies.length === 0) {
		return renderEmptyState(
			"No Allergies yet",
			"No allergies have been recorded for this patient.",
			"Add allergy",
		);
	}

	return (
		<AllergiesClient
			patientId={patientId}
			allergies={allergies}
			page={1}
			limit={14}
			totalPages={Math.ceil(totalAllergies / 14) || 1}
		/>
	);
}

async function ImmunizationSection({ patientId }: { patientId: string }) {
	const { immunizations, totalImmunizations } = await getPatientImmunizations(patientId);

	if (immunizations.length === 0) {
		return renderEmptyState(
			"No Immunizations yet",
			"No immunizations have been recorded for this patient.",
			"Add immunization",
		);
	}

	return (
		<ImmunizationsClient
			patientId={patientId}
			immunizations={immunizations}
			page={1}
			limit={14}
			totalPages={Math.ceil(totalImmunizations / 14) || 1}
		/>
	);
}

async function ProceduresSection({ patientId }: { patientId: string }) {
	const { procedures, totalProcedures } = await getPatientProcedures(patientId);

	if (procedures.length === 0) {
		return renderEmptyState(
			"No Procedures yet",
			"No procedures have been recorded for this patient.",
			"Add procedure",
		);
	}

	return (
		<ProceduresClient
			patientId={patientId}
			procedures={procedures}
			page={1}
			limit={14}
			totalPages={Math.ceil(totalProcedures / 14) || 1}
		/>
	);
}

async function MedicationsSection({ patientId }: { patientId: string }) {
	const { medications, totalMedications } = await getPatientMedications(patientId);

	if (medications.length === 0) {
		return renderEmptyState(
			"No Medications yet",
			"No medications have been recorded for this patient.",
			"Add medication",
		);
	}

	return (
		<MedicationsClient
			patientId={patientId}
			medications={medications}
			page={1}
			limit={14}
			totalPages={Math.ceil(totalMedications / 14) || 1}
		/>
	);
}

async function EncountersSection({ patientId }: { patientId: string }) {
	const { encounters, totalEncounters } = await getPatientEncounters(patientId);

	if (encounters.length === 0) {
		return renderEmptyState(
			"No Encounters yet",
			"No encounters have been recorded for this patient.",
			"Add encounter",
		);
	}

	return (
		<EncountersClient
			patientId={patientId}
			encounters={encounters}
			page={1}
			limit={14}
			totalPages={Math.ceil(totalEncounters / 14) || 1}
		/>
	);
}

async function LabTestsSection({ patientId }: { patientId: string }) {
	const { labTests, totalLabTests } = await getPatientLabTests(patientId);

	if (labTests.length === 0) {
		return renderEmptyState(
			"No Lab Tests yet",
			"No lab tests have been recorded for this patient.",
			"Add lab test",
		);
	}

	return (
		<LabTestsClient
			patientId={patientId}
			labTests={labTests}
			page={1}
			limit={14}
			totalPages={Math.ceil(totalLabTests / 14) || 1}
		/>
	);
}

async function ImagingSection({ patientId }: { patientId: string }) {
	const { imagingStudies, totalImagingStudies } = await getPatientImaging(patientId);

	if (imagingStudies.length === 0) {
		return renderEmptyState(
			"No Imaging yet",
			"No imaging studies have been recorded for this patient.",
			"Add imaging",
		);
	}

	return (
		<ImagingClient
			patientId={patientId}
			imagingStudies={imagingStudies}
			page={1}
			limit={14}
			totalPages={Math.ceil(totalImagingStudies / 14) || 1}
		/>
	);
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

function SectionContentSkeleton({ section }: { section: string }) {
	if (section === "patient-overview" || section === "patient-details") {
		return <CardSectionSkeleton />;
	}

	return <TableSectionSkeleton />;
}

function CardSectionSkeleton() {
	return (
		<div className="p-8">
			<div className="mx-auto max-w-7xl">
				<div className="mb-6 h-7 w-48 animate-pulse rounded bg-gray-200" />
				<div className="flex flex-col gap-10">
					{Array.from({ length: 4 }).map((_, sectionIndex) => (
						<div
							key={sectionIndex}
							className="overflow-hidden rounded-xl bg-gray-50 ring ring-gray-200"
						>
							<div className="p-4">
								<div className="h-5 w-44 animate-pulse rounded bg-gray-200" />
							</div>
							<div className="grid grid-cols-[repeat(auto-fill,minmax(20rem,1fr))] gap-6 rounded-xl bg-white p-4 ring ring-gray-200">
								{Array.from({ length: sectionIndex < 2 ? 6 : 4 }).map((_, itemIndex) => (
									<div key={itemIndex} className="flex flex-col gap-4">
										<div className="h-4 w-28 animate-pulse rounded bg-gray-100" />
										<div className="h-4 w-44 animate-pulse rounded bg-gray-200" />
									</div>
								))}
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}

function TableSectionSkeleton() {
	return (
		<div className="p-8">
			<div className="mx-auto max-w-7xl">
				<div className="mb-6 h-7 w-48 animate-pulse rounded bg-gray-200" />
				<div className="mb-4 flex items-center gap-2">
					<div className="h-10 flex-1 animate-pulse rounded-md bg-gray-200" />
					<div className="h-10 w-24 animate-pulse rounded-md bg-gray-200" />
					<div className="h-10 w-24 animate-pulse rounded-md bg-gray-200" />
					<div className="h-10 w-32 animate-pulse rounded-md bg-gray-200" />
				</div>
				<div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
					<div className="grid grid-cols-6 gap-3 border-b border-gray-200 bg-gray-50 p-4">
						{Array.from({ length: 6 }).map((_, index) => (
							<div key={index} className="h-4 animate-pulse rounded bg-gray-200" />
						))}
					</div>
					<div className="divide-y divide-gray-200">
						{Array.from({ length: 6 }).map((_, rowIndex) => (
							<div key={rowIndex} className="grid grid-cols-6 gap-3 p-4">
								{Array.from({ length: 6 }).map((_, cellIndex) => (
									<div key={cellIndex} className="h-4 animate-pulse rounded bg-gray-100" />
								))}
							</div>
						))}
					</div>
				</div>
			</div>
		</div>
	);
}
