import Link from "next/link";
import type { Route } from "next";
import { notFound } from "next/navigation";
import { RiArrowLeftLine, RiArrowRightSLine } from "@remixicon/react";
import { Button } from "@/components/ui/button";
import { CopyIdButton } from "@/components/copy-id-button";
import { patients } from "@/features/patients/data";
import { encounters } from "@/features/patients/encounters-data";

export const metadata = {
	title: "Encounter Details",
};

export default async function EncounterDetailsPage({
	params,
}: {
	params: Promise<{ patientId: string; encounterId: string }>;
}) {
	const { patientId, encounterId } = await params;
	const patient = patients.find((record) => record.patientId === patientId);
	const encounter = encounters.find((record) => record.encounterId === encounterId);

	if (!patient || !encounter) {
		notFound();
	}

	const backHref = `/dashboard/patients/${patientId}?section=encounters` as Route;

	return (
		<div className="flex h-full min-h-0 flex-col overflow-hidden">
			<nav
				aria-label="Breadcrumb"
				className="flex items-center gap-2 border-b border-gray-200 px-6 py-5"
			>
				<Link href="/dashboard/patients" className="flex shrink-0 items-center gap-2">
					<RiArrowLeftLine aria-hidden="true" />
					<span>Patients</span>
				</Link>
				<RiArrowRightSLine aria-hidden="true" />
				<Link href={backHref} className="shrink-0">
					{patient.name}
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
					<div className="mb-3 flex items-center gap-3">
						<h1 className="text-2xl font-semibold text-gray-900">Encounter Details</h1>
						<CopyIdButton id={encounter.encounterId} />
					</div>
				</div>
			</main>
		</div>
	);
}
