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
					<h1 className="font-semibold text-2xl text-center mb-6">No patient records available</h1>
					<p className="mb-12 text-center">
						Patient records will appear here once patients have been added to the system.
					</p>
					<Button asChild className="text-sm">
						<Link href="/dashboard/add-new-patient">
							Add patient
						</Link>
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
			<header className="sticky top-0 z-20 flex h-16 shrink-0 items-center border-b border-gray-200 bg-white px-8">
				<div className="h-6 w-40 animate-pulse rounded bg-gray-100" />
				<div className="ml-auto flex items-center gap-2">
					<div className="h-10 w-[18rem] animate-pulse rounded bg-gray-100" />
					<div className="h-10 w-10 animate-pulse rounded bg-gray-100" />
					<div className="h-10 w-24 animate-pulse rounded bg-gray-100" />
					<div className="h-10 w-40 animate-pulse rounded bg-gray-100" />
				</div>
			</header>
		</div>
	);
}
