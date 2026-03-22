"use client";

import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { countRecordsWithinRange } from "@/lib/utils/count-records-within-range";
import { formatStat } from "@/lib/utils/format-stat";
import { getRangeLabel } from "@/lib/utils/get-range-label";
import { OverviewStats } from "@/services/patient/types";
import { useState } from "react";
import { RiArrowDownSLine } from "@remixicon/react";

type OverviewClientProps = {
	stats: OverviewStats;
};

const TOTAL_PATIENTS_LABEL = "Total No. of Patients";
const TRANSFERRED_RECORDS_LABEL = "Transferred Records";
const NEW_PATIENTS_LABEL = "New patients";

function getPatientGrowth(patientCreatedAt: Date[]) {
	const thisMonthCount = countRecordsWithinRange(patientCreatedAt, "This Month");
	const lastMonthCount = countRecordsWithinRange(patientCreatedAt, "Last Month");
	const difference = thisMonthCount - lastMonthCount;
	const percentChange =
		lastMonthCount > 0
			? Math.round((difference / lastMonthCount) * 100)
			: thisMonthCount > 0
				? 100
				: 0;

	return { thisMonthCount, difference, percentChange };
}

function getOverviewCards(
	stats: OverviewStats,
	patientCreatedAt: Date[],
	selectedDuration: Record<string, string>,
) {
	const transferredRecordsDuration =
		selectedDuration[TRANSFERRED_RECORDS_LABEL] ?? durationGroups[0];

	const newPatientsDuration = selectedDuration[NEW_PATIENTS_LABEL] ?? durationGroups[0];

	const patientGrowth = getPatientGrowth(patientCreatedAt);

	return [
		{
			label: TOTAL_PATIENTS_LABEL,
			value: stats.totalPatients,
			growth: patientGrowth,
		},
		{
			label: TRANSFERRED_RECORDS_LABEL,
			value: transferredRecordsDuration
				? countRecordsWithinRange(patientCreatedAt, transferredRecordsDuration)
				: stats.transferredRecords,
			rangeLabel: getRangeLabel(transferredRecordsDuration),
		},
		{
			label: NEW_PATIENTS_LABEL,
			value: newPatientsDuration
				? countRecordsWithinRange(patientCreatedAt, newPatientsDuration)
				: stats.newPatients,
			rangeLabel: getRangeLabel(newPatientsDuration),
		},
	];
}

const durationGroups = [
	"Last 7 Days",
	"This Month",
	"Last Month",
	"Last 3 Months",
	"Last 6 Months",
	"This Year",
	"Last Year",
];
export function OverviewClient({ stats }: OverviewClientProps) {
	const [selectedDuration, setSelectedDuration] = useState<Record<string, string>>({});
	const [patientCreatedAt] = useState(() =>
		stats.patientCreatedAt.map((createdAt) => new Date(createdAt)),
	);

	return (
		<div className="flex h-full flex-col">
			<header className="border-b border-gray-200 bg-white px-8 h-16 flex items-center">
				<h1 className="text-xl font-semibold text-balance text-gray-950 tracking-[-0.015em]">
					Overview
				</h1>
			</header>

			<section className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-6 py-8 lg:px-10">
				<div className="grid gap-4 xl:grid-cols-3">
					{getOverviewCards(stats, patientCreatedAt, selectedDuration).map((card) => (
						<div
							key={card.label}
							className="rounded-[12px] overflow-hidden outline outline-gray-200 bg-gray-100"
						>
							<div className="px-3 h-12 flex items-center justify-between">
								<p className="text-sm text-gray-400">{card.label}</p>
								{card.label === TOTAL_PATIENTS_LABEL ? null : (
									<DropdownMenu>
										<DropdownMenuTrigger className="group text-[12px] outline outline-gray-200 bg-white no-line-height px-[6px] h-6 rounded-[4px] text-gray-400 flex items-center">
											<span>
												{(selectedDuration[card.label] ?? durationGroups[0]) || "Select duration"}
											</span>
											<RiArrowDownSLine className="size-4 transition-transform group-data-[state=open]:rotate-180" />
										</DropdownMenuTrigger>
										<DropdownMenuContent>
											{durationGroups.map((item, index) => (
												<DropdownMenuItem
													key={index}
													onClick={() =>
														setSelectedDuration((prev) => ({ ...prev, [card.label]: item }))
													}
												>
													{item}
												</DropdownMenuItem>
											))}
										</DropdownMenuContent>
									</DropdownMenu>
								)}
							</div>
							<div className="bg-white rounded-[12px] px-3 pt-6 outline outline-gray-200 h-full">
								<p className="text-4xl font-semibold text-gray-950">{formatStat(card.value)}</p>
								<div className="mt-4 border-t border-gray-100 py-[14px] text-sm text-pretty text-gray-600">
									{card.label === TOTAL_PATIENTS_LABEL ? (
										<div className="flex items-center justify-between gap-3">
											<p className="text-gray-400">
												{card.growth?.thisMonthCount} added this month
											</p>
											<div>
												<span>
													{card.growth?.difference && card.growth.difference >= 0 ? "+" : ""}
													{card.growth?.percentChange}%
												</span>
												<span>vs last month</span>
											</div>
										</div>
									) : (
										<p>{card.rangeLabel}</p>
									)}
								</div>
							</div>
						</div>
					))}
				</div>
			</section>
		</div>
	);
}
