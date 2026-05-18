"use client";

import { countRecordsWithinRange } from "@/lib/utils/count-records-within-range";
import { formatStat } from "@/lib/utils/format-stat";
import { getRangeLabel } from "@/lib/utils/get-range-label";
import { OverviewStats } from "@/services/patient/types";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils/cn";
import { RiArrowDownLine, RiArrowUpLine } from "@remixicon/react";

const TOTAL_PATIENTS_LABEL = "Total No. of Patients";
const TRANSFERRED_RECORDS_LABEL = "Transferred Records";
const PENDING_TRANSFERS_LABEL = "Pending Transfers";
const DEFAULT_CARD_DURATION = "This Month";
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

	return [
		{
			label: TOTAL_PATIENTS_LABEL,
			value: stats.totalPatients,
			growth: patientGrowth,
			rangeLabel: getRangeLabel(DEFAULT_CARD_DURATION),
		},
		{
			label: TRANSFERRED_RECORDS_LABEL,
			value: stats.transferredRecords,
			growth: transferredGrowth,
			rangeLabel: getRangeLabel(DEFAULT_CARD_DURATION),
		},
		{
			label: PENDING_TRANSFERS_LABEL,
			value: stats.pendingTransfers,
			growth: pendingTransfersGrowth,
			rangeLabel: getRangeLabel(DEFAULT_CARD_DURATION),
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

	const cards = useMemo(() => {
		return getOverviewCards(stats, patientCreatedAt, patientTransferredAt, pendingTransferredAt);
	}, [stats, patientCreatedAt, patientTransferredAt, pendingTransferredAt]);

	return (
		<div className="grid gap-4 xl:grid-cols-3">
			{cards.map((card) => {
				const diff = card.growth?.difference ?? 0;

				return (
					<div key={card.label} className="rounded-xl bg-gray-50 ring ring-gray-200">
						<div className="px-3 h-10 flex items-center">
							<p className="text-sm text-gray-400">{card.label}</p>
						</div>
						<div className="rounded-xl bg-white px-3 pt-6 ring ring-gray-200">
							<p className="text-4xl font-semibold text-gray-800">{formatStat(card.value)}</p>
							<div className="mt-4 border-t border-gray-200 py-3.5 text-sm text-pretty text-gray-600">
								<div className="flex items-center justify-between gap-3 font-medium">
									<p className="text-gray-400">{card.rangeLabel}</p>
									<span
										className={cn(
											"inline-flex items-center gap-1",
											diff > 0 ? "text-emerald-600" : diff < 0 ? "text-red-600" : "text-gray-400",
										)}
									>
										{diff > 0 ? "+" : ""}
										{card.growth?.percentChange}%
										{diff > 0 ? (
											<RiArrowUpLine className="size-4" />
										) : diff < 0 ? (
											<RiArrowDownLine className="size-4" />
										) : null}
									</span>
								</div>
							</div>
						</div>
					</div>
				);
			})}
		</div>
	);
}
