"use client";

import { MedicationsTable } from "@/features/patients/components/medications-table";
import { useTableUrlNavigation } from "@/features/patients/components/table-url-navigation";
import type { MedicationStatusFilter, MedicationType } from "@/features/patients/types";
import { useDebouncedCallback } from "@/hooks/use-debounced";
import { functionalUpdate, type SortingState, type Updater } from "@tanstack/react-table";
import { useOptimistic, useState, useTransition } from "react";

type MedicationsClientProps = {
	patientId: string;
	encounterId?: string;
	medications: MedicationType[];
	page: number;
	limit: number;
	totalPages: number;
	searchQuery?: string;
	sort?: string;
	order?: string;
	createdFrom?: string;
	createdTo?: string;
	statusFilters?: MedicationStatusFilter[];
};

type MedicationsTableChange = {
	nextPage?: number;
	nextSort?: string;
	nextOrder?: string;
	nextLimit?: number;
	nextQuery?: string;
	nextCreatedFrom?: string;
	nextCreatedTo?: string;
	nextStatusFilters?: MedicationStatusFilter[];
};

export function MedicationsClient({
	patientId,
	encounterId,
	medications,
	page,
	limit,
	totalPages,
	searchQuery = "",
	sort = "",
	order = "",
	createdFrom = "",
	createdTo = "",
	statusFilters = [],
}: MedicationsClientProps) {
	const navigateTableUrl = useTableUrlNavigation();
	const [optimisticPage, setOptimisticPage] = useOptimistic(page);
	const [optimisticLimit, setOptimisticLimit] = useOptimistic(limit);
	const [optimisticSort, setOptimisticSort] = useOptimistic(sort);
	const [optimisticOrder, setOptimisticOrder] = useOptimistic(order);
	const sorting: SortingState = optimisticSort
		? [{ id: optimisticSort, desc: optimisticOrder === "desc" }]
		: [];
	const [query, setQuery] = useState(searchQuery);
	const [previousSearchQuery, setPreviousSearchQuery] = useState(searchQuery);
	const [navigatedQuery, setNavigatedQuery] = useState<string | null>(null);
	const [optimisticQuery, setOptimisticQuery] = useOptimistic(searchQuery);
	const [optimisticCreatedFrom, setOptimisticCreatedFrom] = useOptimistic(createdFrom);
	const [optimisticCreatedTo, setOptimisticCreatedTo] = useOptimistic(createdTo);
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
			nextSort = optimisticSort,
			nextOrder = optimisticOrder,
			nextLimit = optimisticLimit,
			nextQuery = query,
			nextCreatedFrom = optimisticCreatedFrom,
			nextCreatedTo = optimisticCreatedTo,
			nextStatusFilters = optimisticStatusFilters,
		}: MedicationsTableChange,
		{ replace = false }: { replace?: boolean } = {},
	) {
		const values = {
			medicationsPage: nextPage === 1 ? "" : String(nextPage),
			medicationsSort: nextSort,
			medicationsOrder: nextSort ? nextOrder : "",
			medicationsLimit: nextLimit === 14 ? "" : String(nextLimit),
			medicationsQuery: nextQuery,
			medicationsCreatedFrom: nextCreatedFrom,
			medicationsCreatedTo: nextCreatedTo,
			medicationsStatus: nextStatusFilters.join(","),
		};

		startTransition(() => {
			setNavigatedQuery(nextQuery);
			setOptimisticQuery(nextQuery);
			setOptimisticPage(nextPage);
			setOptimisticSort(nextSort);
			setOptimisticOrder(nextOrder);
			setOptimisticLimit(nextLimit);
			setOptimisticCreatedFrom(nextCreatedFrom);
			setOptimisticCreatedTo(nextCreatedTo);
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

	function handleCreatedAtRangeApply(nextCreatedFrom: string, nextCreatedTo: string) {
		navigateTable({ nextCreatedFrom, nextCreatedTo });
	}

	function handleStatusFiltersChange(nextStatusFilters: MedicationStatusFilter[]) {
		navigateTable({ nextStatusFilters });
	}

	function handleFiltersClear() {
		navigateTable({ nextCreatedFrom: "", nextCreatedTo: "", nextStatusFilters: [] });
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

	function handleSortingChange(updater: Updater<SortingState>) {
		const [nextSorting] = functionalUpdate(updater, sorting);
		navigateTable({
			nextSort: nextSorting?.id ?? "",
			nextOrder: nextSorting?.desc ? "desc" : "asc",
		});
	}

	return (
		<MedicationsTable
			patientId={patientId}
			encounterId={encounterId}
			medications={medications}
			page={optimisticPage}
			limit={optimisticLimit}
			totalPages={totalPages}
			query={query}
			sorting={sorting}
			onSortingChange={handleSortingChange}
			createdFrom={optimisticCreatedFrom}
			createdTo={optimisticCreatedTo}
			statusFilters={optimisticStatusFilters}
			isPending={isPending}
			onQueryChange={handleQueryChange}
			onCreatedAtRangeApply={handleCreatedAtRangeApply}
			onStatusFiltersChange={handleStatusFiltersChange}
			onFiltersClear={handleFiltersClear}
			onPreviousPage={handlePreviousPage}
			onNextPage={handleNextPage}
			onLimitChange={handleLimitChange}
		/>
	);
}
