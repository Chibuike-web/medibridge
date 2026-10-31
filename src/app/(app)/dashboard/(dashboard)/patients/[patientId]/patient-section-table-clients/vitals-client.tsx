"use client";

import { VitalsTable } from "@/features/patients/components/vitals-table";
import { useTableUrlNavigation } from "@/features/patients/components/table-url-navigation";
import type { VitalEncounterOption, VitalType } from "@/features/patients/types";
import { useDebouncedCallback } from "@/hooks/use-debounced";
import { functionalUpdate, type SortingState, type Updater } from "@tanstack/react-table";
import { useOptimistic, useState, useTransition } from "react";

type VitalsClientProps = {
	patientId: string;
	encounterId?: string;
	encounterOptions: VitalEncounterOption[];
	vitals: VitalType[];
	readings: VitalType[];
	page: number;
	limit: number;
	totalPages: number;
	searchQuery?: string;
	sort?: string;
	order?: string;
	recordedFrom?: string;
	recordedTo?: string;
	createdFrom?: string;
	createdTo?: string;
};

type VitalsTableChange = {
	nextPage?: number;
	nextSort?: string;
	nextOrder?: string;
	nextLimit?: number;
	nextQuery?: string;
	nextRecordedFrom?: string;
	nextRecordedTo?: string;
	nextCreatedFrom?: string;
	nextCreatedTo?: string;
};

export function VitalsClient({
	patientId,
	encounterId,
	encounterOptions,
	vitals,
	readings,
	page,
	limit,
	totalPages,
	searchQuery = "",
	sort = "",
	order = "",
	recordedFrom = "",
	recordedTo = "",
	createdFrom = "",
	createdTo = "",
}: VitalsClientProps) {
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
	const [optimisticRecordedFrom, setOptimisticRecordedFrom] = useOptimistic(recordedFrom);
	const [optimisticRecordedTo, setOptimisticRecordedTo] = useOptimistic(recordedTo);
	const [optimisticCreatedFrom, setOptimisticCreatedFrom] = useOptimistic(createdFrom);
	const [optimisticCreatedTo, setOptimisticCreatedTo] = useOptimistic(createdTo);
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
			nextRecordedFrom = optimisticRecordedFrom,
			nextRecordedTo = optimisticRecordedTo,
			nextCreatedFrom = optimisticCreatedFrom,
			nextCreatedTo = optimisticCreatedTo,
		}: VitalsTableChange,
		{ replace = false }: { replace?: boolean } = {},
	) {
		const values = {
			vitalsPage: nextPage === 1 ? "" : String(nextPage),
			vitalsSort: nextSort,
			vitalsOrder: nextSort ? nextOrder : "",
			vitalsLimit: nextLimit === 14 ? "" : String(nextLimit),
			vitalsQuery: nextQuery,
			vitalsRecordedFrom: nextRecordedFrom,
			vitalsRecordedTo: nextRecordedTo,
			vitalsCreatedFrom: nextCreatedFrom,
			vitalsCreatedTo: nextCreatedTo,
		};

		startTransition(() => {
			setNavigatedQuery(nextQuery);
			setOptimisticQuery(nextQuery);
			setOptimisticPage(nextPage);
			setOptimisticSort(nextSort);
			setOptimisticOrder(nextOrder);
			setOptimisticLimit(nextLimit);
			setOptimisticRecordedFrom(nextRecordedFrom);
			setOptimisticRecordedTo(nextRecordedTo);
			setOptimisticCreatedFrom(nextCreatedFrom);
			setOptimisticCreatedTo(nextCreatedTo);
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
		navigateTable({ nextPage: Math.max(optimisticPage - 1, 1) });
	}

	function handleNextPage() {
		navigateTable({ nextPage: Math.min(optimisticPage + 1, totalPages) });
	}

	function handleLimitChange(nextLimit: number) {
		navigateTable({ nextLimit });
	}

	function handleRecordedAtRangeApply(nextRecordedFrom: string, nextRecordedTo: string) {
		navigateTable({ nextRecordedFrom, nextRecordedTo });
	}

	function handleCreatedAtRangeApply(nextCreatedFrom: string, nextCreatedTo: string) {
		navigateTable({ nextCreatedFrom, nextCreatedTo });
	}

	function handleFiltersClear() {
		navigateTable({
			nextRecordedFrom: "",
			nextRecordedTo: "",
			nextCreatedFrom: "",
			nextCreatedTo: "",
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
		<VitalsTable
			patientId={patientId}
			encounterId={encounterId}
			encounterOptions={encounterOptions}
			vitals={vitals}
			readings={readings}
			page={optimisticPage}
			limit={optimisticLimit}
			totalPages={totalPages}
			query={query}
			sorting={sorting}
			onSortingChange={handleSortingChange}
			recordedFrom={optimisticRecordedFrom}
			recordedTo={optimisticRecordedTo}
			createdFrom={optimisticCreatedFrom}
			createdTo={optimisticCreatedTo}
			isPending={isPending}
			onQueryChange={handleQueryChange}
			onRecordedAtRangeApply={handleRecordedAtRangeApply}
			onCreatedAtRangeApply={handleCreatedAtRangeApply}
			onFiltersClear={handleFiltersClear}
			onPreviousPage={handlePreviousPage}
			onNextPage={handleNextPage}
			onLimitChange={handleLimitChange}
		/>
	);
}
