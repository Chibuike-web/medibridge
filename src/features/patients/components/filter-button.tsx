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
import { endOfDay, format, isSameDay, startOfDay, subDays } from "date-fns";
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

type PatientCreatedAtFilterPreset = {
	label: string;
	getRange: (today: Date) => PatientCreatedAtCompleteRange;
};

type PatientCreatedAtCompleteRange = {
	from: Date;
	to: Date;
};

type PatientFilterSubmenu = "gender" | "age" | "created-at";

const patientCreatedAtFilterPresets: PatientCreatedAtFilterPreset[] = [
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
					className="border-gray-200 bg-white text-sm text-gray-600 hover:bg-gray-50 data-[state=open]:border-gray-400 data-[state=open]:ring-4 data-[state=open]:ring-gray-200"
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
					open={activePatientFilterSubmenu === "gender"}
					onOpenChange={(isGenderSubmenuOpen) => {
						setActivePatientFilterSubmenu((prev) => {
							if (isGenderSubmenuOpen) return "gender";
							if (prev === "gender") return null;
							return prev;
						});
					}}
				>
						<DropdownMenuSubTrigger className="h-9 rounded-lg py-0 text-gray-600 focus:bg-gray-100 data-[state=open]:bg-gray-100">
						<RiMenLine className="size-4.5" />
						<span className="block">Gender</span>
					</DropdownMenuSubTrigger>

					<DropdownMenuSubContent
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
								<div className="flex h-9 items-center gap-2 rounded-lg px-2 hover:bg-gray-100">
								<RadioGroupItem value="all" id="patient-gender-all" />
								<Label
									htmlFor="patient-gender-all"
									className="cursor-pointer w-full leading-normal font-normal"
								>
									All
								</Label>
							</div>

								<div className="flex h-9 items-center gap-2 rounded-lg px-2 hover:bg-gray-100">
								<RadioGroupItem value="male" id="patient-gender-male" />
								<Label
									htmlFor="patient-gender-male"
									className="cursor-pointer w-full leading-normal font-normal"
								>
									Male
								</Label>
							</div>

								<div className="flex h-9 items-center gap-2 rounded-lg px-2 hover:bg-gray-100">
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
						setActivePatientFilterSubmenu((prev) => {
							if (isAgeSubmenuOpen) return "age";
							if (prev === "age") return null;
							return prev;
						});
					}}
				>
						<DropdownMenuSubTrigger className="h-9 rounded-lg py-0 focus:bg-gray-100 focus:text-gray-900 data-[state=open]:bg-gray-100">
						<RiCalendarView className="size-4.5" /> <span className="block">Age</span>
					</DropdownMenuSubTrigger>

					<DropdownMenuSubContent
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
								<div className="flex h-9 items-center gap-2 rounded-lg px-2 hover:bg-gray-100">
								<RadioGroupItem value="any-age" id="patient-age-any" />
								<Label
									htmlFor="patient-age-any"
									className="cursor-pointer w-full leading-normal font-normal"
								>
									Any age
								</Label>
							</div>

								<div className="flex h-9 items-center gap-2 rounded-lg px-2 hover:bg-gray-100">
								<RadioGroupItem value="children" id="patient-age-children" />
								<Label
									htmlFor="patient-age-children"
									className="cursor-pointer w-full leading-normal font-normal"
								>
									0-12 (Children)
								</Label>
							</div>

								<div className="flex h-9 items-center gap-2 rounded-lg px-2 hover:bg-gray-100">
								<RadioGroupItem value="teenagers" id="patient-age-teenagers" />
								<Label
									htmlFor="patient-age-teenagers"
									className="cursor-pointer w-full leading-normal font-normal"
								>
									13-17 (Teenagers)
								</Label>
							</div>

								<div className="flex h-9 items-center gap-2 rounded-lg px-2 hover:bg-gray-100">
								<RadioGroupItem value="young-adults" id="patient-age-young-adults" />
								<Label
									htmlFor="patient-age-young-adults"
									className="cursor-pointer w-full leading-normal font-normal"
								>
									18-35 (Young adults)
								</Label>
							</div>

								<div className="flex h-9 items-center gap-2 rounded-lg px-2 hover:bg-gray-100">
								<RadioGroupItem value="adults" id="patient-age-adults" />
								<Label
									htmlFor="patient-age-adults"
									className="cursor-pointer w-full leading-normal font-normal"
								>
									36-59 (Adults)
								</Label>
							</div>

								<div className="flex h-9 items-center gap-2 rounded-lg px-2 hover:bg-gray-100">
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
						setActivePatientFilterSubmenu((prev) => {
							if (isCreatedAtSubmenuOpen) return "created-at";
							if (prev === "created-at") return null;
							return prev;
						});
					}}
				>
						<DropdownMenuSubTrigger className="h-9 rounded-lg py-0 focus:bg-gray-100 focus:text-gray-900 data-[state=open]:bg-gray-100">
						<RiCalendarLine className="size-4.5" /> <span className="block">Created at</span>
					</DropdownMenuSubTrigger>

					<DropdownMenuSubContent
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
						key={`${createdFrom}:${createdTo}`}
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
			{patientCreatedAtFilterPresets.map((preset) => {
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
	const [draftCreatedAtRange, setDraftCreatedAtRange] = useState<DateRange | undefined>(
		selectedCreatedAtRange,
	);

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


function isSameDateRange(range: DateRange | undefined, presetRange: PatientCreatedAtCompleteRange) {
	if (!range?.from || !range.to) return false;

	return isSameDay(range.from, presetRange.from) && isSameDay(range.to, presetRange.to);
}

function formatUrlDate(date: Date) {
	return format(date, "yyyy-MM-dd");
}
