"use client";

import { createContext, use, useRef, useState, type ReactNode } from "react";
import { RiCloseLine, RiFilter3Line, type RemixiconComponentType } from "@remixicon/react";

import {
	DateRangeButtons,
	DateRangeMenuItems,
	type DateRangeFilter,
} from "@/components/date-range-filter";
import { Button } from "@/components/ui/button";
import {
	Drawer,
	DrawerClose,
	DrawerContent,
	DrawerHeader,
	DrawerTitle,
	DrawerTrigger,
} from "@/components/ui/drawer";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useMediaQuery } from "@/hooks/use-media-query";

const FILTER_MENU_WIDTH_REM = 13.75;

const CloseFilterDrawerContext = createContext<(() => void) | null>(null);

function getFilterMenuAlign(trigger: HTMLButtonElement) {
	const remInPixels = parseFloat(getComputedStyle(document.documentElement).fontSize);
	const menuWidth = FILTER_MENU_WIDTH_REM * remInPixels;
	return trigger.getBoundingClientRect().left + menuWidth <= window.innerWidth ? "start" : "end";
}

export function FilterGroup({
	activeFilterCount,
	children,
}: {
	activeFilterCount: number;
	children: ReactNode;
}) {
	const isMobile = useMediaQuery("(width < 48rem)");
	const [isDrawerOpen, setIsDrawerOpen] = useState(false);

	if (!isMobile) {
		return children;
	}

	return (
		<Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
			<DrawerTrigger asChild>
				<Button variant="outline" className="flex-1 bg-white text-gray-600 hover:bg-gray-50">
					<RiFilter3Line aria-hidden className="size-4 text-gray-600" />
					Filters
					{activeFilterCount > 0 ? (
						<span className="text-gray-500">({activeFilterCount})</span>
					) : null}
				</Button>
			</DrawerTrigger>
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
				<div className="flex flex-col gap-3 overflow-y-auto p-2">
					<CloseFilterDrawerContext value={() => setIsDrawerOpen(false)}>
						{children}
					</CloseFilterDrawerContext>
				</div>
			</DrawerContent>
		</Drawer>
	);
}

export function FilterPopover({
	label,
	icon: Icon,
	children,
}: {
	label: string;
	icon: RemixiconComponentType;
	children: ReactNode;
}) {
	const closeFilterDrawer = use(CloseFilterDrawerContext);
	const triggerRef = useRef<HTMLButtonElement>(null);
	const [align, setAlign] = useState<"start" | "end">("start");

	if (closeFilterDrawer) {
		return (
			<div>
				<h3 className="px-2 py-1.5 font-medium text-gray-800">{label}</h3>
				{children}
			</div>
		);
	}

	return (
		<Popover
			onOpenChange={(isOpen) => {
				if (isOpen && triggerRef.current) setAlign(getFilterMenuAlign(triggerRef.current));
			}}
		>
			<PopoverTrigger asChild>
				<Button
					ref={triggerRef}
					variant="outline"
					className="w-max bg-white text-gray-600 hover:bg-gray-50"
				>
					<Icon aria-hidden className="size-4 text-gray-600" />
					{label}
				</Button>
			</PopoverTrigger>
			<PopoverContent align={align} className="w-[13.75rem] p-1 text-sm text-gray-700">
				{children}
			</PopoverContent>
		</Popover>
	);
}

export function DateFilterMenu({
	label,
	icon: Icon,
	from,
	to,
	onDateRangeApply,
	onCustomDateRangeSelect,
}: DateRangeFilter & {
	label: string;
	icon: RemixiconComponentType;
	onCustomDateRangeSelect: (dateRangeFilter: DateRangeFilter) => void;
}) {
	const closeFilterDrawer = use(CloseFilterDrawerContext);
	const triggerRef = useRef<HTMLButtonElement>(null);
	const [align, setAlign] = useState<"start" | "end">("start");

	if (closeFilterDrawer) {
		return (
			<div>
				<h3 className="px-2 py-1.5 font-medium text-gray-800">{label}</h3>
				<DateRangeButtons
					from={from}
					to={to}
					onDateRangeApply={onDateRangeApply}
					onCustomDateRangeSelect={(dateRangeFilter) => {
						closeFilterDrawer();
						onCustomDateRangeSelect(dateRangeFilter);
					}}
				/>
			</div>
		);
	}

	return (
		<DropdownMenu
			onOpenChange={(isOpen) => {
				if (isOpen && triggerRef.current) setAlign(getFilterMenuAlign(triggerRef.current));
			}}
		>
			<DropdownMenuTrigger asChild>
				<Button
					ref={triggerRef}
					variant="outline"
					className="w-max bg-white text-gray-600 hover:bg-gray-50"
				>
					<Icon aria-hidden className="size-4 text-gray-600" />
					{label}
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent
				align={align}
				className="w-[13.75rem] rounded-xl bg-white text-sm text-gray-700"
			>
				<DateRangeMenuItems
					from={from}
					to={to}
					onDateRangeApply={onDateRangeApply}
					onCustomDateRangeSelect={onCustomDateRangeSelect}
				/>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
