"use client";

import { useState, type ReactNode } from "react";
import { RiCloseLine, RiFilter3Line } from "@remixicon/react";

import { DateRangeButtons, type DateRangeFilter } from "@/components/date-range-filter";
import { Button } from "@/components/ui/button";
import {
	Drawer,
	DrawerClose,
	DrawerContent,
	DrawerHeader,
	DrawerTitle,
} from "@/components/ui/drawer";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useMediaQuery } from "@/hooks/use-media-query";

export function FilterGroup({
	activeFilterCount,
	children,
}: {
	activeFilterCount: number;
	children: ReactNode;
}) {
	const isMobile = useMediaQuery("(width < 48rem)");
	const [isDrawerOpen, setIsDrawerOpen] = useState(false);

	if (!isMobile && isDrawerOpen) {
		setIsDrawerOpen(false);
	}

	return (
		<>
			<Popover>
				<PopoverTrigger asChild>
					<Button
						variant="outline"
						className="bg-white text-gray-600 hover:bg-gray-50 active:scale-100 max-md:flex-1"
						onClick={(event) => {
							if (isMobile) {
								event.preventDefault();
								setIsDrawerOpen(true);
							}
						}}
					>
						<RiFilter3Line aria-hidden className="size-4 text-gray-600" />
						Filters
						{activeFilterCount > 0 ? (
							<span className="text-gray-500">({activeFilterCount})</span>
						) : null}
					</Button>
				</PopoverTrigger>
				<PopoverContent
					aria-label="Filters"
					className="flex max-h-[min(25rem,var(--radix-popover-content-available-height))] w-72 flex-col gap-3 overflow-y-auto py-2 pr-0.5 pl-2 text-sm text-gray-700 max-md:hidden"
				>
					{children}
				</PopoverContent>
			</Popover>
			<Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
				<DrawerContent
					aria-describedby={undefined}
					className="max-w-none overflow-hidden text-sm text-gray-700 shadow-[0_2rem_2rem_-1.25rem_rgba(0,0,0,0.25)] data-[vaul-drawer-direction=bottom]:inset-x-4 data-[vaul-drawer-direction=bottom]:bottom-4 data-[vaul-drawer-direction=bottom]:rounded-2xl data-[vaul-drawer-direction=bottom]:border"
				>
					<DrawerHeader className="flex-row items-center justify-between border-b border-gray-200 text-left">
						<DrawerTitle className="leading-[1.2] text-gray-800">Filters</DrawerTitle>
						<DrawerClose asChild>
							<Button variant="ghost" size="icon" aria-label="Close filters">
								<RiCloseLine aria-hidden="true" />
							</Button>
						</DrawerClose>
					</DrawerHeader>
					<div className="flex flex-col gap-3 overflow-y-auto py-2 pr-0.5 pl-2">{children}</div>
				</DrawerContent>
			</Drawer>
		</>
	);
}

export function FilterSection({ label, children }: { label: string; children: ReactNode }) {
	return (
		<div role="group" aria-label={label}>
			<h3 className="px-2 py-1.5 font-medium text-gray-800">{label}</h3>
			{children}
		</div>
	);
}

export function DateFilterSection({
	label,
	from,
	to,
	onDateRangeApply,
	onCustomDateRangeSelect,
}: DateRangeFilter & {
	label: string;
	onCustomDateRangeSelect: (dateRangeFilter: DateRangeFilter) => void;
}) {
	return (
		<FilterSection label={label}>
			<DateRangeButtons
				from={from}
				to={to}
				onDateRangeApply={onDateRangeApply}
				onCustomDateRangeSelect={onCustomDateRangeSelect}
			/>
		</FilterSection>
	);
}
