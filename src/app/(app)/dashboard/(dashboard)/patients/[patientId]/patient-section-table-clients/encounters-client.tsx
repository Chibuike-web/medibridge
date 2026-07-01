"use client";

import { EncountersTable } from "@/features/patients/components/encounters-table";
import { getPatientEncountersTableAction } from "@/features/patients/server/actions";
import type {
	EncounterDepartmentFilter,
	EncounterType,
	EncounterTypeFilter,
} from "@/features/patients/types";
import { useDebouncedCallback } from "@/hooks/use-debounced";
import { useOptimistic, useRef, useState, useTransition } from "react";

type SectionTableState<T> = {
	rows: T[];
	page: number;
	limit: number;
	totalPages: number;
};

export function EncountersClient({
	patientId,
	encounters,
	page,
	limit,
	totalPages,
}: {
	patientId: string;
	encounters: EncounterType[];
	page: number;
	limit: number;
	totalPages: number;
}) {
	const [tableData, setTableData] = useState<SectionTableState<EncounterType>>({
		rows: encounters,
		page,
		limit,
		totalPages,
	});
	const [optimisticPage, setOptimisticPage] = useOptimistic(tableData.page);
	const [optimisticLimit, setOptimisticLimit] = useOptimistic(tableData.limit);
	const [query, setQuery] = useState("");
	const [encounterFrom, setEncounterFrom] = useState("");
	const [encounterTo, setEncounterTo] = useState("");
	const [createdFrom, setCreatedFrom] = useState("");
	const [createdTo, setCreatedTo] = useState("");
	const [encounterTypeFilters, setEncounterTypeFilters] = useState<EncounterTypeFilter[]>([]);
	const [departmentFilters, setDepartmentFilters] = useState<EncounterDepartmentFilter[]>([]);
	const [isPending, startTransition] = useTransition();
	const latestSectionTableRequestIdRef = useRef(0);

	function refreshEncountersTable({
		nextPage = 1,
		nextLimit = tableData.limit,
		nextQuery = query,
		nextEncounterFrom = encounterFrom,
		nextEncounterTo = encounterTo,
		nextCreatedFrom = createdFrom,
		nextCreatedTo = createdTo,
		nextEncounterTypeFilters = encounterTypeFilters,
		nextDepartmentFilters = departmentFilters,
	}: {
		nextPage?: number;
		nextLimit?: number;
		nextQuery?: string;
		nextEncounterFrom?: string;
		nextEncounterTo?: string;
		nextCreatedFrom?: string;
		nextCreatedTo?: string;
		nextEncounterTypeFilters?: EncounterTypeFilter[];
		nextDepartmentFilters?: EncounterDepartmentFilter[];
	}) {
		const sectionTableRequestId = latestSectionTableRequestIdRef.current + 1;
		latestSectionTableRequestIdRef.current = sectionTableRequestId;

		startTransition(async () => {
			setOptimisticPage(nextPage);
			setOptimisticLimit(nextLimit);

			const result = await getPatientEncountersTableAction({
				patientId,
				page: nextPage,
				limit: nextLimit,
				query: nextQuery,
				encounterFrom: nextEncounterFrom,
				encounterTo: nextEncounterTo,
				createdFrom: nextCreatedFrom,
				createdTo: nextCreatedTo,
				encounterTypeFilters: nextEncounterTypeFilters,
				departmentFilters: nextDepartmentFilters,
			});

			if (latestSectionTableRequestIdRef.current !== sectionTableRequestId) {
				return;
			}

			setTableData({
				rows: result.encounters,
				page: result.page,
				limit: result.limit,
				totalPages: result.totalPages,
			});
		});
	}
	const debouncedSearch = useDebouncedCallback((nextQuery: string) => {
		refreshEncountersTable({ nextQuery });
	}, 300);

	function handleQueryChange(nextQuery: string) {
		setQuery(nextQuery);
		debouncedSearch(nextQuery);
	}

	function handlePreviousPage() {
		const nextPage = Math.max(tableData.page - 1, 1);
		refreshEncountersTable({ nextPage });
	}

	function handleNextPage() {
		const nextPage = Math.min(tableData.page + 1, tableData.totalPages);
		refreshEncountersTable({ nextPage });
	}

	function handleLimitChange(nextLimit: number) {
		refreshEncountersTable({ nextLimit });
	}

	function handleEncounterDateRangeApply(nextEncounterFrom: string, nextEncounterTo: string) {
		setEncounterFrom(nextEncounterFrom);
		setEncounterTo(nextEncounterTo);
		refreshEncountersTable({ nextEncounterFrom, nextEncounterTo });
	}

	function handleCreatedAtRangeApply(nextCreatedFrom: string, nextCreatedTo: string) {
		setCreatedFrom(nextCreatedFrom);
		setCreatedTo(nextCreatedTo);
		refreshEncountersTable({ nextCreatedFrom, nextCreatedTo });
	}

	function handleEncounterTypeFiltersChange(nextEncounterTypeFilters: EncounterTypeFilter[]) {
		setEncounterTypeFilters(nextEncounterTypeFilters);
		refreshEncountersTable({ nextEncounterTypeFilters });
	}

	function handleDepartmentFiltersChange(nextDepartmentFilters: EncounterDepartmentFilter[]) {
		setDepartmentFilters(nextDepartmentFilters);
		refreshEncountersTable({ nextDepartmentFilters });
	}

	return (
		<EncountersTable
			patientId={patientId}
			encounters={tableData.rows}
			page={optimisticPage}
			limit={optimisticLimit}
			totalPages={tableData.totalPages}
			query={query}
			encounterFrom={encounterFrom}
			encounterTo={encounterTo}
			createdFrom={createdFrom}
			createdTo={createdTo}
			encounterTypeFilters={encounterTypeFilters}
			departmentFilters={departmentFilters}
			isPending={isPending}
			onQueryChange={handleQueryChange}
			onEncounterDateRangeApply={handleEncounterDateRangeApply}
			onCreatedAtRangeApply={handleCreatedAtRangeApply}
			onEncounterTypeFiltersChange={handleEncounterTypeFiltersChange}
			onDepartmentFiltersChange={handleDepartmentFiltersChange}
			onPreviousPage={handlePreviousPage}
			onNextPage={handleNextPage}
			onLimitChange={handleLimitChange}
		/>
	);
}
