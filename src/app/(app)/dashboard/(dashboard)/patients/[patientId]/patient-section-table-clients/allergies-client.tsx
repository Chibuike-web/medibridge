"use client";

import { AllergiesTable } from "@/features/patients/components/allergies-table";
import { useTableUrlNavigation } from "@/features/patients/components/table-url-navigation";
import type {
	AllergySeverityFilter,
	AllergyStatusFilter,
	AllergyType,
} from "@/features/patients/types";
import { useDebouncedCallback } from "@/hooks/use-debounced";
import { functionalUpdate, type SortingState, type Updater } from "@tanstack/react-table";
import { useOptimistic, useState, useTransition } from "react";

type AllergiesClientProps = {
	patientId: string;
	encounterId?: string;
	allergies: AllergyType[];
	page: number;
	limit: number;
	totalPages: number;
	searchQuery?: string;
	sort?: string;
	order?: string;
	createdFrom?: string;
	createdTo?: string;
	statusFilters?: AllergyStatusFilter[];
	severityFilters?: AllergySeverityFilter[];
};

type AllergiesTableChange = {
	nextPage?: number;
	nextSort?: string;
	nextOrder?: string;
	nextLimit?: number;
	nextQuery?: string;
	nextCreatedFrom?: string;
	nextCreatedTo?: string;
	nextStatusFilters?: AllergyStatusFilter[];
	nextSeverityFilters?: AllergySeverityFilter[];
};

export function AllergiesClient({
	patientId,
	encounterId,
	allergies,
	page,
	limit,
	totalPages,
	searchQuery = "",
	sort = "",
	order = "",
	createdFrom = "",
	createdTo = "",
	statusFilters = [],
	severityFilters = [],
}: AllergiesClientProps) {
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
	const [optimisticSeverityFilters, setOptimisticSeverityFilters] = useOptimistic(severityFilters);
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
			nextSeverityFilters = optimisticSeverityFilters,
		}: AllergiesTableChange,
		{ replace = false }: { replace?: boolean } = {},
	) {
		const values = {
			allergiesPage: nextPage === 1 ? "" : String(nextPage),
			allergiesSort: nextSort,
			allergiesOrder: nextSort ? nextOrder : "",
			allergiesLimit: nextLimit === 14 ? "" : String(nextLimit),
			allergiesQuery: nextQuery,
			allergiesCreatedFrom: nextCreatedFrom,
			allergiesCreatedTo: nextCreatedTo,
			allergiesStatus: nextStatusFilters.join(","),
			allergiesSeverity: nextSeverityFilters.join(","),
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
			setOptimisticSeverityFilters(nextSeverityFilters);
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

	function handleCreatedAtRangeApply(nextCreatedFrom: string, nextCreatedTo: string) {
		navigateTable({ nextCreatedFrom, nextCreatedTo });
	}

	function handleStatusFiltersChange(nextStatusFilters: AllergyStatusFilter[]) {
		navigateTable({ nextStatusFilters });
	}
	function handleSeverityFiltersChange(nextSeverityFilters: AllergySeverityFilter[]) {
		navigateTable({ nextSeverityFilters });
	}

	function handleFiltersClear() {
		navigateTable({
			nextCreatedFrom: "",
			nextCreatedTo: "",
			nextStatusFilters: [],
			nextSeverityFilters: [],
		});
	}

	function handleSortingChange(updater: Updater<SortingState>) {
		const [nextSorting] = functionalUpdate(updater, sorting);
		navigateTable({
			nextSort: nextSorting?.id ?? "",
			nextOrder: nextSorting?.desc ? "desc" : "asc",
		});
	}

	return (
		<AllergiesTable
			patientId={patientId}
			encounterId={encounterId}
			allergies={allergies}
			page={optimisticPage}
			limit={optimisticLimit}
			totalPages={totalPages}
			query={query}
			sorting={sorting}
			onSortingChange={handleSortingChange}
			createdFrom={optimisticCreatedFrom}
			createdTo={optimisticCreatedTo}
			statusFilters={optimisticStatusFilters}
			severityFilters={optimisticSeverityFilters}
			isPending={isPending}
			onQueryChange={handleQueryChange}
			onCreatedAtRangeApply={handleCreatedAtRangeApply}
			onStatusFiltersChange={handleStatusFiltersChange}
			onSeverityFiltersChange={handleSeverityFiltersChange}
			onFiltersClear={handleFiltersClear}
			onPreviousPage={handlePreviousPage}
			onNextPage={handleNextPage}
			onLimitChange={handleLimitChange}
		/>
	);
}
