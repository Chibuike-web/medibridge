"use client";

import { EncountersTable } from "@/features/patients/components/encounters-table";
import { getPatientEncountersTableAction } from "@/features/patients/server/actions";
import type { EncounterType } from "@/features/patients/types";
import { useDebouncedCallback } from "@/hooks/use-debounced";
import { useOptimistic, useRef, useState, useTransition } from "react";

type SectionTableState<T> = {
	rows: T[];
	page: number;
	limit: number;
	totalPages: number;
};

export function EncountersClient({
	patientId,
	encounters,
	page,
	limit,
	totalPages,
}: {
	patientId: string;
	encounters: EncounterType[];
	page: number;
	limit: number;
	totalPages: number;
}) {
	const [tableData, setTableData] = useState<SectionTableState<EncounterType>>({
		rows: encounters,
		page,
		limit,
		totalPages,
	});
	const [optimisticPage, setOptimisticPage] = useOptimistic(tableData.page);
	const [optimisticLimit, setOptimisticLimit] = useOptimistic(tableData.limit);
	const [query, setQuery] = useState("");
	const [isPending, startTransition] = useTransition();
	const latestSectionTableRequestIdRef = useRef(0);

	function refreshEncountersTable({
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

			const result = await getPatientEncountersTableAction({
				patientId,
				page: nextPage,
				limit: nextLimit,
				query: nextQuery,
			});

			if (latestSectionTableRequestIdRef.current !== sectionTableRequestId) {
				return;
			}

			setTableData({
				rows: result.encounters,
				page: result.page,
				limit: result.limit,
				totalPages: result.totalPages,
			});
		});
	}
	const debouncedSearch = useDebouncedCallback((nextQuery: string) => {
		refreshEncountersTable({ nextQuery });
	}, 300);

	function handleQueryChange(nextQuery: string) {
		setQuery(nextQuery);
		debouncedSearch(nextQuery);
	}

	function handlePreviousPage() {
		const nextPage = Math.max(tableData.page - 1, 1);
		refreshEncountersTable({ nextPage });
	}

	function handleNextPage() {
		const nextPage = Math.min(tableData.page + 1, tableData.totalPages);
		refreshEncountersTable({ nextPage });
	}

	function handleLimitChange(nextLimit: number) {
		refreshEncountersTable({ nextLimit });
	}

	return (
		<EncountersTable
			patientId={patientId}
			encounters={tableData.rows}
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
