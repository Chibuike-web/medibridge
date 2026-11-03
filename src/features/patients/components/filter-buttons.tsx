"use client";

import {
	DateRangeMenuItems,
	SetDateRangeDialog,
	type DateRangeFilter,
} from "@/components/date-range-filter";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useState } from "react";
import type { PatientAgeGroupFilter, PatientGenderFilter } from "../types";

import { RiCalendarLine, RiCalendarView, RiMenLine } from "@remixicon/react";

export function FilterButtons({
	ageGroupFilter,
	createdFrom,
	createdTo,
	genderFilter,
	onAgeGroupFilterChange,
	onCreatedAtRangeApply,
	onGenderFilterChange,
}: {
	ageGroupFilter: PatientAgeGroupFilter;
	createdFrom: string;
	createdTo: string;
	genderFilter: PatientGenderFilter;
	onAgeGroupFilterChange: (ageGroupFilter: PatientAgeGroupFilter) => void;
	onCreatedAtRangeApply: (createdFrom: string, createdTo: string) => void;
	onGenderFilterChange: (genderFilter: PatientGenderFilter) => void;
}) {
	const [customDateRangeFilter, setCustomDateRangeFilter] = useState<DateRangeFilter | null>(null);

	return (
		<>
			<Popover>
				<PopoverTrigger asChild>
					<Button variant="outline" className="bg-white text-gray-600 hover:bg-gray-100">
						<RiMenLine aria-hidden className="size-4 text-gray-600" />
						Gender
					</Button>
				</PopoverTrigger>
				<PopoverContent align="end" className="w-[13.75rem] p-1 text-sm text-gray-700">
					<RadioGroup
						value={genderFilter || "all"}
						onValueChange={(nextGenderFilter) => {
							onGenderFilterChange(
								nextGenderFilter === "all" ? "" : (nextGenderFilter as PatientGenderFilter),
							);
						}}
						className="flex flex-col gap-0.5"
					>
						<div className="flex h-8 items-center gap-2 rounded-lg px-2 hover:bg-gray-100">
							<RadioGroupItem value="all" id="patient-gender-all" />
							<Label
								htmlFor="patient-gender-all"
								className="cursor-pointer w-full leading-normal font-normal"
							>
								All
							</Label>
						</div>

						<div className="flex h-8 items-center gap-2 rounded-lg px-2 hover:bg-gray-100">
							<RadioGroupItem value="male" id="patient-gender-male" />
							<Label
								htmlFor="patient-gender-male"
								className="cursor-pointer w-full leading-normal font-normal"
							>
								Male
							</Label>
						</div>

						<div className="flex h-8 items-center gap-2 rounded-lg px-2 hover:bg-gray-100">
							<RadioGroupItem value="female" id="patient-gender-female" />
							<Label
								htmlFor="patient-gender-female"
								className="cursor-pointer w-full leading-normal font-normal"
							>
								Female
							</Label>
						</div>
					</RadioGroup>
				</PopoverContent>
			</Popover>

			<Popover>
				<PopoverTrigger asChild>
					<Button variant="outline" className="bg-white text-gray-600 hover:bg-gray-100">
						<RiCalendarView aria-hidden className="size-4 text-gray-600" />
						Age
					</Button>
				</PopoverTrigger>
				<PopoverContent align="end" className="w-[13.75rem] p-1 text-sm text-gray-700">
					<RadioGroup
						value={ageGroupFilter || "any-age"}
						onValueChange={(nextAgeGroupFilter) => {
							onAgeGroupFilterChange(
								nextAgeGroupFilter === "any-age"
									? ""
									: (nextAgeGroupFilter as PatientAgeGroupFilter),
							);
						}}
						className="flex flex-col gap-0.5"
					>
						<div className="flex h-8 items-center gap-2 rounded-lg px-2 hover:bg-gray-100">
							<RadioGroupItem value="any-age" id="patient-age-any" />
							<Label
								htmlFor="patient-age-any"
								className="cursor-pointer w-full leading-normal font-normal"
							>
								Any age
							</Label>
						</div>

						<div className="flex h-8 items-center gap-2 rounded-lg px-2 hover:bg-gray-100">
							<RadioGroupItem value="children" id="patient-age-children" />
							<Label
								htmlFor="patient-age-children"
								className="cursor-pointer w-full leading-normal font-normal"
							>
								0-12 (Children)
							</Label>
						</div>

						<div className="flex h-8 items-center gap-2 rounded-lg px-2 hover:bg-gray-100">
							<RadioGroupItem value="teenagers" id="patient-age-teenagers" />
							<Label
								htmlFor="patient-age-teenagers"
								className="cursor-pointer w-full leading-normal font-normal"
							>
								13-17 (Teenagers)
							</Label>
						</div>

						<div className="flex h-8 items-center gap-2 rounded-lg px-2 hover:bg-gray-100">
							<RadioGroupItem value="young-adults" id="patient-age-young-adults" />
							<Label
								htmlFor="patient-age-young-adults"
								className="cursor-pointer w-full leading-normal font-normal"
							>
								18-35 (Young adults)
							</Label>
						</div>

						<div className="flex h-8 items-center gap-2 rounded-lg px-2 hover:bg-gray-100">
							<RadioGroupItem value="adults" id="patient-age-adults" />
							<Label
								htmlFor="patient-age-adults"
								className="cursor-pointer w-full leading-normal font-normal"
							>
								36-59 (Adults)
							</Label>
						</div>

						<div className="flex h-8 items-center gap-2 rounded-lg px-2 hover:bg-gray-100">
							<RadioGroupItem value="seniors" id="patient-age-seniors" />
							<Label
								htmlFor="patient-age-seniors"
								className="cursor-pointer w-full leading-normal font-normal"
							>
								60+ (Seniors)
							</Label>
						</div>
					</RadioGroup>
				</PopoverContent>
			</Popover>

			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button variant="outline" className="bg-white text-gray-600 hover:bg-gray-100">
						<RiCalendarLine aria-hidden className="size-4 text-gray-600" />
						Created at
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent
					align="end"
					className="w-[13.75rem] rounded-xl bg-white text-sm text-gray-700"
				>
					<DateRangeMenuItems
						from={createdFrom}
						to={createdTo}
						onDateRangeApply={onCreatedAtRangeApply}
						onCustomDateRangeSelect={setCustomDateRangeFilter}
					/>
				</DropdownMenuContent>
			</DropdownMenu>
			<SetDateRangeDialog
				dateRangeFilter={customDateRangeFilter}
				onClose={() => setCustomDateRangeFilter(null)}
			/>
		</>
	);
}
