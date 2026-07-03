import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getPatients } from "@/lib/api/get-patients";
import Image from "next/image";
import { PatientsClient } from "./patients-client";
import type { PatientAgeGroupFilter, PatientGenderFilter } from "@/features/patients/types";
import { Suspense } from "react";
import { getNumberParam, getStringParam, parseDateBoundaryParam } from "@/lib/utils/search-params";

export const metadata = {
	title: "Patients",
};

type PatientsPagePageProps = Pick<PageProps<"/dashboard/transfers">, "searchParams">;

export default function PatientsPage({ searchParams }: PatientsPagePageProps) {
	return (
		<Suspense fallback={<PatientsPageSkeleton />}>
			<PatientsPageContent searchParams={searchParams} />
		</Suspense>
	);
}

async function PatientsPageContent({ searchParams }: PatientsPagePageProps) {
	const { page, limit, query, createdFrom, createdTo, gender, ageGroup } = await searchParams;
	const currentPage = getNumberParam(page, 1, { min: 1 });
	const currentLimit = getNumberParam(limit, 14, { min: 1, max: 100 });
	const currentQuery = getStringParam(query);
	const currentCreatedFrom = getStringParam(createdFrom);
	const currentCreatedTo = getStringParam(createdTo);
	const currentGenderFilter = getGender(gender);
	const currentAgeGroupFilter = getAgeGroupFilter(ageGroup);
	const createdAtFilter = {
		from: parseDateBoundaryParam(currentCreatedFrom, "start"),
		to: parseDateBoundaryParam(currentCreatedTo, "end"),
	};
	const ageRangeFilter = getAgeRangeFilter(currentAgeGroupFilter);
	const { hasPatients, patients, totalPatients } = await getPatients(
		currentPage,
		currentLimit,
		currentQuery,
		createdAtFilter,
		{ gender: currentGenderFilter || undefined, ageRange: ageRangeFilter },
	);
	const totalPages = Math.ceil(totalPatients / currentLimit) || 1;

	return hasPatients ? (
		<PatientsClient
			patients={patients}
			page={currentPage}
			limit={currentLimit}
			totalPages={totalPages}
			searchQuery={currentQuery}
			createdFrom={currentCreatedFrom}
			createdTo={currentCreatedTo}
			genderFilter={currentGenderFilter}
			ageGroupFilter={currentAgeGroupFilter}
		/>
	) : (
		<div className="w-full mx-auto max-w-7xl flex items-center justify-center h-full p-10">
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
						<h1 className="mb-2 text-center text-xl font-semibold">No patient records available</h1>
						<p className="mb-6 text-center text-sm">
							Patient records will appear here once patients have been added to the system.
						</p>
					<Button asChild className="text-sm">
						<Link href="/dashboard/add-new-patient"> Add patient</Link>
					</Button>
				</div>
			</div>
		</div>
	);
}

function getAgeRangeFilter(ageGroup: PatientAgeGroupFilter) {
	switch (ageGroup) {
		case "children":
			return { min: 0, max: 12 };

		case "teenagers":
			return { min: 13, max: 17 };

		case "young-adults":
			return { min: 18, max: 35 };

		case "adults":
			return { min: 36, max: 59 };

		case "seniors":
			return { min: 60 };

		default:
			return undefined;
	}
}

const patientAgeGroups = new Set(["children", "teenagers", "young-adults", "adults", "seniors"]);

function getAgeGroupFilter(value: unknown): PatientAgeGroupFilter {
	if (typeof value !== "string") return "";

	return patientAgeGroups.has(value) ? (value as PatientAgeGroupFilter) : "";
}

function getGender(gender: unknown): PatientGenderFilter {
	return gender === "male" || gender === "female" ? gender : "";
}

function PatientsPageSkeleton() {
	return (
		<div className="flex h-full flex-col">
			<header className="sticky top-0 z-20 flex h-14 shrink-0 items-center border-b border-gray-200 bg-white px-6">
				<div className="h-6 w-40 animate-pulse rounded bg-gray-100" />
				<div className="ml-auto flex items-center gap-2">
					<div className="h-10 w-[18rem] animate-pulse rounded bg-gray-100" />
					<div className="h-10 w-10 animate-pulse rounded bg-gray-100" />
					<div className="h-10 w-24 animate-pulse rounded bg-gray-100" />
					<div className="h-10 w-40 animate-pulse rounded bg-gray-100" />
				</div>
			</header>
			<div className="min-h-0 flex-1 overflow-y-auto">
				<section className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-6 py-8 lg:px-10">
					<PatientsTableSkeleton />
				</section>
			</div>
		</div>
	);
}

function PatientsTableSkeleton() {
	const gridColumns = "grid-cols-[2.5rem_1.4fr_8rem_6rem_5rem_8rem_3rem]";

	return (
		<div className="overflow-x-auto rounded-xl border border-gray-200 text-sm">
			<div className="min-w-[64rem] bg-white">
				<div className={`grid h-12 ${gridColumns} items-center gap-3 bg-gray-50 px-3`}>
					{Array.from({ length: 7 }).map((_, index) => (
						<div key={index} className="h-4 animate-pulse rounded bg-gray-200" />
					))}
				</div>
				<div>
					{Array.from({ length: 8 }).map((_, rowIndex) => (
						<div
							key={rowIndex}
							className={`grid min-h-14 ${gridColumns} items-center gap-3 border-b border-gray-200 px-3 last:border-b-0`}
						>
							{Array.from({ length: 7 }).map((_, cellIndex) => (
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
	);
}
