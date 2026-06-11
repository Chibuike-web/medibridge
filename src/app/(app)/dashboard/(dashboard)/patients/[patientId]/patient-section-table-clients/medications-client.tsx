"use client";

import { MedicationsTable } from "@/features/patients/components/medications-table";
import { getPatientMedicationsTableAction } from "@/features/patients/server/actions";
import type { MedicationType } from "@/features/patients/types";
import { useDebouncedCallback } from "@/hooks/use-debounced";
import { useOptimistic, useState, useTransition } from "react";

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
	const [isPending, startTransition] = useTransition();
	const debouncedSearch = useDebouncedCallback((nextQuery: string) => {
		startTransition(async () => {
			setOptimisticPage(1);

			const result = await getPatientMedicationsTableAction({
				patientId,
				page: 1,
				limit: tableData.limit,
				query: nextQuery,
			});

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

	function handlePreviousPage() {
		const nextPage = Math.max(tableData.page - 1, 1);
		startTransition(async () => {
			setOptimisticPage(nextPage);
			const result = await getPatientMedicationsTableAction({
				patientId,
				page: nextPage,
				limit: tableData.limit,
				query,
			});

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
		startTransition(async () => {
			setOptimisticPage(nextPage);
			const result = await getPatientMedicationsTableAction({
				patientId,
				page: nextPage,
				limit: tableData.limit,
				query,
			});

			setTableData({
				rows: result.medications,
				page: result.page,
				limit: result.limit,
				totalPages: result.totalPages,
			});
		});
	}

	function handleLimitChange(nextLimit: number) {
		startTransition(async () => {
			setOptimisticPage(1);
			setOptimisticLimit(nextLimit);
			const result = await getPatientMedicationsTableAction({
				patientId,
				page: 1,
				limit: nextLimit,
				query,
			});

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
			isPending={isPending}
			onQueryChange={handleQueryChange}
			onPreviousPage={handlePreviousPage}
			onNextPage={handleNextPage}
			onLimitChange={handleLimitChange}
		/>
	);
}
