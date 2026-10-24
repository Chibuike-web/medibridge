import { Suspense, type ReactNode } from "react";
import { RiArrowLeftLine, RiArrowRightSLine } from "@remixicon/react";
import { notFound, redirect } from "next/navigation";
import type { Route } from "next";
import Link from "next/link";
import Image from "next/image";
import { StatusBadge } from "@/components/status-badge";
import { CopyIdButton } from "@/components/copy-id-button";
import { SectionTabs, type PatientSection } from "@/features/patients/components/section-tabs";
import { PatientOverviewSection } from "@/features/patients/components/patient-overview-section";
import { PatientDetailsSection } from "@/features/patients/components/patient-details-section/patient-details-section";
import { PatientAvatarMenu } from "@/features/patients/components/patient-avatar-menu";
import { TableUrlNavigation } from "@/features/patients/components/table-url-navigation";
import {
	CreateAllergyEmptyStateAction,
	CreateDiagnosisEmptyStateAction,
	CreateEncounterEmptyStateAction,
	CreateImagingEmptyStateAction,
	CreateImmunizationEmptyStateAction,
	CreateLabTestEmptyStateAction,
	CreateMedicationEmptyStateAction,
	CreateProcedureEmptyStateAction,
	CreateVitalsEmptyStateAction,
} from "@/features/patients/components/patient-empty-state-actions";
import { getPatientById } from "@/lib/api/get-patient-by-id";
import { getPatientAllergies } from "@/lib/api/get-patient-allergies";
import { getPatientDiagnoses } from "@/lib/api/get-patient-diagnoses";
import { getPatientEncounters } from "@/lib/api/get-patient-encounters";
import { getPatientImaging } from "@/lib/api/get-patient-imaging";
import { getPatientImmunizations } from "@/lib/api/get-patient-immunizations";
import { getPatientLabTests } from "@/lib/api/get-patient-lab-tests";
import { getPatientMedications } from "@/lib/api/get-patient-medications";
import { getPatientProcedures } from "@/lib/api/get-patient-procedures";
import { getPatientVitalReadings, getPatientVitals } from "@/lib/api/get-patient-vitals";
import { verifySession } from "@/lib/api/verify-session";
import { getOrganizationContext } from "@/lib/api/get-organization-id";
import type {
	AllergySeverityFilter,
	AllergyStatusFilter,
	DiagnosisStatusFilter,
	EncounterDepartmentFilter,
	EncounterTypeFilter,
	ImagingModalityFilter,
	ImagingStatusFilter,
	ImmunizationStatusFilter,
	LabTestFlagFilter,
	LabTestStatusFilter,
	MedicationStatusFilter,
	ProcedureStatusFilter,
} from "@/features/patients/types";
import { getNumberParam, getStringParam } from "@/lib/utils/search-params";
import { AllergiesClient } from "./patient-section-table-clients/allergies-client";
import { DiagnosesClient } from "./patient-section-table-clients/diagnoses-client";
import { EncountersClient } from "./patient-section-table-clients/encounters-client";
import { ImagingClient } from "./patient-section-table-clients/imaging-client";
import { ImmunizationsClient } from "./patient-section-table-clients/immunizations-client";
import { LabTestsClient } from "./patient-section-table-clients/lab-tests-client";
import { MedicationsClient } from "./patient-section-table-clients/medications-client";
import { ProceduresClient } from "./patient-section-table-clients/procedures-client";
import { VitalsClient } from "./patient-section-table-clients/vitals-client";

export const metadata = {
	title: "Patient",
};

type PatientPageProps = Pick<
	PageProps<"/dashboard/patients/[patientId]">,
	"params" | "searchParams"
>;
type PatientPageParamsProps = Pick<PageProps<"/dashboard/patients/[patientId]">, "params">;

export default function PatientPage({ searchParams, params }: PatientPageProps) {
	return (
		<Suspense fallback={<PatientPageSkeleton />}>
			<TableUrlNavigation>
				<PatientPageContent searchParams={searchParams} params={params} />
			</TableUrlNavigation>
		</Suspense>
	);
}

