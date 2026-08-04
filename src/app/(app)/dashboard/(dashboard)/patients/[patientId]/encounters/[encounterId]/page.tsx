import { RiArrowLeftLine, RiArrowRightSLine } from "@remixicon/react";
import type { Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { CopyIdButton } from "@/components/copy-id-button";
import { getPatientAllergies } from "@/lib/api/get-patient-allergies";
import { getPatientById } from "@/lib/api/get-patient-by-id";
import { getPatientDiagnoses } from "@/lib/api/get-patient-diagnoses";
import { getPatientDocuments } from "@/lib/api/get-patient-documents";
import { getPatientEncounter } from "@/lib/api/get-patient-encounter";
import { getPatientImaging } from "@/lib/api/get-patient-imaging";
import { getPatientImmunizations } from "@/lib/api/get-patient-immunizations";
import { getPatientLabTests } from "@/lib/api/get-patient-lab-tests";
import { getPatientMedications } from "@/lib/api/get-patient-medications";
import { getPatientProcedures } from "@/lib/api/get-patient-procedures";
import { verifySession } from "@/lib/api/verify-session";
import {
	AllergiesClient,
	DiagnosesClient,
	ImagingClient,
	ImmunizationsClient,
	LabTestsClient,
	MedicationsClient,
	ProceduresClient,
} from "../../patient-section-table-clients";
import { DocumentsClient } from "../../patient-section-table-clients/documents-client";

export const metadata = {
	title: "Encounter Details",
};

const INITIAL_PAGE = 1;
const INITIAL_LIMIT = 14;

type EncounterDetailsPageProps =
	PageProps<"/dashboard/patients/[patientId]/encounters/[encounterId]">;
type EncounterDetailsParamsProps = Pick<EncounterDetailsPageProps, "params">;

export default async function EncounterDetailsPage({ params }: EncounterDetailsPageProps) {
	return (
		<Suspense fallback={<EncounterDetailsPageSkeleton />}>
			<EncounterDetailsContent params={params} />
		</Suspense>
	);
}

async function EncounterDetailsContent({ params }: EncounterDetailsParamsProps) {
	const { patientId, encounterId } = await params;
	await verifySession();

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
		documentsResult,
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
		getPatientDocuments(patientId, INITIAL_PAGE, INITIAL_LIMIT, "", {}, [], encounterId),
	]);

	if (!patient || !encounter) {
		notFound();
	}

	const backHref = `/dashboard/patients/${patientId}?section=encounters` as Route;

	return (
		<div className="flex h-full min-h-0 flex-col overflow-hidden">
			<nav
				aria-label="Breadcrumb"
				className="flex h-14 shrink-0 items-center gap-2 overflow-x-auto border-b border-gray-200 px-6 text-sm"
			>
				<Link href="/dashboard/patients" className="flex shrink-0 items-center gap-2 text-gray-600">
					<RiArrowLeftLine aria-hidden className="size-5" />
					<span>Patients</span>
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
				<div className="mx-auto max-w-7xl">
					<div className="flex flex-wrap gap-x-6 gap-y-3">
						<div className="flex items-center gap-2 whitespace-nowrap">
							<span className="text-sm text-gray-500">Patient ID</span>
							<CopyIdButton id={encounter.patientId} className="text-sm" />
						</div>
						<div className="flex items-center gap-2 whitespace-nowrap">
							<span className="text-sm text-gray-500">Encounter ID: </span>
							<CopyIdButton id={encounter.encounterId} className="text-sm" />
						</div>
						<div className="flex items-center gap-2 whitespace-nowrap">
							<span className="text-sm text-gray-500">Department: </span>
							<span className="text-sm font-medium">{encounter.department}</span>
						</div>
						<div className="flex items-center gap-2 whitespace-nowrap">
							<span className="text-sm text-gray-500">Physician: </span>
							<span className="text-sm font-medium">{encounter.physician}</span>
						</div>
						<div className="flex items-center gap-2 whitespace-nowrap">
							<span className="text-sm text-gray-500">Encounter date:</span>
							<span className="text-sm font-medium">{encounter.encounterDateLabel}</span>
						</div>
						<div className="flex items-center gap-2 whitespace-nowrap">
							<span className="text-sm text-gray-500">Created At:</span>
							<span className="text-sm font-medium">{encounter.createdAtLabel}</span>
						</div>
						<div className="flex items-center gap-2 whitespace-nowrap">
							<span className="text-sm text-gray-500">Created By:</span>
							<span className="text-sm font-medium">{encounter.createdBy}</span>
						</div>
						<div className="flex items-center gap-2 whitespace-nowrap">
							<span className="text-sm text-gray-500">Updated At:</span>
							<span className="text-sm font-medium">{encounter.updatedAtLabel}</span>
						</div>
						<div className="flex items-center gap-2 whitespace-nowrap">
							<span className="text-sm text-gray-500">Updated By</span>
							<span className="text-sm font-medium">{encounter.updatedBy}</span>
						</div>
					</div>

					<div className="mt-10 space-y-10 [&>section>div]:px-0 [&>section>div]:py-0">
						<EncounterSection>
							<MedicationsClient
								patientId={patientId}
								encounterId={encounterId}
								medications={medicationsResult.medications}
								page={INITIAL_PAGE}
								limit={INITIAL_LIMIT}
								totalPages={getTotalPages(medicationsResult.totalMedications)}
							/>
						</EncounterSection>

						<EncounterSection>
							<AllergiesClient
								patientId={patientId}
								encounterId={encounterId}
								allergies={allergiesResult.allergies}
								page={INITIAL_PAGE}
								limit={INITIAL_LIMIT}
								totalPages={getTotalPages(allergiesResult.totalAllergies)}
							/>
						</EncounterSection>

						<EncounterSection>
							<DiagnosesClient
								patientId={patientId}
								encounterId={encounterId}
								diagnoses={diagnosesResult.diagnoses}
								page={INITIAL_PAGE}
								limit={INITIAL_LIMIT}
								totalPages={getTotalPages(diagnosesResult.totalDiagnoses)}
							/>
						</EncounterSection>

						<EncounterSection>
							<ImmunizationsClient
								patientId={patientId}
								encounterId={encounterId}
								immunizations={immunizationsResult.immunizations}
								page={INITIAL_PAGE}
								limit={INITIAL_LIMIT}
								totalPages={getTotalPages(immunizationsResult.totalImmunizations)}
							/>
						</EncounterSection>

						<EncounterSection>
							<ProceduresClient
								patientId={patientId}
								encounterId={encounterId}
								procedures={proceduresResult.procedures}
								page={INITIAL_PAGE}
								limit={INITIAL_LIMIT}
								totalPages={getTotalPages(proceduresResult.totalProcedures)}
							/>
						</EncounterSection>

						<EncounterSection>
							<LabTestsClient
								patientId={patientId}
								encounterId={encounterId}
								labTests={labTestsResult.labTests}
								page={INITIAL_PAGE}
								limit={INITIAL_LIMIT}
								totalPages={getTotalPages(labTestsResult.totalLabTests)}
							/>
						</EncounterSection>

						<EncounterSection>
							<ImagingClient
								patientId={patientId}
								encounterId={encounterId}
								imagingStudies={imagingResult.imagingStudies}
								page={INITIAL_PAGE}
								limit={INITIAL_LIMIT}
								totalPages={getTotalPages(imagingResult.totalImagingStudies)}
							/>
						</EncounterSection>

						<EncounterSection>
							<DocumentsClient
								patientId={patientId}
								encounterId={encounterId}
								documents={documentsResult.documents}
								page={INITIAL_PAGE}
								limit={INITIAL_LIMIT}
								totalPages={getTotalPages(documentsResult.totalDocuments)}
							/>
						</EncounterSection>
					</div>
				</div>
			</main>
		</div>
	);
}

function EncounterSection({ children }: { children: ReactNode }) {
	return <section>{children}</section>;
}

function getTotalPages(totalRows: number) {
	return Math.ceil(totalRows / INITIAL_LIMIT) || 1;
}

function EncounterDetailsPageSkeleton() {
	return (
		<div className="flex h-full min-h-0 flex-col overflow-hidden">
			<div className="flex h-14 shrink-0 items-center gap-2 border-b border-gray-200 px-6">
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
