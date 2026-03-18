"use client";

import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { countPatientsWithinRange } from "@/lib/utils/count-patients-within-range";
import { formatStat } from "@/lib/utils/format-stat";
import { getRangeLabel } from "@/lib/utils/get-range-label";
import { OverviewStats } from "@/services/patient/types";
import { useState } from "react";

type OverviewClientProps = {
	stats: OverviewStats;
};

function getOverviewCards(
	stats: OverviewStats,
	patientCreatedAt: Date[],
	selectedDuration: Record<string, string>,
) {
	return [
		{
			label: "Total No. of Patients",
			value: patientCreatedAt.length || stats.totalPatients,
			rangeLabel: "All time",
		},
		{
			label: "Transferred Records",
			value: selectedDuration["Transferred Records"]
				? countPatientsWithinRange(patientCreatedAt, selectedDuration["Transferred Records"])
				: stats.transferredRecords,
			rangeLabel: getRangeLabel(selectedDuration["Transferred Records"]),
		},
		{
			label: "New patients",
			value: selectedDuration["New patients"]
				? countPatientsWithinRange(patientCreatedAt, selectedDuration["New patients"])
				: stats.newPatients,
			rangeLabel: getRangeLabel(selectedDuration["New patients"] || "Last 7 days"),
		},
	] as const;
}

const durationGroups = [
	{
		label: "Quick ranges",
		items: ["This Month", "Last Month", "Last 3 Months", "Last 6 Months", "This Year", "Last Year"],
	},
	{
		label: "Custom",
		items: ["Custom Range"],
	},
];
export function OverviewClient({ stats }: OverviewClientProps) {
	const [selectedDuration, setSelectedDuration] = useState<Record<string, string>>({});
	const [patientCreatedAt] = useState(() =>
		stats.patientCreatedAt.map((createdAt) => new Date(createdAt)),
	);

	return (
		<div className="flex h-full flex-col">
			<header className="border-b border-gray-200 bg-white">
				<div className="mx-auto flex w-full items-center px-8 h-16">
					<h1 className="text-xl font-semibold text-balance text-gray-950 tracking-[-0.015em]">
						Overview
					</h1>
				</div>
			</header>

			<section className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-6 py-8 lg:px-10">
				<div className="grid gap-4 xl:grid-cols-3">
					{getOverviewCards(stats, patientCreatedAt, selectedDuration).map((card) => (
						<div
							key={card.label}
							className="rounded-[12px] overflow-hidden outline outline-gray-200 bg-gray-100"
						>
							<div className="p-3 flex items-center justify-between">
								<p className="text-sm text-gray-400">{card.label}</p>
								{card.label === "Total No. of Patients" ? null : (
									<DropdownMenu>
										<DropdownMenuTrigger className="text-[12px] outline outline-gray-200 bg-white no-line-height p-[6px] rounded-[4px] text-gray-400">
											{selectedDuration[card.label] || "Select duration"}
										</DropdownMenuTrigger>
										<DropdownMenuContent>
											{durationGroups.map((group, i) => (
												<DropdownMenuGroup key={group.label}>
													<DropdownMenuLabel className="text-gray-400 font-normal text-[12px]">
														{group.label}
													</DropdownMenuLabel>

													{group.items.map((item) => (
														<DropdownMenuItem
															key={item}
															onClick={() =>
																setSelectedDuration((prev) => ({ ...prev, [card.label]: item }))
															}
														>
															{item}
														</DropdownMenuItem>
													))}

													{i !== durationGroups.length - 1 && <DropdownMenuSeparator />}
												</DropdownMenuGroup>
											))}
										</DropdownMenuContent>
									</DropdownMenu>
								)}
							</div>
							<div className="bg-white rounded-[12px] px-3 pt-6 outline outline-gray-200">
								<p className="text-4xl font-semibold text-gray-950">{formatStat(card.value)}</p>
								<div className="mt-4 border-t border-gray-100 py-[14px] text-sm text-pretty text-gray-600">
									<p>{card.rangeLabel}</p>
									<div></div>
								</div>
							</div>
						</div>
					))}
				</div>
			</section>
		</div>
	);
}
