"use client";

import { DiagnosesTable } from "@/features/patients/components/diagnoses-table";
import { useTableUrlNavigation } from "@/features/patients/components/table-url-navigation";
import type { DiagnosisStatusFilter, DiagnosisType } from "@/features/patients/types";
import { useDebouncedCallback } from "@/hooks/use-debounced";
import { useOptimistic, useState, useTransition } from "react";

type DiagnosesClientProps = {
	patientId: string;
	encounterId?: string;
	diagnoses: DiagnosisType[];
	page: number;
	limit: number;
	totalPages: number;
	searchQuery?: string;
	createdFrom?: string;
	createdTo?: string;
	diagnosedFrom?: string;
	diagnosedTo?: string;
	lastReviewedFrom?: string;
	lastReviewedTo?: string;
	statusFilters?: DiagnosisStatusFilter[];
};

type DiagnosesTableChange = {
	nextPage?: number;
	nextLimit?: number;
	nextQuery?: string;
	nextCreatedFrom?: string;
	nextCreatedTo?: string;
	nextDiagnosedFrom?: string;
	nextDiagnosedTo?: string;
	nextLastReviewedFrom?: string;
	nextLastReviewedTo?: string;
	nextStatusFilters?: DiagnosisStatusFilter[];
};

export function DiagnosesClient({
	patientId,
	encounterId,
	diagnoses,
	page,
	limit,
	totalPages,
	searchQuery = "",
	createdFrom = "",
	createdTo = "",
	diagnosedFrom = "",
	diagnosedTo = "",
	lastReviewedFrom = "",
	lastReviewedTo = "",
	statusFilters = [],
}: DiagnosesClientProps) {
	const navigateTableUrl = useTableUrlNavigation();
	const [optimisticPage, setOptimisticPage] = useOptimistic(page);
	const [optimisticLimit, setOptimisticLimit] = useOptimistic(limit);
	const [query, setQuery] = useState(searchQuery);
	const [previousSearchQuery, setPreviousSearchQuery] = useState(searchQuery);
	const [navigatedQuery, setNavigatedQuery] = useState<string | null>(null);
	const [optimisticQuery, setOptimisticQuery] = useOptimistic(searchQuery);
	const [optimisticCreatedFrom, setOptimisticCreatedFrom] = useOptimistic(createdFrom);
	const [optimisticCreatedTo, setOptimisticCreatedTo] = useOptimistic(createdTo);
	const [optimisticDiagnosedFrom, setOptimisticDiagnosedFrom] = useOptimistic(diagnosedFrom);
	const [optimisticDiagnosedTo, setOptimisticDiagnosedTo] = useOptimistic(diagnosedTo);
	const [optimisticLastReviewedFrom, setOptimisticLastReviewedFrom] =
		useOptimistic(lastReviewedFrom);
	const [optimisticLastReviewedTo, setOptimisticLastReviewedTo] = useOptimistic(lastReviewedTo);
	const [optimisticStatusFilters, setOptimisticStatusFilters] = useOptimistic(statusFilters);
	const [isPending, startTransition] = useTransition();

	// Restore URL changes while preserving typing ahead of our pending search.
	if (previousSearchQuery !== searchQuery) {
		setPreviousSearchQuery(searchQuery);
		setNavigatedQuery(null);
		if (searchQuery !== navigatedQuery) setQuery(searchQuery);
	}

	function navigateTable(
		{
			nextPage = 1,
			nextLimit = optimisticLimit,
			nextQuery = query,
			nextCreatedFrom = optimisticCreatedFrom,
			nextCreatedTo = optimisticCreatedTo,
			nextDiagnosedFrom = optimisticDiagnosedFrom,
			nextDiagnosedTo = optimisticDiagnosedTo,
			nextLastReviewedFrom = optimisticLastReviewedFrom,
			nextLastReviewedTo = optimisticLastReviewedTo,
			nextStatusFilters = optimisticStatusFilters,
		}: DiagnosesTableChange,
		{ replace = false }: { replace?: boolean } = {},
	) {
		const values = {
			diagnosesPage: nextPage === 1 ? "" : String(nextPage),
			diagnosesLimit: nextLimit === 14 ? "" : String(nextLimit),
			diagnosesQuery: nextQuery,
			diagnosesCreatedFrom: nextCreatedFrom,
			diagnosesCreatedTo: nextCreatedTo,
			diagnosesDiagnosedFrom: nextDiagnosedFrom,
			diagnosesDiagnosedTo: nextDiagnosedTo,
			diagnosesLastReviewedFrom: nextLastReviewedFrom,
			diagnosesLastReviewedTo: nextLastReviewedTo,
			diagnosesStatus: nextStatusFilters.join(","),
		};

		startTransition(() => {
			setNavigatedQuery(nextQuery);
			setOptimisticQuery(nextQuery);
			setOptimisticPage(nextPage);
			setOptimisticLimit(nextLimit);
			setOptimisticCreatedFrom(nextCreatedFrom);
			setOptimisticCreatedTo(nextCreatedTo);
			setOptimisticDiagnosedFrom(nextDiagnosedFrom);
			setOptimisticDiagnosedTo(nextDiagnosedTo);
			setOptimisticLastReviewedFrom(nextLastReviewedFrom);
			setOptimisticLastReviewedTo(nextLastReviewedTo);
			setOptimisticStatusFilters(nextStatusFilters);
			navigateTableUrl(values, { replace });
		});
	}

	const debouncedSearch = useDebouncedCallback((nextQuery: string) => {
		if (nextQuery !== query || nextQuery === optimisticQuery) return;
		navigateTable({ nextQuery }, { replace: true });
	}, 300);

	function handleQueryChange(nextQuery: string) {
		setQuery(nextQuery);
		debouncedSearch(nextQuery);
	}

	function handlePreviousPage() {
		const nextPage = Math.max(optimisticPage - 1, 1);
		navigateTable({ nextPage });
	}

	function handleNextPage() {
		const nextPage = Math.min(optimisticPage + 1, totalPages);
		navigateTable({ nextPage });
	}

	function handleLimitChange(nextLimit: number) {
		navigateTable({ nextLimit });
	}

	function handleStatusFiltersChange(nextStatusFilters: DiagnosisStatusFilter[]) {
		navigateTable({ nextStatusFilters });
	}

	function handleCreatedAtRangeApply(nextCreatedFrom: string, nextCreatedTo: string) {
		navigateTable({ nextCreatedFrom, nextCreatedTo });
	}

	function handleDiagnosedAtRangeApply(nextDiagnosedFrom: string, nextDiagnosedTo: string) {
		navigateTable({ nextDiagnosedFrom, nextDiagnosedTo });
	}

	function handleLastReviewedRangeApply(nextLastReviewedFrom: string, nextLastReviewedTo: string) {
		navigateTable({ nextLastReviewedFrom, nextLastReviewedTo });
	}

	function handleFiltersClear() {
		navigateTable({
			nextCreatedFrom: "",
			nextCreatedTo: "",
			nextDiagnosedFrom: "",
			nextDiagnosedTo: "",
			nextLastReviewedFrom: "",
			nextLastReviewedTo: "",
			nextStatusFilters: [],
		});
	}

	return (
		<DiagnosesTable
			patientId={patientId}
			encounterId={encounterId}
			diagnoses={diagnoses}
			page={optimisticPage}
			limit={optimisticLimit}
			totalPages={totalPages}
			query={query}
			createdFrom={optimisticCreatedFrom}
			createdTo={optimisticCreatedTo}
			diagnosedFrom={optimisticDiagnosedFrom}
			diagnosedTo={optimisticDiagnosedTo}
			isPending={isPending}
			lastReviewedFrom={optimisticLastReviewedFrom}
			lastReviewedTo={optimisticLastReviewedTo}
			statusFilters={optimisticStatusFilters}
			onCreatedAtRangeApply={handleCreatedAtRangeApply}
			onDiagnosedAtRangeApply={handleDiagnosedAtRangeApply}
			onLastReviewedRangeApply={handleLastReviewedRangeApply}
			onQueryChange={handleQueryChange}
			onPreviousPage={handlePreviousPage}
			onNextPage={handleNextPage}
			onLimitChange={handleLimitChange}
			onStatusFiltersChange={handleStatusFiltersChange}
			onFiltersClear={handleFiltersClear}
		/>
	);
}
