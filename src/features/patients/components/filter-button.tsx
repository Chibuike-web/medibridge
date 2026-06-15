"use client";

import { Button } from "@/components/ui/button";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { ReactNode } from "react";

import {
	RiArrowLeftSLine,
	RiArrowRightLine,
	RiArrowRightSLine,
	RiCalendarLine,
	RiCalendarView,
	RiCheckLine,
	RiFilter3Line,
	RiMenLine,
} from "@remixicon/react";

const createdAtFilterPresets = [
	"Today",
	"Last 7 days",
	"Last 30 days",
	"Last year",
	"Last 5 years",
] as const;

const calendarWeekDays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"] as const;
const calendarDays = [
	{ label: "1", isMuted: false },
	{ label: "2", isMuted: false },
	{ label: "3", isMuted: false },
	{ label: "4", isMuted: false },
	{ label: "5", isMuted: false },
	{ label: "6", isMuted: false },
	{ label: "7", isMuted: false },
	{ label: "8", isMuted: false },
	{ label: "9", isMuted: false },
	{ label: "10", isMuted: false },
	{ label: "11", isMuted: false },
	{ label: "12", isMuted: false },
	{ label: "13", isMuted: false },
	{ label: "14", isMuted: false },
	{ label: "15", isMuted: false },
	{ label: "16", isMuted: false },
	{ label: "17", isMuted: false },
	{ label: "18", isMuted: false },
	{ label: "19", isMuted: false },
	{ label: "20", isMuted: false },
	{ label: "21", isMuted: false },
	{ label: "22", isMuted: false },
	{ label: "23", isMuted: false },
	{ label: "24", isMuted: false },
	{ label: "25", isMuted: false, isSelected: true },
	{ label: "26", isMuted: false },
	{ label: "27", isMuted: false },
	{ label: "28", isMuted: false },
	{ label: "29", isMuted: false },
	{ label: "30", isMuted: false },
	{ label: "1", isMuted: true },
	{ label: "2", isMuted: true },
	{ label: "3", isMuted: true },
	{ label: "4", isMuted: true },
	{ label: "5", isMuted: true },
];

