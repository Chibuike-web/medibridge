"use client";

import { ProceduresTable } from "@/features/patients/components/procedures-table";
import type { ProcedureStatusFilter, ProcedureType } from "@/features/patients/types";
import { useDebouncedCallback } from "@/hooks/use-debounced";
import { useContext, useOptimistic, useState, useTransition } from "react";

import type { Route } from "next";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { EncounterTableNavigationContext } from "./encounter-table-navigation";

export function ProceduresClient({
	patientId,
	encounterId,
	procedures,
	page,
	limit,
	totalPages,
	searchQuery = "",
	createdFrom = "",
	createdTo = "",
	statusFilters = [],
}: {
	patientId: string;
	encounterId?: string;
	procedures: ProcedureType[];
	page: number;
	limit: number;
	totalPages: number;
	searchQuery?: string;
	createdFrom?: string;
	createdTo?: string;
	statusFilters?: ProcedureStatusFilter[];
}) {
	const router = useRouter();
	const navigateEncounterTable = useContext(EncounterTableNavigationContext);
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const [optimisticPage, setOptimisticPage] = useOptimistic(page);
	const [optimisticLimit, setOptimisticLimit] = useOptimistic(limit);
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
			nextLimit = optimisticLimit,
			nextQuery = query,
			nextCreatedFrom = optimisticCreatedFrom,
			nextCreatedTo = optimisticCreatedTo,
			nextStatusFilters = optimisticStatusFilters,
		}: {
			nextPage?: number;
			nextLimit?: number;
			nextQuery?: string;
			nextCreatedFrom?: string;
			nextCreatedTo?: string;
			nextStatusFilters?: ProcedureStatusFilter[];
		},
		replace = false,
	) {
		const params = new URLSearchParams(searchParams.toString());
		const values = {
			proceduresPage: nextPage === 1 ? "" : String(nextPage),
			proceduresLimit: nextLimit === 14 ? "" : String(nextLimit),
			proceduresQuery: nextQuery,
			proceduresCreatedFrom: nextCreatedFrom,
			proceduresCreatedTo: nextCreatedTo,
			proceduresStatus: nextStatusFilters.join(","),
		};
		Object.entries(values).forEach(([name, value]) => {
			if (value.trim() === "") params.delete(name);
			else params.set(name, value);
		});

		startTransition(() => {
			setNavigatedQuery(nextQuery);
			setOptimisticQuery(nextQuery);
			setOptimisticPage(nextPage);
			setOptimisticLimit(nextLimit);
			setOptimisticCreatedFrom(nextCreatedFrom);
			setOptimisticCreatedTo(nextCreatedTo);
			setOptimisticStatusFilters(nextStatusFilters);
			if (navigateEncounterTable) {
				navigateEncounterTable(values, replace);
				return;
			}
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

	function handleCreatedAtRangeApply(nextCreatedFrom: string, nextCreatedTo: string) {
		navigateTable({ nextCreatedFrom, nextCreatedTo });
	}

	function handleStatusFiltersChange(nextStatusFilters: ProcedureStatusFilter[]) {
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

	return (
		<ProceduresTable
			patientId={patientId}
			encounterId={encounterId}
			procedures={procedures}
			page={optimisticPage}
			limit={optimisticLimit}
			totalPages={totalPages}
			query={query}
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
