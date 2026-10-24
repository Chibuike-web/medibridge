import { Suspense } from "react";
import type { Route } from "next";
import { RiInformationFill } from "@remixicon/react";
import { sharedSections, type SharedPatient } from "./shared-record-sections";
import {
	SharedAllergiesTable,
	type SharedAllergyRow,
} from "./shared-record-tables/allergies-table";
import {
	SharedDiagnosesTable,
	type SharedDiagnosisRow,
} from "./shared-record-tables/diagnoses-table";
import { SharedImagingTable, type SharedImagingRow } from "./shared-record-tables/imaging-table";
import {
	SharedImmunizationsTable,
	type SharedImmunizationRow,
} from "./shared-record-tables/immunizations-table";
import { SharedLabTestsTable, type SharedLabTestRow } from "./shared-record-tables/lab-tests-table";
import {
	SharedMedicationsTable,
	type SharedMedicationRow,
} from "./shared-record-tables/medications-table";
import {
	SharedProceduresTable,
	type SharedProcedureRow,
} from "./shared-record-tables/procedures-table";
import { SharedTabs } from "./shared-tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
	DetailItem,
	DetailsSection,
} from "@/features/patients/components/patient-details-section/detail-fields";
import { TableUrlNavigation } from "@/features/patients/components/table-url-navigation";
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
import { getNumberParam, getStringParam } from "@/lib/utils/search-params";

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
				<TableUrlNavigation>
					<SharedRecordsContent params={params} searchParams={searchParams} />
				</TableUrlNavigation>
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
				{activeSection === "diagnoses" ? (
					<SharedDiagnoses accessId={accessId} searchParams={searchParams} />
				) : null}
				{activeSection === "allergies" ? (
					<SharedAllergies accessId={accessId} searchParams={searchParams} />
				) : null}
				{activeSection === "immunizations" ? (
					<SharedImmunizations accessId={accessId} searchParams={searchParams} />
				) : null}
				{activeSection === "procedures" ? (
					<SharedProcedures accessId={accessId} searchParams={searchParams} />
				) : null}
				{activeSection === "medications" ? (
					<SharedMedications accessId={accessId} searchParams={searchParams} />
				) : null}
				{activeSection === "lab-tests" ? (
					<SharedLabTests accessId={accessId} searchParams={searchParams} />
				) : null}
				{activeSection === "imaging" ? (
					<SharedImaging accessId={accessId} searchParams={searchParams} />
				) : null}
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

async function SharedDiagnoses({
	accessId,
	searchParams,
}: {
	accessId: string;
	searchParams: SharedRecordsPageProps["searchParams"];
}) {
	const tableParams = await searchParams;
	const page = getNumberParam(tableParams.diagnosesPage, 1, { min: 1 });
	const limit = getNumberParam(tableParams.diagnosesLimit, 14, { min: 1 });
	const searchQuery = getStringParam(tableParams.diagnosesQuery);
	const diagnosedFrom = getStringParam(tableParams.diagnosesDiagnosedFrom);
	const diagnosedTo = getStringParam(tableParams.diagnosesDiagnosedTo);
	const reviewedFrom = getStringParam(tableParams.diagnosesReviewedFrom);
	const reviewedTo = getStringParam(tableParams.diagnosesReviewedTo);
	const createdFrom = getStringParam(tableParams.diagnosesCreatedFrom);
	const createdTo = getStringParam(tableParams.diagnosesCreatedTo);
	const statusFilters = getStringParam(tableParams.diagnosesStatus)
		.split(",")
		.filter((value): value is SharedDiagnosisRow["status"] =>
			["Active", "Resolved"].includes(value),
		);
	const { rows, totalRows } = await getSharedDiagnoses(accessId, {
		page,
		limit,
		query: searchQuery,
		statusFilters,
		diagnosedFrom,
		diagnosedTo,
		reviewedFrom,
		reviewedTo,
		createdFrom,
		createdTo,
	});
	const totalPages = Math.ceil(totalRows / limit) || 1;

	if (page > totalPages) {
		const lastPageParams = new URLSearchParams(
			Object.entries(tableParams).flatMap(([name, value]) =>
				typeof value === "string" ? [[name, value]] : [],
			),
		);
		lastPageParams.set("diagnosesPage", String(totalPages));
		redirect(`/shared-records/${accessId}?${lastPageParams}` as Route);
	}

	return (
		<SharedDiagnosesTable
			rows={rows}
			page={page}
			limit={limit}
			totalPages={totalPages}
			searchQuery={searchQuery}
			statusFilters={statusFilters}
			diagnosedFrom={diagnosedFrom}
			diagnosedTo={diagnosedTo}
			reviewedFrom={reviewedFrom}
			reviewedTo={reviewedTo}
			createdFrom={createdFrom}
			createdTo={createdTo}
		/>
	);
}

