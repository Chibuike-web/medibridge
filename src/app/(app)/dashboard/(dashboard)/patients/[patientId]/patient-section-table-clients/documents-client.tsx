"use client";

import { DocumentsTable } from "@/features/patients/components/documents-table";
import { getPatientDocumentsTableAction } from "@/features/patients/server/actions";
import type { DocumentType } from "@/features/patients/types";
import { useDebouncedCallback } from "@/hooks/use-debounced";
import { useOptimistic, useRef, useState, useTransition } from "react";

type DocumentsTableState = {
	rows: DocumentType[];
	page: number;
	limit: number;
	totalPages: number;
};

export function DocumentsClient({
	patientId,
	documents,
	page,
	limit,
	totalPages,
}: {
	patientId: string;
	documents: DocumentType[];
	page: number;
	limit: number;
	totalPages: number;
}) {
	const [tableData, setTableData] = useState<DocumentsTableState>({
		rows: documents,
		page,
		limit,
		totalPages,
	});
	const [optimisticPage, setOptimisticPage] = useOptimistic(tableData.page);
	const [optimisticLimit, setOptimisticLimit] = useOptimistic(tableData.limit);
	const [query, setQuery] = useState("");
	const [createdFrom, setCreatedFrom] = useState("");
	const [createdTo, setCreatedTo] = useState("");
	const [documentTypeFilters, setDocumentTypeFilters] = useState<string[]>([]);
	const [isPending, startTransition] = useTransition();
	const latestDocumentsRequestIdRef = useRef(0);

	function refreshDocumentsTable({
		nextPage = 1,
		nextLimit = tableData.limit,
		nextQuery = query,
		nextCreatedFrom = createdFrom,
		nextCreatedTo = createdTo,
		nextDocumentTypeFilters = documentTypeFilters,
	}: {
		nextPage?: number;
		nextLimit?: number;
		nextQuery?: string;
		nextCreatedFrom?: string;
		nextCreatedTo?: string;
		nextDocumentTypeFilters?: string[];
	} = {}) {
		const requestId = latestDocumentsRequestIdRef.current + 1;
		latestDocumentsRequestIdRef.current = requestId;
		startTransition(async () => {
			setOptimisticPage(nextPage);
			setOptimisticLimit(nextLimit);
			const result = await getPatientDocumentsTableAction({
				patientId,
				page: nextPage,
				limit: nextLimit,
				query: nextQuery,
				createdFrom: nextCreatedFrom,
				createdTo: nextCreatedTo,
				documentTypeFilters: nextDocumentTypeFilters,
			});
			if (latestDocumentsRequestIdRef.current !== requestId) return;
			setTableData({
				rows: result.documents,
				page: result.page,
				limit: result.limit,
				totalPages: result.totalPages,
			});
		});
	}

	const debouncedSearch = useDebouncedCallback(
		(nextQuery: string) => refreshDocumentsTable({ nextQuery }),
		300,
	);

	function handleQueryChange(nextQuery: string) {
		setQuery(nextQuery);
		debouncedSearch(nextQuery);
	}
	function handlePreviousPage() {
		const nextPage = Math.max(tableData.page - 1, 1);
		refreshDocumentsTable({ nextPage });
	}

	function handleNextPage() {
		const nextPage = Math.min(tableData.page + 1, tableData.totalPages);
		refreshDocumentsTable({ nextPage });
	}
	function handleLimitChange(nextLimit: number) {
		refreshDocumentsTable({ nextLimit });
	}
	function handleDocumentTypeFiltersChange(nextDocumentTypeFilters: string[]) {
		setDocumentTypeFilters(nextDocumentTypeFilters);
		refreshDocumentsTable({ nextDocumentTypeFilters });
	}
	function handleCreatedAtRangeApply(nextCreatedFrom: string, nextCreatedTo: string) {
		setCreatedFrom(nextCreatedFrom);
		setCreatedTo(nextCreatedTo);
		refreshDocumentsTable({ nextCreatedFrom, nextCreatedTo });
	}
	function handleDocumentsChanged() {
		refreshDocumentsTable({ nextPage: tableData.page });
	}

	return (
		<DocumentsTable
			patientId={patientId}
			documents={tableData.rows}
			page={optimisticPage}
			limit={optimisticLimit}
			totalPages={tableData.totalPages}
			query={query}
			createdFrom={createdFrom}
			createdTo={createdTo}
			documentTypeFilters={documentTypeFilters}
			isPending={isPending}
			onQueryChange={handleQueryChange}
			onDocumentTypeFiltersChange={handleDocumentTypeFiltersChange}
			onCreatedAtRangeApply={handleCreatedAtRangeApply}
			onPreviousPage={handlePreviousPage}
			onNextPage={handleNextPage}
			onLimitChange={handleLimitChange}
			onDocumentsChanged={handleDocumentsChanged}
		/>
	);
}
