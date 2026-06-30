"use client";

import { ImagingTable } from "@/features/patients/components/imaging-table";
import { getPatientImagingTableAction } from "@/features/patients/server/actions";
import type {
	ImagingModalityFilter,
	ImagingStatusFilter,
	ImagingType,
} from "@/features/patients/types";
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
	const [orderedFrom, setOrderedFrom] = useState("");
	const [orderedTo, setOrderedTo] = useState("");
	const [createdFrom, setCreatedFrom] = useState("");
	const [createdTo, setCreatedTo] = useState("");
	const [statusFilters, setStatusFilters] = useState<ImagingStatusFilter[]>([]);
	const [modalityFilters, setModalityFilters] = useState<ImagingModalityFilter[]>([]);
	const [isPending, startTransition] = useTransition();
	const latestSectionTableRequestIdRef = useRef(0);

	function refreshImagingTable({
		nextPage = 1,
		nextLimit = tableData.limit,
		nextQuery = query,
		nextOrderedFrom = orderedFrom,
		nextOrderedTo = orderedTo,
		nextCreatedFrom = createdFrom,
		nextCreatedTo = createdTo,
		nextStatusFilters = statusFilters,
		nextModalityFilters = modalityFilters,
	}: {
		nextPage?: number;
		nextLimit?: number;
		nextQuery?: string;
		nextOrderedFrom?: string;
		nextOrderedTo?: string;
		nextCreatedFrom?: string;
		nextCreatedTo?: string;
		nextStatusFilters?: ImagingStatusFilter[];
		nextModalityFilters?: ImagingModalityFilter[];
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
				orderedFrom: nextOrderedFrom,
				orderedTo: nextOrderedTo,
				createdFrom: nextCreatedFrom,
				createdTo: nextCreatedTo,
				statusFilters: nextStatusFilters,
				modalityFilters: nextModalityFilters,
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

	function handleOrderedAtRangeApply(nextOrderedFrom: string, nextOrderedTo: string) {
		setOrderedFrom(nextOrderedFrom);
		setOrderedTo(nextOrderedTo);
		refreshImagingTable({ nextOrderedFrom, nextOrderedTo });
	}

	function handleCreatedAtRangeApply(nextCreatedFrom: string, nextCreatedTo: string) {
		setCreatedFrom(nextCreatedFrom);
		setCreatedTo(nextCreatedTo);
		refreshImagingTable({ nextCreatedFrom, nextCreatedTo });
	}

	function handleStatusFiltersChange(nextStatusFilters: ImagingStatusFilter[]) {
		setStatusFilters(nextStatusFilters);
		refreshImagingTable({ nextStatusFilters });
	}

	function handleModalityFiltersChange(nextModalityFilters: ImagingModalityFilter[]) {
		setModalityFilters(nextModalityFilters);
		refreshImagingTable({ nextModalityFilters });
	}

	return (
		<ImagingTable
			imagingStudies={tableData.rows}
			page={optimisticPage}
			limit={optimisticLimit}
			totalPages={tableData.totalPages}
			query={query}
			orderedFrom={orderedFrom}
			orderedTo={orderedTo}
			createdFrom={createdFrom}
			createdTo={createdTo}
			statusFilters={statusFilters}
			modalityFilters={modalityFilters}
			isPending={isPending}
			onQueryChange={handleQueryChange}
			onOrderedAtRangeApply={handleOrderedAtRangeApply}
			onCreatedAtRangeApply={handleCreatedAtRangeApply}
			onStatusFiltersChange={handleStatusFiltersChange}
			onModalityFiltersChange={handleModalityFiltersChange}
			onPreviousPage={handlePreviousPage}
			onNextPage={handleNextPage}
			onLimitChange={handleLimitChange}
		/>
	);
}
