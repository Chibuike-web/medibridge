"use client";

import { AllergiesTable } from "@/features/patients/components/allergies-table";
import type {
	AllergySeverityFilter,
	AllergyStatusFilter,
	AllergyType,
} from "@/features/patients/types";
import { useDebouncedCallback } from "@/hooks/use-debounced";
import { useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import type { PatientAllergiesTableResult } from "@/app/api/patient-allergies/[patientId]/route";

export function AllergiesClient({
	patientId,
	encounterId,
	allergies,
	page,
	limit,
	totalPages,
}: {
	patientId: string;
	encounterId?: string;
	allergies: AllergyType[];
	page: number;
	limit: number;
	totalPages: number;
}) {
	const router = useRouter();
	const [currentPage, setCurrentPage] = useState(page);
	const [currentLimit, setCurrentLimit] = useState(limit);
	const [searchQuery, setSearchQuery] = useState("");
	const [query, setQuery] = useState("");
	const [createdFrom, setCreatedFrom] = useState("");
	const [createdTo, setCreatedTo] = useState("");
	const [statusFilters, setStatusFilters] = useState<AllergyStatusFilter[]>([]);
	const [severityFilters, setSeverityFilters] = useState<AllergySeverityFilter[]>([]);
	const requestParams = new URLSearchParams({
		page: String(currentPage),
		limit: String(currentLimit),
		query: searchQuery,
		encounterId: encounterId ?? "",
		createdFrom: createdFrom,
		createdTo: createdTo,
		statusFilters: statusFilters.join(","),
		severityFilters: severityFilters.join(","),
	});
	const initialParams = new URLSearchParams({
		page: String(page),
		limit: String(limit),
		query: "",
		encounterId: encounterId ?? "",
		createdFrom: "",
		createdTo: "",
		statusFilters: "",
		severityFilters: "",
	});
	const key = `/api/patient-allergies/${encodeURIComponent(patientId)}?${requestParams}`;
	const initialKey = `/api/patient-allergies/${encodeURIComponent(patientId)}?${initialParams}`;
	const {
		data: tableResult,
		error: tableError,
		isLoading,
		isValidating,
		mutate: mutateAllergies,
	} = useSWR(
		key,
		async (url: string) => {
			const response = await fetch(url);
			const result = (await response.json()) as PatientAllergiesTableResult;
			if (!response.ok || result.status === "failed") {
				throw Object.assign(
					new Error(
						result.status === "failed" ? result.error : "Unable to load patient allergies.",
					),
					{ status: response.status },
				);
			}
			return result;
		},
		{
			keepPreviousData: true,
			fallbackData:
				key === initialKey ? { status: "success", allergies, page, limit, totalPages } : undefined,
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

	function handleCreatedAtRangeApply(nextCreatedFrom: string, nextCreatedTo: string) {
		setCreatedFrom(nextCreatedFrom);
		setCreatedTo(nextCreatedTo);
		setSearchQuery(query);
		setCurrentPage(1);
	}

	function handleStatusFiltersChange(nextStatusFilters: AllergyStatusFilter[]) {
		setStatusFilters(nextStatusFilters);
		setSearchQuery(query);
		setCurrentPage(1);
	}
	function handleSeverityFiltersChange(nextSeverityFilters: AllergySeverityFilter[]) {
		setSeverityFilters(nextSeverityFilters);
		setSearchQuery(query);
		setCurrentPage(1);
	}

	function handleFiltersClear() {
		setCreatedFrom("");
		setCreatedTo("");
		setStatusFilters([]);
		setSeverityFilters([]);
		setSearchQuery(query);
		setCurrentPage(1);
	}

	return (
		<>
			{tableError ? <p role="alert">{tableError.message}</p> : null}
			<AllergiesTable
				patientId={patientId}
				encounterId={encounterId}
				allergies={tableResult?.allergies ?? []}
				page={currentPage}
				limit={currentLimit}
				totalPages={tableResult?.totalPages ?? 1}
				query={query}
				createdFrom={createdFrom}
				createdTo={createdTo}
				statusFilters={statusFilters}
				severityFilters={severityFilters}
				isPending={isPending}
				onQueryChange={handleQueryChange}
				onCreatedAtRangeApply={handleCreatedAtRangeApply}
				onStatusFiltersChange={handleStatusFiltersChange}
				onSeverityFiltersChange={handleSeverityFiltersChange}
				onFiltersClear={handleFiltersClear}
				onAllergyCreated={() => {
					void mutateAllergies();
				}}
				onAllergyUpdated={() => {
					void mutateAllergies();
				}}
				onPreviousPage={handlePreviousPage}
				onNextPage={handleNextPage}
				onLimitChange={handleLimitChange}
			/>
		</>
	);
}
