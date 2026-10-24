"use client";

import { ImagingTable } from "@/features/patients/components/imaging-table";
import { useTableUrlNavigation } from "@/features/patients/components/table-url-navigation";
import type {
	ImagingModalityFilter,
	ImagingStatusFilter,
	ImagingType,
} from "@/features/patients/types";
import { useDebouncedCallback } from "@/hooks/use-debounced";
import { functionalUpdate, type SortingState, type Updater } from "@tanstack/react-table";
import { useOptimistic, useState, useTransition } from "react";

type ImagingClientProps = {
	patientId: string;
	encounterId?: string;
	imagingStudies: ImagingType[];
	page: number;
	limit: number;
	totalPages: number;
	searchQuery?: string;
	sort?: string;
	order?: string;
	orderedFrom?: string;
	orderedTo?: string;
	createdFrom?: string;
	createdTo?: string;
	statusFilters?: ImagingStatusFilter[];
	modalityFilters?: ImagingModalityFilter[];
};

type ImagingTableChange = {
	nextPage?: number;
	nextSort?: string;
	nextOrder?: string;
	nextLimit?: number;
	nextQuery?: string;
	nextOrderedFrom?: string;
	nextOrderedTo?: string;
	nextCreatedFrom?: string;
	nextCreatedTo?: string;
	nextStatusFilters?: ImagingStatusFilter[];
	nextModalityFilters?: ImagingModalityFilter[];
};

export function ImagingClient({
	patientId,
	encounterId,
	imagingStudies,
	page,
	limit,
	totalPages,
	searchQuery = "",
	sort = "",
	order = "",
	orderedFrom = "",
	orderedTo = "",
	createdFrom = "",
	createdTo = "",
	statusFilters = [],
	modalityFilters = [],
}: ImagingClientProps) {
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
	const [optimisticOrderedFrom, setOptimisticOrderedFrom] = useOptimistic(orderedFrom);
	const [optimisticOrderedTo, setOptimisticOrderedTo] = useOptimistic(orderedTo);
	const [optimisticCreatedFrom, setOptimisticCreatedFrom] = useOptimistic(createdFrom);
	const [optimisticCreatedTo, setOptimisticCreatedTo] = useOptimistic(createdTo);
	const [optimisticStatusFilters, setOptimisticStatusFilters] = useOptimistic(statusFilters);
	const [optimisticModalityFilters, setOptimisticModalityFilters] = useOptimistic(modalityFilters);
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
			nextOrderedFrom = optimisticOrderedFrom,
			nextOrderedTo = optimisticOrderedTo,
			nextCreatedFrom = optimisticCreatedFrom,
			nextCreatedTo = optimisticCreatedTo,
			nextStatusFilters = optimisticStatusFilters,
			nextModalityFilters = optimisticModalityFilters,
		}: ImagingTableChange,
		{ replace = false }: { replace?: boolean } = {},
	) {
		const values = {
			imagingPage: nextPage === 1 ? "" : String(nextPage),
			imagingSort: nextSort,
			imagingOrder: nextSort ? nextOrder : "",
			imagingLimit: nextLimit === 14 ? "" : String(nextLimit),
			imagingQuery: nextQuery,
			imagingOrderedFrom: nextOrderedFrom,
			imagingOrderedTo: nextOrderedTo,
			imagingCreatedFrom: nextCreatedFrom,
			imagingCreatedTo: nextCreatedTo,
			imagingStatus: nextStatusFilters.join(","),
			imagingModality: nextModalityFilters.join(","),
		};

		startTransition(() => {
			setNavigatedQuery(nextQuery);
			setOptimisticQuery(nextQuery);
			setOptimisticPage(nextPage);
			setOptimisticSort(nextSort);
			setOptimisticOrder(nextOrder);
			setOptimisticLimit(nextLimit);
			setOptimisticOrderedFrom(nextOrderedFrom);
			setOptimisticOrderedTo(nextOrderedTo);
			setOptimisticCreatedFrom(nextCreatedFrom);
			setOptimisticCreatedTo(nextCreatedTo);
			setOptimisticStatusFilters(nextStatusFilters);
			setOptimisticModalityFilters(nextModalityFilters);
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

	function handleOrderedAtRangeApply(nextOrderedFrom: string, nextOrderedTo: string) {
		navigateTable({ nextOrderedFrom, nextOrderedTo });
	}

	function handleCreatedAtRangeApply(nextCreatedFrom: string, nextCreatedTo: string) {
		navigateTable({ nextCreatedFrom, nextCreatedTo });
	}

	function handleStatusFiltersChange(nextStatusFilters: ImagingStatusFilter[]) {
		navigateTable({ nextStatusFilters });
	}

	function handleModalityFiltersChange(nextModalityFilters: ImagingModalityFilter[]) {
		navigateTable({ nextModalityFilters });
	}

	function handleFiltersClear() {
		navigateTable({
			nextOrderedFrom: "",
			nextOrderedTo: "",
			nextCreatedFrom: "",
			nextCreatedTo: "",
			nextStatusFilters: [],
			nextModalityFilters: [],
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
		<ImagingTable
			patientId={patientId}
			encounterId={encounterId}
			imagingStudies={imagingStudies}
			page={optimisticPage}
			limit={optimisticLimit}
			totalPages={totalPages}
			query={query}
			sorting={sorting}
			onSortingChange={handleSortingChange}
			orderedFrom={optimisticOrderedFrom}
			orderedTo={optimisticOrderedTo}
			createdFrom={optimisticCreatedFrom}
			createdTo={optimisticCreatedTo}
			statusFilters={optimisticStatusFilters}
			modalityFilters={optimisticModalityFilters}
			isPending={isPending}
			onQueryChange={handleQueryChange}
			onOrderedAtRangeApply={handleOrderedAtRangeApply}
			onCreatedAtRangeApply={handleCreatedAtRangeApply}
			onStatusFiltersChange={handleStatusFiltersChange}
			onModalityFiltersChange={handleModalityFiltersChange}
			onFiltersClear={handleFiltersClear}
			onPreviousPage={handlePreviousPage}
			onNextPage={handleNextPage}
			onLimitChange={handleLimitChange}
		/>
	);
}
