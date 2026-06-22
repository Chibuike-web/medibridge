"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
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
import { endOfDay, format, isSameDay, startOfDay, subDays, subYears } from "date-fns";
import { parseDateParam } from "@/lib/utils/parse-date-param";
import { useState } from "react";
import type { DateRange } from "react-day-picker";
import type { PatientAgeGroupFilter, PatientGenderFilter } from "../types";

import {
	RiArrowRightLine,
	RiCalendarLine,
	RiCalendarView,
	RiCheckLine,
	RiFilter3Line,
	RiMenLine,
} from "@remixicon/react";

type CreatedAtFilterPreset = {
	label: string;
	getRange: (today: Date) => CreatedAtCompleteRange;
};

type CreatedAtCompleteRange = {
	from: Date;
	to: Date;
};

type PatientFilterSubmenu = "gender" | "age" | "created-at";

const createdAtFilterPresets: CreatedAtFilterPreset[] = [
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
	{
		label: "Last year",
		getRange: (today) => ({ from: startOfDay(subYears(today, 1)), to: endOfDay(today) }),
	},
	{
		label: "Last 5 years",
		getRange: (today) => ({ from: startOfDay(subYears(today, 5)), to: endOfDay(today) }),
	},
];

export function FilterButton({
	ageGroupFilter,
	createdFrom,
	createdTo,
	genderFilter,
	isPending,
	onAgeGroupFilterChange,
	onCreatedAtRangeApply,
	onGenderFilterChange,
}: {
	ageGroupFilter: PatientAgeGroupFilter;
	createdFrom: string;
	createdTo: string;
	genderFilter: PatientGenderFilter;
	isPending: boolean;
	onAgeGroupFilterChange: (ageGroupFilter: PatientAgeGroupFilter) => void;
	onCreatedAtRangeApply: (createdFrom: string, createdTo: string) => void;
	onGenderFilterChange: (genderFilter: PatientGenderFilter) => void;
}) {
	const [activePatientFilterSubmenu, setActivePatientFilterSubmenu] =
		useState<PatientFilterSubmenu | null>(null);

	return (
		<DropdownMenu
			onOpenChange={(isPatientFilterMenuOpen) => {
				if (!isPatientFilterMenuOpen) {
					setActivePatientFilterSubmenu(null);
				}
			}}
		>
			<DropdownMenuTrigger asChild>
				<Button
					variant="outline"
					className="gap-2 border-gray-200 bg-white text-sm text-gray-600 hover:bg-gray-50 data-[state=open]:border-gray-400 data-[state=open]:ring-4 data-[state=open]:ring-gray-200"
				>
					<RiFilter3Line aria-hidden className="size-4 text-gray-600" />
					Filter
				</Button>
			</DropdownMenuTrigger>

			<DropdownMenuContent
				align="end"
				sideOffset={8}
				className="w-[13.75rem] rounded-xl border border-gray-200 bg-white p-1 text-sm text-gray-700 shadow-xl"
			>
				<DropdownMenuSub
					open={activePatientFilterSubmenu === "gender"}
					onOpenChange={(isGenderSubmenuOpen) => {
						setActivePatientFilterSubmenu((currentActivePatientFilterSubmenu) =>
							isGenderSubmenuOpen
								? "gender"
								: currentActivePatientFilterSubmenu === "gender"
									? null
									: currentActivePatientFilterSubmenu,
						);
					}}
				>
					<DropdownMenuSubTrigger className="rounded-lg focus:bg-gray-100 text-gray-600  data-[state=open]:bg-gray-100 py-2">
						<RiMenLine className="size-4.5" />
						<span className="block">Gender</span>
					</DropdownMenuSubTrigger>

					<DropdownMenuSubContent
						sideOffset={12}
						alignOffset={-5}
						className="w-[13.75rem] rounded-xl border border-gray-200 bg-white p-1 text-sm text-gray-700 shadow-xl"
					>
						<RadioGroup
							value={genderFilter || "all"}
							onValueChange={(nextGenderFilter) => {
								onGenderFilterChange(
									nextGenderFilter === "all" ? "" : (nextGenderFilter as PatientGenderFilter),
								);
							}}
							className="flex flex-col gap-0"
							disabled={isPending}
						>
							<div className="flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-gray-100">
								<RadioGroupItem value="all" id="patient-gender-all" />
								<Label
									htmlFor="patient-gender-all"
									className="cursor-pointer w-full leading-normal font-normal"
								>
									All
								</Label>
							</div>

							<div className="flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-gray-100">
								<RadioGroupItem value="male" id="patient-gender-male" />
								<Label
									htmlFor="patient-gender-male"
									className="cursor-pointer w-full leading-normal font-normal"
								>
									Male
								</Label>
							</div>

							<div className="flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-gray-100">
								<RadioGroupItem value="female" id="patient-gender-female" />
								<Label
									htmlFor="patient-gender-female"
									className="cursor-pointer w-full leading-normal font-normal"
								>
									Female
								</Label>
							</div>
						</RadioGroup>
					</DropdownMenuSubContent>
				</DropdownMenuSub>

				<DropdownMenuSub
					open={activePatientFilterSubmenu === "age"}
					onOpenChange={(isAgeSubmenuOpen) => {
						setActivePatientFilterSubmenu((currentActivePatientFilterSubmenu) =>
							isAgeSubmenuOpen
								? "age"
								: currentActivePatientFilterSubmenu === "age"
									? null
									: currentActivePatientFilterSubmenu,
						);
					}}
				>
					<DropdownMenuSubTrigger className="rounded-lg focus:bg-gray-100 focus:text-gray-900 data-[state=open]:bg-gray-100 py-2">
						<RiCalendarView className="size-4.5" /> <span className="block">Age</span>
					</DropdownMenuSubTrigger>

					<DropdownMenuSubContent
						sideOffset={8}
						alignOffset={-5}
						className="w-[13.75rem] rounded-xl border border-gray-200 bg-white p-1 text-sm text-gray-700 shadow-xl"
					>
						<RadioGroup
							value={ageGroupFilter || "any-age"}
							onValueChange={(nextAgeGroupFilter) => {
								onAgeGroupFilterChange(
									nextAgeGroupFilter === "any-age"
										? ""
										: (nextAgeGroupFilter as PatientAgeGroupFilter),
								);
							}}
							className="flex flex-col gap-0"
							disabled={isPending}
						>
							<div className="flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-gray-100">
								<RadioGroupItem value="any-age" id="patient-age-any" />
								<Label
									htmlFor="patient-age-any"
									className="cursor-pointer w-full leading-normal font-normal"
								>
									Any age
								</Label>
							</div>

							<div className="flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-gray-100">
								<RadioGroupItem value="children" id="patient-age-children" />
								<Label
									htmlFor="patient-age-children"
									className="cursor-pointer w-full leading-normal font-normal"
								>
									0-12 (Children)
								</Label>
							</div>

							<div className="flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-gray-100">
								<RadioGroupItem value="teenagers" id="patient-age-teenagers" />
								<Label
									htmlFor="patient-age-teenagers"
									className="cursor-pointer w-full leading-normal font-normal"
								>
									13-17 (Teenagers)
								</Label>
							</div>

							<div className="flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-gray-100">
								<RadioGroupItem value="young-adults" id="patient-age-young-adults" />
								<Label
									htmlFor="patient-age-young-adults"
									className="cursor-pointer w-full leading-normal font-normal"
								>
									18-35 (Young adults)
								</Label>
							</div>

							<div className="flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-gray-100">
								<RadioGroupItem value="adults" id="patient-age-adults" />
								<Label
									htmlFor="patient-age-adults"
									className="cursor-pointer w-full leading-normal font-normal"
								>
									36-59 (Adults)
								</Label>
							</div>

							<div className="flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-gray-100">
								<RadioGroupItem value="seniors" id="patient-age-seniors" />
								<Label
									htmlFor="patient-age-seniors"
									className="cursor-pointer w-full leading-normal font-normal"
								>
									60+ (Seniors)
								</Label>
							</div>
						</RadioGroup>
					</DropdownMenuSubContent>
				</DropdownMenuSub>

				<DropdownMenuSub
					open={activePatientFilterSubmenu === "created-at"}
					onOpenChange={(isCreatedAtSubmenuOpen) => {
						setActivePatientFilterSubmenu((currentActivePatientFilterSubmenu) =>
							isCreatedAtSubmenuOpen
								? "created-at"
								: currentActivePatientFilterSubmenu === "created-at"
									? null
									: currentActivePatientFilterSubmenu,
						);
					}}
				>
					<DropdownMenuSubTrigger className="rounded-lg focus:bg-gray-100 focus:text-gray-900 data-[state=open]:bg-gray-100 py-2">
						<RiCalendarLine className="size-4.5" /> <span className="block">Created at</span>
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

	function CreatedAtFilterContent() {
		return (
			<div className="flex w-max">
				<div className="flex w-50 shrink-0 flex-col p-1 text-sm text-gray-600">
					<CreatedAtPresetList
						createdFrom={createdFrom}
						createdTo={createdTo}
						onCreatedAtRangeApply={onCreatedAtRangeApply}
					/>
				</div>

				<div className="w-88 shrink-0 border-l border-gray-100 p-3">
					<CustomRangeCalendarPanel
						createdFrom={createdFrom}
						createdTo={createdTo}
						isPending={isPending}
						onCreatedAtRangeApply={onCreatedAtRangeApply}
					/>
				</div>
			</div>
		);
	}
}

function CreatedAtPresetList({
	createdFrom,
	createdTo,
	onCreatedAtRangeApply,
}: {
	createdFrom: string;
	createdTo: string;
	onCreatedAtRangeApply: (createdFrom: string, createdTo: string) => void;
}) {
	const selectedCreatedAtRange = getDateRangeFromParams(createdFrom, createdTo);
	const today = new Date();

	return (
		<>
			{createdAtFilterPresets.map((preset) => {
				const presetRange = preset.getRange(today);
				return (
					<DatePresetButton
						key={preset.label}
						label={preset.label}
						isSelected={isSameDateRange(selectedCreatedAtRange, presetRange)}
						onSelect={() => {
							onCreatedAtRangeApply(formatUrlDate(presetRange.from), formatUrlDate(presetRange.to));
						}}
					/>
				);
			})}
		</>
	);
}

function CustomRangeCalendarPanel({
	createdFrom,
	createdTo,
	isPending,
	onCreatedAtRangeApply,
}: {
	createdFrom: string;
	createdTo: string;
	isPending: boolean;
	onCreatedAtRangeApply: (createdFrom: string, createdTo: string) => void;
}) {
	const selectedCreatedAtRange = getDateRangeFromParams(createdFrom, createdTo);
	const selectedCreatedAtRangeKey = getDateRangeKey(selectedCreatedAtRange);
	const [draftCreatedAtRange, setDraftCreatedAtRange] = useState<DateRange | undefined>(
		selectedCreatedAtRange,
	);
	const [previousSelectedCreatedAtRangeKey, setPreviousSelectedCreatedAtRangeKey] =
		useState(selectedCreatedAtRangeKey);

	if (selectedCreatedAtRangeKey !== previousSelectedCreatedAtRangeKey) {
		setPreviousSelectedCreatedAtRangeKey(selectedCreatedAtRangeKey);
		setDraftCreatedAtRange(selectedCreatedAtRange);
	}

	return (
		<div className="flex min-w-0 flex-col">
			<div className="flex items-center gap-3">
				<DateFieldPlaceholder value={draftCreatedAtRange?.from} label="Start date" />
				<RiArrowRightLine className="size-5 shrink-0 text-gray-400" aria-hidden="true" />
				<DateFieldPlaceholder value={draftCreatedAtRange?.to} label="End date" />
			</div>

			<Calendar
				mode="range"
				selected={draftCreatedAtRange}
				onSelect={(nextDraftCreatedAtRange) => {
					setDraftCreatedAtRange(nextDraftCreatedAtRange);
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
						setDraftCreatedAtRange(undefined);
						onCreatedAtRangeApply("", "");
					}}
				>
					Reset
				</Button>
					<Button
						type="button"
						className="min-w-40 flex-1 text-sm"
					disabled={!draftCreatedAtRange?.from || !draftCreatedAtRange?.to || isPending}
					onClick={() => {
						if (!draftCreatedAtRange?.from || !draftCreatedAtRange?.to) return;

						onCreatedAtRangeApply(
							formatUrlDate(draftCreatedAtRange.from),
							formatUrlDate(draftCreatedAtRange.to),
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

function getDateRangeFromParams(createdFrom: string, createdTo: string): DateRange | undefined {
	const from = parseDateParam(createdFrom);
	const to = parseDateParam(createdTo);

	if (!from && !to) return undefined;

	return { from, to };
}

function getDateRangeKey(range?: DateRange) {
	return `${range?.from ? formatUrlDate(range.from) : ""}:${range?.to ? formatUrlDate(range.to) : ""}`;
}

function isSameDateRange(range: DateRange | undefined, presetRange: CreatedAtCompleteRange) {
	if (!range?.from || !range.to) return false;

	return isSameDay(range.from, presetRange.from) && isSameDay(range.to, presetRange.to);
}

function formatUrlDate(date: Date) {
	return format(date, "yyyy-MM-dd");
}
