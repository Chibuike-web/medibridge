"use client";

import { LabTestsTable } from "@/features/patients/components/lab-tests-table";
import { getPatientLabTestsTableAction } from "@/features/patients/server/actions";
import type {
	LabTestFlagFilter,
	LabTestStatusFilter,
	LabTestType,
} from "@/features/patients/types";
import { useDebouncedCallback } from "@/hooks/use-debounced";
import { useOptimistic, useRef, useState, useTransition } from "react";

type SectionTableState<T> = {
	rows: T[];
	page: number;
	limit: number;
	totalPages: number;
};

export function LabTestsClient({
	patientId,
	labTests,
	page,
	limit,
	totalPages,
}: {
	patientId: string;
	labTests: LabTestType[];
	page: number;
	limit: number;
	totalPages: number;
}) {
	const [tableData, setTableData] = useState<SectionTableState<LabTestType>>({
		rows: labTests,
		page,
		limit,
		totalPages,
	});
	const [optimisticPage, setOptimisticPage] = useOptimistic(tableData.page);
	const [optimisticLimit, setOptimisticLimit] = useOptimistic(tableData.limit);
	const [query, setQuery] = useState("");
	const [createdFrom, setCreatedFrom] = useState("");
	const [createdTo, setCreatedTo] = useState("");
	const [statusFilters, setStatusFilters] = useState<LabTestStatusFilter[]>([]);
	const [flagFilters, setFlagFilters] = useState<LabTestFlagFilter[]>([]);
	const [isPending, startTransition] = useTransition();
	const latestSectionTableRequestIdRef = useRef(0);

	function refreshLabTestsTable({
		nextPage = 1,
		nextLimit = tableData.limit,
		nextQuery = query,
		nextCreatedFrom = createdFrom,
		nextCreatedTo = createdTo,
		nextStatusFilters = statusFilters,
		nextFlagFilters = flagFilters,
	}: {
		nextPage?: number;
		nextLimit?: number;
		nextQuery?: string;
		nextCreatedFrom?: string;
		nextCreatedTo?: string;
		nextStatusFilters?: LabTestStatusFilter[];
		nextFlagFilters?: LabTestFlagFilter[];
	}) {
		const sectionTableRequestId = latestSectionTableRequestIdRef.current + 1;
		latestSectionTableRequestIdRef.current = sectionTableRequestId;

		startTransition(async () => {
			setOptimisticPage(nextPage);
			setOptimisticLimit(nextLimit);

			const result = await getPatientLabTestsTableAction({
				patientId,
				page: nextPage,
				limit: nextLimit,
				query: nextQuery,
				createdFrom: nextCreatedFrom,
				createdTo: nextCreatedTo,
				statusFilters: nextStatusFilters,
				flagFilters: nextFlagFilters,
			});

			if (latestSectionTableRequestIdRef.current !== sectionTableRequestId) {
				return;
			}

			setTableData({
				rows: result.labTests,
				page: result.page,
				limit: result.limit,
				totalPages: result.totalPages,
			});
		});
	}

	const debouncedSearch = useDebouncedCallback((nextQuery: string) => {
		refreshLabTestsTable({ nextQuery });
	}, 300);

	function handleQueryChange(nextQuery: string) {
		setQuery(nextQuery);
		debouncedSearch(nextQuery);
	}

	function handlePreviousPage() {
		const nextPage = Math.max(tableData.page - 1, 1);
		refreshLabTestsTable({ nextPage });
	}

	function handleNextPage() {
		const nextPage = Math.min(tableData.page + 1, tableData.totalPages);
		refreshLabTestsTable({ nextPage });
	}

	function handleLimitChange(nextLimit: number) {
		refreshLabTestsTable({ nextLimit });
	}

	function handleCreatedAtRangeApply(nextCreatedFrom: string, nextCreatedTo: string) {
		setCreatedFrom(nextCreatedFrom);
		setCreatedTo(nextCreatedTo);
		refreshLabTestsTable({ nextCreatedFrom, nextCreatedTo });
	}

	function handleStatusFiltersChange(nextStatusFilters: LabTestStatusFilter[]) {
		setStatusFilters(nextStatusFilters);
		refreshLabTestsTable({ nextStatusFilters });
	}

	function handleFlagFiltersChange(nextFlagFilters: LabTestFlagFilter[]) {
		setFlagFilters(nextFlagFilters);
		refreshLabTestsTable({ nextFlagFilters });
	}

	return (
		<LabTestsTable
			patientId={patientId}
			labTests={tableData.rows}
			page={optimisticPage}
			limit={optimisticLimit}
			totalPages={tableData.totalPages}
				query={query}
				createdFrom={createdFrom}
				createdTo={createdTo}
				statusFilters={statusFilters}
				flagFilters={flagFilters}
				isPending={isPending}
				onQueryChange={handleQueryChange}
				onCreatedAtRangeApply={handleCreatedAtRangeApply}
				onStatusFiltersChange={handleStatusFiltersChange}
				onFlagFiltersChange={handleFlagFiltersChange}
				onPreviousPage={handlePreviousPage}
			onNextPage={handleNextPage}
			onLimitChange={handleLimitChange}
		/>
	);
}
