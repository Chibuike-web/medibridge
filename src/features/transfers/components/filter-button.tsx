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
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils/cn";
import { useState } from "react";
import type { TransferStatusFilter } from "../types";

import { RiArrowRightSLine, RiCalendarLine, RiFilter3Line, RiMenLine } from "@remixicon/react";

type TransferFilterSubmenu = "status" | "requested-at";

const transferStatusFilterOptions: { label: string; value: TransferStatusFilter }[] = [
	{ label: "Pending", value: "pending" },
	{ label: "Rejected", value: "rejected" },
	{ label: "Completed", value: "completed" },
	{ label: "Failed", value: "failed" },
	{ label: "Cancelled", value: "cancelled" },
];

export function FilterButton({
	requestedFrom,
	requestedTo,
	isPending,
	onRequestedAtRangeApply,
	onStatusFiltersChange,
	statusFilters,
}: {
	requestedFrom: string;
	requestedTo: string;
	isPending: boolean;
	onRequestedAtRangeApply: (requestedFrom: string, requestedTo: string) => void;
	onStatusFiltersChange: (statusFilters: TransferStatusFilter[]) => void;
	statusFilters: TransferStatusFilter[];
}) {
	const [activeFilterSubmenu, setActiveFilterSubmenu] = useState<TransferFilterSubmenu | null>(
		null,
	);
	const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
	const [customDateRangeFilter, setCustomDateRangeFilter] = useState<DateRangeFilter | null>(null);

	return (
		<>
			<DropdownMenu
				open={isFilterMenuOpen}
				onOpenChange={(nextIsFilterMenuOpen) => {
					setIsFilterMenuOpen(nextIsFilterMenuOpen);

					if (!nextIsFilterMenuOpen) {
						setActiveFilterSubmenu(null);
					}
				}}
			>
				<DropdownMenuTrigger asChild>
					<Button variant="outline" className="bg-white text-gray-600 hover:bg-gray-50">
						<RiFilter3Line aria-hidden className="size-4 text-gray-600" />
						Filter
					</Button>
				</DropdownMenuTrigger>

				<DropdownMenuContent
					onPointerLeave={() => setActiveFilterSubmenu(null)}
					align="end"
					className="relative w-[13.75rem] overflow-visible rounded-xl border-gray-200 bg-white text-sm text-gray-700 shadow-xl"
				>
					<DropdownMenuItem
						data-active={activeFilterSubmenu === "status"}
						onFocus={() => setActiveFilterSubmenu("status")}
						onPointerEnter={() => setActiveFilterSubmenu("status")}
						onSelect={(event) => event.preventDefault()}
						className="h-8 rounded-lg py-0 text-gray-600 focus:bg-gray-100 focus:text-gray-900 data-[active=true]:bg-gray-100"
					>
						<RiMenLine className="size-4" />
						<span className="flex-1">Status</span>
						<RiArrowRightSLine className="size-4" aria-hidden="true" />
					</DropdownMenuItem>

					<DropdownMenuItem
						data-active={activeFilterSubmenu === "requested-at"}
						onFocus={() => setActiveFilterSubmenu("requested-at")}
						onPointerEnter={() => setActiveFilterSubmenu("requested-at")}
						onSelect={(event) => event.preventDefault()}
						className="mb-0 h-8 rounded-lg py-0 text-gray-600 focus:bg-gray-100 focus:text-gray-900 data-[active=true]:bg-gray-100"
					>
						<RiCalendarLine className="size-4" />
						<span className="flex-1">Requested at</span>
						<RiArrowRightSLine className="size-4" aria-hidden="true" />
					</DropdownMenuItem>

					<div
						id="transfer-filter-submenu-panel"
						aria-hidden={activeFilterSubmenu === null}
						className={cn(
							"absolute top-0 right-[100%] z-50 w-[13.75rem] max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-gray-200 bg-white text-sm text-gray-700 shadow-xl transition-[translate,opacity] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none",
							activeFilterSubmenu === "requested-at" ? "translate-y-9" : "translate-y-0",
							activeFilterSubmenu === null ? "pointer-events-none opacity-0" : "opacity-100",
						)}
					>
						<div hidden={activeFilterSubmenu !== "status"} className="p-1">
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
											disabled={isPending}
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
						</div>

						<div hidden={activeFilterSubmenu !== "requested-at"} className="p-1">
							<DateRangeMenuItems
								from={requestedFrom}
								to={requestedTo}
								onDateRangeApply={onRequestedAtRangeApply}
								onCustomDateRangeSelect={setCustomDateRangeFilter}
							/>
						</div>
					</div>
				</DropdownMenuContent>
			</DropdownMenu>
			<SetDateRangeDialog
				dateRangeFilter={customDateRangeFilter}
				onClose={() => setCustomDateRangeFilter(null)}
			/>
		</>
	);
}
