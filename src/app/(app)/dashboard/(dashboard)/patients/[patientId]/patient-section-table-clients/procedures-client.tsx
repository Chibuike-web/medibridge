"use client";

import { ProceduresTable } from "@/features/patients/components/procedures-table";
import { getPatientProceduresTableAction } from "@/features/patients/server/actions";
import type { ProcedureStatusFilter, ProcedureType } from "@/features/patients/types";
import { useDebouncedCallback } from "@/hooks/use-debounced";
import { useOptimistic, useRef, useState, useTransition } from "react";

type SectionTableState<T> = {
	rows: T[];
	page: number;
	limit: number;
	totalPages: number;
};

export function ProceduresClient({
	patientId,
	procedures,
	page,
	limit,
	totalPages,
}: {
	patientId: string;
	procedures: ProcedureType[];
	page: number;
	limit: number;
	totalPages: number;
}) {
	const [tableData, setTableData] = useState<SectionTableState<ProcedureType>>({
		rows: procedures,
		page,
		limit,
		totalPages,
	});
	const [optimisticPage, setOptimisticPage] = useOptimistic(tableData.page);
	const [optimisticLimit, setOptimisticLimit] = useOptimistic(tableData.limit);
	const [query, setQuery] = useState("");
	const [createdFrom, setCreatedFrom] = useState("");
	const [createdTo, setCreatedTo] = useState("");
	const [statusFilters, setStatusFilters] = useState<ProcedureStatusFilter[]>([]);
	const [isPending, startTransition] = useTransition();
	const latestSectionTableRequestIdRef = useRef(0);
	const debouncedSearch = useDebouncedCallback((nextQuery: string) => {
		const sectionTableRequestId = latestSectionTableRequestIdRef.current + 1;
		latestSectionTableRequestIdRef.current = sectionTableRequestId;

		startTransition(async () => {
			setOptimisticPage(1);

			const result = await getPatientProceduresTableAction({
				patientId,
				page: 1,
				limit: tableData.limit,
				query: nextQuery,
				createdFrom,
				createdTo,
				statusFilters,
			});

			if (latestSectionTableRequestIdRef.current !== sectionTableRequestId) {
				return;
			}

			setTableData({
				rows: result.procedures,
				page: result.page,
				limit: result.limit,
				totalPages: result.totalPages,
			});
		});
	}, 300);

	function handleQueryChange(nextQuery: string) {
		setQuery(nextQuery);
		debouncedSearch(nextQuery);
	}

	function handleCreatedAtRangeApply(nextCreatedFrom: string, nextCreatedTo: string) {
		const sectionTableRequestId = latestSectionTableRequestIdRef.current + 1;
		latestSectionTableRequestIdRef.current = sectionTableRequestId;

		setCreatedFrom(nextCreatedFrom);
		setCreatedTo(nextCreatedTo);

		startTransition(async () => {
			setOptimisticPage(1);

			const result = await getPatientProceduresTableAction({
				patientId,
				page: 1,
				limit: tableData.limit,
				query,
				createdFrom: nextCreatedFrom,
				createdTo: nextCreatedTo,
				statusFilters,
			});

			if (latestSectionTableRequestIdRef.current !== sectionTableRequestId) {
				return;
			}

			setTableData({
				rows: result.procedures,
				page: result.page,
				limit: result.limit,
				totalPages: result.totalPages,
			});
		});
	}

	function handleStatusFiltersChange(nextStatusFilters: ProcedureStatusFilter[]) {
		const sectionTableRequestId = latestSectionTableRequestIdRef.current + 1;
		latestSectionTableRequestIdRef.current = sectionTableRequestId;

		setStatusFilters(nextStatusFilters);

		startTransition(async () => {
			setOptimisticPage(1);

			const result = await getPatientProceduresTableAction({
				patientId,
				page: 1,
				limit: tableData.limit,
				query,
				createdFrom,
				createdTo,
				statusFilters: nextStatusFilters,
			});

			if (latestSectionTableRequestIdRef.current !== sectionTableRequestId) {
				return;
			}

			setTableData({
				rows: result.procedures,
				page: result.page,
				limit: result.limit,
				totalPages: result.totalPages,
			});
		});
	}

	function handlePreviousPage() {
		const nextPage = Math.max(tableData.page - 1, 1);
		const sectionTableRequestId = latestSectionTableRequestIdRef.current + 1;
		latestSectionTableRequestIdRef.current = sectionTableRequestId;

		startTransition(async () => {
			setOptimisticPage(nextPage);
			const result = await getPatientProceduresTableAction({
				patientId,
				page: nextPage,
				limit: tableData.limit,
				query,
				createdFrom,
				createdTo,
				statusFilters,
			});

			if (latestSectionTableRequestIdRef.current !== sectionTableRequestId) {
				return;
			}

			setTableData({
				rows: result.procedures,
				page: result.page,
				limit: result.limit,
				totalPages: result.totalPages,
			});
		});
	}

	function handleNextPage() {
		const nextPage = Math.min(tableData.page + 1, tableData.totalPages);
		const sectionTableRequestId = latestSectionTableRequestIdRef.current + 1;
		latestSectionTableRequestIdRef.current = sectionTableRequestId;

		startTransition(async () => {
			setOptimisticPage(nextPage);
			const result = await getPatientProceduresTableAction({
				patientId,
				page: nextPage,
				limit: tableData.limit,
				query,
				createdFrom,
				createdTo,
				statusFilters,
			});

			if (latestSectionTableRequestIdRef.current !== sectionTableRequestId) {
				return;
			}

			setTableData({
				rows: result.procedures,
				page: result.page,
				limit: result.limit,
				totalPages: result.totalPages,
			});
		});
	}

	function handleLimitChange(nextLimit: number) {
		const sectionTableRequestId = latestSectionTableRequestIdRef.current + 1;
		latestSectionTableRequestIdRef.current = sectionTableRequestId;

		startTransition(async () => {
			setOptimisticPage(1);
			setOptimisticLimit(nextLimit);
			const result = await getPatientProceduresTableAction({
				patientId,
				page: 1,
				limit: nextLimit,
				query,
				createdFrom,
				createdTo,
				statusFilters,
			});

			if (latestSectionTableRequestIdRef.current !== sectionTableRequestId) {
				return;
			}

			setTableData({
				rows: result.procedures,
				page: result.page,
				limit: result.limit,
				totalPages: result.totalPages,
			});
		});
	}

	return (
		<ProceduresTable
			procedures={tableData.rows}
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
