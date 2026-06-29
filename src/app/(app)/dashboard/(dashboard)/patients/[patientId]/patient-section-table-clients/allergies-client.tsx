"use client";

import { AllergiesTable } from "@/features/patients/components/allergies-table";
import { getPatientAllergiesTableAction } from "@/features/patients/server/actions";
import type {
	AllergySeverityFilter,
	AllergyStatusFilter,
	AllergyType,
} from "@/features/patients/types";
import { useDebouncedCallback } from "@/hooks/use-debounced";
import { useOptimistic, useRef, useState, useTransition } from "react";

type SectionTableState<T> = {
	rows: T[];
	page: number;
	limit: number;
	totalPages: number;
};

export function AllergiesClient({
	patientId,
	allergies,
	page,
	limit,
	totalPages,
}: {
	patientId: string;
	allergies: AllergyType[];
	page: number;
	limit: number;
	totalPages: number;
}) {
	const [tableData, setTableData] = useState<SectionTableState<AllergyType>>({
		rows: allergies,
		page,
		limit,
		totalPages,
	});
	const [optimisticPage, setOptimisticPage] = useOptimistic(tableData.page);
	const [optimisticLimit, setOptimisticLimit] = useOptimistic(tableData.limit);
	const [query, setQuery] = useState("");
	const [createdFrom, setCreatedFrom] = useState("");
	const [createdTo, setCreatedTo] = useState("");
	const [statusFilter, setStatusFilter] = useState<AllergyStatusFilter>("");
	const [severityFilters, setSeverityFilters] = useState<AllergySeverityFilter[]>([]);
	const [isPending, startTransition] = useTransition();
	const latestSectionTableRequestIdRef = useRef(0);

	function refreshAllergiesTable({
		nextPage = 1,
		nextLimit = tableData.limit,
		nextQuery = query,
		nextCreatedFrom = createdFrom,
		nextCreatedTo = createdTo,
		nextStatusFilter = statusFilter,
		nextSeverityFilters = severityFilters,
	}: {
		nextPage?: number;
		nextLimit?: number;
		nextQuery?: string;
		nextCreatedFrom?: string;
		nextCreatedTo?: string;
		nextStatusFilter?: AllergyStatusFilter;
		nextSeverityFilters?: AllergySeverityFilter[];
	}) {
		const sectionTableRequestId = latestSectionTableRequestIdRef.current + 1;
		latestSectionTableRequestIdRef.current = sectionTableRequestId;

		startTransition(async () => {
			setOptimisticPage(nextPage);
			setOptimisticLimit(nextLimit);

			const result = await getPatientAllergiesTableAction({
				patientId,
				page: nextPage,
				limit: nextLimit,
				query: nextQuery,
				createdFrom: nextCreatedFrom,
				createdTo: nextCreatedTo,
				statusFilter: nextStatusFilter,
				severityFilters: nextSeverityFilters,
			});

			if (latestSectionTableRequestIdRef.current !== sectionTableRequestId) {
				return;
			}

			setTableData({
				rows: result.allergies,
				page: result.page,
				limit: result.limit,
				totalPages: result.totalPages,
			});
		});
	}

	const debouncedSearch = useDebouncedCallback((nextQuery: string) => {
		refreshAllergiesTable({ nextQuery });
	}, 300);

	function handleQueryChange(nextQuery: string) {
		setQuery(nextQuery);
		debouncedSearch(nextQuery);
	}

	function handlePreviousPage() {
		const nextPage = Math.max(tableData.page - 1, 1);
		refreshAllergiesTable({ nextPage });
	}

	function handleNextPage() {
		const nextPage = Math.min(tableData.page + 1, tableData.totalPages);
		refreshAllergiesTable({ nextPage });
	}

	function handleLimitChange(nextLimit: number) {
		refreshAllergiesTable({ nextLimit });
	}

	function handleCreatedAtRangeApply(nextCreatedFrom: string, nextCreatedTo: string) {
		setCreatedFrom(nextCreatedFrom);
		setCreatedTo(nextCreatedTo);
		refreshAllergiesTable({ nextCreatedFrom, nextCreatedTo });
	}

	function handleStatusFiltersChange(nextStatusFilter: AllergyStatusFilter) {
		setStatusFilter(nextStatusFilter);
		refreshAllergiesTable({ nextStatusFilter });
	}
	function handleSeverityFiltersChange(nextSeverityFilters: AllergySeverityFilter[]) {
		setSeverityFilters(nextSeverityFilters);
		refreshAllergiesTable({ nextSeverityFilters });
	}

	return (
		<AllergiesTable
			allergies={tableData.rows}
			page={optimisticPage}
			limit={optimisticLimit}
			totalPages={tableData.totalPages}
			query={query}
			createdFrom={createdFrom}
			createdTo={createdTo}
			statusFilter={statusFilter}
			severityFilters={severityFilters}
			isPending={isPending}
			onQueryChange={handleQueryChange}
			onCreatedAtRangeApply={handleCreatedAtRangeApply}
			onStatusFilterChange={handleStatusFiltersChange}
			onSeverityFiltersChange={handleSeverityFiltersChange}
			onPreviousPage={handlePreviousPage}
			onNextPage={handleNextPage}
			onLimitChange={handleLimitChange}
		/>
	);
}
