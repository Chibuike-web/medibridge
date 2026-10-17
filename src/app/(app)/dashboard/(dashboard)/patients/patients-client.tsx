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
import { getNumberParam } from "@/lib/utils/search-params";
import { format } from "date-fns";
import { RiCloseLine, RiSearchLine, RiShare2Line } from "@remixicon/react";
import type { Route } from "next";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import useSWR from "swr";
import type { PatientsTableResult } from "@/app/api/patients/route";

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
	ageGroupFilter: initialAgeGroupFilter,
	patients,
	page: initialPage,
	limit: initialLimit,
	totalPages,
	searchQuery: initialSearchQuery,
	createdFrom: initialCreatedFrom,
	createdTo: initialCreatedTo,
	genderFilter: initialGenderFilter,
}: PatientsClientProps) {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const currentPage = getNumberParam(searchParams.get("page"), 1, { min: 1 });
	const currentLimit = getNumberParam(searchParams.get("limit"), 14, { min: 1, max: 100 });
	const currentQuery = searchParams.get("query") ?? "";
	const createdFrom = searchParams.get("createdFrom") ?? "";
	const createdTo = searchParams.get("createdTo") ?? "";
	const gender = searchParams.get("gender");
	const genderFilter = gender === "male" || gender === "female" ? gender : "";
	const ageGroup = searchParams.get("ageGroup") ?? "";
	const ageGroupFilter: PatientAgeGroupFilter = [
		"children",
		"teenagers",
		"young-adults",
		"adults",
		"seniors",
	].includes(ageGroup)
		? (ageGroup as PatientAgeGroupFilter)
		: "";
	const [patientSearch, setPatientSearch] = useState({
		query: currentQuery,
		urlQuery: currentQuery,
	});
	if (patientSearch.urlQuery !== currentQuery) {
		setPatientSearch({ query: currentQuery, urlQuery: currentQuery });
	}
	const requestParams = new URLSearchParams({
		page: String(currentPage),
		limit: String(currentLimit),
		query: currentQuery,
		createdFrom: createdFrom,
		createdTo: createdTo,
		gender: genderFilter,
		ageGroup: ageGroupFilter,
	});
	const initialParams = new URLSearchParams({
		page: String(initialPage),
		limit: String(initialLimit),
		query: initialSearchQuery,
		createdFrom: initialCreatedFrom,
		createdTo: initialCreatedTo,
		gender: initialGenderFilter,
		ageGroup: initialAgeGroupFilter,
	});
	const key = `/api/patients?${requestParams}`;
	const initialKey = `/api/patients?${initialParams}`;
	const {
		data: tableResult,
		error: tableError,
		isLoading,
		isValidating,
	} = useSWR(
		key,
		async (url: string) => {
			const response = await fetch(url);
			const result = (await response.json()) as PatientsTableResult;
			if (!response.ok || result.status === "failed") {
				throw Object.assign(
					new Error(result.status === "failed" ? result.error : "Unable to load patients."),
					{ status: response.status },
				);
			}
			return result;
		},
		{
			keepPreviousData: true,
			fallbackData:
				key === initialKey
					? { status: "success", patients, page: initialPage, limit: initialLimit, totalPages }
					: undefined,
			onError: (error: Error & { status?: number }) => {
				if (error.status === 401 || error.status === 403) router.refresh();
			},
			shouldRetryOnError: (error: Error & { status?: number }) =>
				error.status !== 401 && error.status !== 403,
		},
	);
	const isPending = isLoading || isValidating;
	const debouncedSearch = useDebouncedCallback((nextQuery: string) => {
		if (nextQuery !== patientSearch.query) return;
		window.history.replaceState(
			null,
			"",
			pathname + "?" + createQueryString({ page: "1", query: nextQuery }),
		);
	}, 300);

	function createQueryString(params: Record<string, string>) {
		const newParams = new URLSearchParams(window.location.search);
		Object.entries(params).forEach(([name, value]) => {
			if (value.trim() === "") newParams.delete(name);
			else newParams.set(name, value);
		});
		return newParams.toString();
	}

	function handleQueryChange(nextQuery: string) {
		setPatientSearch({ query: nextQuery, urlQuery: currentQuery });
		debouncedSearch(nextQuery);
	}
	function handleCreatedAtRangeApply(nextCreatedFrom: string, nextCreatedTo: string) {
		window.history.replaceState(
			null,
			"",
			pathname +
				"?" +
				createQueryString({ page: "1", createdFrom: nextCreatedFrom, createdTo: nextCreatedTo }),
		);
	}
	function handleGenderFilterChange(nextGenderFilter: PatientGenderFilter) {
		window.history.replaceState(
			null,
			"",
			pathname + "?" + createQueryString({ page: "1", gender: nextGenderFilter }),
		);
	}
	function handleAgeGroupFilterChange(nextAgeGroupFilter: PatientAgeGroupFilter) {
		window.history.replaceState(
			null,
			"",
			pathname + "?" + createQueryString({ page: "1", ageGroup: nextAgeGroupFilter }),
		);
	}
	function handleFiltersClear() {
		window.history.replaceState(
			null,
			"",
			pathname +
				"?" +
				createQueryString({ page: "1", createdFrom: "", createdTo: "", gender: "", ageGroup: "" }),
		);
	}
	function handlePreviousPage() {
		window.history.pushState(
			null,
			"",
			pathname + "?" + createQueryString({ page: String(Math.max(currentPage - 1, 1)) }),
		);
	}
	function handleNextPage() {
		window.history.pushState(
			null,
			"",
			pathname +
				"?" +
				createQueryString({
					page: String(Math.min(currentPage + 1, tableResult?.totalPages ?? 1)),
				}),
		);
	}
	function handleLimitChange(value: string) {
		window.history.replaceState(
			null,
			"",
			pathname + "?" + createQueryString({ page: "1", limit: value }),
		);
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
								value={patientSearch.query}
								onChange={(event) => handleQueryChange(event.target.value)}
							/>
						</div>

						<FilterButton
							ageGroupFilter={ageGroupFilter}
							createdFrom={createdFrom}
							createdTo={createdTo}
							genderFilter={genderFilter}
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
					ageGroupFilter={ageGroupFilter}
					createdFrom={createdFrom}
					createdTo={createdTo}
					genderFilter={genderFilter}
					onAgeGroupFilterChange={handleAgeGroupFilterChange}
					onCreatedAtRangeApply={handleCreatedAtRangeApply}
					onGenderFilterChange={handleGenderFilterChange}
					onFiltersClear={handleFiltersClear}
				/>
				{tableError ? <p role="alert">{tableError.message}</p> : null}
				<PatientsTable
					patients={tableResult?.patients ?? []}
					page={currentPage}
					limit={currentLimit}
					totalPages={tableResult?.totalPages ?? 1}
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
