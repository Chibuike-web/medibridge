"use client";

import { ImagingTable } from "@/features/patients/components/imaging-table";
import { getPatientImagingTableAction } from "@/features/patients/server/actions";
import type { ImagingType } from "@/features/patients/types";
import { useDebouncedCallback } from "@/hooks/use-debounced";
import { useOptimistic, useState, useTransition } from "react";

type SectionTableState<T> = {
	rows: T[];
	page: number;
	limit: number;
	totalPages: number;
};

export function ImagingClient({
	patientId,
	imagingStudies,
	page,
	limit,
	totalPages,
}: {
	patientId: string;
	imagingStudies: ImagingType[];
	page: number;
	limit: number;
	totalPages: number;
}) {
	const [tableData, setTableData] = useState<SectionTableState<ImagingType>>({
		rows: imagingStudies,
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

			const result = await getPatientImagingTableAction({
				patientId,
				page: 1,
				limit: tableData.limit,
				query: nextQuery,
			});

			setTableData({
				rows: result.imagingStudies,
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
			const result = await getPatientImagingTableAction({
				patientId,
				page: nextPage,
				limit: tableData.limit,
				query,
			});

			setTableData({
				rows: result.imagingStudies,
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
			const result = await getPatientImagingTableAction({
				patientId,
				page: nextPage,
				limit: tableData.limit,
				query,
			});

			setTableData({
				rows: result.imagingStudies,
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
			const result = await getPatientImagingTableAction({
				patientId,
				page: 1,
				limit: nextLimit,
				query,
			});

			setTableData({
				rows: result.imagingStudies,
				page: result.page,
				limit: result.limit,
				totalPages: result.totalPages,
			});
		});
	}

	return (
		<ImagingTable
			imagingStudies={tableData.rows}
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
