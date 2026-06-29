import Link from "next/link";
import type { Route } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { RiArrowLeftLine, RiArrowRightSLine } from "@remixicon/react";
import { CopyIdButton } from "@/components/copy-id-button";
import { getPatientById } from "@/lib/api/get-patient-by-id";
import { getPatientEncounter } from "@/lib/api/get-patient-encounter";
import { verifySession } from "@/lib/api/verify-session";

export const metadata = {
	title: "Encounter Details",
};

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

	const [patient, encounter] = await Promise.all([
		getPatientById(patientId),
		getPatientEncounter(patientId, encounterId),
	]);

	if (!patient || !encounter) {
		notFound();
	}

	const backHref = `/dashboard/patients/${patientId}?section=encounters` as Route;

	return (
		<div className="flex h-full min-h-0 flex-col overflow-hidden">
				<nav
					aria-label="Breadcrumb"
					className="flex h-14 items-center gap-2 border-b border-gray-200 px-6 text-sm"
				>
				<Link href="/dashboard/patients" className="flex shrink-0 items-center gap-2">
					<RiArrowLeftLine aria-hidden="true" />
					<span>Patients</span>
				</Link>
				<RiArrowRightSLine aria-hidden="true" />
				<Link href={backHref} className="shrink-0">
					{`${patient.firstName} ${patient.lastName}`}
				</Link>
				<RiArrowRightSLine aria-hidden="true" />
				<Link href={backHref} className="shrink-0">
					Encounters
				</Link>
				<RiArrowRightSLine aria-hidden="true" />
				<span className="shrink-0 font-semibold">Encounter Details</span>
			</nav>

			<main className="min-h-0 flex-1 overflow-y-auto px-6 py-8 lg:px-10">
				<div className="mx-auto max-w-7xl">
					<div className="flex flex-wrap gap-x-6 gap-y-3">
						<div className="flex items-center gap-2 whitespace-nowrap">
							<span className="text-gray-500 text-sm">Patient ID</span>
							<CopyIdButton id={encounter.patientId} className="text-sm" />
						</div>
						<div className="flex items-center gap-2 whitespace-nowrap">
							<span className="text-gray-500 text-sm">Encounter ID: </span>
							<CopyIdButton id={encounter.encounterId} className="text-sm" />
						</div>
						<div className="flex items-center gap-2 whitespace-nowrap">
							<span className="text-gray-500 text-sm">Department: </span>
							<span className="font-medium text-sm">{encounter.department}</span>
						</div>
						<div className="flex items-center gap-2 whitespace-nowrap">
							<span className="text-gray-500 text-sm">Physician: </span>
							<span className="font-medium text-sm">{encounter.physician}</span>
						</div>
						<div className="flex items-center gap-2 whitespace-nowrap">
							<span className="text-gray-500 text-sm">Encounter date:</span>
							<span className="font-medium text-sm">{encounter.encounterDateLabel}</span>
						</div>
						<div className="flex items-center gap-2 whitespace-nowrap">
							<span className="text-gray-500 text-sm">Created At:</span>
							<span className="font-medium text-sm">{encounter.createdAtLabel}</span>
						</div>
						<div className="flex items-center gap-2 whitespace-nowrap">
							<span className="text-gray-500 text-sm">Created By:</span>
							<span className="font-medium text-sm">{encounter.createdBy}</span>
						</div>
						<div className="flex items-center gap-2 whitespace-nowrap">
							<span className="text-gray-500 text-sm">Updated At:</span>
							<span className="font-medium text-sm">{encounter.updatedAtLabel}</span>
						</div>
						<div className="flex items-center gap-2 whitespace-nowrap">
							<span className="text-gray-500 text-sm">Updated By</span>
							<span className="font-medium text-sm">{encounter.updatedBy}</span>
						</div>
					</div>
				</div>
			</main>
		</div>
	);
}

function EncounterDetailsPageSkeleton() {
	return (
		<div className="flex h-full min-h-0 flex-col overflow-hidden">
				<nav
					aria-label="Breadcrumb"
					className="flex h-14 items-center gap-2 border-b border-gray-200 px-6 text-sm"
				>
				<Link href="/dashboard/patients" className="flex shrink-0 items-center gap-2">
					<RiArrowLeftLine aria-hidden="true" />
					<span>Patients</span>
				</Link>
				<RiArrowRightSLine aria-hidden="true" />
				<div className="h-4 w-32 shrink-0 rounded bg-gray-100" />
				<RiArrowRightSLine aria-hidden="true" />
				<div className="h-4 w-24 shrink-0 rounded bg-gray-100" />
				<RiArrowRightSLine aria-hidden="true" />
				<div className="h-4 w-36 shrink-0 rounded bg-gray-100" />
			</nav>

			<main className="min-h-0 flex-1 overflow-y-auto px-6 py-8 lg:px-10">
				<div className="mx-auto max-w-7xl">
					<div className="flex flex-wrap gap-x-6 gap-y-3">
						{Array.from({ length: 9 }).map((_, index) => (
							<div key={index} className="h-5 w-40 rounded bg-gray-100" />
						))}
					</div>
				</div>
			</main>
		</div>
	);
}
