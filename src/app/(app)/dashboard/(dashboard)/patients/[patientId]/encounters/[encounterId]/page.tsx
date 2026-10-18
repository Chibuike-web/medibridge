import { RiArrowLeftLine, RiArrowRightSLine } from "@remixicon/react";
import type { Route } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { EncounterOverview } from "@/features/patients/components/encounter-overview";
import { EncounterCreatedBanner } from "@/features/patients/components/encounter-created-banner";
import {
	CreateAllergyEmptyStateAction,
	CreateDiagnosisEmptyStateAction,
	CreateImagingEmptyStateAction,
	CreateImmunizationEmptyStateAction,
	CreateLabTestEmptyStateAction,
	CreateMedicationEmptyStateAction,
	CreateProcedureEmptyStateAction,
	CreateVitalsEmptyStateAction,
} from "@/features/patients/components/patient-empty-state-actions";
import { getPatientAllergies } from "@/lib/api/get-patient-allergies";
import { getPatientById } from "@/lib/api/get-patient-by-id";
import { getPatientDiagnoses } from "@/lib/api/get-patient-diagnoses";
import { getPatientEncounter } from "@/lib/api/get-patient-encounter";
import { getPatientImaging } from "@/lib/api/get-patient-imaging";
import { getPatientImmunizations } from "@/lib/api/get-patient-immunizations";
import { getPatientLabTests } from "@/lib/api/get-patient-lab-tests";
import { getPatientMedications } from "@/lib/api/get-patient-medications";
import { getPatientProcedures } from "@/lib/api/get-patient-procedures";
import { getPatientVitalReadings, getPatientVitals } from "@/lib/api/get-patient-vitals";
import { verifySession } from "@/lib/api/verify-session";
import { getOrganizationContext } from "@/lib/api/get-organization-id";
import {
	AllergiesClient,
	DiagnosesClient,
	ImagingClient,
	ImmunizationsClient,
	LabTestsClient,
	MedicationsClient,
	ProceduresClient,
	VitalsClient,
} from "../../patient-section-table-clients";

import { EncounterTableNavigation } from "../../patient-section-table-clients/encounter-table-navigation";

import type {
	AllergySeverityFilter,
	AllergyStatusFilter,
	DiagnosisStatusFilter,
	ImagingModalityFilter,
	ImagingStatusFilter,
	ImmunizationStatusFilter,
	LabTestFlagFilter,
	LabTestStatusFilter,
	MedicationStatusFilter,
	ProcedureStatusFilter,
} from "@/features/patients/types";
import { getNumberParam, getStringParam } from "@/lib/utils/search-params";

export const metadata = {
	title: "Encounter Details",
};

type EncounterDetailsPageProps = Pick<
	PageProps<"/dashboard/patients/[patientId]/encounters/[encounterId]">,
	"params" | "searchParams"
>;

export default function EncounterDetailsPage({ params, searchParams }: EncounterDetailsPageProps) {
	return (
		<Suspense fallback={<EncounterDetailsPageSkeleton />}>
			<EncounterTableNavigation>
				<EncounterDetailsContent params={params} searchParams={searchParams} />
			</EncounterTableNavigation>
		</Suspense>
	);
}

