"use client";

import { VitalsTable } from "@/features/patients/components/vitals-table";
import { useTableUrlNavigation } from "@/features/patients/components/table-url-navigation";
import type { VitalEncounterOption, VitalType } from "@/features/patients/types";
import { useDebouncedCallback } from "@/hooks/use-debounced";
import { useOptimistic, useState, useTransition } from "react";

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
	recordedFrom = "",
	recordedTo = "",
	createdFrom = "",
	createdTo = "",
}: {
	patientId: string;
	encounterId?: string;
	encounterOptions: VitalEncounterOption[];
	vitals: VitalType[];
	readings: VitalType[];
	page: number;
	limit: number;
	totalPages: number;
	searchQuery?: string;
	recordedFrom?: string;
	recordedTo?: string;
	createdFrom?: string;
	createdTo?: string;
}) {
	const navigateTableUrl = useTableUrlNavigation();
	const [optimisticPage, setOptimisticPage] = useOptimistic(page);
	const [optimisticLimit, setOptimisticLimit] = useOptimistic(limit);
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
			nextLimit = optimisticLimit,
			nextQuery = query,
			nextRecordedFrom = optimisticRecordedFrom,
			nextRecordedTo = optimisticRecordedTo,
			nextCreatedFrom = optimisticCreatedFrom,
			nextCreatedTo = optimisticCreatedTo,
		}: {
			nextPage?: number;
			nextLimit?: number;
			nextQuery?: string;
			nextRecordedFrom?: string;
			nextRecordedTo?: string;
			nextCreatedFrom?: string;
			nextCreatedTo?: string;
		},
		{ replace = false }: { replace?: boolean } = {},
	) {
		const values = {
			vitalsPage: nextPage === 1 ? "" : String(nextPage),
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
