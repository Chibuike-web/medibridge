"use client";

import { LabTestsTable } from "@/features/patients/components/lab-tests-table";
import type {
	LabTestFlagFilter,
	LabTestStatusFilter,
	LabTestType,
} from "@/features/patients/types";
import { useDebouncedCallback } from "@/hooks/use-debounced";
import { useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import type { PatientLabTestsTableResult } from "@/app/api/patient-lab-tests/[patientId]/route";

export function LabTestsClient({
	patientId,
	encounterId,
	labTests,
	page,
	limit,
	totalPages,
}: {
	patientId: string;
	encounterId?: string;
	labTests: LabTestType[];
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
	const [statusFilters, setStatusFilters] = useState<LabTestStatusFilter[]>([]);
	const [flagFilters, setFlagFilters] = useState<LabTestFlagFilter[]>([]);
	const requestParams = new URLSearchParams({
		page: String(currentPage),
		limit: String(currentLimit),
		query: searchQuery,
		encounterId: encounterId ?? "",
		createdFrom: createdFrom,
		createdTo: createdTo,
		statusFilters: statusFilters.join(","),
		flagFilters: flagFilters.join(","),
	});
	const initialParams = new URLSearchParams({
		page: String(page),
		limit: String(limit),
		query: "",
		encounterId: encounterId ?? "",
		createdFrom: "",
		createdTo: "",
		statusFilters: "",
		flagFilters: "",
	});
	const key = `/api/patient-lab-tests/${encodeURIComponent(patientId)}?${requestParams}`;
	const initialKey = `/api/patient-lab-tests/${encodeURIComponent(patientId)}?${initialParams}`;
	const {
		data: tableResult,
		error: tableError,
		isLoading,
		isValidating,
		mutate: mutateLabTests,
	} = useSWR(
		key,
		async (url: string) => {
			const response = await fetch(url);
			const result = (await response.json()) as PatientLabTestsTableResult;
			if (!response.ok || result.status === "failed") {
				throw Object.assign(
					new Error(
						result.status === "failed" ? result.error : "Unable to load patient lab-tests.",
					),
					{ status: response.status },
				);
			}
			return result;
		},
		{
			keepPreviousData: true,
			fallbackData:
				key === initialKey ? { status: "success", labTests, page, limit, totalPages } : undefined,
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

	function handleStatusFiltersChange(nextStatusFilters: LabTestStatusFilter[]) {
		setStatusFilters(nextStatusFilters);
		setSearchQuery(query);
		setCurrentPage(1);
	}

	function handleFlagFiltersChange(nextFlagFilters: LabTestFlagFilter[]) {
		setFlagFilters(nextFlagFilters);
		setSearchQuery(query);
		setCurrentPage(1);
	}

	function handleFiltersClear() {
		setCreatedFrom("");
		setCreatedTo("");
		setStatusFilters([]);
		setFlagFilters([]);
		setSearchQuery(query);
		setCurrentPage(1);
	}

	return (
		<>
			{tableError ? <p role="alert">{tableError.message}</p> : null}
			<LabTestsTable
				patientId={patientId}
				encounterId={encounterId}
				labTests={tableResult?.labTests ?? []}
				page={currentPage}
				limit={currentLimit}
				totalPages={tableResult?.totalPages ?? 1}
				query={query}
				createdFrom={createdFrom}
				createdTo={createdTo}
				statusFilters={statusFilters}
				flagFilters={flagFilters}
				isPending={isPending}
				onQueryChange={handleQueryChange}
				onCreatedAtRangeApply={handleCreatedAtRangeApply}
				onStatusFiltersChange={handleStatusFiltersChange}
				onFlagFiltersChange={handleFlagFiltersChange}
				onFiltersClear={handleFiltersClear}
				onLabTestCreated={() => {
					void mutateLabTests();
				}}
				onLabTestUpdated={() => {
					void mutateLabTests();
				}}
				onPreviousPage={handlePreviousPage}
				onNextPage={handleNextPage}
				onLimitChange={handleLimitChange}
			/>
		</>
	);
}
