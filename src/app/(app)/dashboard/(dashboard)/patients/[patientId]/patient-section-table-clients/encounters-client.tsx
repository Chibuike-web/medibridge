"use client";

import { EncountersTable } from "@/features/patients/components/encounters-table";
import type {
	EncounterDepartmentFilter,
	EncounterType,
	EncounterTypeFilter,
} from "@/features/patients/types";
import { useDebouncedCallback } from "@/hooks/use-debounced";
import { functionalUpdate, type SortingState, type Updater } from "@tanstack/react-table";
import { useOptimistic, useState, useTransition } from "react";

import type { Route } from "next";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function EncountersClient({
	patientId,
	encounters,
	page,
	limit,
	totalPages,
	searchQuery = "",
	sort = "",
	order = "",
	encounterFrom = "",
	encounterTo = "",
	createdFrom = "",
	createdTo = "",
	encounterTypeFilters = [],
	departmentFilters = [],
}: {
	patientId: string;
	encounters: EncounterType[];
	page: number;
	limit: number;
	totalPages: number;
	searchQuery?: string;
	sort?: string;
	order?: string;
	encounterFrom?: string;
	encounterTo?: string;
	createdFrom?: string;
	createdTo?: string;
	encounterTypeFilters?: EncounterTypeFilter[];
	departmentFilters?: EncounterDepartmentFilter[];
}) {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
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
	const [optimisticEncounterFrom, setOptimisticEncounterFrom] = useOptimistic(encounterFrom);
	const [optimisticEncounterTo, setOptimisticEncounterTo] = useOptimistic(encounterTo);
	const [optimisticCreatedFrom, setOptimisticCreatedFrom] = useOptimistic(createdFrom);
	const [optimisticCreatedTo, setOptimisticCreatedTo] = useOptimistic(createdTo);
	const [optimisticEncounterTypeFilters, setOptimisticEncounterTypeFilters] =
		useOptimistic(encounterTypeFilters);
	const [optimisticDepartmentFilters, setOptimisticDepartmentFilters] =
		useOptimistic(departmentFilters);
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
			nextEncounterFrom = optimisticEncounterFrom,
			nextEncounterTo = optimisticEncounterTo,
			nextCreatedFrom = optimisticCreatedFrom,
			nextCreatedTo = optimisticCreatedTo,
			nextEncounterTypeFilters = optimisticEncounterTypeFilters,
			nextDepartmentFilters = optimisticDepartmentFilters,
		}: {
			nextPage?: number;
	nextSort?: string;
	nextOrder?: string;
			nextLimit?: number;
			nextQuery?: string;
			nextEncounterFrom?: string;
			nextEncounterTo?: string;
			nextCreatedFrom?: string;
			nextCreatedTo?: string;
			nextEncounterTypeFilters?: EncounterTypeFilter[];
			nextDepartmentFilters?: EncounterDepartmentFilter[];
		},
		replace = false,
	) {
		const params = new URLSearchParams(searchParams.toString());
		const values = {
			encountersPage: nextPage === 1 ? "" : String(nextPage),
			encountersSort: nextSort,
			encountersOrder: nextSort ? nextOrder : "",
			encountersLimit: nextLimit === 14 ? "" : String(nextLimit),
			encountersQuery: nextQuery,
			encountersEncounterFrom: nextEncounterFrom,
			encountersEncounterTo: nextEncounterTo,
			encountersCreatedFrom: nextCreatedFrom,
			encountersCreatedTo: nextCreatedTo,
			encountersType: nextEncounterTypeFilters.join(","),
			encountersDepartment: nextDepartmentFilters.join(","),
		};
		Object.entries(values).forEach(([name, value]) => {
			if (value.trim() === "") params.delete(name);
			else params.set(name, value);
		});

		startTransition(() => {
			setNavigatedQuery(nextQuery);
			setOptimisticQuery(nextQuery);
			setOptimisticPage(nextPage);
			setOptimisticSort(nextSort);
			setOptimisticOrder(nextOrder);
			setOptimisticLimit(nextLimit);
			setOptimisticEncounterFrom(nextEncounterFrom);
			setOptimisticEncounterTo(nextEncounterTo);
			setOptimisticCreatedFrom(nextCreatedFrom);
			setOptimisticCreatedTo(nextCreatedTo);
			setOptimisticEncounterTypeFilters(nextEncounterTypeFilters);
			setOptimisticDepartmentFilters(nextDepartmentFilters);
			const href = `${pathname}?${params}` as Route;
			if (replace) router.replace(href, { scroll: false });
			else router.push(href, { scroll: false });
		});
	}

	const debouncedSearch = useDebouncedCallback((nextQuery: string) => {
		if (nextQuery !== query || nextQuery === optimisticQuery) return;
		navigateTable({ nextQuery }, true);
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

	function handleEncounterDateRangeApply(nextEncounterFrom: string, nextEncounterTo: string) {
		navigateTable({ nextEncounterFrom, nextEncounterTo });
	}

	function handleCreatedAtRangeApply(nextCreatedFrom: string, nextCreatedTo: string) {
		navigateTable({ nextCreatedFrom, nextCreatedTo });
	}

	function handleEncounterTypeFiltersChange(nextEncounterTypeFilters: EncounterTypeFilter[]) {
		navigateTable({ nextEncounterTypeFilters });
	}

	function handleDepartmentFiltersChange(nextDepartmentFilters: EncounterDepartmentFilter[]) {
		navigateTable({ nextDepartmentFilters });
	}

	function handleFiltersClear() {
		navigateTable({
			nextEncounterFrom: "",
			nextEncounterTo: "",
			nextCreatedFrom: "",
			nextCreatedTo: "",
			nextEncounterTypeFilters: [],
			nextDepartmentFilters: [],
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
		<EncountersTable
			patientId={patientId}
			encounters={encounters}
			page={optimisticPage}
			limit={optimisticLimit}
			totalPages={totalPages}
			query={query}
			sorting={sorting}
			onSortingChange={handleSortingChange}
			encounterFrom={optimisticEncounterFrom}
			encounterTo={optimisticEncounterTo}
			createdFrom={optimisticCreatedFrom}
			createdTo={optimisticCreatedTo}
			encounterTypeFilters={optimisticEncounterTypeFilters}
			departmentFilters={optimisticDepartmentFilters}
			isPending={isPending}
			onQueryChange={handleQueryChange}
			onEncounterDateRangeApply={handleEncounterDateRangeApply}
			onCreatedAtRangeApply={handleCreatedAtRangeApply}
			onEncounterTypeFiltersChange={handleEncounterTypeFiltersChange}
			onDepartmentFiltersChange={handleDepartmentFiltersChange}
			onFiltersClear={handleFiltersClear}
			onPreviousPage={handlePreviousPage}
			onNextPage={handleNextPage}
			onLimitChange={handleLimitChange}
		/>
	);
}