export function FilterButton() {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					size="lg"
					variant="outline"
					className="gap-2 border-gray-200 bg-white text-gray-600 hover:bg-gray-50 data-[state=open]:border-gray-400 data-[state=open]:ring-4 data-[state=open]:ring-gray-200"
				>
					<RiFilter3Line aria-hidden className="size-5 text-gray-600" />
					Filter
				</Button>
			</DropdownMenuTrigger>

			<DropdownMenuContent
				align="end"
				sideOffset={8}
				className="w-[13.75rem] rounded-xl border border-gray-200 bg-white p-1 text-sm text-gray-700 shadow-xl"
			>
				<DropdownMenuSub>
					<DropdownMenuSubTrigger className="rounded-lg focus:bg-gray-100 text-gray-600  data-[state=open]:bg-gray-100 py-2">
						<RiMenLine className="size-[18px]" />
						<span className="block">Gender</span>
					</DropdownMenuSubTrigger>

					<DropdownMenuSubContent
						sideOffset={12}
						alignOffset={-5}
						className="w-48 rounded-xl border border-gray-200 bg-white p-1 text-sm text-gray-700 shadow-xl"
					>
						<RadioGroup defaultValue="all" className="flex flex-col gap-0">
							<div className="flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-gray-100">
								<RadioGroupItem value="all" id="all" />
								<Label htmlFor="all" className="cursor-pointer w-full leading-normal font-normal">
									All
								</Label>
							</div>

							<div className="flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-gray-100">
								<RadioGroupItem value="male" id="male" />
								<Label htmlFor="male" className="cursor-pointer w-full leading-normal font-normal">
									Male
								</Label>
							</div>

							<div className="flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-gray-100">
								<RadioGroupItem value="female" id="female" />
								<Label
									htmlFor="female"
									className="cursor-pointer w-full leading-normal font-normal"
								>
									Female
								</Label>
							</div>
						</RadioGroup>
					</DropdownMenuSubContent>
				</DropdownMenuSub>

				<DropdownMenuSub>
					<DropdownMenuSubTrigger className="rounded-lg focus:bg-gray-100 focus:text-gray-900 data-[state=open]:bg-gray-100 py-2">
						<RiCalendarView className="size-[18px]" /> <span className="block">Age</span>
					</DropdownMenuSubTrigger>

					<DropdownMenuSubContent
						sideOffset={8}
						alignOffset={-5}
						className="w-48 rounded-xl border border-gray-200 bg-white p-1 text-sm text-gray-700 shadow-xl"
					>
						<RadioGroup defaultValue="any-age" className="flex flex-col gap-0">
							<div className="flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-gray-100">
								<RadioGroupItem value="any-age" id="any-age" />
								<Label
									htmlFor="any-age"
									className="cursor-pointer w-full leading-normal font-normal"
								>
									Any age
								</Label>
							</div>

							<div className="flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-gray-100">
								<RadioGroupItem value="children" id="children" />
								<Label
									htmlFor="children"
									className="cursor-pointer w-full leading-normal font-normal"
								>
									0-12 (Children)
								</Label>
							</div>

							<div className="flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-gray-100">
								<RadioGroupItem value="teenagers" id="teenagers" />
								<Label
									htmlFor="teenagers"
									className="cursor-pointer w-full leading-normal font-normal"
								>
									13-17 (Teenagers)
								</Label>
							</div>

							<div className="flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-gray-100">
								<RadioGroupItem value="young-adults" id="young-adults" />
								<Label
									htmlFor="young-adults"
									className="cursor-pointer w-full leading-normal font-normal"
								>
									18-35 (Young adults)
								</Label>
							</div>

							<div className="flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-gray-100">
								<RadioGroupItem value="adults" id="adults" />
								<Label
									htmlFor="adults"
									className="cursor-pointer w-full leading-normal font-normal"
								>
									36-60 (Adults)
								</Label>
							</div>

							<div className="flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-gray-100">
								<RadioGroupItem value="seniors" id="seniors" />
								<Label
									htmlFor="seniors"
									className="cursor-pointer w-full leading-normal font-normal"
								>
									60+ (Seniors)
								</Label>
							</div>
						</RadioGroup>
					</DropdownMenuSubContent>
				</DropdownMenuSub>

				<DropdownMenuSub>
					<DropdownMenuSubTrigger className="rounded-lg focus:bg-gray-100 focus:text-gray-900 data-[state=open]:bg-gray-100 py-2">
						<RiCalendarLine className="size-[18px]" /> <span className="block">Created at</span>
					</DropdownMenuSubTrigger>

					<DropdownMenuSubContent
						sideOffset={8}
						alignOffset={-5}
						className="w-max max-w-[calc(100vw-2rem)] rounded-xl border border-gray-200 bg-white p-0 text-sm text-gray-700 shadow-xl"
					>
						<CreatedAtFilterContent />
					</DropdownMenuSubContent>
				</DropdownMenuSub>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

function CreatedAtFilterContent() {
	return (
		<div className="flex w-max">
			<div className="flex w-[200px] shrink-0 flex-col p-1 text-sm text-gray-600">
				{createdAtFilterPresets.map((preset) => (
					<DatePresetButton key={preset} label={preset} isSelected={preset === "Today"} />
				))}

				<DropdownMenuItem
					onSelect={(event) => event.preventDefault()}
					className="flex h-10 w-full items-center justify-between rounded-lg bg-gray-100 px-3 text-left font-medium text-gray-700 focus:bg-gray-100"
				>
					<span>Custom range</span>
					<RiArrowRightSLine className="size-5 text-gray-400" aria-hidden="true" />
				</DropdownMenuItem>
			</div>

			<div className="w-[352px] shrink-0 border-l border-gray-100 p-3">
				<CustomRangeCalendarPanel />
			</div>
		</div>
	);
}

function CustomRangeCalendarPanel() {
	return (
		<div className="flex min-w-0 flex-col">
			<div className="flex items-center gap-3">
				<DateFieldPlaceholder />
				<RiArrowRightLine className="size-5 shrink-0 text-gray-400" aria-hidden="true" />
				<DateFieldPlaceholder />
			</div>

			<div className="mt-7 flex items-center justify-between">
				<CalendarNavigationButton label="Previous month">
					<RiArrowLeftSLine className="size-5" aria-hidden="true" />
				</CalendarNavigationButton>

				<span className="text-base font-semibold text-gray-800">December 2025</span>

				<CalendarNavigationButton label="Next month">
					<RiArrowRightSLine className="size-5" aria-hidden="true" />
				</CalendarNavigationButton>
			</div>

			<div className="mt-6 grid grid-cols-7 text-center">
				{calendarWeekDays.map((weekday) => (
					<span
						key={weekday}
						className="flex size-9 items-center justify-center text-sm font-medium text-gray-700"
					>
						{weekday}
					</span>
				))}

				{calendarDays.map((day, dayIndex) => (
					<div key={`${day.label}-${dayIndex}`} className="flex size-9 items-center justify-center">
						<CalendarDayButton day={day} />
					</div>
				))}
			</div>

			<div className="mt-7 flex justify-end gap-3">
				<Button type="button" size="lg" variant="outline" className="min-w-28">
					Cancel
				</Button>
				<Button type="button" size="lg" className="min-w-40 flex-1">
					Apply
				</Button>
			</div>
		</div>
	);
}

function DatePresetButton({ isSelected, label }: { isSelected: boolean; label: string }) {
	return (
		<DropdownMenuItem
			onSelect={(event) => event.preventDefault()}
			className="flex h-10 w-full items-center justify-between rounded-lg px-3 text-left font-medium text-gray-700 focus:bg-gray-50"
		>
			<span>{label}</span>
			{isSelected ? <RiCheckLine className="size-5 text-gray-700" aria-hidden="true" /> : null}
		</DropdownMenuItem>
	);
}

function CalendarNavigationButton({ children, label }: { children: ReactNode; label: string }) {
	return (
		<button
			type="button"
			className="inline-flex size-10 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition-colors hover:bg-gray-50"
			aria-label={label}
		>
			{children}
		</button>
	);
}

function CalendarDayButton({
	day,
}: {
	day: { label: string; isMuted: boolean; isSelected?: boolean };
}) {
	const dayButtonClassName = day.isSelected
		? "bg-gray-900 text-white hover:bg-gray-900"
		: day.isMuted
			? "text-gray-400 hover:bg-gray-50"
			: "text-gray-800 hover:bg-gray-50";

	return (
		<button
			type="button"
			className={`inline-flex size-9 items-center justify-center rounded-lg text-sm font-medium transition-colors ${dayButtonClassName}`}
		>
			{day.label}
		</button>
	);
}

function DateFieldPlaceholder() {
	return (
		<button
			type="button"
			className="flex h-11 min-w-0 flex-1 items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 text-left font-medium text-gray-400 transition hover:bg-gray-50"
		>
			<RiCalendarLine className="size-5 shrink-0 text-gray-400" aria-hidden="true" />
			<span className="truncate">DD/MM/YYYY</span>
		</button>
	);
}
