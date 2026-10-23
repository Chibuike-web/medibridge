import { Suspense } from "react";
import { RiInformationFill } from "@remixicon/react";
import { sharedSections, type SharedPatient } from "./shared-record-sections";
import { SharedAllergiesTable } from "./shared-record-tables/allergies-table";
import { SharedDiagnosesTable } from "./shared-record-tables/diagnoses-table";
import { SharedImagingTable } from "./shared-record-tables/imaging-table";
import { SharedImmunizationsTable } from "./shared-record-tables/immunizations-table";
import { SharedLabTestsTable } from "./shared-record-tables/lab-tests-table";
import { SharedMedicationsTable } from "./shared-record-tables/medications-table";
import { SharedProceduresTable } from "./shared-record-tables/procedures-table";
import { SharedTabs } from "./shared-tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
	DetailItem,
	DetailsSection,
} from "@/features/patients/components/patient-details-section/detail-fields";
import { hasVerifiedExternalAccessSession } from "@/lib/api/external-access-session";
import { getInitials } from "@/lib/utils/get-initials";
import { notFound, redirect } from "next/navigation";
import { getSharedAllergies } from "@/lib/api/get-shared-allergies";
import { getSharedDiagnoses } from "@/lib/api/get-shared-diagnoses";
import { getSharedImaging } from "@/lib/api/get-shared-imaging";
import { getSharedImmunizations } from "@/lib/api/get-shared-immunizations";
import { getSharedLabTests } from "@/lib/api/get-shared-lab-tests";
import { getSharedMedications } from "@/lib/api/get-shared-medications";
import { getSharedPatientDetails } from "@/lib/api/get-shared-patient-details";
import { getSharedProcedures } from "@/lib/api/get-shared-procedures";
import { getSharedRecord } from "@/lib/api/get-shared-record";
import { formatDate } from "@/lib/utils/format-date";
import { getStringParam } from "@/lib/utils/search-params";

export const metadata = {
	title: "Shared Patient Record",
};

type SharedRecordsPageProps = Pick<
	PageProps<"/shared-records/[accessId]">,
	"params" | "searchParams"
>;

export default function SharedRecordsPage({ params, searchParams }: SharedRecordsPageProps) {
	return (
		<div className="min-h-dvh bg-white text-gray-800">
			<Suspense fallback={<SharedRecordsPageSkeleton />}>
				<SharedRecordsContent params={params} searchParams={searchParams} />
			</Suspense>
		</div>
	);
}

async function SharedRecordsContent({ params, searchParams }: SharedRecordsPageProps) {
	const [{ accessId }, { section: sectionParam }] = await Promise.all([params, searchParams]);
	const section = getStringParam(sectionParam);
	const hasVerifiedAccessSession = await hasVerifiedExternalAccessSession(accessId);

	if (!hasVerifiedAccessSession) {
		redirect(`/verify-access/${accessId}`);
	}

	const sharedRecord = await getSharedRecord(accessId);
	if (!sharedRecord) notFound();

	const selectedSections = sharedRecord.selectedRecordIds.map((record) => record.section);
	const availableSections = sharedSections
		.map((sharedSection) => sharedSection.id)
		.filter((id) => selectedSections.includes(id));
	const activeSection = availableSections.find((id) => id === section) ?? availableSections[0];

	return (
		<>
			<SharedAccessBanner
				sourceOrganizationName={sharedRecord.sourceOrganizationName}
				expiresAt={sharedRecord.expiresAt}
			/>
			<PatientHeader patient={sharedRecord.patient} />
			<nav className="border-b border-gray-200" aria-label="Shared record sections">
				<SharedTabs activeSection={activeSection} availableSections={availableSections} />
			</nav>
			<main className="mx-auto w-full max-w-7xl px-6 py-9">
				{activeSection === "patient-details" ? <SharedPatientDetails accessId={accessId} /> : null}
				{activeSection === "diagnoses" ? <SharedDiagnoses accessId={accessId} /> : null}
				{activeSection === "allergies" ? <SharedAllergies accessId={accessId} /> : null}
				{activeSection === "immunizations" ? <SharedImmunizations accessId={accessId} /> : null}
				{activeSection === "procedures" ? <SharedProcedures accessId={accessId} /> : null}
				{activeSection === "medications" ? <SharedMedications accessId={accessId} /> : null}
				{activeSection === "lab-tests" ? <SharedLabTests accessId={accessId} /> : null}
				{activeSection === "imaging" ? <SharedImaging accessId={accessId} /> : null}
			</main>
		</>
	);
}

