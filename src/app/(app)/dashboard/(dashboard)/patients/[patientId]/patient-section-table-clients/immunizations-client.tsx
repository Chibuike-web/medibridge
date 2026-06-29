"use client";

import { ImmunizationsTable } from "@/features/patients/components/immunizations-table";
import { getPatientImmunizationsTableAction } from "@/features/patients/server/actions";
import type { ImmunizationStatusFilter, ImmunizationType } from "@/features/patients/types";
import { useDebouncedCallback } from "@/hooks/use-debounced";
import { useOptimistic, useRef, useState, useTransition } from "react";

type SectionTableState<T> = {
	rows: T[];
	page: number;
	limit: number;
	totalPages: number;
};

export function ImmunizationsClient({
	patientId,
	immunizations,
	page,
	limit,
	totalPages,
}: {
	patientId: string;
	immunizations: ImmunizationType[];
	page: number;
	limit: number;
	totalPages: number;
}) {
	const [tableData, setTableData] = useState<SectionTableState<ImmunizationType>>({
		rows: immunizations,
		page,
		limit,
		totalPages,
	});
	const [optimisticPage, setOptimisticPage] = useOptimistic(tableData.page);
	const [optimisticLimit, setOptimisticLimit] = useOptimistic(tableData.limit);
	const [query, setQuery] = useState("");
	const [createdFrom, setCreatedFrom] = useState("");
	const [createdTo, setCreatedTo] = useState("");
	const [statusFilters, setStatusFilters] = useState<ImmunizationStatusFilter[]>([]);
	const [isPending, startTransition] = useTransition();
	const latestSectionTableRequestIdRef = useRef(0);

	function refreshImmunizationsTable({
		nextPage = 1,
		nextLimit = tableData.limit,
		nextQuery = query,
		nextCreatedFrom = createdFrom,
		nextCreatedTo = createdTo,
		nextStatusFilters = statusFilters,
	}: {
		nextPage?: number;
		nextLimit?: number;
		nextQuery?: string;
		nextCreatedFrom?: string;
		nextCreatedTo?: string;
		nextStatusFilters?: ImmunizationStatusFilter[];
	}) {
		const sectionTableRequestId = latestSectionTableRequestIdRef.current + 1;
		latestSectionTableRequestIdRef.current = sectionTableRequestId;

		startTransition(async () => {
			setOptimisticPage(nextPage);
			setOptimisticLimit(nextLimit);

			const result = await getPatientImmunizationsTableAction({
				patientId,
				page: nextPage,
				limit: nextLimit,
				query: nextQuery,
				createdFrom: nextCreatedFrom,
				createdTo: nextCreatedTo,
				statusFilters: nextStatusFilters,
			});

			if (latestSectionTableRequestIdRef.current !== sectionTableRequestId) {
				return;
			}

			setTableData({
				rows: result.immunizations,
				page: result.page,
				limit: result.limit,
				totalPages: result.totalPages,
			});
		});
	}

	const debouncedSearch = useDebouncedCallback((nextQuery: string) => {
		refreshImmunizationsTable({ nextQuery });
	}, 300);

	function handleQueryChange(nextQuery: string) {
		setQuery(nextQuery);
		debouncedSearch(nextQuery);
	}

	function handlePreviousPage() {
		const nextPage = Math.max(tableData.page - 1, 1);
		refreshImmunizationsTable({ nextPage });
	}

	function handleNextPage() {
		const nextPage = Math.min(tableData.page + 1, tableData.totalPages);
		refreshImmunizationsTable({ nextPage });
	}

	function handleLimitChange(nextLimit: number) {
		refreshImmunizationsTable({ nextLimit });
	}

	function handleCreatedAtRangeApply(nextCreatedFrom: string, nextCreatedTo: string) {
		setCreatedFrom(nextCreatedFrom);
		setCreatedTo(nextCreatedTo);
		refreshImmunizationsTable({ nextCreatedFrom, nextCreatedTo });
	}

	function handleStatusFiltersChange(nextStatusFilters: ImmunizationStatusFilter[]) {
		setStatusFilters(nextStatusFilters);
		refreshImmunizationsTable({ nextStatusFilters });
	}

	return (
		<ImmunizationsTable
			immunizations={tableData.rows}
			page={optimisticPage}
			limit={optimisticLimit}
			totalPages={tableData.totalPages}
			query={query}
			createdFrom={createdFrom}
			createdTo={createdTo}
			statusFilters={statusFilters}
			isPending={isPending}
			onQueryChange={handleQueryChange}
			onCreatedAtRangeApply={handleCreatedAtRangeApply}
			onStatusFiltersChange={handleStatusFiltersChange}
			onPreviousPage={handlePreviousPage}
			onNextPage={handleNextPage}
			onLimitChange={handleLimitChange}
		/>
	);
}
