"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils/cn";
import { parseDateParam } from "@/lib/utils/parse-date-param";
import { endOfDay, format, isSameDay, startOfDay, subDays } from "date-fns";
import { useState } from "react";
import type { DateRange } from "react-day-picker";
import type { TransferStatusFilter } from "../types";

import {
	RiArrowRightLine,
	RiArrowRightSLine,
	RiCalendarLine,
	RiCheckLine,
	RiFilter3Line,
	RiMenLine,
} from "@remixicon/react";

type TransferRequestedAtFilterPreset = {
	label: string;
	getRange: (today: Date) => TransferRequestedAtCompleteRange;
};

type TransferRequestedAtCompleteRange = {
	from: Date;
	to: Date;
};

type TransferFilterSubmenu = "status" | "requested-at";

const transferStatusFilterOptions: { label: string; value: TransferStatusFilter }[] = [
	{ label: "Pending", value: "pending" },
	{ label: "Rejected", value: "rejected" },
	{ label: "Completed", value: "completed" },
	{ label: "Failed", value: "failed" },
	{ label: "Cancelled", value: "cancelled" },
];

const transferRequestedAtFilterPresets: TransferRequestedAtFilterPreset[] = [
	{
		label: "Today",
		getRange: (today) => ({ from: startOfDay(today), to: endOfDay(today) }),
	},
	{
		label: "Last 7 days",
		getRange: (today) => ({ from: startOfDay(subDays(today, 6)), to: endOfDay(today) }),
	},
	{
		label: "Last 30 days",
		getRange: (today) => ({ from: startOfDay(subDays(today, 29)), to: endOfDay(today) }),
	},
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
	const [activeFilterSubmenu, setActiveFilterSubmenu] = useState<TransferFilterSubmenu | null>(null);
	const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);

	return (
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
				<Button
					variant="outline"
					className="bg-white text-sm text-gray-600 hover:bg-gray-50"
				>
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
					className="h-9 rounded-lg py-0 text-gray-600 focus:bg-gray-100 focus:text-gray-900 data-[active=true]:bg-gray-100"
				>
					<RiMenLine className="size-4.5" />
					<span>Status</span>
					<RiArrowRightSLine className="ml-auto size-4.5" aria-hidden="true" />
				</DropdownMenuItem>

				<DropdownMenuItem
					data-active={activeFilterSubmenu === "requested-at"}
					onFocus={() => setActiveFilterSubmenu("requested-at")}
					onPointerEnter={() => setActiveFilterSubmenu("requested-at")}
					onSelect={(event) => event.preventDefault()}
					className="h-9 rounded-lg py-0 text-gray-600 focus:bg-gray-100 focus:text-gray-900 data-[active=true]:bg-gray-100"
				>
					<RiCalendarLine className="size-4.5" />
					<span>Requested at</span>
					<RiArrowRightSLine className="ml-auto size-4.5" aria-hidden="true" />
				</DropdownMenuItem>

				<div
					id="transfer-filter-submenu-panel"
					aria-hidden={activeFilterSubmenu === null}
					className={cn(
						"absolute top-0 right-[100%] z-50 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-gray-200 bg-white text-sm text-gray-700 shadow-xl transition-[transform,opacity] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none",
						activeFilterSubmenu === "requested-at" ? "w-max" : "w-[13.75rem]",
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
									className="flex h-9 w-full cursor-pointer items-center gap-2 rounded-lg px-2 leading-normal font-normal hover:bg-gray-100"
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

					<div hidden={activeFilterSubmenu !== "requested-at"}>
						<RequestedAtFilterContent />
					</div>
				</div>
			</DropdownMenuContent>
		</DropdownMenu>
	);

	function RequestedAtFilterContent() {
		return (
			<div className="flex w-max">
				<div className="flex w-50 shrink-0 flex-col p-1 text-sm text-gray-600">
					<RequestedAtPresetList
						requestedFrom={requestedFrom}
						requestedTo={requestedTo}
						onRequestedAtRangeApply={onRequestedAtRangeApply}
					/>
				</div>

				<div className="w-88 shrink-0 border-l border-gray-100 p-3">
					<CustomRangeCalendarPanel
						key={`${requestedFrom}:${requestedTo}`}
						requestedFrom={requestedFrom}
						requestedTo={requestedTo}
						isPending={isPending}
						onRequestedAtRangeApply={onRequestedAtRangeApply}
					/>
				</div>
			</div>
		);
	}
}

function RequestedAtPresetList({
	requestedFrom,
	requestedTo,
	onRequestedAtRangeApply,
}: {
	requestedFrom: string;
	requestedTo: string;
	onRequestedAtRangeApply: (requestedFrom: string, requestedTo: string) => void;
}) {
	const selectedRequestedAtRange = getDateRangeFromParams(requestedFrom, requestedTo);
	const today = new Date();

	return (
		<>
			{transferRequestedAtFilterPresets.map((preset) => {
				const presetRange = preset.getRange(today);
				return (
					<DatePresetButton
						key={preset.label}
						label={preset.label}
						isSelected={isSameDateRange(selectedRequestedAtRange, presetRange)}
						onSelect={() => {
							onRequestedAtRangeApply(
								formatUrlDate(presetRange.from),
								formatUrlDate(presetRange.to),
							);
						}}
					/>
				);
			})}
		</>
	);
}

function CustomRangeCalendarPanel({
	requestedFrom,
	requestedTo,
	isPending,
	onRequestedAtRangeApply,
}: {
	requestedFrom: string;
	requestedTo: string;
	isPending: boolean;
	onRequestedAtRangeApply: (requestedFrom: string, requestedTo: string) => void;
}) {
	const selectedRequestedAtRange = getDateRangeFromParams(requestedFrom, requestedTo);
	const [draftRequestedAtRange, setDraftRequestedAtRange] = useState<DateRange | undefined>(
		selectedRequestedAtRange,
	);

	return (
		<div className="flex min-w-0 flex-col">
			<div className="flex items-center gap-3">
				<DateFieldPlaceholder value={draftRequestedAtRange?.from} label="Start date" />
				<RiArrowRightLine className="size-5 shrink-0 text-gray-400" aria-hidden="true" />
				<DateFieldPlaceholder value={draftRequestedAtRange?.to} label="End date" />
			</div>

			<Calendar
				mode="range"
				selected={draftRequestedAtRange}
				onSelect={(nextDraftRequestedAtRange) => {
					setDraftRequestedAtRange(nextDraftRequestedAtRange);
				}}
				numberOfMonths={1}
				className="mt-4 p-0"
				classNames={{
					month_caption: "flex h-9 w-full items-center justify-center px-9",
					caption_label: "text-sm font-semibold text-gray-800",
					weekday: "flex-1 rounded-md text-sm font-medium text-gray-700 select-none",
					day_button: "rounded-lg text-sm",
				}}
				disabled={isPending}
			/>

			<div className="mt-7 flex justify-end gap-3">
				<Button
					type="button"
					variant="outline"
					className="min-w-28 text-sm"
					disabled={isPending}
					onClick={() => {
						setDraftRequestedAtRange(undefined);
						onRequestedAtRangeApply("", "");
					}}
				>
					Reset
				</Button>
				<Button
					type="button"
					className="min-w-40 flex-1 text-sm"
					disabled={!draftRequestedAtRange?.from || !draftRequestedAtRange?.to || isPending}
					onClick={() => {
						if (!draftRequestedAtRange?.from || !draftRequestedAtRange?.to) return;

						onRequestedAtRangeApply(
							formatUrlDate(draftRequestedAtRange.from),
							formatUrlDate(draftRequestedAtRange.to),
						);
					}}
				>
					Apply
				</Button>
			</div>
		</div>
	);
}

function DatePresetButton({
	isSelected,
	label,
	onSelect,
}: {
	isSelected: boolean;
	label: string;
	onSelect: () => void;
	}) {
	return (
		<button
			type="button"
			onClick={onSelect}
			className="flex h-9 w-full items-center justify-between rounded-lg px-3 text-left font-medium text-gray-700 hover:bg-gray-100 focus-visible:bg-gray-50 focus-visible:outline-none"
		>
			<span>{label}</span>
			{isSelected ? <RiCheckLine className="size-5 text-gray-700" aria-hidden="true" /> : null}
		</button>
	);
}

function DateFieldPlaceholder({ label, value }: { label: string; value?: Date }) {
	return (
		<div className="flex h-9 min-w-0 flex-1 items-center gap-3 rounded-lg border border-gray-200 bg-white px-2 text-left font-medium text-gray-500">
			<RiCalendarLine className="size-5 shrink-0 text-gray-400" aria-hidden="true" />
			<span className="sr-only">{label}</span>
			<span className="truncate">{value ? format(value, "dd/MM/yyyy") : "DD/MM/YYYY"}</span>
		</div>
	);
}

function getDateRangeFromParams(requestedFrom: string, requestedTo: string): DateRange | undefined {
	const from = parseDateParam(requestedFrom);
	const to = parseDateParam(requestedTo);

	if (!from && !to) return undefined;

	return { from, to };
}

function isSameDateRange(range: DateRange | undefined, presetRange: TransferRequestedAtCompleteRange) {
	if (!range?.from || !range.to) return false;

	return isSameDay(range.from, presetRange.from) && isSameDay(range.to, presetRange.to);
}

function formatUrlDate(date: Date) {
	return format(date, "yyyy-MM-dd");
}
