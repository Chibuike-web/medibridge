import { Suspense } from "react";
import { RiInformationLine } from "@remixicon/react";
import { SharedRecordsClient } from "./shared-records-client";
import { getSharedSection, type SharedPatient } from "./shared-record-sections";
import { SharedTabs } from "./shared-tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { hasVerifiedExternalAccessSession } from "@/lib/api/external-access-session";
import { getInitials } from "@/lib/utils/get-initials";
import { notFound, redirect } from "next/navigation";
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

export default async function SharedRecordsPage({
	params,
	searchParams,
}: SharedRecordsPageProps) {
	return (
		<div className="min-h-dvh bg-white text-gray-800">
			<Suspense fallback={<SharedRecordsPageSkeleton />}>
				<SharedRecordsContent params={params} searchParams={searchParams} />
			</Suspense>
		</div>
	);
}

async function SharedRecordsContent({
	params,
	searchParams,
}: SharedRecordsPageProps) {
	const [{ accessId }, { section: sectionParam }] = await Promise.all([
		params,
		searchParams,
	]);
	const section = getStringParam(sectionParam);
	const hasVerifiedAccessSession =
		await hasVerifiedExternalAccessSession(accessId);

	if (!hasVerifiedAccessSession) {
		redirect(`/verify-access/${accessId}`);
	}

	const sharedRecord = await getSharedRecord(accessId);
	if (!sharedRecord) notFound();

	const activeSection = getSharedSection(
		section,
		sharedRecord.availableSections,
	);

	return (
		<>
			<SharedAccessBanner
				sourceOrganizationName={sharedRecord.sourceOrganizationName}
				expiresAt={sharedRecord.expiresAt}
			/>
			<PatientHeader patient={sharedRecord.patient} />
			<nav
				className="border-b border-gray-200"
				aria-label="Shared record sections"
			>
				<SharedTabs
					activeSection={activeSection}
					availableSections={sharedRecord.availableSections}
				/>
			</nav>
			<SharedRecordsClient
				accessId={accessId}
				patientDetailsSections={sharedRecord.patientDetailsSections}
				records={sharedRecord.records}
				activeSection={activeSection}
			/>
		</>
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
			<div className="mx-auto flex w-full max-w-7xl items-center gap-3 px-6 py-4 ">
				<RiInformationLine className="shrink-0" aria-hidden="true" />
				<div className="flex flex-col gap-1 text-sm leading-5">
					<p className="font-semibold">Shared Patient Record</p>
					<p>
						You are viewing a patient record securely shared by{" "}
						<span className="font-semibold">{sourceOrganizationName}.</span>{" "}
						This session is <span className="font-semibold">view-only</span> and
						expires on{" "}
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
					<AvatarFallback className="bg-gray-100 text-xl font-semibold text-gray-700">
						{getInitials(patient.name)}
					</AvatarFallback>
				</Avatar>

				<div className="min-w-0">
					<h1 className="text-xl font-semibold text-gray-900">
						{patient.name}
					</h1>
					<div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
						<HeaderMeta label="Sex" value={patient.sex} />
						<HeaderMeta label="Email" value={patient.email} />
						<HeaderMeta label="Phone Number" value={patient.phoneNumber} />
						<HeaderMeta label="Address" value={patient.address} />
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