async function SharedAllergies({
	accessId,
	searchParams,
}: {
	accessId: string;
	searchParams: SharedRecordsPageProps["searchParams"];
}) {
	const tableParams = await searchParams;
	const page = getNumberParam(tableParams.allergiesPage, 1, { min: 1 });
	const limit = getNumberParam(tableParams.allergiesLimit, 14, { min: 1 });
	const searchQuery = getStringParam(tableParams.allergiesQuery);
	const createdFrom = getStringParam(tableParams.allergiesCreatedFrom);
	const createdTo = getStringParam(tableParams.allergiesCreatedTo);
	const statusFilters = getStringParam(tableParams.allergiesStatus)
		.split(",")
		.filter((value): value is SharedAllergyRow["status"] => ["Active", "Inactive"].includes(value));
	const severityFilters = getStringParam(tableParams.allergiesSeverity)
		.split(",")
		.filter((value): value is SharedAllergyRow["severity"] =>
			["Mild", "Moderate", "Severe"].includes(value),
		);
	const { rows, totalRows } = await getSharedAllergies(accessId, {
		page,
		limit,
		query: searchQuery,
		statusFilters,
		severityFilters,
		createdFrom,
		createdTo,
	});
	const totalPages = Math.ceil(totalRows / limit) || 1;

	if (page > totalPages) {
		const lastPageParams = new URLSearchParams(
			Object.entries(tableParams).flatMap(([name, value]) =>
				typeof value === "string" ? [[name, value]] : [],
			),
		);
		lastPageParams.set("allergiesPage", String(totalPages));
		redirect(`/shared-records/${accessId}?${lastPageParams}` as Route);
	}

	return (
		<SharedAllergiesTable
			rows={rows}
			page={page}
			limit={limit}
			totalPages={totalPages}
			searchQuery={searchQuery}
			statusFilters={statusFilters}
			severityFilters={severityFilters}
			createdFrom={createdFrom}
			createdTo={createdTo}
		/>
	);
}

async function SharedImmunizations({
	accessId,
	searchParams,
}: {
	accessId: string;
	searchParams: SharedRecordsPageProps["searchParams"];
}) {
	const tableParams = await searchParams;
	const page = getNumberParam(tableParams.immunizationsPage, 1, { min: 1 });
	const limit = getNumberParam(tableParams.immunizationsLimit, 14, { min: 1 });
	const searchQuery = getStringParam(tableParams.immunizationsQuery);
	const createdFrom = getStringParam(tableParams.immunizationsCreatedFrom);
	const createdTo = getStringParam(tableParams.immunizationsCreatedTo);
	const statusFilters = getStringParam(tableParams.immunizationsStatus)
		.split(",")
		.filter((value): value is SharedImmunizationRow["status"] =>
			["Active", "Completed", "Cancelled", "Discontinued"].includes(value),
		);
	const { rows, totalRows } = await getSharedImmunizations(accessId, {
		page,
		limit,
		query: searchQuery,
		statusFilters,
		createdFrom,
		createdTo,
	});
	const totalPages = Math.ceil(totalRows / limit) || 1;

	if (page > totalPages) {
		const lastPageParams = new URLSearchParams(
			Object.entries(tableParams).flatMap(([name, value]) =>
				typeof value === "string" ? [[name, value]] : [],
			),
		);
		lastPageParams.set("immunizationsPage", String(totalPages));
		redirect(`/shared-records/${accessId}?${lastPageParams}` as Route);
	}

	return (
		<SharedImmunizationsTable
			rows={rows}
			page={page}
			limit={limit}
			totalPages={totalPages}
			searchQuery={searchQuery}
			statusFilters={statusFilters}
			createdFrom={createdFrom}
			createdTo={createdTo}
		/>
	);
}

