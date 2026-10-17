"use client";

import { EncountersTable } from "@/features/patients/components/encounters-table";
import type {
	EncounterDepartmentFilter,
	EncounterType,
	EncounterTypeFilter,
} from "@/features/patients/types";
import { useDebouncedCallback } from "@/hooks/use-debounced";
import { useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import type { PatientEncountersTableResult } from "@/app/api/patient-encounters/[patientId]/route";

export function EncountersClient({
	patientId,
	encounters,
	page,
	limit,
	totalPages,
}: {
	patientId: string;
	encounters: EncounterType[];
	page: number;
	limit: number;
	totalPages: number;
}) {
	const router = useRouter();
	const [currentPage, setCurrentPage] = useState(page);
	const [currentLimit, setCurrentLimit] = useState(limit);
	const [searchQuery, setSearchQuery] = useState("");
	const [query, setQuery] = useState("");
	const [encounterFrom, setEncounterFrom] = useState("");
	const [encounterTo, setEncounterTo] = useState("");
	const [createdFrom, setCreatedFrom] = useState("");
	const [createdTo, setCreatedTo] = useState("");
	const [encounterTypeFilters, setEncounterTypeFilters] = useState<EncounterTypeFilter[]>([]);
	const [departmentFilters, setDepartmentFilters] = useState<EncounterDepartmentFilter[]>([]);
	const requestParams = new URLSearchParams({
		page: String(currentPage),
		limit: String(currentLimit),
		query: searchQuery,
		encounterFrom: encounterFrom,
		encounterTo: encounterTo,
		createdFrom: createdFrom,
		createdTo: createdTo,
		encounterTypeFilters: encounterTypeFilters.join(","),
		departmentFilters: departmentFilters.join(","),
	});
	const initialParams = new URLSearchParams({
		page: String(page),
		limit: String(limit),
		query: "",
		encounterFrom: "",
		encounterTo: "",
		createdFrom: "",
		createdTo: "",
		encounterTypeFilters: "",
		departmentFilters: "",
	});
	const key = `/api/patient-encounters/${encodeURIComponent(patientId)}?${requestParams}`;
	const initialKey = `/api/patient-encounters/${encodeURIComponent(patientId)}?${initialParams}`;
	const {
		data: tableResult,
		error: tableError,
		isLoading,
		isValidating,
	} = useSWR(
		key,
		async (url: string) => {
			const response = await fetch(url);
			const result = (await response.json()) as PatientEncountersTableResult;
			if (!response.ok || result.status === "failed") {
				throw Object.assign(
					new Error(
						result.status === "failed" ? result.error : "Unable to load patient encounters.",
					),
					{ status: response.status },
				);
			}
			return result;
		},
		{
			keepPreviousData: true,
			fallbackData:
				key === initialKey ? { status: "success", encounters, page, limit, totalPages } : undefined,
			onError: (error: Error & { status?: number }) => {
				if (error.status === 401 || error.status === 403) router.refresh();
			},
			shouldRetryOnError: (error: Error & { status?: number }) =>
				error.status !== 401 && error.status !== 403,
		},
	);
	const isPending = isLoading || isValidating;
	const debouncedSearch = useDebouncedCallback((nextQuery: string) => {
		setSearchQuery(nextQuery);
		setCurrentPage(1);
	}, 300);

	function handleQueryChange(nextQuery: string) {
		setQuery(nextQuery);
		debouncedSearch(nextQuery);
	}

	function handlePreviousPage() {
		const nextPage = Math.max(currentPage - 1, 1);
		setCurrentPage(nextPage);
	}

	function handleNextPage() {
		const nextPage = Math.min(currentPage + 1, tableResult?.totalPages ?? 1);
		setCurrentPage(nextPage);
	}

	function handleLimitChange(nextLimit: number) {
		setCurrentLimit(nextLimit);
		setCurrentPage(1);
	}

	function handleEncounterDateRangeApply(nextEncounterFrom: string, nextEncounterTo: string) {
		setEncounterFrom(nextEncounterFrom);
		setEncounterTo(nextEncounterTo);
		setSearchQuery(query);
		setCurrentPage(1);
	}

	function handleCreatedAtRangeApply(nextCreatedFrom: string, nextCreatedTo: string) {
		setCreatedFrom(nextCreatedFrom);
		setCreatedTo(nextCreatedTo);
		setSearchQuery(query);
		setCurrentPage(1);
	}

	function handleEncounterTypeFiltersChange(nextEncounterTypeFilters: EncounterTypeFilter[]) {
		setEncounterTypeFilters(nextEncounterTypeFilters);
		setSearchQuery(query);
		setCurrentPage(1);
	}

	function handleDepartmentFiltersChange(nextDepartmentFilters: EncounterDepartmentFilter[]) {
		setDepartmentFilters(nextDepartmentFilters);
		setSearchQuery(query);
		setCurrentPage(1);
	}

	function handleFiltersClear() {
		setEncounterFrom("");
		setEncounterTo("");
		setCreatedFrom("");
		setCreatedTo("");
		setEncounterTypeFilters([]);
		setDepartmentFilters([]);
		setSearchQuery(query);
		setCurrentPage(1);
	}

	return (
		<>
			{tableError ? <p role="alert">{tableError.message}</p> : null}
			<EncountersTable
				patientId={patientId}
				encounters={tableResult?.encounters ?? []}
				page={currentPage}
				limit={currentLimit}
				totalPages={tableResult?.totalPages ?? 1}
				query={query}
				encounterFrom={encounterFrom}
				encounterTo={encounterTo}
				createdFrom={createdFrom}
				createdTo={createdTo}
				encounterTypeFilters={encounterTypeFilters}
				departmentFilters={departmentFilters}
				isPending={isPending}
				onQueryChange={handleQueryChange}
				onEncounterDateRangeApply={handleEncounterDateRangeApply}
				onCreatedAtRangeApply={handleCreatedAtRangeApply}
				onEncounterTypeFiltersChange={handleEncounterTypeFiltersChange}
				onDepartmentFiltersChange={handleDepartmentFiltersChange}
				onFiltersClear={handleFiltersClear}
				onPreviousPage={handlePreviousPage}
				onNextPage={handleNextPage}
				onLimitChange={handleLimitChange}
			/>
		</>
	);
}
