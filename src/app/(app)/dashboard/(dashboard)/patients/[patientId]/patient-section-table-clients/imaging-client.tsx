"use client";

import { ImagingTable } from "@/features/patients/components/imaging-table";
import type {
	ImagingModalityFilter,
	ImagingStatusFilter,
	ImagingType,
} from "@/features/patients/types";
import { useDebouncedCallback } from "@/hooks/use-debounced";
import { useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import type { PatientImagingTableResult } from "@/app/api/patient-imaging/[patientId]/route";

export function ImagingClient({
	patientId,
	encounterId,
	imagingStudies,
	page,
	limit,
	totalPages,
}: {
	patientId: string;
	encounterId?: string;
	imagingStudies: ImagingType[];
	page: number;
	limit: number;
	totalPages: number;
}) {
	const router = useRouter();
	const [currentPage, setCurrentPage] = useState(page);
	const [currentLimit, setCurrentLimit] = useState(limit);
	const [searchQuery, setSearchQuery] = useState("");
	const [query, setQuery] = useState("");
	const [orderedFrom, setOrderedFrom] = useState("");
	const [orderedTo, setOrderedTo] = useState("");
	const [createdFrom, setCreatedFrom] = useState("");
	const [createdTo, setCreatedTo] = useState("");
	const [statusFilters, setStatusFilters] = useState<ImagingStatusFilter[]>([]);
	const [modalityFilters, setModalityFilters] = useState<ImagingModalityFilter[]>([]);
	const requestParams = new URLSearchParams({
		page: String(currentPage),
		limit: String(currentLimit),
		query: searchQuery,
		encounterId: encounterId ?? "",
		orderedFrom: orderedFrom,
		orderedTo: orderedTo,
		createdFrom: createdFrom,
		createdTo: createdTo,
		statusFilters: statusFilters.join(","),
		modalityFilters: modalityFilters.join(","),
	});
	const initialParams = new URLSearchParams({
		page: String(page),
		limit: String(limit),
		query: "",
		encounterId: encounterId ?? "",
		orderedFrom: "",
		orderedTo: "",
		createdFrom: "",
		createdTo: "",
		statusFilters: "",
		modalityFilters: "",
	});
	const key = `/api/patient-imaging/${encodeURIComponent(patientId)}?${requestParams}`;
	const initialKey = `/api/patient-imaging/${encodeURIComponent(patientId)}?${initialParams}`;
	const {
		data: tableResult,
		error: tableError,
		isLoading,
		isValidating,
		mutate: mutateImaging,
	} = useSWR(
		key,
		async (url: string) => {
			const response = await fetch(url);
			const result = (await response.json()) as PatientImagingTableResult;
			if (!response.ok || result.status === "failed") {
				throw Object.assign(
					new Error(result.status === "failed" ? result.error : "Unable to load patient imaging."),
					{ status: response.status },
				);
			}
			return result;
		},
		{
			keepPreviousData: true,
			fallbackData:
				key === initialKey
					? { status: "success", imagingStudies, page, limit, totalPages }
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

	function handleOrderedAtRangeApply(nextOrderedFrom: string, nextOrderedTo: string) {
		setOrderedFrom(nextOrderedFrom);
		setOrderedTo(nextOrderedTo);
		setSearchQuery(query);
		setCurrentPage(1);
	}

	function handleCreatedAtRangeApply(nextCreatedFrom: string, nextCreatedTo: string) {
		setCreatedFrom(nextCreatedFrom);
		setCreatedTo(nextCreatedTo);
		setSearchQuery(query);
		setCurrentPage(1);
	}

	function handleStatusFiltersChange(nextStatusFilters: ImagingStatusFilter[]) {
		setStatusFilters(nextStatusFilters);
		setSearchQuery(query);
		setCurrentPage(1);
	}

	function handleModalityFiltersChange(nextModalityFilters: ImagingModalityFilter[]) {
		setModalityFilters(nextModalityFilters);
		setSearchQuery(query);
		setCurrentPage(1);
	}

	function handleFiltersClear() {
		setOrderedFrom("");
		setOrderedTo("");
		setCreatedFrom("");
		setCreatedTo("");
		setStatusFilters([]);
		setModalityFilters([]);
		setSearchQuery(query);
		setCurrentPage(1);
	}

	return (
		<>
			{tableError ? <p role="alert">{tableError.message}</p> : null}
			<ImagingTable
				patientId={patientId}
				encounterId={encounterId}
				imagingStudies={tableResult?.imagingStudies ?? []}
				page={currentPage}
				limit={currentLimit}
				totalPages={tableResult?.totalPages ?? 1}
				query={query}
				orderedFrom={orderedFrom}
				orderedTo={orderedTo}
				createdFrom={createdFrom}
				createdTo={createdTo}
				statusFilters={statusFilters}
				modalityFilters={modalityFilters}
				isPending={isPending}
				onQueryChange={handleQueryChange}
				onOrderedAtRangeApply={handleOrderedAtRangeApply}
				onCreatedAtRangeApply={handleCreatedAtRangeApply}
				onStatusFiltersChange={handleStatusFiltersChange}
				onModalityFiltersChange={handleModalityFiltersChange}
				onFiltersClear={handleFiltersClear}
				onImagingCreated={() => {
					void mutateImaging();
				}}
				onImagingUpdated={() => {
					void mutateImaging();
				}}
				onPreviousPage={handlePreviousPage}
				onNextPage={handleNextPage}
				onLimitChange={handleLimitChange}
			/>
		</>
	);
}
