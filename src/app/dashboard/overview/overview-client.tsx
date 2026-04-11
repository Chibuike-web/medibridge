"use client";

import { countRecordsWithinRange } from "@/lib/utils/count-records-within-range";
import { formatStat } from "@/lib/utils/format-stat";
import { getRangeLabel } from "@/lib/utils/get-range-label";
import { OverviewStats } from "@/services/patient/types";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils/cn";
import { RiArrowDownLine, RiArrowUpLine } from "@remixicon/react";
import { useStats } from "./stats-context";
import { RecentPatientsTable } from "@/features/patients/components/recent-patients-table";
import { RecentTransfersTable } from "@/features/transfers/components/recent-transfers-table";

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

export function OverviewClient() {
	return (
		<div className="flex h-full flex-col">
			<header className="border-b border-gray-200 bg-white px-8 h-16 flex items-center sticky top-0 z-20 shrink-0">
				<h1 className="text-xl font-semibold text-balance text-gray-800 tracking-[-0.015em]">
					Overview
				</h1>
			</header>
			<div className="min-h-0 flex-1 overflow-y-auto">
				<section className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-6 py-8 lg:px-10">
					<Cards />
					<RecentPatientsTable />
					<RecentTransfersTable />
				</section>
			</div>
		</div>
	);
}

function Cards() {
	const stats = useStats();
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
			{cards.map((card) => (
				<div key={card.label} className="rounded-[12px] bg-gray-100">
					<div className="px-3 h-10 flex items-center">
						<p className="text-sm text-gray-400">{card.label}</p>
					</div>
					<div className="bg-white rounded-[12px] px-3 pt-6 border border-gray-200">
						<p className="text-4xl font-semibold text-gray-800">{formatStat(card.value)}</p>
						<div className="mt-4 border-t border-gray-100 py-[14px] text-sm text-pretty text-gray-600">
							<div className="flex items-center justify-between gap-3 font-medium">
								<p className="text-gray-400">{card.rangeLabel}</p>
								<span
									className={cn(
										"inline-flex items-center gap-1",
										card.growth?.difference && card.growth.difference > 0
											? "text-emerald-600"
											: card.growth?.difference && card.growth.difference < 0
												? "text-red-600"
												: "text-gray-400",
									)}
								>
									{card.growth?.percentChange}%
									{card.growth?.difference && card.growth.difference > 0 ? (
										<RiArrowUpLine className="size-4" />
									) : card.growth?.difference && card.growth.difference < 0 ? (
										<RiArrowDownLine className="size-4" />
									) : null}
									{card.growth?.difference && card.growth.difference >= 0 ? "+" : ""}
								</span>
							</div>
						</div>
					</div>
				</div>
			))}
		</div>
	);
}
