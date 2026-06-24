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

	function getAllergiesRequestParams({
		page,
		limit,
		query,
		createdFrom,
		createdTo,
		statusFilter,
		severityFilters,
	}: {
		page: number;
		limit: number;
		query: string;
		createdFrom: string;
		createdTo: string;
		statusFilter: AllergyStatusFilter;
		severityFilters: AllergySeverityFilter[];
	}) {
		return {
			patientId,
			page,
			limit,
			query,
			createdFrom,
			createdTo,
			statusFilter,
			severityFilters,
		};
	}

	const debouncedSearch = useDebouncedCallback((nextQuery: string) => {
		const sectionTableRequestId = latestSectionTableRequestIdRef.current + 1;
		latestSectionTableRequestIdRef.current = sectionTableRequestId;

		startTransition(async () => {
			setOptimisticPage(1);

			const result = await getPatientAllergiesTableAction({
				...getAllergiesRequestParams({
					page: 1,
					limit: tableData.limit,
					query: nextQuery,
					createdFrom,
					createdTo,
					statusFilter,
					severityFilters,
				}),
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
			const result = await getPatientAllergiesTableAction({
				...getAllergiesRequestParams({
					page: nextPage,
					limit: tableData.limit,
					query,
					createdFrom,
					createdTo,
					statusFilter,
					severityFilters,
				}),
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

	function handleNextPage() {
		const nextPage = Math.min(tableData.page + 1, tableData.totalPages);
		const sectionTableRequestId = latestSectionTableRequestIdRef.current + 1;
		latestSectionTableRequestIdRef.current = sectionTableRequestId;

		startTransition(async () => {
			setOptimisticPage(nextPage);
			const result = await getPatientAllergiesTableAction({
				...getAllergiesRequestParams({
					page: nextPage,
					limit: tableData.limit,
					query,
					createdFrom,
					createdTo,
					statusFilter,
					severityFilters,
				}),
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

	function handleLimitChange(nextLimit: number) {
		const sectionTableRequestId = latestSectionTableRequestIdRef.current + 1;
		latestSectionTableRequestIdRef.current = sectionTableRequestId;

		startTransition(async () => {
			setOptimisticPage(1);
			setOptimisticLimit(nextLimit);
			const result = await getPatientAllergiesTableAction({
				...getAllergiesRequestParams({
					page: 1,
					limit: nextLimit,
					query,
					createdFrom,
					createdTo,
					statusFilter,
					severityFilters,
				}),
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

	function handleAllergyFiltersChange({
		createdFrom: nextCreatedFrom = createdFrom,
		createdTo: nextCreatedTo = createdTo,
		statusFilter: nextStatusFilter = statusFilter,
		severityFilters: nextSeverityFilters = severityFilters,
	}: {
		createdFrom?: string;
		createdTo?: string;
		statusFilter?: AllergyStatusFilter;
		severityFilters?: AllergySeverityFilter[];
	}) {
		const sectionTableRequestId = latestSectionTableRequestIdRef.current + 1;
		latestSectionTableRequestIdRef.current = sectionTableRequestId;

		setCreatedFrom(nextCreatedFrom);
		setCreatedTo(nextCreatedTo);
		setStatusFilter(nextStatusFilter);
		setSeverityFilters(nextSeverityFilters);

		startTransition(async () => {
			setOptimisticPage(1);

			const result = await getPatientAllergiesTableAction({
				...getAllergiesRequestParams({
					page: 1,
					limit: tableData.limit,
					query,
					createdFrom: nextCreatedFrom,
					createdTo: nextCreatedTo,
					statusFilter: nextStatusFilter,
					severityFilters: nextSeverityFilters,
				}),
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
			onCreatedAtRangeApply={(nextCreatedFrom, nextCreatedTo) =>
				handleAllergyFiltersChange({
					createdFrom: nextCreatedFrom,
					createdTo: nextCreatedTo,
				})
			}
			onStatusFilterChange={(nextStatusFilter) =>
				handleAllergyFiltersChange({ statusFilter: nextStatusFilter })
			}
			onSeverityFiltersChange={(nextSeverityFilters) =>
				handleAllergyFiltersChange({ severityFilters: nextSeverityFilters })
			}
			onPreviousPage={handlePreviousPage}
			onNextPage={handleNextPage}
			onLimitChange={handleLimitChange}
		/>
	);
}
