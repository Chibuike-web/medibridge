import { Button } from "@/components/ui/button";
import { RiArrowLeftLine, RiArrowRightSLine } from "@remixicon/react";
import type { Route } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { CopyIdButton } from "@/components/copy-id-button";
import {
	DetailItem,
	DetailsSection,
} from "@/features/patients/components/patient-details-section/detail-fields";
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

export const metadata = {
	title: "Encounter Details",
};

const INITIAL_PAGE = 1;
const INITIAL_LIMIT = 14;

type EncounterDetailsPageProps = Pick<
	PageProps<"/dashboard/patients/[patientId]/encounters/[encounterId]">,
	"params" | "searchParams"
>;

export default function EncounterDetailsPage({ params, searchParams }: EncounterDetailsPageProps) {
	return (
		<Suspense fallback={<EncounterDetailsPageSkeleton />}>
			<EncounterDetailsContent params={params} searchParams={searchParams} />
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
	const { created } = await searchParams;

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
		getPatientMedications(patientId, INITIAL_PAGE, INITIAL_LIMIT, "", {}, [], encounterId),
		getPatientAllergies(patientId, INITIAL_PAGE, INITIAL_LIMIT, "", {}, [], [], encounterId),
		getPatientDiagnoses(patientId, INITIAL_PAGE, INITIAL_LIMIT, "", {}, [], encounterId),
		getPatientImmunizations(patientId, INITIAL_PAGE, INITIAL_LIMIT, "", {}, [], encounterId),
		getPatientProcedures(patientId, INITIAL_PAGE, INITIAL_LIMIT, "", {}, [], encounterId),
		getPatientLabTests(patientId, INITIAL_PAGE, INITIAL_LIMIT, "", {}, [], [], encounterId),
		getPatientImaging(patientId, INITIAL_PAGE, INITIAL_LIMIT, "", {}, [], [], encounterId),
		getPatientVitals(patientId, INITIAL_PAGE, INITIAL_LIMIT, "", {}, encounterId),
		getPatientVitalReadings(patientId, encounterId),
	]);

	if (!patient || !encounter) {
		notFound();
	}

	const backHref = `/dashboard/patients/${patientId}?section=encounters` as Route;
	const encounterOptions = [
		{
			encounterId: encounter.encounterId,
			encounterType: encounter.encounterType,
			encounterDateLabel: encounter.encounterDateLabel,
		},
	];
	const visitDateLabel = new Intl.DateTimeFormat("en-US", { dateStyle: "long" }).format(
		encounter.encounterDate,
	);

	return (
		<div className="flex h-full min-h-0 flex-col overflow-hidden">
			<nav
				aria-label="Breadcrumb"
				className="flex h-14 shrink-0 items-center gap-2 overflow-x-auto border-b border-gray-200 px-4 text-sm"
			>
				<Button variant="ghost" asChild>
					<Link href="/dashboard/patients">
						<RiArrowLeftLine data-icon="inline-start" aria-hidden="true" />
						<span>Patients</span>
					</Link>
				</Button>
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
				<div className="mx-auto max-w-7xl">
					{created === "true" && <EncounterCreatedBanner />}
					<DetailsSection title="Encounter details">
						<DetailItem label="Visit type" value={encounter.encounterType} />
						<DetailItem label="Department" value={encounter.department} />
						<DetailItem label="Attending physician" value={encounter.physician} />
						<DetailItem label="Visit date" value={visitDateLabel} />
						<div className="flex flex-col items-start gap-2">
							<span className="text-sm text-gray-400">Encounter ID</span>
							<CopyIdButton id={encounter.encounterId} className="text-sm" />
						</div>
						<div className="flex flex-col items-start gap-2">
							<span className="text-sm text-gray-400">Patient ID</span>
							<CopyIdButton id={encounter.patientId} className="text-sm" />
						</div>
						<DetailItem label="Reason for visit" value={encounter.reason} />
						<DetailItem
							label="Created"
							value={`${encounter.createdBy} · ${encounter.createdAtLabel}`}
						/>
					</DetailsSection>

					<div className="mt-8 space-y-6 [&>section>div]:px-0 [&>section>div]:py-0">
						<EncounterSection
							title="Vitals"
							isEmpty={vitalsResult.totalVitals === 0}
							addAction={
								<CreateVitalsEmptyStateAction
									patientId={patientId}
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
								page={INITIAL_PAGE}
								limit={INITIAL_LIMIT}
								totalPages={getTotalPages(vitalsResult.totalVitals)}
							/>
						</EncounterSection>

						<EncounterSection
							title="Medications"
							isEmpty={medicationsResult.totalMedications === 0}
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
								page={INITIAL_PAGE}
								limit={INITIAL_LIMIT}
								totalPages={getTotalPages(medicationsResult.totalMedications)}
							/>
						</EncounterSection>

						<EncounterSection
							title="Allergies"
							isEmpty={allergiesResult.totalAllergies === 0}
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
								page={INITIAL_PAGE}
								limit={INITIAL_LIMIT}
								totalPages={getTotalPages(allergiesResult.totalAllergies)}
							/>
						</EncounterSection>

						<EncounterSection
							title="Diagnoses"
							isEmpty={diagnosesResult.totalDiagnoses === 0}
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
								page={INITIAL_PAGE}
								limit={INITIAL_LIMIT}
								totalPages={getTotalPages(diagnosesResult.totalDiagnoses)}
							/>
						</EncounterSection>

						<EncounterSection
							title="Immunizations"
							isEmpty={immunizationsResult.totalImmunizations === 0}
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
								page={INITIAL_PAGE}
								limit={INITIAL_LIMIT}
								totalPages={getTotalPages(immunizationsResult.totalImmunizations)}
							/>
						</EncounterSection>

						<EncounterSection
							title="Procedures"
							isEmpty={proceduresResult.totalProcedures === 0}
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
								page={INITIAL_PAGE}
								limit={INITIAL_LIMIT}
								totalPages={getTotalPages(proceduresResult.totalProcedures)}
							/>
						</EncounterSection>

						<EncounterSection
							title="Lab tests"
							isEmpty={labTestsResult.totalLabTests === 0}
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
								page={INITIAL_PAGE}
								limit={INITIAL_LIMIT}
								totalPages={getTotalPages(labTestsResult.totalLabTests)}
							/>
						</EncounterSection>

						<EncounterSection
							title="Imaging"
							isEmpty={imagingResult.totalImagingStudies === 0}
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
								page={INITIAL_PAGE}
								limit={INITIAL_LIMIT}
								totalPages={getTotalPages(imagingResult.totalImagingStudies)}
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

function getTotalPages(totalRows: number) {
	return Math.ceil(totalRows / INITIAL_LIMIT) || 1;
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
