"use client";

import { ImagingTable } from "@/features/patients/components/imaging-table";
import type {
	ImagingModalityFilter,
	ImagingStatusFilter,
	ImagingType,
} from "@/features/patients/types";
import { useDebouncedCallback } from "@/hooks/use-debounced";
import { useOptimistic, useState, useTransition } from "react";

import type { Route } from "next";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function ImagingClient({
	patientId,
	encounterId,
	imagingStudies,
	page,
	limit,
	totalPages,
	searchQuery = "",
	orderedFrom = "",
	orderedTo = "",
	createdFrom = "",
	createdTo = "",
	statusFilters = [],
	modalityFilters = [],
}: {
	patientId: string;
	encounterId?: string;
	imagingStudies: ImagingType[];
	page: number;
	limit: number;
	totalPages: number;
	searchQuery?: string;
	orderedFrom?: string;
	orderedTo?: string;
	createdFrom?: string;
	createdTo?: string;
	statusFilters?: ImagingStatusFilter[];
	modalityFilters?: ImagingModalityFilter[];
}) {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const [optimisticPage, setOptimisticPage] = useOptimistic(page);
	const [optimisticLimit, setOptimisticLimit] = useOptimistic(limit);
	const [query, setQuery] = useState(searchQuery);
	const [previousSearchQuery, setPreviousSearchQuery] = useState(searchQuery);
	const [navigatedQuery, setNavigatedQuery] = useState(searchQuery);
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
		if (searchQuery !== navigatedQuery) setQuery(searchQuery);
	}

	function navigateTable(
		{
			nextPage = 1,
			nextLimit = optimisticLimit,
			nextQuery = query,
			nextOrderedFrom = optimisticOrderedFrom,
			nextOrderedTo = optimisticOrderedTo,
			nextCreatedFrom = optimisticCreatedFrom,
			nextCreatedTo = optimisticCreatedTo,
			nextStatusFilters = optimisticStatusFilters,
			nextModalityFilters = optimisticModalityFilters,
		}: {
			nextPage?: number;
			nextLimit?: number;
			nextQuery?: string;
			nextOrderedFrom?: string;
			nextOrderedTo?: string;
			nextCreatedFrom?: string;
			nextCreatedTo?: string;
			nextStatusFilters?: ImagingStatusFilter[];
			nextModalityFilters?: ImagingModalityFilter[];
		},
		replace = false,
	) {
		const params = new URLSearchParams(searchParams.toString());
		const values = {
			imagingPage: String(nextPage),
			imagingLimit: String(nextLimit),
			imagingQuery: nextQuery,
			imagingOrderedFrom: nextOrderedFrom,
			imagingOrderedTo: nextOrderedTo,
			imagingCreatedFrom: nextCreatedFrom,
			imagingCreatedTo: nextCreatedTo,
			imagingStatus: nextStatusFilters.join(","),
			imagingModality: nextModalityFilters.join(","),
		};
		Object.entries(values).forEach(([name, value]) => {
			if (value.trim() === "") params.delete(name);
			else params.set(name, value);
		});

		startTransition(() => {
			setNavigatedQuery(nextQuery);
			setOptimisticPage(nextPage);
			setOptimisticLimit(nextLimit);
			setOptimisticOrderedFrom(nextOrderedFrom);
			setOptimisticOrderedTo(nextOrderedTo);
			setOptimisticCreatedFrom(nextCreatedFrom);
			setOptimisticCreatedTo(nextCreatedTo);
			setOptimisticStatusFilters(nextStatusFilters);
			setOptimisticModalityFilters(nextModalityFilters);
			const href = `${pathname}?${params}` as Route;
			if (replace) router.replace(href, { scroll: false });
			else router.push(href, { scroll: false });
		});
	}

	const debouncedSearch = useDebouncedCallback((nextQuery: string) => {
		if (nextQuery !== query || nextQuery === searchQuery) return;
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

	return (
		<ImagingTable
			patientId={patientId}
			encounterId={encounterId}
			imagingStudies={imagingStudies}
			page={optimisticPage}
			limit={optimisticLimit}
			totalPages={totalPages}
			query={query}
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
