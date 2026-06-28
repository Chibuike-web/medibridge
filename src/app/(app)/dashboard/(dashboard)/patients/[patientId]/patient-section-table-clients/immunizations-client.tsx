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

	function getImmunizationsRequestParams({
		page,
		limit,
		query,
		createdFrom,
		createdTo,
		statusFilters,
	}: {
		page: number;
		limit: number;
		query: string;
		createdFrom: string;
		createdTo: string;
		statusFilters: ImmunizationStatusFilter[];
	}) {
		return {
			patientId,
			page,
			limit,
			query,
			createdFrom,
			createdTo,
			statusFilters,
		};
	}

	const debouncedSearch = useDebouncedCallback((nextQuery: string) => {
		const sectionTableRequestId = latestSectionTableRequestIdRef.current + 1;
		latestSectionTableRequestIdRef.current = sectionTableRequestId;

		startTransition(async () => {
			setOptimisticPage(1);

			const result = await getPatientImmunizationsTableAction({
				...getImmunizationsRequestParams({
					page: 1,
					limit: tableData.limit,
					query: nextQuery,
					createdFrom,
					createdTo,
					statusFilters,
				}),
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
	}, 300);

	function handleQueryChange(nextQuery: string) {
		setQuery(nextQuery);
		debouncedSearch(nextQuery);
	}

	function handlePreviousPage() {
		const nextPage = Math.max(tableData.page - 1, 1);
		const sectionTableRequestId = latestSectionTableRequestIdRef.current + 1;
		latestSectionTableRequestIdRef.current = sectionTableRequestId;

		startTransition(async () => {
			setOptimisticPage(nextPage);
			const result = await getPatientImmunizationsTableAction({
				...getImmunizationsRequestParams({
					page: nextPage,
					limit: tableData.limit,
					query,
					createdFrom,
					createdTo,
					statusFilters,
				}),
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

	function handleNextPage() {
		const nextPage = Math.min(tableData.page + 1, tableData.totalPages);
		const sectionTableRequestId = latestSectionTableRequestIdRef.current + 1;
		latestSectionTableRequestIdRef.current = sectionTableRequestId;

		startTransition(async () => {
			setOptimisticPage(nextPage);
			const result = await getPatientImmunizationsTableAction({
				...getImmunizationsRequestParams({
					page: nextPage,
					limit: tableData.limit,
					query,
					createdFrom,
					createdTo,
					statusFilters,
				}),
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

	function handleLimitChange(nextLimit: number) {
		const sectionTableRequestId = latestSectionTableRequestIdRef.current + 1;
		latestSectionTableRequestIdRef.current = sectionTableRequestId;

		startTransition(async () => {
			setOptimisticPage(1);
			setOptimisticLimit(nextLimit);
			const result = await getPatientImmunizationsTableAction({
				...getImmunizationsRequestParams({
					page: 1,
					limit: nextLimit,
					query,
					createdFrom,
					createdTo,
					statusFilters,
				}),
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

	function handleImmunizationFiltersChange({
		createdFrom: nextCreatedFrom = createdFrom,
		createdTo: nextCreatedTo = createdTo,
		statusFilters: nextStatusFilters = statusFilters,
	}: {
		createdFrom?: string;
		createdTo?: string;
		statusFilters?: ImmunizationStatusFilter[];
	}) {
		const sectionTableRequestId = latestSectionTableRequestIdRef.current + 1;
		latestSectionTableRequestIdRef.current = sectionTableRequestId;

		setCreatedFrom(nextCreatedFrom);
		setCreatedTo(nextCreatedTo);
		setStatusFilters(nextStatusFilters);

		startTransition(async () => {
			setOptimisticPage(1);

			const result = await getPatientImmunizationsTableAction({
				...getImmunizationsRequestParams({
					page: 1,
					limit: tableData.limit,
					query,
					createdFrom: nextCreatedFrom,
					createdTo: nextCreatedTo,
					statusFilters: nextStatusFilters,
				}),
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
			onCreatedAtRangeApply={(nextCreatedFrom, nextCreatedTo) =>
				handleImmunizationFiltersChange({
					createdFrom: nextCreatedFrom,
					createdTo: nextCreatedTo,
				})
			}
			onStatusFiltersChange={(nextStatusFilters) =>
				handleImmunizationFiltersChange({ statusFilters: nextStatusFilters })
			}
			onPreviousPage={handlePreviousPage}
			onNextPage={handleNextPage}
			onLimitChange={handleLimitChange}
		/>
	);
}