async function PatientPageContent({ searchParams, params }: PatientPageProps) {
	const session = await verifySession();
	if (!session.user.emailVerified) {
		redirect("/email-verified?error=unverified");
	}

	const organizationContext = await getOrganizationContext();
	if (!organizationContext) {
		redirect("/sign-in");
	}

	if (!organizationContext.isOrganizationVerified) {
		redirect("/verify");
	}

	return (
		<div className="flex h-full min-h-0 flex-col overflow-hidden">
			<div className="shrink-0">
				<nav
					aria-label="Breadcrumb"
					className="flex h-14 items-center gap-2 border-b border-gray-200 px-4 text-sm"
				>
					<Link
						href="/dashboard/patients"
						className="flex shrink-0 items-center gap-1 font-medium text-gray-800"
					>
						<RiArrowLeftLine className="size-4" aria-hidden="true" />
						Patients
					</Link>
					<RiArrowRightSLine aria-hidden="true" className="size-5" />
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

async function BreadCrumb({ searchParams, params }: PatientPageProps) {
	const [{ section }, { patientId }] = await Promise.all([searchParams, params]);
	const currentSection = getStringParam(section);

	const patient = await getPatientById(patientId);

	if (!patient) {
		notFound();
	}

	return (
		<>
			<span className="shrink-0">
				{patient.firstName} {patient.lastName}
			</span>
			<RiArrowRightSLine aria-hidden="true" className="size-5" />
			<span className="font-semibold shrink-0">{formatPatientSectionLabel(currentSection)}</span>
		</>
	);
}

async function Header({ params }: PatientPageParamsProps) {
	const { patientId } = await params;
	const patient = await getPatientById(patientId);

	if (!patient) {
		notFound();
	}

	const patientName = `${patient.firstName} ${patient.lastName}`;
	return (
		<div className="flex items-center gap-3 border-b border-gray-200 px-6 py-3.5 text-sm">
			<PatientAvatarMenu patientName={patientName ?? ""} />

			<div className="flex flex-col gap-3">
				<div className="flex items-center gap-2.5">
					<h1 className="text-lg font-semibold text-balance">{patientName}</h1>
					<StatusBadge status="Active" />
					<CopyIdButton id={patient.patientId} />
				</div>
				<div className="flex items-center gap-4">
					<div className="flex items-center shrink-0 gap-1">
						<span className="text-gray-400">Sex:</span>
						<span className="font-semibold text-gray-600">{patient.sex ?? "-"}</span>
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

async function Main({ searchParams, params }: PatientPageProps) {
	const { section } = await searchParams;
	const currentSection = getStringParam(section);

	return (
		<div className="flex min-h-0 flex-1 flex-col">
			<Suspense fallback={<SectionTabsSkeleton />}>
				<SectionTabs activeSection={currentSection as PatientSection} />
			</Suspense>
			<div className="min-h-0 flex-1 overflow-y-auto">
				<Suspense fallback={<SectionContentSkeleton section={currentSection} />}>
					<SectionContent searchParams={searchParams} params={params} />
				</Suspense>
			</div>
		</div>
	);
}

async function SectionContent({ searchParams, params }: PatientPageProps) {
	const [tableParams, { patientId }] = await Promise.all([searchParams, params]);

	return renderSectionContent(getStringParam(tableParams.section), patientId, searchParams);
}

async function renderSectionContent(
	section: string,
	patientId: string,
	searchParams: PatientPageProps["searchParams"],
) {
	if (section === "patient-overview") {
		return <PatientOverviewSection patientId={patientId} />;
	}
	if (section === "patient-details") {
		return <PatientDetailsSection patientId={patientId} />;
	}

	if (section === "vitals") {
		return <VitalsSection patientId={patientId} searchParams={searchParams} />;
	}

	if (section === "diagnoses") {
		return <DiagnosesSection patientId={patientId} searchParams={searchParams} />;
	}

	if (section === "allergies") {
		return <AllergiesSection patientId={patientId} searchParams={searchParams} />;
	}

	if (section === "immunizations") {
		return <ImmunizationSection patientId={patientId} searchParams={searchParams} />;
	}

	if (section === "procedures") {
		return <ProceduresSection patientId={patientId} searchParams={searchParams} />;
	}

	if (section === "medications") {
		return <MedicationsSection patientId={patientId} searchParams={searchParams} />;
	}

	if (section === "encounters") {
		return <EncountersSection patientId={patientId} searchParams={searchParams} />;
	}

	if (section === "lab-tests") {
		return <LabTestsSection patientId={patientId} searchParams={searchParams} />;
	}

	if (section === "imaging") {
		return <ImagingSection patientId={patientId} searchParams={searchParams} />;
	}
}

async function VitalsSection({
	patientId,
	searchParams,
}: {
	patientId: string;
	searchParams: PatientPageProps["searchParams"];
}) {
	const tableParams = await searchParams;
	const page = getNumberParam(tableParams.vitalsPage, 1, { min: 1 });
	const limit = getNumberParam(tableParams.vitalsLimit, 14);
	const searchQuery = getStringParam(tableParams.vitalsQuery);
	const sort = getStringParam(tableParams.vitalsSort);
	const order = getStringParam(tableParams.vitalsOrder);
	const recordedFrom = getStringParam(tableParams.vitalsRecordedFrom);
	const recordedTo = getStringParam(tableParams.vitalsRecordedTo);
	const createdFrom = getStringParam(tableParams.vitalsCreatedFrom);
	const createdTo = getStringParam(tableParams.vitalsCreatedTo);
	const [{ vitals, totalVitals }, readings, { encounters }] = await Promise.all([
		getPatientVitals(patientId, page, limit, searchQuery, { sort, order }, {
			recordedFrom,
			recordedTo,
			createdFrom,
			createdTo,
		}),
		getPatientVitalReadings(patientId),
		getPatientEncounters(patientId, 1, 100),
	]);

	const totalPages = Math.ceil(totalVitals / limit) || 1;

	if (page > totalPages) {
		const lastPageParams = new URLSearchParams(
			Object.entries(tableParams).flatMap(([name, value]) =>
				typeof value === "string" ? [[name, value]] : [],
			),
		);
		lastPageParams.set("vitalsPage", String(totalPages));
		redirect(`/dashboard/patients/${patientId}?${lastPageParams}` as Route);
	}

	const encounterOptions = encounters.map(({ encounterId, encounterType, encounterDateLabel }) => ({
		encounterId,
		encounterType,
		encounterDateLabel,
	}));

	if (
		readings.length === 0 &&
		!(
			page !== 1 ||
			Boolean(searchQuery) ||
			Boolean(recordedFrom) ||
			Boolean(recordedTo) ||
			Boolean(createdFrom) ||
			Boolean(createdTo)
		)
	) {
		return renderEmptyState({
			title: "No vitals yet",
			description: "No vitals have been recorded for this patient.",
			action: (
				<CreateVitalsEmptyStateAction patientId={patientId} encounterOptions={encounterOptions} />
			),
		});
	}

	return (
		<VitalsClient
			patientId={patientId}
			encounterOptions={encounterOptions}
			vitals={vitals}
			readings={readings}
			searchQuery={searchQuery}
			sort={sort}
			order={order}
			recordedFrom={recordedFrom}
			recordedTo={recordedTo}
			createdFrom={createdFrom}
			createdTo={createdTo}
			page={page}
			limit={limit}
			totalPages={totalPages}
		/>
	);
}

async function DiagnosesSection({
	patientId,
	searchParams,
}: {
	patientId: string;
	searchParams: PatientPageProps["searchParams"];
}) {
	const tableParams = await searchParams;
	const page = getNumberParam(tableParams.diagnosesPage, 1, { min: 1 });
	const limit = getNumberParam(tableParams.diagnosesLimit, 14);
	const searchQuery = getStringParam(tableParams.diagnosesQuery);
	const sort = getStringParam(tableParams.diagnosesSort);
	const order = getStringParam(tableParams.diagnosesOrder);
	const createdFrom = getStringParam(tableParams.diagnosesCreatedFrom);
	const createdTo = getStringParam(tableParams.diagnosesCreatedTo);
	const diagnosedFrom = getStringParam(tableParams.diagnosesDiagnosedFrom);
	const diagnosedTo = getStringParam(tableParams.diagnosesDiagnosedTo);
	const lastReviewedFrom = getStringParam(tableParams.diagnosesLastReviewedFrom);
	const lastReviewedTo = getStringParam(tableParams.diagnosesLastReviewedTo);
	const statusFilters = getStringParam(tableParams.diagnosesStatus)
		.split(",")
		.filter((value): value is DiagnosisStatusFilter => ["active", "resolved"].includes(value));
	const { diagnoses, totalDiagnoses } = await getPatientDiagnoses(
		patientId,
		page,
		limit,
		searchQuery,
		{ sort, order },
		{ createdFrom, createdTo, diagnosedFrom, diagnosedTo, lastReviewedFrom, lastReviewedTo },
		statusFilters,
	);

	const totalPages = Math.ceil(totalDiagnoses / limit) || 1;

	if (page > totalPages) {
		const lastPageParams = new URLSearchParams(
			Object.entries(tableParams).flatMap(([name, value]) =>
				typeof value === "string" ? [[name, value]] : [],
			),
		);
		lastPageParams.set("diagnosesPage", String(totalPages));
		redirect(`/dashboard/patients/${patientId}?${lastPageParams}` as Route);
	}

	if (
		diagnoses.length === 0 &&
		!(
			page !== 1 ||
			Boolean(searchQuery) ||
			Boolean(createdFrom) ||
			Boolean(createdTo) ||
			Boolean(diagnosedFrom) ||
			Boolean(diagnosedTo) ||
			Boolean(lastReviewedFrom) ||
			Boolean(lastReviewedTo) ||
			statusFilters.length > 0
		)
	) {
		return renderEmptyState({
			title: "No diagnoses yet",
			description: "No diagnoses have been recorded for this patient.",
			action: <CreateDiagnosisEmptyStateAction patientId={patientId} />,
		});
	}

	return (
		<DiagnosesClient
			patientId={patientId}
			diagnoses={diagnoses}
			searchQuery={searchQuery}
			sort={sort}
			order={order}
			createdFrom={createdFrom}
			createdTo={createdTo}
			diagnosedFrom={diagnosedFrom}
			diagnosedTo={diagnosedTo}
			lastReviewedFrom={lastReviewedFrom}
			lastReviewedTo={lastReviewedTo}
			statusFilters={statusFilters}
			page={page}
			limit={limit}
			totalPages={totalPages}
		/>
	);
}

async function AllergiesSection({
	patientId,
	searchParams,
}: {
	patientId: string;
	searchParams: PatientPageProps["searchParams"];
}) {
	const tableParams = await searchParams;
	const page = getNumberParam(tableParams.allergiesPage, 1, { min: 1 });
	const limit = getNumberParam(tableParams.allergiesLimit, 14);
	const searchQuery = getStringParam(tableParams.allergiesQuery);
	const sort = getStringParam(tableParams.allergiesSort);
	const order = getStringParam(tableParams.allergiesOrder);
	const createdFrom = getStringParam(tableParams.allergiesCreatedFrom);
	const createdTo = getStringParam(tableParams.allergiesCreatedTo);
	const statusFilters = getStringParam(tableParams.allergiesStatus)
		.split(",")
		.filter((value): value is AllergyStatusFilter => ["active", "inactive"].includes(value));
	const severityFilters = getStringParam(tableParams.allergiesSeverity)
		.split(",")
		.filter((value): value is AllergySeverityFilter =>
			["mild", "moderate", "severe"].includes(value),
		);
	const { allergies, totalAllergies } = await getPatientAllergies(
		patientId,
		page,
		limit,
		searchQuery,
		{ sort, order },
		{ createdFrom, createdTo },
		statusFilters,
		severityFilters,
	);

	const totalPages = Math.ceil(totalAllergies / limit) || 1;

	if (page > totalPages) {
		const lastPageParams = new URLSearchParams(
			Object.entries(tableParams).flatMap(([name, value]) =>
				typeof value === "string" ? [[name, value]] : [],
			),
		);
		lastPageParams.set("allergiesPage", String(totalPages));
		redirect(`/dashboard/patients/${patientId}?${lastPageParams}` as Route);
	}

	if (
		allergies.length === 0 &&
		!(
			page !== 1 ||
			Boolean(searchQuery) ||
			Boolean(createdFrom) ||
			Boolean(createdTo) ||
			statusFilters.length > 0 ||
			severityFilters.length > 0
		)
	) {
		return renderEmptyState({
			title: "No allergies yet",
			description: "No allergies have been recorded for this patient.",
			action: <CreateAllergyEmptyStateAction patientId={patientId} />,
		});
	}

	return (
		<AllergiesClient
			patientId={patientId}
			allergies={allergies}
			searchQuery={searchQuery}
			sort={sort}
			order={order}
			createdFrom={createdFrom}
			createdTo={createdTo}
			statusFilters={statusFilters}
			severityFilters={severityFilters}
			page={page}
			limit={limit}
			totalPages={totalPages}
		/>
	);
}

async function ImmunizationSection({
	patientId,
	searchParams,
}: {
	patientId: string;
	searchParams: PatientPageProps["searchParams"];
}) {
	const tableParams = await searchParams;
	const page = getNumberParam(tableParams.immunizationsPage, 1, { min: 1 });
	const limit = getNumberParam(tableParams.immunizationsLimit, 14);
	const searchQuery = getStringParam(tableParams.immunizationsQuery);
	const sort = getStringParam(tableParams.immunizationsSort);
	const order = getStringParam(tableParams.immunizationsOrder);
	const createdFrom = getStringParam(tableParams.immunizationsCreatedFrom);
	const createdTo = getStringParam(tableParams.immunizationsCreatedTo);
	const statusFilters = getStringParam(tableParams.immunizationsStatus)
		.split(",")
		.filter((value): value is ImmunizationStatusFilter =>
			["active", "completed", "cancelled", "discontinued"].includes(value),
		);
	const { immunizations, totalImmunizations } = await getPatientImmunizations(
		patientId,
		page,
		limit,
		searchQuery,
		{ sort, order },
		{ createdFrom, createdTo },
		statusFilters,
	);

	const totalPages = Math.ceil(totalImmunizations / limit) || 1;

	if (page > totalPages) {
		const lastPageParams = new URLSearchParams(
			Object.entries(tableParams).flatMap(([name, value]) =>
				typeof value === "string" ? [[name, value]] : [],
			),
		);
		lastPageParams.set("immunizationsPage", String(totalPages));
		redirect(`/dashboard/patients/${patientId}?${lastPageParams}` as Route);
	}

	if (
		immunizations.length === 0 &&
		!(
			page !== 1 ||
			Boolean(searchQuery) ||
			Boolean(createdFrom) ||
			Boolean(createdTo) ||
			statusFilters.length > 0
		)
	) {
		return renderEmptyState({
			title: "No immunizations yet",
			description: "No immunizations have been recorded for this patient.",
			action: <CreateImmunizationEmptyStateAction patientId={patientId} />,
		});
	}

	return (
		<ImmunizationsClient
			patientId={patientId}
			immunizations={immunizations}
			searchQuery={searchQuery}
			sort={sort}
			order={order}
			createdFrom={createdFrom}
			createdTo={createdTo}
			statusFilters={statusFilters}
			page={page}
			limit={limit}
			totalPages={totalPages}
		/>
	);
}

async function ProceduresSection({
	patientId,
	searchParams,
}: {
	patientId: string;
	searchParams: PatientPageProps["searchParams"];
}) {
	const tableParams = await searchParams;
	const page = getNumberParam(tableParams.proceduresPage, 1, { min: 1 });
	const limit = getNumberParam(tableParams.proceduresLimit, 14);
	const searchQuery = getStringParam(tableParams.proceduresQuery);
	const sort = getStringParam(tableParams.proceduresSort);
	const order = getStringParam(tableParams.proceduresOrder);
	const createdFrom = getStringParam(tableParams.proceduresCreatedFrom);
	const createdTo = getStringParam(tableParams.proceduresCreatedTo);
	const statusFilters = getStringParam(tableParams.proceduresStatus)
		.split(",")
		.filter((value): value is ProcedureStatusFilter =>
			["pending", "completed", "cancelled"].includes(value),
		);
	const { procedures, totalProcedures } = await getPatientProcedures(
		patientId,
		page,
		limit,
		searchQuery,
		{ sort, order },
		{ createdFrom, createdTo },
		statusFilters,
	);

	const totalPages = Math.ceil(totalProcedures / limit) || 1;

	if (page > totalPages) {
		const lastPageParams = new URLSearchParams(
			Object.entries(tableParams).flatMap(([name, value]) =>
				typeof value === "string" ? [[name, value]] : [],
			),
		);
		lastPageParams.set("proceduresPage", String(totalPages));
		redirect(`/dashboard/patients/${patientId}?${lastPageParams}` as Route);
	}

	if (
		procedures.length === 0 &&
		!(
			page !== 1 ||
			Boolean(searchQuery) ||
			Boolean(createdFrom) ||
			Boolean(createdTo) ||
			statusFilters.length > 0
		)
	) {
		return renderEmptyState({
			title: "No procedures yet",
			description: "No procedures have been recorded for this patient.",
			action: <CreateProcedureEmptyStateAction patientId={patientId} />,
		});
	}

	return (
		<ProceduresClient
			patientId={patientId}
			procedures={procedures}
			searchQuery={searchQuery}
			sort={sort}
			order={order}
			createdFrom={createdFrom}
			createdTo={createdTo}
			statusFilters={statusFilters}
			page={page}
			limit={limit}
			totalPages={totalPages}
		/>
	);
}

async function MedicationsSection({
	patientId,
	searchParams,
}: {
	patientId: string;
	searchParams: PatientPageProps["searchParams"];
}) {
	const tableParams = await searchParams;
	const page = getNumberParam(tableParams.medicationsPage, 1, { min: 1 });
	const limit = getNumberParam(tableParams.medicationsLimit, 14);
	const searchQuery = getStringParam(tableParams.medicationsQuery);
	const sort = getStringParam(tableParams.medicationsSort);
	const order = getStringParam(tableParams.medicationsOrder);
	const createdFrom = getStringParam(tableParams.medicationsCreatedFrom);
	const createdTo = getStringParam(tableParams.medicationsCreatedTo);
	const statusFilters = getStringParam(tableParams.medicationsStatus)
		.split(",")
		.filter((value): value is MedicationStatusFilter =>
			["active", "completed", "discontinued"].includes(value),
		);
	const { medications, totalMedications } = await getPatientMedications(
		patientId,
		page,
		limit,
		searchQuery,
		{ sort, order },
		{ createdFrom, createdTo },
		statusFilters,
	);

	const totalPages = Math.ceil(totalMedications / limit) || 1;

	if (page > totalPages) {
		const lastPageParams = new URLSearchParams(
			Object.entries(tableParams).flatMap(([name, value]) =>
				typeof value === "string" ? [[name, value]] : [],
			),
		);
		lastPageParams.set("medicationsPage", String(totalPages));
		redirect(`/dashboard/patients/${patientId}?${lastPageParams}` as Route);
	}

	if (
		medications.length === 0 &&
		!(
			page !== 1 ||
			Boolean(searchQuery) ||
			Boolean(createdFrom) ||
			Boolean(createdTo) ||
			statusFilters.length > 0
		)
	) {
		return renderEmptyState({
			title: "No medications yet",
			description: "No medications have been recorded for this patient.",
			action: <CreateMedicationEmptyStateAction patientId={patientId} />,
		});
	}

	return (
		<MedicationsClient
			patientId={patientId}
			medications={medications}
			searchQuery={searchQuery}
			sort={sort}
			order={order}
			createdFrom={createdFrom}
			createdTo={createdTo}
			statusFilters={statusFilters}
			page={page}
			limit={limit}
			totalPages={totalPages}
		/>
	);
}

async function EncountersSection({
	patientId,
	searchParams,
}: {
	patientId: string;
	searchParams: PatientPageProps["searchParams"];
}) {
	const tableParams = await searchParams;
	const page = getNumberParam(tableParams.encountersPage, 1, { min: 1 });
	const limit = getNumberParam(tableParams.encountersLimit, 14);
	const searchQuery = getStringParam(tableParams.encountersQuery);
	const sort = getStringParam(tableParams.encountersSort);
	const order = getStringParam(tableParams.encountersOrder);
	const encounterFrom = getStringParam(tableParams.encountersEncounterFrom);
	const encounterTo = getStringParam(tableParams.encountersEncounterTo);
	const createdFrom = getStringParam(tableParams.encountersCreatedFrom);
	const createdTo = getStringParam(tableParams.encountersCreatedTo);
	const encounterTypeFilters = getStringParam(tableParams.encountersType)
		.split(",")
		.filter((value): value is EncounterTypeFilter =>
			["emergency-visit", "routine-checkup", "follow-up-visit", "outpatient-visit"].includes(value),
		);
	const departmentFilters = getStringParam(tableParams.encountersDepartment)
		.split(",")
		.filter((value): value is EncounterDepartmentFilter =>
			[
				"emergency-medicine",
				"general-medicine",
				"cardiology",
				"endocrinology",
				"family-medicine",
				"nephrology",
			].includes(value),
		);
	const { encounters, totalEncounters } = await getPatientEncounters(
		patientId,
		page,
		limit,
		searchQuery,
		{ sort, order },
		{ encounterFrom, encounterTo, createdFrom, createdTo },
		encounterTypeFilters,
		departmentFilters,
	);

	const totalPages = Math.ceil(totalEncounters / limit) || 1;

	if (page > totalPages) {
		const lastPageParams = new URLSearchParams(
			Object.entries(tableParams).flatMap(([name, value]) =>
				typeof value === "string" ? [[name, value]] : [],
			),
		);
		lastPageParams.set("encountersPage", String(totalPages));
		redirect(`/dashboard/patients/${patientId}?${lastPageParams}` as Route);
	}

	if (
		encounters.length === 0 &&
		!(
			page !== 1 ||
			Boolean(searchQuery) ||
			Boolean(encounterFrom) ||
			Boolean(encounterTo) ||
			Boolean(createdFrom) ||
			Boolean(createdTo) ||
			encounterTypeFilters.length > 0 ||
			departmentFilters.length > 0
		)
	) {
		return renderEmptyState({
			title: "No encounters yet",
			description: "Create one to record vitals, diagnoses, and medications.",
			action: <CreateEncounterEmptyStateAction patientId={patientId} />,
		});
	}

	return (
		<EncountersClient
			patientId={patientId}
			encounters={encounters}
			searchQuery={searchQuery}
			sort={sort}
			order={order}
			encounterFrom={encounterFrom}
			encounterTo={encounterTo}
			createdFrom={createdFrom}
			createdTo={createdTo}
			encounterTypeFilters={encounterTypeFilters}
			departmentFilters={departmentFilters}
			page={page}
			limit={limit}
			totalPages={totalPages}
		/>
	);
}

async function LabTestsSection({
	patientId,
	searchParams,
}: {
	patientId: string;
	searchParams: PatientPageProps["searchParams"];
}) {
	const tableParams = await searchParams;
	const page = getNumberParam(tableParams.labTestsPage, 1, { min: 1 });
	const limit = getNumberParam(tableParams.labTestsLimit, 14);
	const searchQuery = getStringParam(tableParams.labTestsQuery);
	const sort = getStringParam(tableParams.labTestsSort);
	const order = getStringParam(tableParams.labTestsOrder);
	const createdFrom = getStringParam(tableParams.labTestsCreatedFrom);
	const createdTo = getStringParam(tableParams.labTestsCreatedTo);
	const statusFilters = getStringParam(tableParams.labTestsStatus)
		.split(",")
		.filter((value): value is LabTestStatusFilter =>
			["pending", "completed", "cancelled"].includes(value),
		);
	const flagFilters = getStringParam(tableParams.labTestsFlag)
		.split(",")
		.filter((value): value is LabTestFlagFilter =>
			[
				"within-range",
				"abnormal",
				"high",
				"low",
				"critical",
				"pending",
				"borderline",
				"invalid",
				"cancelled",
				"inconclusive",
			].includes(value),
		);
	const { labTests, totalLabTests } = await getPatientLabTests(
		patientId,
		page,
		limit,
		searchQuery,
		{ sort, order },
		{ createdFrom, createdTo },
		statusFilters,
		flagFilters,
	);

	const totalPages = Math.ceil(totalLabTests / limit) || 1;

	if (page > totalPages) {
		const lastPageParams = new URLSearchParams(
			Object.entries(tableParams).flatMap(([name, value]) =>
				typeof value === "string" ? [[name, value]] : [],
			),
		);
		lastPageParams.set("labTestsPage", String(totalPages));
		redirect(`/dashboard/patients/${patientId}?${lastPageParams}` as Route);
	}

	if (
		labTests.length === 0 &&
		!(
			page !== 1 ||
			Boolean(searchQuery) ||
			Boolean(createdFrom) ||
			Boolean(createdTo) ||
			statusFilters.length > 0 ||
			flagFilters.length > 0
		)
	) {
		return renderEmptyState({
			title: "No lab tests yet",
			description: "No lab tests have been recorded for this patient.",
			action: <CreateLabTestEmptyStateAction patientId={patientId} />,
		});
	}

	return (
		<LabTestsClient
			patientId={patientId}
			labTests={labTests}
			searchQuery={searchQuery}
			sort={sort}
			order={order}
			createdFrom={createdFrom}
			createdTo={createdTo}
			statusFilters={statusFilters}
			flagFilters={flagFilters}
			page={page}
			limit={limit}
			totalPages={totalPages}
		/>
	);
}

async function ImagingSection({
	patientId,
	searchParams,
}: {
	patientId: string;
	searchParams: PatientPageProps["searchParams"];
}) {
	const tableParams = await searchParams;
	const page = getNumberParam(tableParams.imagingPage, 1, { min: 1 });
	const limit = getNumberParam(tableParams.imagingLimit, 14);
	const searchQuery = getStringParam(tableParams.imagingQuery);
	const sort = getStringParam(tableParams.imagingSort);
	const order = getStringParam(tableParams.imagingOrder);
	const orderedFrom = getStringParam(tableParams.imagingOrderedFrom);
	const orderedTo = getStringParam(tableParams.imagingOrderedTo);
	const createdFrom = getStringParam(tableParams.imagingCreatedFrom);
	const createdTo = getStringParam(tableParams.imagingCreatedTo);
	const statusFilters = getStringParam(tableParams.imagingStatus)
		.split(",")
		.filter((value): value is ImagingStatusFilter =>
			["pending", "completed", "cancelled"].includes(value),
		);
	const modalityFilters = getStringParam(tableParams.imagingModality)
		.split(",")
		.filter((value): value is ImagingModalityFilter =>
			["ct", "mri", "ultrasound", "x-ray"].includes(value),
		);
	const { imagingStudies, totalImagingStudies } = await getPatientImaging(
		patientId,
		page,
		limit,
		searchQuery,
		{ sort, order },
		{ orderedFrom, orderedTo, createdFrom, createdTo },
		statusFilters,
		modalityFilters,
	);

	const totalPages = Math.ceil(totalImagingStudies / limit) || 1;

	if (page > totalPages) {
		const lastPageParams = new URLSearchParams(
			Object.entries(tableParams).flatMap(([name, value]) =>
				typeof value === "string" ? [[name, value]] : [],
			),
		);
		lastPageParams.set("imagingPage", String(totalPages));
		redirect(`/dashboard/patients/${patientId}?${lastPageParams}` as Route);
	}

	if (
		imagingStudies.length === 0 &&
		!(
			page !== 1 ||
			Boolean(searchQuery) ||
			Boolean(orderedFrom) ||
			Boolean(orderedTo) ||
			Boolean(createdFrom) ||
			Boolean(createdTo) ||
			statusFilters.length > 0 ||
			modalityFilters.length > 0
		)
	) {
		return renderEmptyState({
			title: "No imaging yet",
			description: "No imaging studies have been recorded for this patient.",
			action: <CreateImagingEmptyStateAction patientId={patientId} />,
		});
	}

	return (
		<ImagingClient
			patientId={patientId}
			imagingStudies={imagingStudies}
			searchQuery={searchQuery}
			sort={sort}
			order={order}
			orderedFrom={orderedFrom}
			orderedTo={orderedTo}
			createdFrom={createdFrom}
			createdTo={createdTo}
			statusFilters={statusFilters}
			modalityFilters={modalityFilters}
			page={page}
			limit={limit}
			totalPages={totalPages}
		/>
	);
}

function renderEmptyState({
	title,
	description,
	action,
}: {
	title: string;
	description: string;
	action: ReactNode;
}) {
	return (
		<div className="flex min-h-[calc(100vh-13.75rem)] items-center justify-center px-6 py-12">
			<div className="flex w-[31.25rem] max-w-full flex-col items-center">
				<div className="aspect-[473/238] w-full overflow-hidden">
					<Image
						src="/assets/empty-state.svg"
						alt=""
						aria-hidden="true"
						width={473}
						height={357}
						className="h-auto w-full"
					/>
				</div>
				<div className="relative z-10 -mt-4 flex w-full flex-col items-center text-center">
					<h2 className="mb-2 text-lg leading-6 font-semibold text-gray-800">{title}</h2>
					<p className="mb-6 max-w-[32rem] text-sm text-pretty text-gray-500">{description}</p>
					{action}
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
					className="flex h-14 items-center gap-2 border-b border-gray-200 px-4 text-sm"
				>
					<Link
						href="/dashboard/patients"
						className="flex shrink-0 items-center gap-1 font-medium text-gray-800"
					>
						<RiArrowLeftLine className="size-4" aria-hidden="true" />
						Patients
					</Link>
					<RiArrowRightSLine aria-hidden="true" className="size-5" />
					<BreadCrumbSkeleton />
				</nav>
				<HeaderSkeleton />
			</div>
			<div className="flex min-h-0 flex-1 flex-col">
				<SectionTabsSkeleton />
				<div className="min-h-0 flex-1 overflow-y-auto">
					<PatientOverviewSkeleton />
				</div>
			</div>
		</div>
	);
}

function BreadCrumbSkeleton() {
	return (
		<div className="flex items-center gap-2">
			<div className="h-4 w-24 shrink-0 animate-pulse rounded bg-gray-200" />
			<RiArrowRightSLine aria-hidden="true" className="shrink-0 size-5 text-gray-400" />
			<div className="h-4 w-32 shrink-0 animate-pulse rounded bg-gray-200" />
		</div>
	);
}

function HeaderSkeleton() {
	return (
		<div className="flex items-center gap-3 border-b border-gray-200 px-6 py-3.5 text-sm">
			<div className="relative shrink-0">
				<div className="size-16 animate-pulse rounded-full border border-gray-200 bg-gray-100" />
				<div className="absolute right-0 bottom-0 size-4.5 animate-pulse rounded-full bg-gray-300" />
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
										<div key={cellIndex} className="h-4 animate-pulse rounded bg-gray-100" />
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

function MetaItemSkeleton({ labelWidth, valueWidth }: { labelWidth: string; valueWidth: string }) {
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
