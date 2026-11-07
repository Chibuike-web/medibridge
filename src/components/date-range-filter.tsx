"use client";

import { useId, useState } from "react";
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
import { useMediaQuery } from "@/hooks/use-media-query";
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

function formatUrlDate(date: Date) {
	return format(date, "yyyy-MM-dd");
}

export function DateRangeButtons({
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
					<button
						key={preset.label}
						type="button"
						className="flex h-10 w-full items-center gap-2 rounded-lg px-2 text-left text-gray-600 hover:bg-gray-100"
						onClick={() => onDateRangeApply(presetFrom, today)}
					>
						<RiCalendarLine className="size-4" aria-hidden="true" />
						<span className="flex-1">{preset.label}</span>
						{from === presetFrom && to === today ? (
							<RiCheckLine className="size-4" aria-label="Selected" />
						) : null}
					</button>
				);
			})}
			<button
				type="button"
				className="flex h-10 w-full items-center gap-2 rounded-lg px-2 text-left text-gray-600 hover:bg-gray-100"
				onClick={() => onCustomDateRangeSelect({ from, to, onDateRangeApply })}
			>
				<RiCalendarLine className="size-4" aria-hidden="true" />
				<span className="flex-1">Custom date range</span>
				<RiArrowRightSLine className="size-4" aria-hidden="true" />
			</button>
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
			<DialogContent className="max-w-[40rem] gap-0 p-0 max-md:flex max-md:h-full max-md:flex-col">
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
				<DateRangeFields dateRangeFilter={dateRangeFilter} onClose={onClose} />
			</DialogContent>
		</Dialog>
	);
}

function DateRangeFields({
	dateRangeFilter,
	onClose,
}: {
	dateRangeFilter: DateRangeFilter | null;
	onClose: () => void;
}) {
	const today = new Date();
	const isPhone = useMediaQuery("(width < 48rem)");
	const [draftDateRange, setDraftDateRange] = useState<DateRange | undefined>(() => {
		const from = parseDateParam(dateRangeFilter?.from ?? "");
		const to = parseDateParam(dateRangeFilter?.to ?? "");
		return from ? { from, to } : undefined;
	});
	const [calendarMonth, setCalendarMonth] = useState(() =>
		startOfMonth(subMonths(draftDateRange?.to ?? today, isPhone ? 0 : 1)),
	);
	const dateRangeHintId = useId();
	const hasDateRange = Boolean(draftDateRange?.from && draftDateRange.to);
	const dateFields = [
		{ label: "Start date", date: draftDateRange?.from },
		{ label: "End date", date: draftDateRange?.to },
	];

	return (
		<>
			<div className="py-5 max-md:flex-1 max-md:overflow-y-auto">
				<div className="grid gap-3.5 px-4 pb-4 sm:grid-cols-2">
					{dateFields.map((dateField) => (
						<div key={dateField.label} className="flex min-w-0 flex-col gap-3.5">
							<p className="text-sm font-medium text-gray-600">{dateField.label}</p>
							<p
								className={`flex h-9 items-center rounded-lg border border-gray-200 px-3 text-sm ${dateField.date ? "text-gray-800" : "text-gray-400"}`}
							>
								{dateField.date ? format(dateField.date, "do MMMM, yyyy") : "Not picked yet"}
							</p>
						</div>
					))}
				</div>
				<Calendar
					mode="range"
					numberOfMonths={isPhone ? 1 : 2}
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
			<DialogFooter className="flex-row flex-wrap items-center gap-3 p-4 sm:justify-end">
				{hasDateRange ? null : (
					<p
						id={dateRangeHintId}
						className="basis-full text-sm text-gray-500 md:mr-auto md:basis-auto"
					>
						Pick a start date and an end date to apply.
					</p>
				)}
				<Button
					type="button"
					variant="outline"
					className="max-md:flex-1"
					onClick={() => {
						setDraftDateRange(undefined);
						dateRangeFilter?.onDateRangeApply("", "");
					}}
				>
					Reset
				</Button>
				<Button
					type="button"
					className="max-md:flex-1"
					disabled={!hasDateRange}
					aria-describedby={hasDateRange ? undefined : dateRangeHintId}
					onClick={() => {
						if (!draftDateRange?.from || !draftDateRange.to) return;
						dateRangeFilter?.onDateRangeApply(
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
