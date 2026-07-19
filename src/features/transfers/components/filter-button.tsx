"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { parseDateParam } from "@/lib/utils/parse-date-param";
import { endOfDay, format, isSameDay, startOfDay, subDays } from "date-fns";
import { useState } from "react";
import type { DateRange } from "react-day-picker";
import type { TransferStatusFilter } from "../types";

import {
	RiArrowRightLine,
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
	const [activeTransferFilterSubmenu, setActiveTransferFilterSubmenu] =
		useState<TransferFilterSubmenu | null>(null);

	return (
		<DropdownMenu
			onOpenChange={(isTransferFilterMenuOpen) => {
				if (!isTransferFilterMenuOpen) {
					setActiveTransferFilterSubmenu(null);
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
				align="end"
				className="w-[13.75rem] rounded-xl border-gray-200 bg-white text-sm text-gray-700 shadow-xl"
			>
					<DropdownMenuSub
						open={activeTransferFilterSubmenu === "status"}
						onOpenChange={(isStatusSubmenuOpen) => {
							setActiveTransferFilterSubmenu((prev) => {
								if (isStatusSubmenuOpen) return "status";
								if (prev === "status") return null;
								return prev;
							});
						}}
					>
					<DropdownMenuSubTrigger className="h-9 rounded-lg py-0 text-gray-600 focus:bg-gray-100 focus:text-gray-900 data-[state=open]:bg-gray-100">
						<RiMenLine className="size-4.5" /> <span className="block">Status</span>
					</DropdownMenuSubTrigger>

					<DropdownMenuSubContent
						alignOffset={-5}
						className="w-[13.75rem] rounded-xl border border-gray-200 bg-white p-1 text-sm text-gray-700 shadow-xl"
					>
						{transferStatusFilterOptions.map((statusOption) => {
							const isStatusSelected = statusFilters.includes(statusOption.value);
							const statusOptionId = `status-${statusOption.value}`;

							return (
								<DropdownMenuItem
									key={statusOption.value}
									className="rounded-lg p-0 focus:bg-gray-100 focus:text-gray-900"
									onSelect={(event) => {
										event.preventDefault();
									}}
								>
									<Label
										htmlFor={statusOptionId}
										className="flex h-9 w-full cursor-pointer items-center gap-2 px-2 leading-normal font-normal"
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
								</DropdownMenuItem>
							);
						})}
					</DropdownMenuSubContent>
				</DropdownMenuSub>

					<DropdownMenuSub
						open={activeTransferFilterSubmenu === "requested-at"}
						onOpenChange={(isRequestedAtSubmenuOpen) => {
							setActiveTransferFilterSubmenu((prev) => {
								if (isRequestedAtSubmenuOpen) return "requested-at";
								if (prev === "requested-at") return null;
								return prev;
							});
						}}
					>
					<DropdownMenuSubTrigger className="h-9 rounded-lg py-0 text-gray-600 focus:bg-gray-100 focus:text-gray-900 data-[state=open]:bg-gray-100">
						<RiCalendarLine className="size-4.5" /> <span className="block">Requested at</span>
					</DropdownMenuSubTrigger>

					<DropdownMenuSubContent
						alignOffset={-5}
						className="w-max max-w-[calc(100vw-2rem)] rounded-xl border border-gray-200 bg-white p-0 text-sm text-gray-700 shadow-xl"
					>
						<RequestedAtFilterContent />
					</DropdownMenuSubContent>
				</DropdownMenuSub>
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
		<DropdownMenuItem
			onSelect={(event) => {
				event.preventDefault();
				onSelect();
			}}
			className="flex h-9 w-full items-center justify-between rounded-lg px-3 text-left font-medium text-gray-700 focus:bg-gray-50"
		>
			<span>{label}</span>
			{isSelected ? <RiCheckLine className="size-5 text-gray-700" aria-hidden="true" /> : null}
		</DropdownMenuItem>
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