async function SharedProcedures({
	accessId,
	searchParams,
}: {
	accessId: string;
	searchParams: SharedRecordsPageProps["searchParams"];
}) {
	const tableParams = await searchParams;
	const page = getNumberParam(tableParams.proceduresPage, 1, { min: 1 });
	const limit = getNumberParam(tableParams.proceduresLimit, 14, { min: 1 });
	const searchQuery = getStringParam(tableParams.proceduresQuery);
	const createdFrom = getStringParam(tableParams.proceduresCreatedFrom);
	const createdTo = getStringParam(tableParams.proceduresCreatedTo);
	const statusFilters = getStringParam(tableParams.proceduresStatus)
		.split(",")
		.filter((value): value is SharedProcedureRow["status"] =>
			["Pending", "Completed", "Cancelled"].includes(value),
		);
	const { rows, totalRows } = await getSharedProcedures(accessId, {
		page,
		limit,
		query: searchQuery,
		statusFilters,
		createdFrom,
		createdTo,
	});
	const totalPages = Math.ceil(totalRows / limit) || 1;

	if (page > totalPages) {
		const lastPageParams = new URLSearchParams(
			Object.entries(tableParams).flatMap(([name, value]) =>
				typeof value === "string" ? [[name, value]] : [],
			),
		);
		lastPageParams.set("proceduresPage", String(totalPages));
		redirect(`/shared-records/${accessId}?${lastPageParams}` as Route);
	}

	return (
		<SharedProceduresTable
			rows={rows}
			page={page}
			limit={limit}
			totalPages={totalPages}
			searchQuery={searchQuery}
			statusFilters={statusFilters}
			createdFrom={createdFrom}
			createdTo={createdTo}
		/>
	);
}

async function SharedMedications({
	accessId,
	searchParams,
}: {
	accessId: string;
	searchParams: SharedRecordsPageProps["searchParams"];
}) {
	const tableParams = await searchParams;
	const page = getNumberParam(tableParams.medicationsPage, 1, { min: 1 });
	const limit = getNumberParam(tableParams.medicationsLimit, 14, { min: 1 });
	const searchQuery = getStringParam(tableParams.medicationsQuery);
	const createdFrom = getStringParam(tableParams.medicationsCreatedFrom);
	const createdTo = getStringParam(tableParams.medicationsCreatedTo);
	const statusFilters = getStringParam(tableParams.medicationsStatus)
		.split(",")
		.filter((value): value is SharedMedicationRow["status"] =>
			["Active", "Completed", "Discontinued"].includes(value),
		);
	const { rows, totalRows } = await getSharedMedications(accessId, {
		page,
		limit,
		query: searchQuery,
		statusFilters,
		createdFrom,
		createdTo,
	});
	const totalPages = Math.ceil(totalRows / limit) || 1;

	if (page > totalPages) {
		const lastPageParams = new URLSearchParams(
			Object.entries(tableParams).flatMap(([name, value]) =>
				typeof value === "string" ? [[name, value]] : [],
			),
		);
		lastPageParams.set("medicationsPage", String(totalPages));
		redirect(`/shared-records/${accessId}?${lastPageParams}` as Route);
	}

	return (
		<SharedMedicationsTable
			rows={rows}
			page={page}
			limit={limit}
			totalPages={totalPages}
			searchQuery={searchQuery}
			statusFilters={statusFilters}
			createdFrom={createdFrom}
			createdTo={createdTo}
		/>
	);
}

