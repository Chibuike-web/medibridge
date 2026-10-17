"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FilterButton } from "@/features/patients/components/filter-button";
import { PatientsTable } from "@/features/patients/components/patients-table";
import type {
	PatientAgeGroupFilter,
	PatientGenderFilter,
	PatientListItemType,
} from "@/features/patients/types";
import { useDebouncedCallback } from "@/hooks/use-debounced";
import { parseDateParam } from "@/lib/utils/parse-date-param";
import { format } from "date-fns";
import { RiCloseLine, RiSearchLine, RiShare2Line } from "@remixicon/react";
import type { Route } from "next";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useOptimistic, useState, useTransition } from "react";

type PatientsClientProps = {
	patients: PatientListItemType[];
	page: number;
	limit: number;
	totalPages: number;
	searchQuery: string;
	createdFrom: string;
	createdTo: string;
	genderFilter: PatientGenderFilter;
	ageGroupFilter: PatientAgeGroupFilter;
};

const patientAgeGroupFilterLabels: Record<Exclude<PatientAgeGroupFilter, "">, string> = {
	children: "0-12 (Children)",
	teenagers: "13-17 (Teenagers)",
	"young-adults": "18-35 (Young adults)",
	adults: "36-59 (Adults)",
	seniors: "60+ (Seniors)",
};

const patientGenderFilterLabels: Record<Exclude<PatientGenderFilter, "">, string> = {
	male: "Male",
	female: "Female",
};