async function SharedPatientDetails({ accessId }: { accessId: string }) {
	const sections = await getSharedPatientDetails(accessId);

	return (
		<div>
			<h2 className="mb-6 text-lg font-semibold text-gray-900">Patient Details</h2>
			<div className="flex flex-col gap-8">
				{sections.map((section) => (
					<DetailsSection key={section.title} title={section.title}>
						{section.items.map((item) => (
							<DetailItem key={item.label} label={item.label} value={item.value} />
						))}
					</DetailsSection>
				))}
			</div>
		</div>
	);
}

async function SharedDiagnoses({ accessId }: { accessId: string }) {
	const diagnoses = await getSharedDiagnoses(accessId);

	return <SharedDiagnosesTable accessId={accessId} rows={diagnoses} />;
}

async function SharedAllergies({ accessId }: { accessId: string }) {
	const allergies = await getSharedAllergies(accessId);

	return <SharedAllergiesTable accessId={accessId} rows={allergies} />;
}

async function SharedImmunizations({ accessId }: { accessId: string }) {
	const immunizations = await getSharedImmunizations(accessId);

	return <SharedImmunizationsTable accessId={accessId} rows={immunizations} />;
}

async function SharedProcedures({ accessId }: { accessId: string }) {
	const procedures = await getSharedProcedures(accessId);

	return <SharedProceduresTable accessId={accessId} rows={procedures} />;
}

async function SharedMedications({ accessId }: { accessId: string }) {
	const medications = await getSharedMedications(accessId);

	return <SharedMedicationsTable accessId={accessId} rows={medications} />;
}

async function SharedLabTests({ accessId }: { accessId: string }) {
	const labTests = await getSharedLabTests(accessId);

	return <SharedLabTestsTable accessId={accessId} rows={labTests} />;
}

async function SharedImaging({ accessId }: { accessId: string }) {
	const imaging = await getSharedImaging(accessId);

	return <SharedImagingTable accessId={accessId} rows={imaging} />;
}

function SharedAccessBanner({
	sourceOrganizationName,
	expiresAt,
}: {
	sourceOrganizationName: string;
	expiresAt: string;
}) {
	return (
		<div className="bg-[#fff3c4] text-[#b94600]">
			<div className="mx-auto flex w-full max-w-7xl items-start gap-2 px-6 py-4">
				<RiInformationFill className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
				<div className="flex flex-col gap-1 text-sm leading-5">
					<p className="font-semibold">Shared Patient Record</p>
					<p>
						You are viewing a patient record securely shared by{" "}
						<span className="font-semibold">{sourceOrganizationName}.</span> This session is{" "}
						<span className="font-semibold">view-only</span> and expires on{" "}
						<span className="font-semibold">{formatDate(expiresAt)}.</span>
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
				<Avatar className="size-16 border border-gray-200 bg-gray-100 text-gray-700">
					<AvatarFallback className="bg-gray-100 text-lg font-semibold text-gray-700">
						{getInitials(patient.name)}
					</AvatarFallback>
				</Avatar>

				<div className="min-w-0">
					<h1 className="text-lg font-semibold text-gray-900 text-balance">{patient.name}</h1>
					<div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
						<HeaderMeta label="Sex" value={patient.sex} />
						<HeaderMeta label="Age" value={patient.age} />
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
