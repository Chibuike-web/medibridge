"use client";

import { ImagingTable } from "@/features/patients/components/imaging-table";
import { getPatientImagingTableAction } from "@/features/patients/server/actions";
import type { ImagingType } from "@/features/patients/types";
import { useDebouncedCallback } from "@/hooks/use-debounced";
import { useOptimistic, useRef, useState, useTransition } from "react";

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
	const latestSectionTableRequestIdRef = useRef(0);

	function refreshImagingTable({
		nextPage = 1,
		nextLimit = tableData.limit,
		nextQuery = query,
	}: {
		nextPage?: number;
		nextLimit?: number;
		nextQuery?: string;
	}) {
		const sectionTableRequestId = latestSectionTableRequestIdRef.current + 1;
		latestSectionTableRequestIdRef.current = sectionTableRequestId;

		startTransition(async () => {
			setOptimisticPage(nextPage);
			setOptimisticLimit(nextLimit);

			const result = await getPatientImagingTableAction({
				patientId,
				page: nextPage,
				limit: nextLimit,
				query: nextQuery,
			});

			if (latestSectionTableRequestIdRef.current !== sectionTableRequestId) {
				return;
			}

			setTableData({
				rows: result.imagingStudies,
				page: result.page,
				limit: result.limit,
				totalPages: result.totalPages,
			});
		});
	}

	const debouncedSearch = useDebouncedCallback((nextQuery: string) => {
		refreshImagingTable({ nextQuery });
	}, 300);

	function handleQueryChange(nextQuery: string) {
		setQuery(nextQuery);
		debouncedSearch(nextQuery);
	}

	function handlePreviousPage() {
		const nextPage = Math.max(tableData.page - 1, 1);
		refreshImagingTable({ nextPage });
	}

	function handleNextPage() {
		const nextPage = Math.min(tableData.page + 1, tableData.totalPages);
		refreshImagingTable({ nextPage });
	}

	function handleLimitChange(nextLimit: number) {
		refreshImagingTable({ nextLimit });
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
