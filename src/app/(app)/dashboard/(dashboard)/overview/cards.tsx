import { formatStat } from "@/lib/utils/format-stat";
import type { OverviewStats } from "@/lib/api/get-overview-stats";
import { cn } from "@/lib/utils/cn";

const TOTAL_PATIENTS_LABEL = "Total No. of Patients";
const COMPLETED_TRANSFERS_LABEL = "Completed Transfers";
const PENDING_TRANSFERS_LABEL = "Pending Transfers";
const NEW_ENCOUNTERS_LABEL = "New Encounter";

function getComparison(currentCount: number, previousCount: number) {
	const difference = currentCount - previousCount;
	const percentChange =
		previousCount > 0 ? Math.round((difference / previousCount) * 100) : currentCount > 0 ? 100 : 0;

	return { difference, percentChange };
}

export function Cards({ stats }: { stats: OverviewStats }) {
	const cards = [
		{
			label: TOTAL_PATIENTS_LABEL,
			value: stats.patients.total,
			growth: getComparison(stats.patients.thisMonth, stats.patients.lastMonth),
		},
		{
			label: COMPLETED_TRANSFERS_LABEL,
			value: stats.completedTransfers.total,
			growth: getComparison(stats.completedTransfers.thisMonth, stats.completedTransfers.lastMonth),
		},
		{
			label: PENDING_TRANSFERS_LABEL,
			value: stats.pendingTransfers.total,
			growth: getComparison(stats.pendingTransfers.thisMonth, stats.pendingTransfers.lastMonth),
		},
		{
			label: NEW_ENCOUNTERS_LABEL,
			value: stats.encounters.thisMonth,
			growth: getComparison(stats.encounters.thisMonth, stats.encounters.lastMonth),
		},
	];

	return (
		<div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
			{cards.map((card) => {
				const diff = card.growth.difference;

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
									{card.growth.percentChange}%
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