export function PatientsClient({
	ageGroupFilter,
	patients,
	page,
	limit,
	totalPages,
	searchQuery,
	createdFrom,
	createdTo,
	genderFilter,
}: PatientsClientProps) {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const [patientSearchQuery, setPatientSearchQuery] = useState(searchQuery);
	const [optimisticPage, setOptimisticPage] = useOptimistic(page);
	const [optimisticLimit, setOptimisticLimit] = useOptimistic(limit);
	const [optimisticCreatedAtRange, setOptimisticCreatedAtRange] = useOptimistic({
		createdFrom,
		createdTo,
	});
	const [optimisticAgeGroupFilter, setOptimisticAgeGroupFilter] = useOptimistic(ageGroupFilter);
	const [optimisticGenderFilter, setOptimisticGenderFilter] = useOptimistic(genderFilter);
	const [isPending, startTransition] = useTransition();

	const [previousSearchQuery, setPreviousSearchQuery] = useState(searchQuery);
	const [navigatedQuery, setNavigatedQuery] = useState(searchQuery);
	if (previousSearchQuery !== searchQuery) {
		setPreviousSearchQuery(searchQuery);
		if (searchQuery !== navigatedQuery) setPatientSearchQuery(searchQuery);
	}

	const debouncedSearch = useDebouncedCallback((nextQuery: string) => {
		if (nextQuery !== patientSearchQuery || nextQuery === searchQuery) return;

		startTransition(() => {
			setNavigatedQuery(nextQuery);
			setOptimisticPage(1);

			router.replace(
				(pathname +
					"?" +
					createQueryString({
						page: "1",
						limit: String(optimisticLimit),
						query: nextQuery,
					})) as Route,
				{ scroll: false },
			);
		});
	}, 300);

	function createQueryString(params: Record<string, string>) {
		const newParams = new URLSearchParams(searchParams.toString());
		Object.entries({
			page: String(optimisticPage),
			limit: String(optimisticLimit),
			query: patientSearchQuery,
			createdFrom: optimisticCreatedAtRange.createdFrom,
			createdTo: optimisticCreatedAtRange.createdTo,
			gender: optimisticGenderFilter,
			ageGroup: optimisticAgeGroupFilter,
			...params,
		}).forEach(([name, value]) => {
			if (value.trim() === "") {
				newParams.delete(name);
			} else {
				newParams.set(name, value);
			}
		});

		return newParams.toString();
	}

	function handleCreatedAtRangeApply(nextCreatedFrom: string, nextCreatedTo: string) {
		startTransition(() => {
			setNavigatedQuery(patientSearchQuery);
			setOptimisticPage(1);
			setOptimisticCreatedAtRange({
				createdFrom: nextCreatedFrom,
				createdTo: nextCreatedTo,
			});

			router.push(
				(pathname +
					"?" +
					createQueryString({
						page: "1",
						limit: String(optimisticLimit),
						createdFrom: nextCreatedFrom,
						createdTo: nextCreatedTo,
					})) as Route,
				{ scroll: false },
			);
		});
	}

	function handleGenderFilterChange(nextGenderFilter: PatientGenderFilter) {
		startTransition(() => {
			setNavigatedQuery(patientSearchQuery);
			setOptimisticPage(1);
			setOptimisticGenderFilter(nextGenderFilter);

			router.push(
				(pathname +
					"?" +
					createQueryString({
						page: "1",
						limit: String(optimisticLimit),
						gender: nextGenderFilter,
					})) as Route,
				{ scroll: false },
			);
		});
	}

	function handleAgeGroupFilterChange(nextAgeGroupFilter: PatientAgeGroupFilter) {
		startTransition(() => {
			setNavigatedQuery(patientSearchQuery);
			setOptimisticPage(1);
			setOptimisticAgeGroupFilter(nextAgeGroupFilter);

			router.push(
				(pathname +
					"?" +
					createQueryString({
						page: "1",
						limit: String(optimisticLimit),
						ageGroup: nextAgeGroupFilter,
					})) as Route,
				{ scroll: false },
			);
		});
	}

	function handleFiltersClear() {
		startTransition(() => {
			setNavigatedQuery(patientSearchQuery);
			setOptimisticPage(1);
			setOptimisticCreatedAtRange({
				createdFrom: "",
				createdTo: "",
			});
			setOptimisticGenderFilter("");
			setOptimisticAgeGroupFilter("");

			router.push(
				(pathname +
					"?" +
					createQueryString({
						page: "1",
						limit: String(optimisticLimit),
						createdFrom: "",
						createdTo: "",
						gender: "",
						ageGroup: "",
					})) as Route,
				{ scroll: false },
			);
		});
	}

	function handleQueryChange(nextQuery: string) {
		setPatientSearchQuery(nextQuery);
		debouncedSearch(nextQuery);
	}

	function handlePreviousPage() {
		const previousPage = Math.max(1, optimisticPage - 1);

		startTransition(() => {
			setNavigatedQuery(patientSearchQuery);
			setOptimisticPage(previousPage);

			router.push(
				(pathname +
					"?" +
					createQueryString({
						page: String(previousPage),
						limit: String(optimisticLimit),
					})) as Route,
				{ scroll: false },
			);
		});
	}

	function handleNextPage() {
		const nextPage = Math.min(totalPages, optimisticPage + 1);

		startTransition(() => {
			setNavigatedQuery(patientSearchQuery);
			setOptimisticPage(nextPage);

			router.push(
				(pathname +
					"?" +
					createQueryString({
						page: String(nextPage),
						limit: String(optimisticLimit),
					})) as Route,
				{ scroll: false },
			);
		});
	}

	function handleLimitChange(value: string) {
		const nextLimit = Number(value);

		startTransition(() => {
			setNavigatedQuery(patientSearchQuery);
			setOptimisticPage(1);
			setOptimisticLimit(nextLimit);

			router.push(
				(pathname +
					"?" +
					createQueryString({ page: String(1), limit: String(nextLimit) })) as Route,
				{ scroll: false },
			);
		});
	}

	const returnTo = getCurrentRoute(pathname, searchParams);
	const addNewPatientHref =
		`/dashboard/add-new-patient?returnTo=${encodeURIComponent(returnTo)}` as Route;

	return (
		<div className="h-full overflow-y-auto">
			<section className="mx-auto flex w-full max-w-7xl flex-col px-6 py-6 lg:px-10">
				<header className="mb-4 flex flex-col gap-4 text-sm">
					<h1 className="text-lg font-semibold text-balance text-gray-800 tracking-[-0.015em]">
						Patients
					</h1>
					<div className="flex items-center gap-2">
						<div className="relative flex-1">
							<RiSearchLine className="size-4 pointer-events-none absolute bottom-0 left-2 flex h-full items-center justify-center text-gray-400" />
							<Input
								type="search"
								className="pl-8"
								placeholder="Search by patient name or ID"
								value={patientSearchQuery}
								onChange={(event) => handleQueryChange(event.target.value)}
							/>
						</div>

						<FilterButton
							ageGroupFilter={optimisticAgeGroupFilter}
							createdFrom={optimisticCreatedAtRange.createdFrom}
							createdTo={optimisticCreatedAtRange.createdTo}
							genderFilter={optimisticGenderFilter}
							isPending={isPending}
							onAgeGroupFilterChange={handleAgeGroupFilterChange}
							onCreatedAtRangeApply={handleCreatedAtRangeApply}
							onGenderFilterChange={handleGenderFilterChange}
						/>
						<Button variant="outline" className="bg-white text-gray-600 hover:bg-gray-50">
							<RiShare2Line aria-hidden className="size-5 text-gray-600" />
							Export
						</Button>

						<Button asChild>
							<Link href={addNewPatientHref} prefetch={true}>
								Add patient
							</Link>
						</Button>
					</div>
				</header>
				<PatientActiveFilterPills
					ageGroupFilter={optimisticAgeGroupFilter}
					createdFrom={optimisticCreatedAtRange.createdFrom}
					createdTo={optimisticCreatedAtRange.createdTo}
					genderFilter={optimisticGenderFilter}
					onAgeGroupFilterChange={handleAgeGroupFilterChange}
					onCreatedAtRangeApply={handleCreatedAtRangeApply}
					onGenderFilterChange={handleGenderFilterChange}
					onFiltersClear={handleFiltersClear}
				/>
				<PatientsTable
					patients={patients}
					page={optimisticPage}
					limit={optimisticLimit}
					totalPages={totalPages}
					isPending={isPending}
					onPreviousPage={handlePreviousPage}
					onNextPage={handleNextPage}
					onLimitChange={handleLimitChange}
				/>
			</section>
		</div>
	);
}

