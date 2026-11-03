"use client";

import {
	DateRangeMenuItems,
	SetDateRangeDialog,
	type DateRangeFilter,
} from "@/components/date-range-filter";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
			<Popover>
				<PopoverTrigger asChild>
					<Button variant="outline" className="bg-white text-gray-600 hover:bg-gray-50">
						<RiMenLine aria-hidden className="size-4 text-gray-600" />
						Status
					</Button>
				</PopoverTrigger>
				<PopoverContent align="end" className="w-[13.75rem] p-1 text-sm text-gray-700">
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
				</PopoverContent>
			</Popover>

			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button variant="outline" className="bg-white text-gray-600 hover:bg-gray-50">
						<RiCalendarLine aria-hidden className="size-4 text-gray-600" />
						Requested at
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent
					align="end"
					className="w-[13.75rem] rounded-xl bg-white text-sm text-gray-700"
				>
					<DateRangeMenuItems
						from={requestedFrom}
						to={requestedTo}
						onDateRangeApply={onRequestedAtRangeApply}
						onCustomDateRangeSelect={setCustomDateRangeFilter}
					/>
				</DropdownMenuContent>
			</DropdownMenu>
			<SetDateRangeDialog
				dateRangeFilter={customDateRangeFilter}
				onClose={() => setCustomDateRangeFilter(null)}
			/>
		</>
	);
}
