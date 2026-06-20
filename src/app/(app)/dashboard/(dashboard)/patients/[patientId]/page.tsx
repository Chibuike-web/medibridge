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
	return (
		<Suspense fallback={<PatientPageSkeleton />}>
			<PatientPageContent searchParams={searchParams} params={params} />
		</Suspense>
	);
}

async function PatientPageContent({
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

function PatientPageSkeleton() {
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
					<BreadCrumbSkeleton />
				</nav>
				<HeaderSkeleton />
			</div>
			<div className="flex min-h-0 flex-1 flex-col">
				<SectionTabsSkeleton />
				<div className="min-h-0 flex-1 overflow-y-auto">
					<TableSectionSkeleton />
				</div>
			</div>
		</div>
	);
}

function BreadCrumbSkeleton() {
	return (
		<div className="flex items-center gap-2">
			<div className="h-4 w-24 shrink-0 animate-pulse rounded bg-gray-200" />
			<RiArrowRightSLine aria-hidden="true" className="shrink-0 text-gray-400" />
			<div className="h-4 w-32 shrink-0 animate-pulse rounded bg-gray-200" />
		</div>
	);
}

function HeaderSkeleton() {
	return (
		<div className="flex items-center gap-3 border-b border-gray-200 px-6 py-3.5 text-sm">
			<div className="relative shrink-0">
				<div className="size-16 animate-pulse rounded-full border border-gray-200 bg-gray-100" />
				<div className="absolute right-0 bottom-0 size-4.5 animate-pulse rounded-full bg-gray-300 ring ring-gray-800" />
			</div>

			<div className="flex flex-1 flex-col gap-4 overflow-hidden">
				<div className="flex items-center gap-2.5">
					<div className="h-7 w-52 animate-pulse rounded bg-gray-200" />
					<div className="h-6 w-16 animate-pulse rounded-full bg-gray-200" />
				</div>

				<div className="flex items-center gap-4 overflow-hidden">
					<MetaItemSkeleton labelWidth="w-7" valueWidth="w-10" />
					<div className="flex shrink-0 items-center gap-1">
						<div className="h-4 w-16 animate-pulse rounded bg-gray-200" />
						<div className="h-7 w-25 animate-pulse rounded-md bg-gray-200" />
					</div>
					<MetaItemSkeleton labelWidth="w-9" valueWidth="w-44" />
					<MetaItemSkeleton labelWidth="w-24" valueWidth="w-28" />
					<MetaItemSkeleton labelWidth="w-14" valueWidth="w-52" />
				</div>
			</div>
		</div>
	);
}

function SectionTabsSkeleton() {
	const tabWidths = [
		"w-32",
		"w-28",
		"w-20",
		"w-20",
		"w-24",
		"w-24",
		"w-24",
		"w-20",
		"w-20",
		"w-16",
		"w-20",
	];

	return (
		<div className="no-scrollbar relative flex w-full overflow-x-auto border-b px-6 whitespace-nowrap">
			{tabWidths.map((width, index) => (
				<div key={index} className="relative shrink-0 px-6 py-3">
					<div className={`h-5 ${width} animate-pulse rounded bg-gray-200`} />
					{index === 0 ? (
						<div className="absolute right-0 bottom-0 left-0 h-0.5 animate-pulse bg-gray-300" />
					) : null}
				</div>
			))}
		</div>
	);
}

function SectionContentSkeleton({ section }: { section: string }) {
	if (section === "patient-overview") {
		return <PatientOverviewSkeleton />;
	}

	if (section === "patient-details") {
		return <PatientDetailsSkeleton />;
	}

	return <TableSectionSkeleton />;
}

function PatientOverviewSkeleton() {
	return (
		<div className="p-8">
			<div className="mx-auto max-w-7xl">
				<div className="mb-6 h-7 w-48 animate-pulse rounded bg-gray-200" />
				<div className="flex flex-col gap-10">
					<DetailsSectionSkeleton itemCount={6} titleWidth="w-44" />
					<DetailsSectionSkeleton itemCount={6} titleWidth="w-40" />
					<RecentRecordsTableSkeleton titleWidth="w-36" />
					<RecentRecordsTableSkeleton titleWidth="w-32" />
				</div>
			</div>
		</div>
	);
}

function PatientDetailsSkeleton() {
	const sectionSkeletons = [
		{ itemCount: 8, titleWidth: "w-44" },
		{ itemCount: 5, titleWidth: "w-40" },
		{ itemCount: 5, titleWidth: "w-36" },
		{ itemCount: 4, titleWidth: "w-40" },
	];

	return (
		<div className="p-8">
			<div className="mx-auto max-w-7xl">
				<div className="mb-6 h-7 w-44 animate-pulse rounded bg-gray-200" />
				<div className="flex flex-col gap-10">
					{sectionSkeletons.map((sectionSkeleton, index) => (
						<DetailsSectionSkeleton
							key={index}
							itemCount={sectionSkeleton.itemCount}
							titleWidth={sectionSkeleton.titleWidth}
							withAction
						/>
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
				<div className="h-7 w-40 animate-pulse rounded bg-gray-200" />
				<div className="mt-7 mb-4 flex items-center gap-2">
					<div className="h-10 flex-1 animate-pulse rounded-md bg-gray-200" />
					<div className="h-10 w-24 shrink-0 animate-pulse rounded-md bg-gray-200" />
					<div className="h-10 w-24 shrink-0 animate-pulse rounded-md bg-gray-200" />
					<div className="h-10 w-32 shrink-0 animate-pulse rounded-md bg-gray-200" />
				</div>
				<div className="overflow-x-auto rounded-xl border border-gray-200 text-sm">
					<div className="min-w-[78rem] bg-white">
						<div className="grid h-12 grid-cols-[2.5rem_1.4fr_1fr_1fr_8rem_1fr_6rem_3rem] items-center gap-3 bg-gray-50 px-3">
							{Array.from({ length: 8 }).map((_, index) => (
								<div key={index} className="h-4 animate-pulse rounded bg-gray-200" />
							))}
						</div>
						<div className="outline outline-gray-200">
							{Array.from({ length: 6 }).map((_, rowIndex) => (
								<div
									key={rowIndex}
									className="grid min-h-14 grid-cols-[2.5rem_1.4fr_1fr_1fr_8rem_1fr_6rem_3rem] items-center gap-3 border-b border-gray-200 px-3 last:border-b-0"
								>
									{Array.from({ length: 8 }).map((_, cellIndex) => (
										<div
											key={cellIndex}
											className="h-4 animate-pulse rounded bg-gray-100"
										/>
									))}
								</div>
							))}
						</div>
						<div className="flex min-h-14 items-center justify-between gap-3 border-t border-gray-200 bg-white p-3">
							<div className="flex items-center gap-3">
								<div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
								<div className="h-8 w-[4.25rem] animate-pulse rounded-md bg-gray-200" />
							</div>
							<div className="flex items-center gap-3">
								<div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
								<div className="h-8 w-20 animate-pulse rounded-md bg-gray-200" />
								<div className="h-8 w-14 animate-pulse rounded-md bg-gray-200" />
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

function MetaItemSkeleton({
	labelWidth,
	valueWidth,
}: {
	labelWidth: string;
	valueWidth: string;
}) {
	return (
		<div className="flex shrink-0 items-center gap-1">
			<div className={`h-4 ${labelWidth} animate-pulse rounded bg-gray-200`} />
			<div className={`h-4 ${valueWidth} animate-pulse rounded bg-gray-200`} />
		</div>
	);
}

function DetailsSectionSkeleton({
	itemCount,
	titleWidth,
	withAction = false,
}: {
	itemCount: number;
	titleWidth: string;
	withAction?: boolean;
}) {
	return (
		<section className="overflow-hidden rounded-xl bg-gray-50 ring-1 ring-gray-200">
			<div className="flex h-11 min-h-11 items-center justify-between gap-4 px-4">
				<div className={`h-5 ${titleWidth} animate-pulse rounded bg-gray-200`} />
				{withAction ? <div className="size-9 animate-pulse rounded-md bg-gray-200" /> : null}
			</div>
			<div className="grid grid-cols-[repeat(auto-fill,minmax(20rem,1fr))] gap-6 rounded-xl bg-white p-4 ring-1 ring-gray-200">
				{Array.from({ length: itemCount }).map((_, itemIndex) => (
					<div key={itemIndex} className="flex flex-col gap-2">
						<div className="h-4 w-28 animate-pulse rounded bg-gray-100" />
						<div className="h-4 w-44 animate-pulse rounded bg-gray-200" />
					</div>
				))}
			</div>
		</section>
	);
}

function RecentRecordsTableSkeleton({ titleWidth }: { titleWidth: string }) {
	return (
		<div className="flex flex-col gap-4">
			<div className={`h-6 ${titleWidth} animate-pulse rounded bg-gray-200`} />
			<div className="overflow-hidden rounded-xl ring-1 ring-gray-200">
				<div className="grid h-12 grid-cols-6 items-center gap-4 bg-gray-50 px-4">
					{Array.from({ length: 6 }).map((_, index) => (
						<div key={index} className="h-4 animate-pulse rounded bg-gray-200" />
					))}
				</div>
				<div className="bg-white ring-1 ring-gray-200">
					{Array.from({ length: 3 }).map((_, rowIndex) => (
						<div
							key={rowIndex}
							className="grid h-14 grid-cols-6 items-center gap-4 border-b border-gray-200 px-4 last:border-b-0"
						>
							{Array.from({ length: 6 }).map((_, cellIndex) => (
								<div key={cellIndex} className="h-4 animate-pulse rounded bg-gray-100" />
							))}
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
