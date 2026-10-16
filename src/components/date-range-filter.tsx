"use client";

import { useState } from "react";
import { format, startOfMonth, subDays, subMonths, subYears } from "date-fns";
import type { DateRange } from "react-day-picker";
import { RiArrowRightSLine, RiCalendarLine, RiCheckLine, RiCloseLine } from "@remixicon/react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { parseDateParam } from "@/lib/utils/parse-date-param";

export type DateRangeFilter = {
	from: string;
	to: string;
	onDateRangeApply: (from: string, to: string) => void;
};

const dateRangePresets = [
	{ label: "Today", getFrom: (today: Date) => today },
	{ label: "Last 7 days", getFrom: (today: Date) => subDays(today, 6) },
	{ label: "Last 30 days", getFrom: (today: Date) => subDays(today, 29) },
	{ label: "Last year", getFrom: (today: Date) => subYears(today, 1) },
	{ label: "Last 5 years", getFrom: (today: Date) => subYears(today, 5) },
];

const menuItemClassName =
	"h-9 rounded-lg py-0 text-gray-600 focus:bg-gray-100 focus:text-gray-900 [&_svg]:text-gray-500";

function formatUrlDate(date: Date) {
	return format(date, "yyyy-MM-dd");
}

export function DateRangeMenuItems({
	from,
	to,
	onDateRangeApply,
	onCustomDateRangeSelect,
}: DateRangeFilter & { onCustomDateRangeSelect: (dateRangeFilter: DateRangeFilter) => void }) {
	const today = formatUrlDate(new Date());

	return (
		<>
			{dateRangePresets.map((preset) => {
				const presetFrom = formatUrlDate(preset.getFrom(new Date()));

				return (
					<DropdownMenuItem
						key={preset.label}
						className={menuItemClassName}
						onSelect={(event) => {
							event.preventDefault();
							onDateRangeApply(presetFrom, today);
						}}
					>
						<RiCalendarLine className="size-4" aria-hidden="true" />
						<span className="flex-1">{preset.label}</span>
						{from === presetFrom && to === today ? (
							<RiCheckLine className="size-4" aria-label="Selected" />
						) : null}
					</DropdownMenuItem>
				);
			})}
			<DropdownMenuItem
				className={menuItemClassName}
				onSelect={() => onCustomDateRangeSelect({ from, to, onDateRangeApply })}
			>
				<RiCalendarLine className="size-4" aria-hidden="true" />
				<span className="flex-1">Custom date range</span>
				<RiArrowRightSLine className="size-4" aria-hidden="true" />
			</DropdownMenuItem>
		</>
	);
}

export function SetDateRangeDialog({
	dateRangeFilter,
	onClose,
}: {
	dateRangeFilter: DateRangeFilter | null;
	onClose: () => void;
}) {
	return (
		<Dialog open={dateRangeFilter !== null} onOpenChange={(open) => !open && onClose()}>
			<DialogContent className="max-w-[40rem] gap-0 p-0">
				<DialogHeader className="py-4">
					<DialogTitle>Set date range</DialogTitle>
					<DialogClose asChild>
						<Button variant="ghost" size="icon" aria-label="Close set date range dialog">
							<RiCloseLine aria-hidden="true" />
						</Button>
					</DialogClose>
				</DialogHeader>
				<DialogDescription className="sr-only">
					Choose a start date and an end date to filter by.
				</DialogDescription>
				{dateRangeFilter ? (
					<DateRangeFields dateRangeFilter={dateRangeFilter} onClose={onClose} />
				) : null}
			</DialogContent>
		</Dialog>
	);
}

function DateRangeFields({
	dateRangeFilter,
	onClose,
}: {
	dateRangeFilter: DateRangeFilter;
	onClose: () => void;
}) {
	const today = new Date();
	const [draftDateRange, setDraftDateRange] = useState<DateRange | undefined>(() => {
		const from = parseDateParam(dateRangeFilter.from) ?? undefined;
		const to = parseDateParam(dateRangeFilter.to) ?? undefined;
		return from ? { from, to } : undefined;
	});
	const [calendarMonth, setCalendarMonth] = useState(() =>
		startOfMonth(subMonths(draftDateRange?.to ?? today, 1)),
	);
	const dateFields = [
		{ label: "Start date", date: draftDateRange?.from },
		{ label: "End date", date: draftDateRange?.to },
	];

	return (
		<>
			<div className="py-5">
				<div className="grid gap-3.5 px-4 pb-4 sm:grid-cols-2">
					{dateFields.map((dateField) => (
						<div key={dateField.label} className="flex min-w-0 flex-col gap-3.5">
							<p className="text-sm font-medium text-gray-600">{dateField.label}</p>
							<p
								className={`flex h-9 items-center rounded-lg border border-gray-200 px-3 text-sm ${dateField.date ? "text-gray-800" : "text-gray-400"}`}
							>
								{dateField.date
									? format(dateField.date, "do MMMM, yyyy")
									: "Eg. 22nd December, 2026"}
							</p>
						</div>
					))}
				</div>
				<Calendar
					mode="range"
					numberOfMonths={2}
					showOutsideDays={false}
					resetOnSelect
					selected={draftDateRange}
					onSelect={setDraftDateRange}
					month={calendarMonth}
					onMonthChange={setCalendarMonth}
					disabled={{ after: today }}
					endMonth={today}
				/>
			</div>
			<DialogFooter className="gap-3 p-4 sm:justify-end">
				<Button
					type="button"
					variant="outline"
					onClick={() => {
						setDraftDateRange(undefined);
						dateRangeFilter.onDateRangeApply("", "");
					}}
				>
					Reset
				</Button>
				<Button
					type="button"
					disabled={!draftDateRange?.from || !draftDateRange.to}
					onClick={() => {
						if (!draftDateRange?.from || !draftDateRange.to) return;
						dateRangeFilter.onDateRangeApply(
							formatUrlDate(draftDateRange.from),
							formatUrlDate(draftDateRange.to),
						);
						onClose();
					}}
				>
					Apply date range
				</Button>
			</DialogFooter>
		</>
	);
}
