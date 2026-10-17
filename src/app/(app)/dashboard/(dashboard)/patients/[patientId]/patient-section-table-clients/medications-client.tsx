"use client";

import { MedicationsTable } from "@/features/patients/components/medications-table";
import type { MedicationStatusFilter, MedicationType } from "@/features/patients/types";
import { useDebouncedCallback } from "@/hooks/use-debounced";
import { useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import type { PatientMedicationsTableResult } from "@/app/api/patient-medications/[patientId]/route";

export function MedicationsClient({
	patientId,
	encounterId,
	medications,
	page,
	limit,
	totalPages,
}: {
	patientId: string;
	encounterId?: string;
	medications: MedicationType[];
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
	const [statusFilters, setStatusFilters] = useState<MedicationStatusFilter[]>([]);
	const requestParams = new URLSearchParams({
		page: String(currentPage),
		limit: String(currentLimit),
		query: searchQuery,
		encounterId: encounterId ?? "",
		createdFrom: createdFrom,
		createdTo: createdTo,
		statusFilters: statusFilters.join(","),
	});
	const initialParams = new URLSearchParams({
		page: String(page),
		limit: String(limit),
		query: "",
		encounterId: encounterId ?? "",
		createdFrom: "",
		createdTo: "",
		statusFilters: "",
	});
	const key = `/api/patient-medications/${encodeURIComponent(patientId)}?${requestParams}`;
	const initialKey = `/api/patient-medications/${encodeURIComponent(patientId)}?${initialParams}`;
	const {
		data: tableResult,
		error: tableError,
		isLoading,
		isValidating,
		mutate: mutateMedications,
	} = useSWR(
		key,
		async (url: string) => {
			const response = await fetch(url);
			const result = (await response.json()) as PatientMedicationsTableResult;
			if (!response.ok || result.status === "failed") {
				throw Object.assign(
					new Error(
						result.status === "failed" ? result.error : "Unable to load patient medications.",
					),
					{ status: response.status },
				);
			}
			return result;
		},
		{
			keepPreviousData: true,
			fallbackData:
				key === initialKey
					? { status: "success", medications, page, limit, totalPages }
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
		setSearchQuery(nextQuery);
		setCurrentPage(1);
	}, 300);

	function handleQueryChange(nextQuery: string) {
		setQuery(nextQuery);
		debouncedSearch(nextQuery);
	}

	function handleCreatedAtRangeApply(nextCreatedFrom: string, nextCreatedTo: string) {
		setCreatedFrom(nextCreatedFrom);
		setCreatedTo(nextCreatedTo);

		setSearchQuery(query);
		setCurrentPage(1);
	}

	function handleStatusFiltersChange(nextStatusFilters: MedicationStatusFilter[]) {
		setStatusFilters(nextStatusFilters);

		setSearchQuery(query);
		setCurrentPage(1);
	}

	function handleFiltersClear() {
		setCreatedFrom("");
		setCreatedTo("");
		setStatusFilters([]);

		setSearchQuery(query);
		setCurrentPage(1);
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

	return (
		<>
			{tableError ? <p role="alert">{tableError.message}</p> : null}
			<MedicationsTable
				patientId={patientId}
				encounterId={encounterId}
				medications={tableResult?.medications ?? []}
				page={currentPage}
				limit={currentLimit}
				totalPages={tableResult?.totalPages ?? 1}
				query={query}
				createdFrom={createdFrom}
				createdTo={createdTo}
				statusFilters={statusFilters}
				isPending={isPending}
				onQueryChange={handleQueryChange}
				onCreatedAtRangeApply={handleCreatedAtRangeApply}
				onStatusFiltersChange={handleStatusFiltersChange}
				onFiltersClear={handleFiltersClear}
				onMedicationCreated={() => {
					void mutateMedications();
				}}
				onMedicationUpdated={() => {
					void mutateMedications();
				}}
				onPreviousPage={handlePreviousPage}
				onNextPage={handleNextPage}
				onLimitChange={handleLimitChange}
			/>
		</>
	);
}
