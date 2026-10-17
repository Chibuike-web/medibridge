"use client";

import { VitalsTable } from "@/features/patients/components/vitals-table";
import type { VitalEncounterOption, VitalType } from "@/features/patients/types";
import { useDebouncedCallback } from "@/hooks/use-debounced";
import { useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import type { PatientVitalsTableResult } from "@/app/api/patient-vitals/[patientId]/route";

export function VitalsClient({
	patientId,
	encounterId,
	encounterOptions,
	vitals,
	readings,
	page,
	limit,
	totalPages,
}: {
	patientId: string;
	encounterId?: string;
	encounterOptions: VitalEncounterOption[];
	vitals: VitalType[];
	readings: VitalType[];
	page: number;
	limit: number;
	totalPages: number;
}) {
	const router = useRouter();
	const [currentPage, setCurrentPage] = useState(page);
	const [currentLimit, setCurrentLimit] = useState(limit);
	const [searchQuery, setSearchQuery] = useState("");
	const [query, setQuery] = useState("");
	const [recordedFrom, setRecordedFrom] = useState("");
	const [recordedTo, setRecordedTo] = useState("");
	const [createdFrom, setCreatedFrom] = useState("");
	const [createdTo, setCreatedTo] = useState("");
	const [chartReadings, setChartReadings] = useState(readings);
	const requestParams = new URLSearchParams({
		page: String(currentPage),
		limit: String(currentLimit),
		query: searchQuery,
		encounterId: encounterId ?? "",
		recordedFrom: recordedFrom,
		recordedTo: recordedTo,
		createdFrom: createdFrom,
		createdTo: createdTo,
	});
	const initialParams = new URLSearchParams({
		page: String(page),
		limit: String(limit),
		query: "",
		encounterId: encounterId ?? "",
		recordedFrom: "",
		recordedTo: "",
		createdFrom: "",
		createdTo: "",
	});
	const key = `/api/patient-vitals/${encodeURIComponent(patientId)}?${requestParams}`;
	const initialKey = `/api/patient-vitals/${encodeURIComponent(patientId)}?${initialParams}`;
	const {
		data: tableResult,
		error: tableError,
		isLoading,
		isValidating,
		mutate: mutateVitals,
	} = useSWR(
		key,
		async (url: string) => {
			const response = await fetch(url);
			const result = (await response.json()) as PatientVitalsTableResult;
			if (!response.ok || result.status === "failed") {
				throw Object.assign(
					new Error(result.status === "failed" ? result.error : "Unable to load patient vitals."),
					{ status: response.status },
				);
			}
			return result;
		},
		{
			keepPreviousData: true,
			fallbackData:
				key === initialKey ? { status: "success", vitals, page, limit, totalPages } : undefined,
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
		setCurrentPage(Math.max(currentPage - 1, 1));
	}

	function handleNextPage() {
		setCurrentPage(Math.min(currentPage + 1, tableResult?.totalPages ?? 1));
	}

	function handleLimitChange(nextLimit: number) {
		setCurrentLimit(nextLimit);
		setCurrentPage(1);
	}

	function handleRecordedAtRangeApply(nextRecordedFrom: string, nextRecordedTo: string) {
		setRecordedFrom(nextRecordedFrom);
		setRecordedTo(nextRecordedTo);
		setSearchQuery(query);
		setCurrentPage(1);
	}

	function handleCreatedAtRangeApply(nextCreatedFrom: string, nextCreatedTo: string) {
		setCreatedFrom(nextCreatedFrom);
		setCreatedTo(nextCreatedTo);
		setSearchQuery(query);
		setCurrentPage(1);
	}

	function handleFiltersClear() {
		setRecordedFrom("");
		setRecordedTo("");
		setCreatedFrom("");
		setCreatedTo("");
		setSearchQuery(query);
		setCurrentPage(1);
	}

	function handleVitalCreated(vital: VitalType) {
		setChartReadings((prev) => [vital, ...prev]);
		void mutateVitals();
	}

	return (
		<>
			{tableError ? <p role="alert">{tableError.message}</p> : null}
			<VitalsTable
				patientId={patientId}
				encounterId={encounterId}
				encounterOptions={encounterOptions}
				vitals={tableResult?.vitals ?? []}
				readings={chartReadings}
				page={currentPage}
				limit={currentLimit}
				totalPages={tableResult?.totalPages ?? 1}
				query={query}
				recordedFrom={recordedFrom}
				recordedTo={recordedTo}
				createdFrom={createdFrom}
				createdTo={createdTo}
				isPending={isPending}
				onQueryChange={handleQueryChange}
				onRecordedAtRangeApply={handleRecordedAtRangeApply}
				onCreatedAtRangeApply={handleCreatedAtRangeApply}
				onFiltersClear={handleFiltersClear}
				onPreviousPage={handlePreviousPage}
				onNextPage={handleNextPage}
				onLimitChange={handleLimitChange}
				onVitalCreated={handleVitalCreated}
			/>
		</>
	);
}
