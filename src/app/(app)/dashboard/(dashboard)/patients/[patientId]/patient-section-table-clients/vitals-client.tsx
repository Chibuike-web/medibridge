"use client";

import { VitalsTable } from "@/features/patients/components/vitals-table";
import { getPatientVitalsTableAction } from "@/features/patients/server/get-patient-vitals-table-action";
import type { VitalEncounterOption, VitalType } from "@/features/patients/types";
import { useDebouncedCallback } from "@/hooks/use-debounced";
import { useOptimistic, useRef, useState, useTransition } from "react";

type VitalsTableState = {
	rows: VitalType[];
	page: number;
	limit: number;
	totalPages: number;
};

export function VitalsClient({
	patientId,
	encounterOptions,
	vitals,
	readings,
	page,
	limit,
	totalPages,
}: {
	patientId: string;
	encounterOptions: VitalEncounterOption[];
	vitals: VitalType[];
	readings: VitalType[];
	page: number;
	limit: number;
	totalPages: number;
}) {
	const [tableData, setTableData] = useState<VitalsTableState>({
		rows: vitals,
		page,
		limit,
		totalPages,
	});
	const [chartReadings, setChartReadings] = useState(readings);
	const [optimisticPage, setOptimisticPage] = useOptimistic(tableData.page);
	const [optimisticLimit, setOptimisticLimit] = useOptimistic(tableData.limit);
	const [query, setQuery] = useState("");
	const [recordedFrom, setRecordedFrom] = useState("");
	const [recordedTo, setRecordedTo] = useState("");
	const [createdFrom, setCreatedFrom] = useState("");
	const [createdTo, setCreatedTo] = useState("");
	const [isPending, startTransition] = useTransition();
	const latestVitalsRequestIdRef = useRef(0);

	function refreshVitalsTable({
		nextPage = 1,
		nextLimit = tableData.limit,
		nextQuery = query,
		nextRecordedFrom = recordedFrom,
		nextRecordedTo = recordedTo,
		nextCreatedFrom = createdFrom,
		nextCreatedTo = createdTo,
	}: {
		nextPage?: number;
		nextLimit?: number;
		nextQuery?: string;
		nextRecordedFrom?: string;
		nextRecordedTo?: string;
		nextCreatedFrom?: string;
		nextCreatedTo?: string;
	} = {}) {
		const requestId = latestVitalsRequestIdRef.current + 1;
		latestVitalsRequestIdRef.current = requestId;

		startTransition(async () => {
			setOptimisticPage(nextPage);
			setOptimisticLimit(nextLimit);

			const result = await getPatientVitalsTableAction({
				patientId,
				page: nextPage,
				limit: nextLimit,
				query: nextQuery,
				recordedFrom: nextRecordedFrom,
				recordedTo: nextRecordedTo,
				createdFrom: nextCreatedFrom,
				createdTo: nextCreatedTo,
			});

			if (latestVitalsRequestIdRef.current !== requestId) return;

			setTableData({
				rows: result.vitals,
				page: result.page,
				limit: result.limit,
				totalPages: result.totalPages,
			});
		});
	}

	const debouncedSearch = useDebouncedCallback(
		(nextQuery: string) => refreshVitalsTable({ nextQuery }),
		300,
	);

	function handleQueryChange(nextQuery: string) {
		setQuery(nextQuery);
		debouncedSearch(nextQuery);
	}

	function handlePreviousPage() {
		refreshVitalsTable({ nextPage: Math.max(tableData.page - 1, 1) });
	}

	function handleNextPage() {
		refreshVitalsTable({ nextPage: Math.min(tableData.page + 1, tableData.totalPages) });
	}

	function handleLimitChange(nextLimit: number) {
		refreshVitalsTable({ nextLimit });
	}

	function handleRecordedAtRangeApply(nextRecordedFrom: string, nextRecordedTo: string) {
		setRecordedFrom(nextRecordedFrom);
		setRecordedTo(nextRecordedTo);
		refreshVitalsTable({ nextRecordedFrom, nextRecordedTo });
	}

	function handleCreatedAtRangeApply(nextCreatedFrom: string, nextCreatedTo: string) {
		setCreatedFrom(nextCreatedFrom);
		setCreatedTo(nextCreatedTo);
		refreshVitalsTable({ nextCreatedFrom, nextCreatedTo });
	}

	function handleVitalCreated(vital: VitalType) {
		setChartReadings((previousReadings) => [vital, ...previousReadings]);
		refreshVitalsTable({ nextPage: tableData.page });
	}

	return (
		<VitalsTable
			patientId={patientId}
			encounterOptions={encounterOptions}
			vitals={tableData.rows}
			readings={chartReadings}
			page={optimisticPage}
			limit={optimisticLimit}
			totalPages={tableData.totalPages}
			query={query}
			recordedFrom={recordedFrom}
			recordedTo={recordedTo}
			createdFrom={createdFrom}
			createdTo={createdTo}
			isPending={isPending}
			onQueryChange={handleQueryChange}
			onRecordedAtRangeApply={handleRecordedAtRangeApply}
			onCreatedAtRangeApply={handleCreatedAtRangeApply}
			onPreviousPage={handlePreviousPage}
			onNextPage={handleNextPage}
			onLimitChange={handleLimitChange}
			onVitalCreated={handleVitalCreated}
		/>
	);
}