function PatientActiveFilterPills({
	ageGroupFilter,
	createdFrom,
	createdTo,
	genderFilter,
	onAgeGroupFilterChange,
	onCreatedAtRangeApply,
	onGenderFilterChange,
	onFiltersClear,
}: {
	ageGroupFilter: PatientAgeGroupFilter;
	createdFrom: string;
	createdTo: string;
	genderFilter: PatientGenderFilter;
	onAgeGroupFilterChange: (ageGroupFilter: PatientAgeGroupFilter) => void;
	onCreatedAtRangeApply: (createdFrom: string, createdTo: string) => void;
	onGenderFilterChange: (genderFilter: PatientGenderFilter) => void;
	onFiltersClear: () => void;
}) {
	const hasCreatedAtFilter = Boolean(createdFrom || createdTo);

	if (!ageGroupFilter && !genderFilter && !hasCreatedAtFilter) {
		return null;
	}

	return (
		<div className="mb-4 flex items-start gap-4">
			<div className="flex flex-1 flex-wrap gap-2">
				{genderFilter ? (
					<PatientFilterPill
						label={`Gender: ${patientGenderFilterLabels[genderFilter]}`}
						onRemove={() => onGenderFilterChange("")}
					/>
				) : null}
				{ageGroupFilter ? (
					<PatientFilterPill
						label={`Age: ${patientAgeGroupFilterLabels[ageGroupFilter]}`}
						onRemove={() => onAgeGroupFilterChange("")}
					/>
				) : null}
				{hasCreatedAtFilter ? (
					<PatientFilterPill
						label={`Created: ${formatDateRangeFilterLabel(createdFrom, createdTo)}`}
						onRemove={() => onCreatedAtRangeApply("", "")}
					/>
				) : null}
			</div>
			<Button
				type="button"
				variant="ghost"
				size="sm"
				className="h-8.5 text-gray-600"
				onClick={onFiltersClear}
			>
				Clear all
			</Button>
		</div>
	);
}

function PatientFilterPill({ label, onRemove }: { label: string; onRemove: () => void }) {
	return (
		<span className="inline-flex items-center gap-3 rounded-full border border-gray-200 bg-gray-100 py-1.5 pr-1.5 pl-3 text-sm font-medium text-gray-600 shadow-xs">
			<span>{label}</span>
			<Button
				size="icon"
				type="button"
				onClick={onRemove}
				className="flex size-5 rounded-full text-white hover:bg-gray-500 focus-visible:ring-2 focus-visible:ring-gray-300"
				aria-label={`Remove ${label} filter`}
			>
				<RiCloseLine className="size-4" aria-hidden={true} />
			</Button>
		</span>
	);
}

function formatDateRangeFilterLabel(from: string, to: string) {
	const parsedFromDate = parseDateParam(from);
	const parsedToDate = parseDateParam(to);

	if (parsedFromDate && parsedToDate) {
		return `${format(parsedFromDate, "MMM d, yyyy")} - ${format(parsedToDate, "MMM d, yyyy")}`;
	}

	if (parsedFromDate) {
		return `From ${format(parsedFromDate, "MMM d, yyyy")}`;
	}

	if (parsedToDate) {
		return `Until ${format(parsedToDate, "MMM d, yyyy")}`;
	}

	return "Any date";
}

function getCurrentRoute(pathname: string, searchParams: URLSearchParams) {
	const queryString = searchParams.toString();

	return queryString ? `${pathname}?${queryString}` : pathname;
}
