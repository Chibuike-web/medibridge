"use client";

import { DiagnosesTable } from "@/features/patients/components/diagnoses-table";
import type { DiagnosisStatusFilter, DiagnosisType } from "@/features/patients/types";
import { useDebouncedCallback } from "@/hooks/use-debounced";
import { useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import type { PatientDiagnosesTableResult } from "@/app/api/patient-diagnoses/[patientId]/route";

export function DiagnosesClient({
	patientId,
	encounterId,
	diagnoses,
	page,
	limit,
	totalPages,
}: {
	patientId: string;
	encounterId?: string;
	diagnoses: DiagnosisType[];
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
	const [diagnosedFrom, setDiagnosedFrom] = useState("");
	const [diagnosedTo, setDiagnosedTo] = useState("");
	const [lastReviewedFrom, setLastReviewedFrom] = useState("");
	const [lastReviewedTo, setLastReviewedTo] = useState("");
	const [statusFilters, setStatusFilters] = useState<DiagnosisStatusFilter[]>([]);
	const requestParams = new URLSearchParams({
		page: String(currentPage),
		limit: String(currentLimit),
		query: searchQuery,
		encounterId: encounterId ?? "",
		createdFrom: createdFrom,
		createdTo: createdTo,
		diagnosedFrom: diagnosedFrom,
		diagnosedTo: diagnosedTo,
		lastReviewedFrom: lastReviewedFrom,
		lastReviewedTo: lastReviewedTo,
		statusFilters: statusFilters.join(","),
	});
	const initialParams = new URLSearchParams({
		page: String(page),
		limit: String(limit),
		query: "",
		encounterId: encounterId ?? "",
		createdFrom: "",
		createdTo: "",
		diagnosedFrom: "",
		diagnosedTo: "",
		lastReviewedFrom: "",
		lastReviewedTo: "",
		statusFilters: "",
	});
	const key = `/api/patient-diagnoses/${encodeURIComponent(patientId)}?${requestParams}`;
	const initialKey = `/api/patient-diagnoses/${encodeURIComponent(patientId)}?${initialParams}`;
	const {
		data: tableResult,
		error: tableError,
		isLoading,
		isValidating,
		mutate: mutateDiagnoses,
	} = useSWR(
		key,
		async (url: string) => {
			const response = await fetch(url);
			const result = (await response.json()) as PatientDiagnosesTableResult;
			if (!response.ok || result.status === "failed") {
				throw Object.assign(
					new Error(
						result.status === "failed" ? result.error : "Unable to load patient diagnoses.",
					),
					{ status: response.status },
				);
			}
			return result;
		},
		{
			keepPreviousData: true,
			fallbackData:
				key === initialKey ? { status: "success", diagnoses, page, limit, totalPages } : undefined,
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

	function handleStatusFiltersChange(nextStatusFilters: DiagnosisStatusFilter[]) {
		setStatusFilters(nextStatusFilters);
		setSearchQuery(query);
		setCurrentPage(1);
	}

	function handleCreatedAtRangeApply(nextCreatedFrom: string, nextCreatedTo: string) {
		setCreatedFrom(nextCreatedFrom);
		setCreatedTo(nextCreatedTo);
		setSearchQuery(query);
		setCurrentPage(1);
	}

	function handleDiagnosedAtRangeApply(nextDiagnosedFrom: string, nextDiagnosedTo: string) {
		setDiagnosedFrom(nextDiagnosedFrom);
		setDiagnosedTo(nextDiagnosedTo);
		setSearchQuery(query);
		setCurrentPage(1);
	}

	function handleLastReviewedRangeApply(nextLastReviewedFrom: string, nextLastReviewedTo: string) {
		setLastReviewedFrom(nextLastReviewedFrom);
		setLastReviewedTo(nextLastReviewedTo);
		setSearchQuery(query);
		setCurrentPage(1);
	}

	function handleFiltersClear() {
		setCreatedFrom("");
		setCreatedTo("");
		setDiagnosedFrom("");
		setDiagnosedTo("");
		setLastReviewedFrom("");
		setLastReviewedTo("");
		setStatusFilters([]);
		setSearchQuery(query);
		setCurrentPage(1);
	}

	return (
		<>
			{tableError ? <p role="alert">{tableError.message}</p> : null}
			<DiagnosesTable
				patientId={patientId}
				encounterId={encounterId}
				diagnoses={tableResult?.diagnoses ?? []}
				page={currentPage}
				limit={currentLimit}
				totalPages={tableResult?.totalPages ?? 1}
				query={query}
				createdFrom={createdFrom}
				createdTo={createdTo}
				diagnosedFrom={diagnosedFrom}
				diagnosedTo={diagnosedTo}
				isPending={isPending}
				lastReviewedFrom={lastReviewedFrom}
				lastReviewedTo={lastReviewedTo}
				statusFilters={statusFilters}
				onCreatedAtRangeApply={handleCreatedAtRangeApply}
				onDiagnosedAtRangeApply={handleDiagnosedAtRangeApply}
				onLastReviewedRangeApply={handleLastReviewedRangeApply}
				onQueryChange={handleQueryChange}
				onPreviousPage={handlePreviousPage}
				onNextPage={handleNextPage}
				onLimitChange={handleLimitChange}
				onStatusFiltersChange={handleStatusFiltersChange}
				onFiltersClear={handleFiltersClear}
				onDiagnosisCreated={() => {
					void mutateDiagnoses();
				}}
				onDiagnosisUpdated={() => {
					void mutateDiagnoses();
				}}
			/>
		</>
	);
}