async function EncounterDetailsContent({ params, searchParams }: EncounterDetailsPageProps) {
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

	const { patientId, encounterId } = await params;
	const tableParams = await searchParams;
	const { created } = tableParams;

	const proceduresParams = {
		page: getNumberParam(tableParams.proceduresPage, 1, { min: 1 }),
		limit: getNumberParam(tableParams.proceduresLimit, 14),
		searchQuery: getStringParam(tableParams.proceduresQuery),
		createdFrom: getStringParam(tableParams.proceduresCreatedFrom),
		createdTo: getStringParam(tableParams.proceduresCreatedTo),
		statusFilters: getStringParam(tableParams.proceduresStatus)
			.split(",")
			.filter((value): value is ProcedureStatusFilter =>
				["pending", "completed", "cancelled"].includes(value),
			),
	};

	const imagingParams = {
		page: getNumberParam(tableParams.imagingPage, 1, { min: 1 }),
		limit: getNumberParam(tableParams.imagingLimit, 14),
		searchQuery: getStringParam(tableParams.imagingQuery),
		orderedFrom: getStringParam(tableParams.imagingOrderedFrom),
		orderedTo: getStringParam(tableParams.imagingOrderedTo),
		createdFrom: getStringParam(tableParams.imagingCreatedFrom),
		createdTo: getStringParam(tableParams.imagingCreatedTo),
		statusFilters: getStringParam(tableParams.imagingStatus)
			.split(",")
			.filter((value): value is ImagingStatusFilter =>
				["pending", "completed", "cancelled"].includes(value),
			),
		modalityFilters: getStringParam(tableParams.imagingModality)
			.split(",")
			.filter((value): value is ImagingModalityFilter =>
				["ct", "mri", "ultrasound", "x-ray"].includes(value),
			),
	};

	const allergiesParams = {
		page: getNumberParam(tableParams.allergiesPage, 1, { min: 1 }),
		limit: getNumberParam(tableParams.allergiesLimit, 14),
		searchQuery: getStringParam(tableParams.allergiesQuery),
		createdFrom: getStringParam(tableParams.allergiesCreatedFrom),
		createdTo: getStringParam(tableParams.allergiesCreatedTo),
		statusFilters: getStringParam(tableParams.allergiesStatus)
			.split(",")
			.filter((value): value is AllergyStatusFilter => ["active", "inactive"].includes(value)),
		severityFilters: getStringParam(tableParams.allergiesSeverity)
			.split(",")
			.filter((value): value is AllergySeverityFilter =>
				["mild", "moderate", "severe"].includes(value),
			),
	};

	const vitalsParams = {
		page: getNumberParam(tableParams.vitalsPage, 1, { min: 1 }),
		limit: getNumberParam(tableParams.vitalsLimit, 14),
		searchQuery: getStringParam(tableParams.vitalsQuery),
		recordedFrom: getStringParam(tableParams.vitalsRecordedFrom),
		recordedTo: getStringParam(tableParams.vitalsRecordedTo),
		createdFrom: getStringParam(tableParams.vitalsCreatedFrom),
		createdTo: getStringParam(tableParams.vitalsCreatedTo),
	};

	const labTestsParams = {
		page: getNumberParam(tableParams.labTestsPage, 1, { min: 1 }),
		limit: getNumberParam(tableParams.labTestsLimit, 14),
		searchQuery: getStringParam(tableParams.labTestsQuery),
		createdFrom: getStringParam(tableParams.labTestsCreatedFrom),
		createdTo: getStringParam(tableParams.labTestsCreatedTo),
		statusFilters: getStringParam(tableParams.labTestsStatus)
			.split(",")
			.filter((value): value is LabTestStatusFilter =>
				["pending", "completed", "cancelled"].includes(value),
			),
		flagFilters: getStringParam(tableParams.labTestsFlag)
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
			),
	};

	const immunizationsParams = {
		page: getNumberParam(tableParams.immunizationsPage, 1, { min: 1 }),
		limit: getNumberParam(tableParams.immunizationsLimit, 14),
		searchQuery: getStringParam(tableParams.immunizationsQuery),
		createdFrom: getStringParam(tableParams.immunizationsCreatedFrom),
		createdTo: getStringParam(tableParams.immunizationsCreatedTo),
		statusFilters: getStringParam(tableParams.immunizationsStatus)
			.split(",")
			.filter((value): value is ImmunizationStatusFilter =>
				["active", "completed", "cancelled", "discontinued"].includes(value),
			),
	};

	const medicationsParams = {
		page: getNumberParam(tableParams.medicationsPage, 1, { min: 1 }),
		limit: getNumberParam(tableParams.medicationsLimit, 14),
		searchQuery: getStringParam(tableParams.medicationsQuery),
		createdFrom: getStringParam(tableParams.medicationsCreatedFrom),
		createdTo: getStringParam(tableParams.medicationsCreatedTo),
		statusFilters: getStringParam(tableParams.medicationsStatus)
			.split(",")
			.filter((value): value is MedicationStatusFilter =>
				["active", "completed", "discontinued"].includes(value),
			),
	};

	const diagnosesParams = {
		page: getNumberParam(tableParams.diagnosesPage, 1, { min: 1 }),
		limit: getNumberParam(tableParams.diagnosesLimit, 14),
		searchQuery: getStringParam(tableParams.diagnosesQuery),
		createdFrom: getStringParam(tableParams.diagnosesCreatedFrom),
		createdTo: getStringParam(tableParams.diagnosesCreatedTo),
		diagnosedFrom: getStringParam(tableParams.diagnosesDiagnosedFrom),
		diagnosedTo: getStringParam(tableParams.diagnosesDiagnosedTo),
		lastReviewedFrom: getStringParam(tableParams.diagnosesLastReviewedFrom),
		lastReviewedTo: getStringParam(tableParams.diagnosesLastReviewedTo),
		statusFilters: getStringParam(tableParams.diagnosesStatus)
			.split(",")
			.filter((value): value is DiagnosisStatusFilter => ["active", "resolved"].includes(value)),
	};

	const [
		patient,
		encounter,
		medicationsResult,
		allergiesResult,
		diagnosesResult,
		immunizationsResult,
		proceduresResult,
		labTestsResult,
		imagingResult,
		vitalsResult,
		vitalReadings,
	] = await Promise.all([
		getPatientById(patientId),
		getPatientEncounter(patientId, encounterId),
		getPatientMedications(
			patientId,
			medicationsParams.page,
			medicationsParams.limit,
			medicationsParams.searchQuery,
			{ createdFrom: medicationsParams.createdFrom, createdTo: medicationsParams.createdTo },
			medicationsParams.statusFilters,
			encounterId,
		),
		getPatientAllergies(
			patientId,
			allergiesParams.page,
			allergiesParams.limit,
			allergiesParams.searchQuery,
			{ createdFrom: allergiesParams.createdFrom, createdTo: allergiesParams.createdTo },
			allergiesParams.statusFilters,
			allergiesParams.severityFilters,
			encounterId,
		),
		getPatientDiagnoses(
			patientId,
			diagnosesParams.page,
			diagnosesParams.limit,
			diagnosesParams.searchQuery,
			{
				createdFrom: diagnosesParams.createdFrom,
				createdTo: diagnosesParams.createdTo,
				diagnosedFrom: diagnosesParams.diagnosedFrom,
				diagnosedTo: diagnosesParams.diagnosedTo,
				lastReviewedFrom: diagnosesParams.lastReviewedFrom,
				lastReviewedTo: diagnosesParams.lastReviewedTo,
			},
			diagnosesParams.statusFilters,
			encounterId,
		),
		getPatientImmunizations(
			patientId,
			immunizationsParams.page,
			immunizationsParams.limit,
			immunizationsParams.searchQuery,
			{ createdFrom: immunizationsParams.createdFrom, createdTo: immunizationsParams.createdTo },
			immunizationsParams.statusFilters,
			encounterId,
		),
		getPatientProcedures(
			patientId,
			proceduresParams.page,
			proceduresParams.limit,
			proceduresParams.searchQuery,
			{ createdFrom: proceduresParams.createdFrom, createdTo: proceduresParams.createdTo },
			proceduresParams.statusFilters,
			encounterId,
		),
		getPatientLabTests(
			patientId,
			labTestsParams.page,
			labTestsParams.limit,
			labTestsParams.searchQuery,
			{ createdFrom: labTestsParams.createdFrom, createdTo: labTestsParams.createdTo },
			labTestsParams.statusFilters,
			labTestsParams.flagFilters,
			encounterId,
		),
		getPatientImaging(
			patientId,
			imagingParams.page,
			imagingParams.limit,
			imagingParams.searchQuery,
			{
				orderedFrom: imagingParams.orderedFrom,
				orderedTo: imagingParams.orderedTo,
				createdFrom: imagingParams.createdFrom,
				createdTo: imagingParams.createdTo,
			},
			imagingParams.statusFilters,
			imagingParams.modalityFilters,
			encounterId,
		),
		getPatientVitals(
			patientId,
			vitalsParams.page,
			vitalsParams.limit,
			vitalsParams.searchQuery,
			{
				recordedFrom: vitalsParams.recordedFrom,
				recordedTo: vitalsParams.recordedTo,
				createdFrom: vitalsParams.createdFrom,
				createdTo: vitalsParams.createdTo,
			},
			encounterId,
		),
		getPatientVitalReadings(patientId, encounterId),
	]);

	if (!patient || !encounter) {
		notFound();
	}

	const vitalsTotalPages = Math.max(1, Math.ceil(vitalsResult.totalVitals / vitalsParams.limit));
	const medicationsTotalPages = Math.max(
		1,
		Math.ceil(medicationsResult.totalMedications / medicationsParams.limit),
	);
	const allergiesTotalPages = Math.max(
		1,
		Math.ceil(allergiesResult.totalAllergies / allergiesParams.limit),
	);
	const diagnosesTotalPages = Math.max(
		1,
		Math.ceil(diagnosesResult.totalDiagnoses / diagnosesParams.limit),
	);
	const immunizationsTotalPages = Math.max(
		1,
		Math.ceil(immunizationsResult.totalImmunizations / immunizationsParams.limit),
	);
	const proceduresTotalPages = Math.max(
		1,
		Math.ceil(proceduresResult.totalProcedures / proceduresParams.limit),
	);
	const labTestsTotalPages = Math.max(
		1,
		Math.ceil(labTestsResult.totalLabTests / labTestsParams.limit),
	);
	const imagingTotalPages = Math.max(
		1,
		Math.ceil(imagingResult.totalImagingStudies / imagingParams.limit),
	);

	const lastPageParams = new URLSearchParams(
		Object.entries(tableParams).flatMap(([name, value]) =>
			typeof value === "string" ? [[name, value]] : [],
		),
	);
	const currentQueryString = lastPageParams.toString();
	if (vitalsParams.page > vitalsTotalPages) {
		lastPageParams.set("vitalsPage", String(vitalsTotalPages));
	}
	if (medicationsParams.page > medicationsTotalPages) {
		lastPageParams.set("medicationsPage", String(medicationsTotalPages));
	}
	if (allergiesParams.page > allergiesTotalPages) {
		lastPageParams.set("allergiesPage", String(allergiesTotalPages));
	}
	if (diagnosesParams.page > diagnosesTotalPages) {
		lastPageParams.set("diagnosesPage", String(diagnosesTotalPages));
	}
	if (immunizationsParams.page > immunizationsTotalPages) {
		lastPageParams.set("immunizationsPage", String(immunizationsTotalPages));
	}
	if (proceduresParams.page > proceduresTotalPages) {
		lastPageParams.set("proceduresPage", String(proceduresTotalPages));
	}
	if (labTestsParams.page > labTestsTotalPages) {
		lastPageParams.set("labTestsPage", String(labTestsTotalPages));
	}
	if (imagingParams.page > imagingTotalPages) {
		lastPageParams.set("imagingPage", String(imagingTotalPages));
	}
	if (lastPageParams.toString() !== currentQueryString) {
		redirect(
			`/dashboard/patients/${patientId}/encounters/${encounterId}?${lastPageParams}` as Route,
		);
	}

	const backHref = `/dashboard/patients/${patientId}?section=encounters` as Route;
	const encounterOptions = [
		{
			encounterId: encounter.encounterId,
			encounterType: encounter.encounterType,
			encounterDateLabel: encounter.encounterDateLabel,
		},
	];
	const encounterDayLabel = new Intl.DateTimeFormat("en-US", { dateStyle: "long" }).format(
		encounter.encounterDate,
	);

	return (
		<div className="flex h-full min-h-0 flex-col overflow-hidden">
			<nav
				aria-label="Breadcrumb"
				className="flex h-14 shrink-0 items-center gap-2 overflow-x-auto border-b border-gray-200 px-4 text-sm"
			>
				<Link
					href="/dashboard/patients"
					className="flex shrink-0 items-center gap-1 font-medium text-gray-800"
				>
					<RiArrowLeftLine className="size-4" aria-hidden="true" />
					Patients
				</Link>
				<RiArrowRightSLine className="size-5 shrink-0 text-gray-400" aria-hidden />
				<Link href={backHref} className="shrink-0 text-gray-600">
					{`${patient.firstName} ${patient.lastName}`}
				</Link>
				<RiArrowRightSLine className="size-5 shrink-0 text-gray-400" aria-hidden />
				<Link href={backHref} className="shrink-0 text-gray-600">
					Encounters
				</Link>
				<RiArrowRightSLine className="size-5 shrink-0 text-gray-400" aria-hidden />
				<span className="shrink-0 font-semibold text-gray-800">Encounter details</span>
			</nav>

			<main className="min-h-0 flex-1 overflow-y-auto px-6 py-8">
				<div className="mx-auto max-w-[75rem]">
					{created === "true" && <EncounterCreatedBanner />}
					<EncounterOverview encounter={encounter} encounterDayLabel={encounterDayLabel} />

					<div className="mt-8 space-y-6 [&>section>div]:px-0 [&>section>div]:py-0">
						<EncounterSection
							title="Vitals"
							isEmpty={
								vitalsResult.totalVitals === 0 &&
								!(
									vitalsParams.page !== 1 ||
									Boolean(vitalsParams.searchQuery) ||
									Boolean(vitalsParams.recordedFrom) ||
									Boolean(vitalsParams.recordedTo) ||
									Boolean(vitalsParams.createdFrom) ||
									Boolean(vitalsParams.createdTo)
								)
							}
							addAction={
								<CreateVitalsEmptyStateAction
									patientId={patientId}
									encounterId={encounterId}
									encounterOptions={encounterOptions}
									variant="outline"
								/>
							}
						>
							<VitalsClient
								patientId={patientId}
								encounterId={encounterId}
								encounterOptions={encounterOptions}
								vitals={vitalsResult.vitals}
								readings={vitalReadings}
								page={vitalsParams.page}
								limit={vitalsParams.limit}
								totalPages={vitalsTotalPages}
								searchQuery={vitalsParams.searchQuery}
								recordedFrom={vitalsParams.recordedFrom}
								recordedTo={vitalsParams.recordedTo}
								createdFrom={vitalsParams.createdFrom}
								createdTo={vitalsParams.createdTo}
							/>
						</EncounterSection>

						<EncounterSection
							title="Medications"
							isEmpty={
								medicationsResult.totalMedications === 0 &&
								!(
									medicationsParams.page !== 1 ||
									Boolean(medicationsParams.searchQuery) ||
									Boolean(medicationsParams.createdFrom) ||
									Boolean(medicationsParams.createdTo) ||
									medicationsParams.statusFilters.length > 0
								)
							}
							addAction={
								<CreateMedicationEmptyStateAction
									patientId={patientId}
									encounterId={encounterId}
									variant="outline"
								/>
							}
						>
							<MedicationsClient
								patientId={patientId}
								encounterId={encounterId}
								medications={medicationsResult.medications}
								page={medicationsParams.page}
								limit={medicationsParams.limit}
								totalPages={medicationsTotalPages}
								searchQuery={medicationsParams.searchQuery}
								createdFrom={medicationsParams.createdFrom}
								createdTo={medicationsParams.createdTo}
								statusFilters={medicationsParams.statusFilters}
							/>
						</EncounterSection>

						<EncounterSection
							title="Allergies"
							isEmpty={
								allergiesResult.totalAllergies === 0 &&
								!(
									allergiesParams.page !== 1 ||
									Boolean(allergiesParams.searchQuery) ||
									Boolean(allergiesParams.createdFrom) ||
									Boolean(allergiesParams.createdTo) ||
									allergiesParams.statusFilters.length > 0 ||
									allergiesParams.severityFilters.length > 0
								)
							}
							addAction={
								<CreateAllergyEmptyStateAction
									patientId={patientId}
									encounterId={encounterId}
									variant="outline"
								/>
							}
						>
							<AllergiesClient
								patientId={patientId}
								encounterId={encounterId}
								allergies={allergiesResult.allergies}
								page={allergiesParams.page}
								limit={allergiesParams.limit}
								totalPages={allergiesTotalPages}
								searchQuery={allergiesParams.searchQuery}
								createdFrom={allergiesParams.createdFrom}
								createdTo={allergiesParams.createdTo}
								statusFilters={allergiesParams.statusFilters}
								severityFilters={allergiesParams.severityFilters}
							/>
						</EncounterSection>

						<EncounterSection
							title="Diagnoses"
							isEmpty={
								diagnosesResult.totalDiagnoses === 0 &&
								!(
									diagnosesParams.page !== 1 ||
									Boolean(diagnosesParams.searchQuery) ||
									Boolean(diagnosesParams.createdFrom) ||
									Boolean(diagnosesParams.createdTo) ||
									Boolean(diagnosesParams.diagnosedFrom) ||
									Boolean(diagnosesParams.diagnosedTo) ||
									Boolean(diagnosesParams.lastReviewedFrom) ||
									Boolean(diagnosesParams.lastReviewedTo) ||
									diagnosesParams.statusFilters.length > 0
								)
							}
							addAction={
								<CreateDiagnosisEmptyStateAction
									patientId={patientId}
									encounterId={encounterId}
									variant="outline"
								/>
							}
						>
							<DiagnosesClient
								patientId={patientId}
								encounterId={encounterId}
								diagnoses={diagnosesResult.diagnoses}
								page={diagnosesParams.page}
								limit={diagnosesParams.limit}
								totalPages={diagnosesTotalPages}
								searchQuery={diagnosesParams.searchQuery}
								createdFrom={diagnosesParams.createdFrom}
								createdTo={diagnosesParams.createdTo}
								diagnosedFrom={diagnosesParams.diagnosedFrom}
								diagnosedTo={diagnosesParams.diagnosedTo}
								lastReviewedFrom={diagnosesParams.lastReviewedFrom}
								lastReviewedTo={diagnosesParams.lastReviewedTo}
								statusFilters={diagnosesParams.statusFilters}
							/>
						</EncounterSection>

						<EncounterSection
							title="Immunizations"
							isEmpty={
								immunizationsResult.totalImmunizations === 0 &&
								!(
									immunizationsParams.page !== 1 ||
									Boolean(immunizationsParams.searchQuery) ||
									Boolean(immunizationsParams.createdFrom) ||
									Boolean(immunizationsParams.createdTo) ||
									immunizationsParams.statusFilters.length > 0
								)
							}
							addAction={
								<CreateImmunizationEmptyStateAction
									patientId={patientId}
									encounterId={encounterId}
									variant="outline"
								/>
							}
						>
							<ImmunizationsClient
								patientId={patientId}
								encounterId={encounterId}
								immunizations={immunizationsResult.immunizations}
								page={immunizationsParams.page}
								limit={immunizationsParams.limit}
								totalPages={immunizationsTotalPages}
								searchQuery={immunizationsParams.searchQuery}
								createdFrom={immunizationsParams.createdFrom}
								createdTo={immunizationsParams.createdTo}
								statusFilters={immunizationsParams.statusFilters}
							/>
						</EncounterSection>

						<EncounterSection
							title="Procedures"
							isEmpty={
								proceduresResult.totalProcedures === 0 &&
								!(
									proceduresParams.page !== 1 ||
									Boolean(proceduresParams.searchQuery) ||
									Boolean(proceduresParams.createdFrom) ||
									Boolean(proceduresParams.createdTo) ||
									proceduresParams.statusFilters.length > 0
								)
							}
							addAction={
								<CreateProcedureEmptyStateAction
									patientId={patientId}
									encounterId={encounterId}
									variant="outline"
								/>
							}
						>
							<ProceduresClient
								patientId={patientId}
								encounterId={encounterId}
								procedures={proceduresResult.procedures}
								page={proceduresParams.page}
								limit={proceduresParams.limit}
								totalPages={proceduresTotalPages}
								searchQuery={proceduresParams.searchQuery}
								createdFrom={proceduresParams.createdFrom}
								createdTo={proceduresParams.createdTo}
								statusFilters={proceduresParams.statusFilters}
							/>
						</EncounterSection>

						<EncounterSection
							title="Lab tests"
							isEmpty={
								labTestsResult.totalLabTests === 0 &&
								!(
									labTestsParams.page !== 1 ||
									Boolean(labTestsParams.searchQuery) ||
									Boolean(labTestsParams.createdFrom) ||
									Boolean(labTestsParams.createdTo) ||
									labTestsParams.statusFilters.length > 0 ||
									labTestsParams.flagFilters.length > 0
								)
							}
							addAction={
								<CreateLabTestEmptyStateAction
									patientId={patientId}
									encounterId={encounterId}
									variant="outline"
								/>
							}
						>
							<LabTestsClient
								patientId={patientId}
								encounterId={encounterId}
								labTests={labTestsResult.labTests}
								page={labTestsParams.page}
								limit={labTestsParams.limit}
								totalPages={labTestsTotalPages}
								searchQuery={labTestsParams.searchQuery}
								createdFrom={labTestsParams.createdFrom}
								createdTo={labTestsParams.createdTo}
								statusFilters={labTestsParams.statusFilters}
								flagFilters={labTestsParams.flagFilters}
							/>
						</EncounterSection>

						<EncounterSection
							title="Imaging"
							isEmpty={
								imagingResult.totalImagingStudies === 0 &&
								!(
									imagingParams.page !== 1 ||
									Boolean(imagingParams.searchQuery) ||
									Boolean(imagingParams.orderedFrom) ||
									Boolean(imagingParams.orderedTo) ||
									Boolean(imagingParams.createdFrom) ||
									Boolean(imagingParams.createdTo) ||
									imagingParams.statusFilters.length > 0 ||
									imagingParams.modalityFilters.length > 0
								)
							}
							addAction={
								<CreateImagingEmptyStateAction
									patientId={patientId}
									encounterId={encounterId}
									variant="outline"
								/>
							}
						>
							<ImagingClient
								patientId={patientId}
								encounterId={encounterId}
								imagingStudies={imagingResult.imagingStudies}
								page={imagingParams.page}
								limit={imagingParams.limit}
								totalPages={imagingTotalPages}
								searchQuery={imagingParams.searchQuery}
								orderedFrom={imagingParams.orderedFrom}
								orderedTo={imagingParams.orderedTo}
								createdFrom={imagingParams.createdFrom}
								createdTo={imagingParams.createdTo}
								statusFilters={imagingParams.statusFilters}
								modalityFilters={imagingParams.modalityFilters}
							/>
						</EncounterSection>
					</div>
				</div>
			</main>
		</div>
	);
}

