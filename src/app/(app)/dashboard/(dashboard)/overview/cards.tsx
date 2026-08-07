"use client";

import { countRecordsWithinRange } from "@/lib/utils/count-records-within-range";
import { formatStat } from "@/lib/utils/format-stat";
import type { OverviewStats } from "@/services/patient/types";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils/cn";

const TOTAL_PATIENTS_LABEL = "Total No. of Patients";
const TRANSFERRED_RECORDS_LABEL = "Transferred Records";
const PENDING_TRANSFERS_LABEL = "Pending Transfers";
const NEW_ENCOUNTERS_LABEL = "New Encounter";

function getComparison(currentCount: number, previousCount: number) {
	const difference = currentCount - previousCount;
	const percentChange =
		previousCount > 0 ? Math.round((difference / previousCount) * 100) : currentCount > 0 ? 100 : 0;

	return { currentCount, difference, percentChange };
}

function getOverviewCards(
	stats: OverviewStats,
	patientCreatedAt: Date[],
	patientTransferredAt: Date[],
	pendingTransferredAt: Date[],
	encounterCreatedAt: Date[],
) {
	const thisMonthPatients = countRecordsWithinRange(patientCreatedAt, "This Month");
	const lastMonthPatients = countRecordsWithinRange(patientCreatedAt, "Last Month");
	const patientGrowth = getComparison(thisMonthPatients, lastMonthPatients);
	const thisMonthTransfers = countRecordsWithinRange(patientTransferredAt, "This Month");
	const lastMonthTransfers = countRecordsWithinRange(patientTransferredAt, "Last Month");
	const transferredGrowth = getComparison(thisMonthTransfers, lastMonthTransfers);
	const thisMonthPendingTransfers = countRecordsWithinRange(pendingTransferredAt, "This Month");
	const lastMonthPendingTransfers = countRecordsWithinRange(pendingTransferredAt, "Last Month");
	const pendingTransfersGrowth = getComparison(
		thisMonthPendingTransfers,
		lastMonthPendingTransfers,
	);
	const thisMonthEncounters = countRecordsWithinRange(encounterCreatedAt, "This Month");
	const lastMonthEncounters = countRecordsWithinRange(encounterCreatedAt, "Last Month");
	const encounterGrowth = getComparison(thisMonthEncounters, lastMonthEncounters);

	return [
		{
			label: TOTAL_PATIENTS_LABEL,
			value: stats.totalPatients,
			growth: patientGrowth,
		},
		{
			label: TRANSFERRED_RECORDS_LABEL,
			value: stats.transferredRecords,
			growth: transferredGrowth,
		},
		{
			label: PENDING_TRANSFERS_LABEL,
			value: stats.pendingTransfers,
			growth: pendingTransfersGrowth,
		},
		{
			label: NEW_ENCOUNTERS_LABEL,
			value: thisMonthEncounters,
			growth: encounterGrowth,
		},
	];
}

export function Cards({ stats }: { stats: OverviewStats }) {
	const [patientCreatedAt] = useState(() =>
		stats.patientCreatedAt.map((createdAt) => new Date(createdAt)),
	);
	const [patientTransferredAt] = useState(() =>
		stats.patientTransferredAt.map((transferredAt) => new Date(transferredAt)),
	);
	const [pendingTransferredAt] = useState(() =>
		stats.pendingTransferredAt.map((transferredAt) => new Date(transferredAt)),
	);
	const [encounterCreatedAt] = useState(() =>
		stats.encounterCreatedAt.map((createdAt) => new Date(createdAt)),
	);

	const cards = useMemo(() => {
		return getOverviewCards(
			stats,
			patientCreatedAt,
			patientTransferredAt,
			pendingTransferredAt,
			encounterCreatedAt,
		);
	}, [stats, patientCreatedAt, patientTransferredAt, pendingTransferredAt, encounterCreatedAt]);

	return (
		<div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
			{cards.map((card) => {
				const diff = card.growth?.difference ?? 0;

				return (
					<div key={card.label} className="rounded-xl bg-gray-50 ring ring-gray-200">
						<div className="flex h-9 items-center px-3">
							<p className="text-sm text-gray-400">{card.label}</p>
						</div>
						<div className="rounded-xl bg-white px-3 py-4 ring ring-gray-200">
							<p className="text-[2rem] font-semibold text-gray-800">{formatStat(card.value)}</p>
							<div className="mt-2 flex items-center gap-2 text-sm font-medium">
								<span
									className={cn(
										diff > 0 ? "text-emerald-600" : diff < 0 ? "text-red-600" : "text-gray-400",
									)}
								>
									{diff > 0 ? "+" : ""}
									{card.growth?.percentChange}%
								</span>
								<span className="text-gray-400">vs last month</span>
							</div>
						</div>
					</div>
				);
			})}
		</div>
	);
}
