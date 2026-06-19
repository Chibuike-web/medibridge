import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getPatients } from "@/lib/api/get-patients";
import Image from "next/image";
import { PatientsClient } from "./patients-client";
import { endOfDay, startOfDay } from "date-fns";
import { parseDateParam } from "@/lib/utils/parse-date-param";
import type { PatientAgeGroupFilter, PatientGenderFilter } from "@/features/patients/types";

export const metadata = {
	title: "Patients",
};

export default async function PatientsPage({
	searchParams,
}: {
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
	const { page, limit, query, createdFrom, createdTo, gender, ageGroup } = await searchParams;
	const currentPage = typeof page === "string" ? parseInt(page, 10) : 1;
	const currentLimit = typeof limit === "string" ? parseInt(limit, 10) : 14;
	const currentQuery = typeof query === "string" ? query : "";
	const currentCreatedFrom = typeof createdFrom === "string" ? createdFrom : "";
	const currentCreatedTo = typeof createdTo === "string" ? createdTo : "";
	const currentGenderFilter: PatientGenderFilter =
		gender === "male" || gender === "female" ? gender : "";
	const currentAgeGroupFilter: PatientAgeGroupFilter =
		ageGroup === "children" ||
		ageGroup === "teenagers" ||
		ageGroup === "young-adults" ||
		ageGroup === "adults" ||
		ageGroup === "seniors"
			? ageGroup
			: "";
	const createdAtFilter = {
		from: parseCreatedAtDateParam(currentCreatedFrom, "start"),
		to: parseCreatedAtDateParam(currentCreatedTo, "end"),
	};
	const ageRangeFilter =
		currentAgeGroupFilter === "children"
			? { min: 0, max: 12 }
			: currentAgeGroupFilter === "teenagers"
				? { min: 13, max: 17 }
				: currentAgeGroupFilter === "young-adults"
					? { min: 18, max: 35 }
					: currentAgeGroupFilter === "adults"
						? { min: 36, max: 59 }
						: currentAgeGroupFilter === "seniors"
							? { min: 60 }
							: undefined;
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
					<Button className="h-11" asChild>
						<Link href="/dashboard/add-new-patient">Add patient </Link>
					</Button>
				</div>
			</div>
		</div>
	);
}

function parseCreatedAtDateParam(value: string, boundary: "start" | "end") {
	const date = parseDateParam(value);
	if (!date) return undefined;

	return boundary === "start" ? startOfDay(date) : endOfDay(date);
}
