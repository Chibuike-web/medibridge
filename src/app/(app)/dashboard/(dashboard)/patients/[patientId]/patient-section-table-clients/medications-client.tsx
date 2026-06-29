"use client";

import { MedicationsTable } from "@/features/patients/components/medications-table";
import { getPatientMedicationsTableAction } from "@/features/patients/server/actions";
import type { MedicationStatusFilter, MedicationType } from "@/features/patients/types";
import { useDebouncedCallback } from "@/hooks/use-debounced";
import { useOptimistic, useRef, useState, useTransition } from "react";

type SectionTableState<T> = {
	rows: T[];
	page: number;
	limit: number;
	totalPages: number;
};

export function MedicationsClient({
	patientId,
	medications,
	page,
	limit,
	totalPages,
}: {
	patientId: string;
	medications: MedicationType[];
	page: number;
	limit: number;
	totalPages: number;
}) {
	const [tableData, setTableData] = useState<SectionTableState<MedicationType>>({
		rows: medications,
		page,
		limit,
		totalPages,
	});
	const [optimisticPage, setOptimisticPage] = useOptimistic(tableData.page);
	const [optimisticLimit, setOptimisticLimit] = useOptimistic(tableData.limit);
	const [query, setQuery] = useState("");
	const [createdFrom, setCreatedFrom] = useState("");
	const [createdTo, setCreatedTo] = useState("");
	const [statusFilter, setStatusFilter] = useState<MedicationStatusFilter>("");
	const [isPending, startTransition] = useTransition();
	const latestSectionTableRequestIdRef = useRef(0);
	const debouncedSearch = useDebouncedCallback((nextQuery: string) => {
		const sectionTableRequestId = latestSectionTableRequestIdRef.current + 1;
		latestSectionTableRequestIdRef.current = sectionTableRequestId;

		startTransition(async () => {
			setOptimisticPage(1);

			const result = await getPatientMedicationsTableAction({
				patientId,
				page: 1,
					limit: tableData.limit,
					query: nextQuery,
					createdFrom,
					createdTo,
					statusFilter,
				});

			if (latestSectionTableRequestIdRef.current !== sectionTableRequestId) {
				return;
			}

			setTableData({
				rows: result.medications,
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

			const result = await getPatientMedicationsTableAction({
				patientId,
				page: 1,
				limit: tableData.limit,
				query,
				createdFrom: nextCreatedFrom,
				createdTo: nextCreatedTo,
				statusFilter,
			});

			if (latestSectionTableRequestIdRef.current !== sectionTableRequestId) {
				return;
			}

			setTableData({
				rows: result.medications,
				page: result.page,
				limit: result.limit,
				totalPages: result.totalPages,
			});
		});
	}

	function handleStatusFilterChange(nextStatusFilter: MedicationStatusFilter) {
		const sectionTableRequestId = latestSectionTableRequestIdRef.current + 1;
		latestSectionTableRequestIdRef.current = sectionTableRequestId;

		setStatusFilter(nextStatusFilter);

		startTransition(async () => {
			setOptimisticPage(1);

			const result = await getPatientMedicationsTableAction({
				patientId,
				page: 1,
				limit: tableData.limit,
				query,
				createdFrom,
				createdTo,
				statusFilter: nextStatusFilter,
			});

			if (latestSectionTableRequestIdRef.current !== sectionTableRequestId) {
				return;
			}

			setTableData({
				rows: result.medications,
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
			const result = await getPatientMedicationsTableAction({
				patientId,
				page: nextPage,
					limit: tableData.limit,
					query,
					createdFrom,
					createdTo,
					statusFilter,
				});

			if (latestSectionTableRequestIdRef.current !== sectionTableRequestId) {
				return;
			}

			setTableData({
				rows: result.medications,
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
			const result = await getPatientMedicationsTableAction({
				patientId,
				page: nextPage,
					limit: tableData.limit,
					query,
					createdFrom,
					createdTo,
					statusFilter,
				});

			if (latestSectionTableRequestIdRef.current !== sectionTableRequestId) {
				return;
			}

			setTableData({
				rows: result.medications,
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
			const result = await getPatientMedicationsTableAction({
				patientId,
				page: 1,
					limit: nextLimit,
					query,
					createdFrom,
					createdTo,
					statusFilter,
				});

			if (latestSectionTableRequestIdRef.current !== sectionTableRequestId) {
				return;
			}

			setTableData({
				rows: result.medications,
				page: result.page,
				limit: result.limit,
				totalPages: result.totalPages,
			});
		});
	}

	return (
		<MedicationsTable
			medications={tableData.rows}
			page={optimisticPage}
			limit={optimisticLimit}
				totalPages={tableData.totalPages}
				query={query}
				createdFrom={createdFrom}
				createdTo={createdTo}
				statusFilter={statusFilter}
				isPending={isPending}
				onQueryChange={handleQueryChange}
				onCreatedAtRangeApply={handleCreatedAtRangeApply}
				onStatusFilterChange={handleStatusFilterChange}
				onPreviousPage={handlePreviousPage}
			onNextPage={handleNextPage}
			onLimitChange={handleLimitChange}
		/>
	);
}
