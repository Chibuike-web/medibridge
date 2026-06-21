"use client";

import { DiagnosesTable } from "@/features/patients/components/diagnoses-table";
import { getPatientDiagnosesTableAction } from "@/features/patients/server/actions";
import type {
	DiagnosisStatusFilter,
	DiagnosisType,
} from "@/features/patients/types";
import { useDebouncedCallback } from "@/hooks/use-debounced";
import { useOptimistic, useRef, useState, useTransition } from "react";

type SectionTableState<T> = {
	rows: T[];
	page: number;
	limit: number;
	totalPages: number;
};

export function DiagnosesClient({
	patientId,
	diagnoses,
	page,
	limit,
	totalPages,
}: {
	patientId: string;
	diagnoses: DiagnosisType[];
	page: number;
	limit: number;
	totalPages: number;
}) {
	const [tableData, setTableData] = useState<SectionTableState<DiagnosisType>>({
		rows: diagnoses,
		page,
		limit,
		totalPages,
	});
	const [optimisticPage, setOptimisticPage] = useOptimistic(tableData.page);
	const [optimisticLimit, setOptimisticLimit] = useOptimistic(tableData.limit);
	const [query, setQuery] = useState("");
	const [createdFrom, setCreatedFrom] = useState("");
	const [createdTo, setCreatedTo] = useState("");
	const [diagnosedFrom, setDiagnosedFrom] = useState("");
	const [diagnosedTo, setDiagnosedTo] = useState("");
	const [lastReviewedFrom, setLastReviewedFrom] = useState("");
	const [lastReviewedTo, setLastReviewedTo] = useState("");
	const [statusFilters, setStatusFilters] = useState<DiagnosisStatusFilter[]>(
		[],
	);
	const [isPending, startTransition] = useTransition();
	const latestSectionTableRequestIdRef = useRef(0);
	const debouncedSearch = useDebouncedCallback((nextQuery: string) => {
		const sectionTableRequestId = latestSectionTableRequestIdRef.current + 1;
		latestSectionTableRequestIdRef.current = sectionTableRequestId;

		startTransition(async () => {
			setOptimisticPage(1);

			const result = await getPatientDiagnosesTableAction({
				patientId,
				page: 1,
				limit: tableData.limit,
				query: nextQuery,
				createdFrom,
				createdTo,
				diagnosedFrom,
				diagnosedTo,
				lastReviewedFrom,
				lastReviewedTo,
				statusFilters,
			});

			if (latestSectionTableRequestIdRef.current !== sectionTableRequestId) {
				return;
			}

			setTableData({
				rows: result.diagnoses,
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
			const result = await getPatientDiagnosesTableAction({
				patientId,
				page: nextPage,
				limit: tableData.limit,
				query,
				createdFrom,
				createdTo,
				diagnosedFrom,
				diagnosedTo,
				lastReviewedFrom,
				lastReviewedTo,
				statusFilters,
			});

			if (latestSectionTableRequestIdRef.current !== sectionTableRequestId) {
				return;
			}

			setTableData({
				rows: result.diagnoses,
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
			const result = await getPatientDiagnosesTableAction({
				patientId,
				page: nextPage,
				limit: tableData.limit,
				query,
				createdFrom,
				createdTo,
				diagnosedFrom,
				diagnosedTo,
				lastReviewedFrom,
				lastReviewedTo,
				statusFilters,
			});

			if (latestSectionTableRequestIdRef.current !== sectionTableRequestId) {
				return;
			}

			setTableData({
				rows: result.diagnoses,
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
			const result = await getPatientDiagnosesTableAction({
				patientId,
				page: 1,
				limit: nextLimit,
				query,
				createdFrom,
				createdTo,
				diagnosedFrom,
				diagnosedTo,
				lastReviewedFrom,
				lastReviewedTo,
				statusFilters,
			});

			if (latestSectionTableRequestIdRef.current !== sectionTableRequestId) {
				return;
			}

			setTableData({
				rows: result.diagnoses,
				page: result.page,
				limit: result.limit,
				totalPages: result.totalPages,
			});
		});
	}

	function handleStatusFiltersChange(
		nextStatusFilters: DiagnosisStatusFilter[],
	) {
		setStatusFilters(nextStatusFilters);
		fetchFilteredDiagnoses({
			nextCreatedFrom: createdFrom,
			nextCreatedTo: createdTo,
			nextDiagnosedFrom: diagnosedFrom,
			nextDiagnosedTo: diagnosedTo,
			nextLastReviewedFrom: lastReviewedFrom,
			nextLastReviewedTo: lastReviewedTo,
			nextStatusFilters,
		});
	}

	function handleCreatedAtRangeApply(
		nextCreatedFrom: string,
		nextCreatedTo: string,
	) {
		setCreatedFrom(nextCreatedFrom);
		setCreatedTo(nextCreatedTo);
		fetchFilteredDiagnoses({
			nextCreatedFrom,
			nextCreatedTo,
			nextDiagnosedFrom: diagnosedFrom,
			nextDiagnosedTo: diagnosedTo,
			nextLastReviewedFrom: lastReviewedFrom,
			nextLastReviewedTo: lastReviewedTo,
			nextStatusFilters: statusFilters,
		});
	}

	function handleDiagnosedAtRangeApply(
		nextDiagnosedFrom: string,
		nextDiagnosedTo: string,
	) {
		setDiagnosedFrom(nextDiagnosedFrom);
		setDiagnosedTo(nextDiagnosedTo);
		fetchFilteredDiagnoses({
			nextCreatedFrom: createdFrom,
			nextCreatedTo: createdTo,
			nextDiagnosedFrom,
			nextDiagnosedTo,
			nextLastReviewedFrom: lastReviewedFrom,
			nextLastReviewedTo: lastReviewedTo,
			nextStatusFilters: statusFilters,
		});
	}

	function handleLastReviewedRangeApply(
		nextLastReviewedFrom: string,
		nextLastReviewedTo: string,
	) {
		setLastReviewedFrom(nextLastReviewedFrom);
		setLastReviewedTo(nextLastReviewedTo);
		fetchFilteredDiagnoses({
			nextCreatedFrom: createdFrom,
			nextCreatedTo: createdTo,
			nextDiagnosedFrom: diagnosedFrom,
			nextDiagnosedTo: diagnosedTo,
			nextLastReviewedFrom,
			nextLastReviewedTo,
			nextStatusFilters: statusFilters,
		});
	}

	function fetchFilteredDiagnoses({
		nextCreatedFrom,
		nextCreatedTo,
		nextDiagnosedFrom,
		nextDiagnosedTo,
		nextLastReviewedFrom,
		nextLastReviewedTo,
		nextStatusFilters,
	}: {
		nextCreatedFrom: string;
		nextCreatedTo: string;
		nextDiagnosedFrom: string;
		nextDiagnosedTo: string;
		nextLastReviewedFrom: string;
		nextLastReviewedTo: string;
		nextStatusFilters: DiagnosisStatusFilter[];
	}) {
		const sectionTableRequestId = latestSectionTableRequestIdRef.current + 1;
		latestSectionTableRequestIdRef.current = sectionTableRequestId;

		startTransition(async () => {
			setOptimisticPage(1);

			const result = await getPatientDiagnosesTableAction({
				patientId,
				page: 1,
				limit: tableData.limit,
				query,
				createdFrom: nextCreatedFrom,
				createdTo: nextCreatedTo,
				diagnosedFrom: nextDiagnosedFrom,
				diagnosedTo: nextDiagnosedTo,
				lastReviewedFrom: nextLastReviewedFrom,
				lastReviewedTo: nextLastReviewedTo,
				statusFilters: nextStatusFilters,
			});

			if (latestSectionTableRequestIdRef.current !== sectionTableRequestId) {
				return;
			}

			setTableData({
				rows: result.diagnoses,
				page: result.page,
				limit: result.limit,
				totalPages: result.totalPages,
			});
		});
	}

	return (
		<DiagnosesTable
			diagnoses={tableData.rows}
			page={optimisticPage}
			limit={optimisticLimit}
			totalPages={tableData.totalPages}
			query={query}
			createdFrom={createdFrom}
			createdTo={createdTo}
			diagnosedFrom={diagnosedFrom}
			diagnosedTo={diagnosedTo}
			isPending={isPending}
			lastReviewedFrom={lastReviewedFrom}
			lastReviewedTo={lastReviewedTo}
			statusFilters={statusFilters}
			onCreatedAtRangeApply={handleCreatedAtRangeApply}
			onDiagnosedAtRangeApply={handleDiagnosedAtRangeApply}
			onLastReviewedRangeApply={handleLastReviewedRangeApply}
			onQueryChange={handleQueryChange}
			onPreviousPage={handlePreviousPage}
			onNextPage={handleNextPage}
			onLimitChange={handleLimitChange}
			onStatusFiltersChange={handleStatusFiltersChange}
		/>
	);
}
