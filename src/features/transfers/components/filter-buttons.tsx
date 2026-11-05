"use client";

import { DateFilterMenu, FilterGroup, FilterPopover } from "@/components/filter-menu";

import { SetDateRangeDialog, type DateRangeFilter } from "@/components/date-range-filter";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import type { TransferStatusFilter } from "../types";

import { RiCalendarLine, RiMenLine } from "@remixicon/react";

const transferStatusFilterOptions: { label: string; value: TransferStatusFilter }[] = [
	{ label: "Pending", value: "pending" },
	{ label: "Rejected", value: "rejected" },
	{ label: "Completed", value: "completed" },
	{ label: "Failed", value: "failed" },
	{ label: "Cancelled", value: "cancelled" },
];

export function FilterButtons({
	requestedFrom,
	requestedTo,
	onRequestedAtRangeApply,
	onStatusFiltersChange,
	statusFilters,
}: {
	requestedFrom: string;
	requestedTo: string;
	onRequestedAtRangeApply: (requestedFrom: string, requestedTo: string) => void;
	onStatusFiltersChange: (statusFilters: TransferStatusFilter[]) => void;
	statusFilters: TransferStatusFilter[];
}) {
	const [customDateRangeFilter, setCustomDateRangeFilter] = useState<DateRangeFilter | null>(null);

	return (
		<>
			<FilterGroup
				activeFilterCount={
					(statusFilters.length > 0 ? 1 : 0) + (requestedFrom || requestedTo ? 1 : 0)
				}
			>
				<FilterPopover label="Status" icon={RiMenLine}>
					{transferStatusFilterOptions.map((statusOption) => {
						const isStatusSelected = statusFilters.includes(statusOption.value);
						const statusOptionId = `status-${statusOption.value}`;

						return (
							<Label
								key={statusOption.value}
								htmlFor={statusOptionId}
								className="flex h-8 w-full cursor-pointer items-center gap-2 rounded-lg px-2 leading-normal font-normal hover:bg-gray-100"
							>
								<Checkbox
									id={statusOptionId}
									checked={isStatusSelected}
									onCheckedChange={(checked) => {
										onStatusFiltersChange(
											checked === true
												? [...statusFilters, statusOption.value]
												: statusFilters.filter(
														(statusFilter) => statusFilter !== statusOption.value,
													),
										);
									}}
									className="[&_svg]:!text-current"
								/>
								<span>{statusOption.label}</span>
							</Label>
						);
					})}
				</FilterPopover>

				<DateFilterMenu
					label="Requested at"
					icon={RiCalendarLine}
					from={requestedFrom}
					to={requestedTo}
					onDateRangeApply={onRequestedAtRangeApply}
					onCustomDateRangeSelect={setCustomDateRangeFilter}
				/>
			</FilterGroup>
			<SetDateRangeDialog
				dateRangeFilter={customDateRangeFilter}
				onClose={() => setCustomDateRangeFilter(null)}
			/>
		</>
	);
}