async function SharedLabTests({
	accessId,
	searchParams,
}: {
	accessId: string;
	searchParams: SharedRecordsPageProps["searchParams"];
}) {
	const tableParams = await searchParams;
	const page = getNumberParam(tableParams.labTestsPage, 1, { min: 1 });
	const limit = getNumberParam(tableParams.labTestsLimit, 14, { min: 1 });
	const searchQuery = getStringParam(tableParams.labTestsQuery);
	const createdFrom = getStringParam(tableParams.labTestsCreatedFrom);
	const createdTo = getStringParam(tableParams.labTestsCreatedTo);
	const statusFilters = getStringParam(tableParams.labTestsStatus)
		.split(",")
		.filter((value): value is SharedLabTestRow["status"] =>
			["Pending", "Completed", "Cancelled"].includes(value),
		);
	const flagFilters = getStringParam(tableParams.labTestsFlag)
		.split(",")
		.filter((value) =>
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
	const { rows, totalRows } = await getSharedLabTests(accessId, {
		page,
		limit,
		query: searchQuery,
		statusFilters,
		flagFilters,
		createdFrom,
		createdTo,
	});
	const totalPages = Math.ceil(totalRows / limit) || 1;

	if (page > totalPages) {
		const lastPageParams = new URLSearchParams(
			Object.entries(tableParams).flatMap(([name, value]) =>
				typeof value === "string" ? [[name, value]] : [],
			),
		);
		lastPageParams.set("labTestsPage", String(totalPages));
		redirect(`/shared-records/${accessId}?${lastPageParams}` as Route);
	}

	return (
		<SharedLabTestsTable
			rows={rows}
			page={page}
			limit={limit}
			totalPages={totalPages}
			searchQuery={searchQuery}
			statusFilters={statusFilters}
			interpretationFilters={flagFilters}
			createdFrom={createdFrom}
			createdTo={createdTo}
		/>
	);
}

async function SharedImaging({
	accessId,
	searchParams,
}: {
	accessId: string;
	searchParams: SharedRecordsPageProps["searchParams"];
}) {
	const tableParams = await searchParams;
	const page = getNumberParam(tableParams.imagingPage, 1, { min: 1 });
	const limit = getNumberParam(tableParams.imagingLimit, 14, { min: 1 });
	const searchQuery = getStringParam(tableParams.imagingQuery);
	const orderedFrom = getStringParam(tableParams.imagingOrderedFrom);
	const orderedTo = getStringParam(tableParams.imagingOrderedTo);
	const createdFrom = getStringParam(tableParams.imagingCreatedFrom);
	const createdTo = getStringParam(tableParams.imagingCreatedTo);
	const statusFilters = getStringParam(tableParams.imagingStatus)
		.split(",")
		.filter((value): value is SharedImagingRow["status"] =>
			["Pending", "Completed", "Cancelled"].includes(value),
		);
	const modalityFilters = getStringParam(tableParams.imagingModality)
		.split(",")
		.filter((value): value is SharedImagingRow["modality"] =>
			["CT", "MRI", "Ultrasound", "X-ray"].includes(value),
		);
	const { rows, totalRows } = await getSharedImaging(accessId, {
		page,
		limit,
		query: searchQuery,
		statusFilters,
		modalityFilters,
		orderedFrom,
		orderedTo,
		createdFrom,
		createdTo,
	});
	const totalPages = Math.ceil(totalRows / limit) || 1;

	if (page > totalPages) {
		const lastPageParams = new URLSearchParams(
			Object.entries(tableParams).flatMap(([name, value]) =>
				typeof value === "string" ? [[name, value]] : [],
			),
		);
		lastPageParams.set("imagingPage", String(totalPages));
		redirect(`/shared-records/${accessId}?${lastPageParams}` as Route);
	}

	return (
		<SharedImagingTable
			rows={rows}
			page={page}
			limit={limit}
			totalPages={totalPages}
			searchQuery={searchQuery}
			statusFilters={statusFilters}
			modalityFilters={modalityFilters}
			orderedFrom={orderedFrom}
			orderedTo={orderedTo}
			createdFrom={createdFrom}
			createdTo={createdTo}
		/>
	);
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