function EncounterSection({
	title,
	isEmpty,
	addAction,
	children,
}: {
	title: string;
	isEmpty: boolean;
	addAction: ReactNode;
	children: ReactNode;
}) {
	if (!isEmpty) return <section>{children}</section>;

	return (
		<section className="flex items-center justify-between gap-4 rounded-xl px-4 py-3 ring-1 ring-gray-200">
			<div className="flex flex-col gap-1">
				<h2 className="font-semibold text-gray-800">{title}</h2>
				<p className="text-sm text-gray-500">
					No {title.toLowerCase()} recorded for this encounter.
				</p>
			</div>
			{addAction}
		</section>
	);
}

function EncounterDetailsPageSkeleton() {
	return (
		<div className="flex h-full min-h-0 flex-col overflow-hidden">
			<div className="flex shrink-0 items-center gap-2 border-b border-gray-200 p-4">
				<div className="h-4 w-20 rounded bg-gray-100" />
				<div className="h-4 w-32 rounded bg-gray-100" />
				<div className="h-4 w-24 rounded bg-gray-100" />
			</div>
			<main className="min-h-0 flex-1 overflow-hidden px-6 py-8">
				<div className="mx-auto max-w-7xl space-y-8">
					<div className="h-24 animate-pulse rounded-xl border border-gray-200 bg-gray-50" />
					{Array.from({ length: 3 }).map((_, index) => (
						<div key={index} className="space-y-3">
							<div className="h-4 w-24 animate-pulse rounded bg-gray-100" />
							<div className="h-10 animate-pulse rounded-lg bg-gray-100" />
							<div className="h-56 animate-pulse rounded-xl border border-gray-200 bg-gray-50" />
						</div>
					))}
				</div>
			</main>
		</div>
	);
}
