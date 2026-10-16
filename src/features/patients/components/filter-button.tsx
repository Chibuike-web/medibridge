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
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils/cn";
import { useState } from "react";
import type { PatientAgeGroupFilter, PatientGenderFilter } from "../types";

import {
	RiArrowRightSLine,
	RiCalendarLine,
	RiCalendarView,
	RiFilter3Line,
	RiMenLine,
} from "@remixicon/react";

type PatientFilterSubmenu = "gender" | "age" | "created-at";

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
	const [activeFilterSubmenu, setActiveFilterSubmenu] = useState<PatientFilterSubmenu | null>(null);
	const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
	const [customDateRangeFilter, setCustomDateRangeFilter] = useState<DateRangeFilter | null>(null);

	return (
		<>
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
					<Button variant="outline" className="bg-white text-gray-600 hover:bg-gray-100">
						<RiFilter3Line aria-hidden className="size-4 text-gray-600" />
						Filter
					</Button>
				</DropdownMenuTrigger>

				<DropdownMenuContent
					onPointerLeave={() => setActiveFilterSubmenu(null)}
					align="end"
					className="relative w-[13.75rem] overflow-visible rounded-xl bg-white text-sm text-gray-700"
				>
					<DropdownMenuItem
						data-active={activeFilterSubmenu === "gender"}
						onFocus={() => setActiveFilterSubmenu("gender")}
						onPointerEnter={() => setActiveFilterSubmenu("gender")}
						onSelect={(event) => event.preventDefault()}
						className="h-8 rounded-lg py-0 text-gray-600 focus:bg-gray-100 data-[active=true]:bg-gray-100"
					>
						<RiMenLine className="size-4" />
						<span className="flex-1">Gender</span>
						<RiArrowRightSLine className="size-4" aria-hidden="true" />
					</DropdownMenuItem>

					<DropdownMenuItem
						data-active={activeFilterSubmenu === "age"}
						onFocus={() => setActiveFilterSubmenu("age")}
						onPointerEnter={() => setActiveFilterSubmenu("age")}
						onSelect={(event) => event.preventDefault()}
						className="h-8 rounded-lg py-0 text-gray-600 focus:bg-gray-100 focus:text-gray-900 data-[active=true]:bg-gray-100"
					>
						<RiCalendarView className="size-4" />
						<span className="flex-1">Age</span>
						<RiArrowRightSLine className="size-4" aria-hidden="true" />
					</DropdownMenuItem>

					<DropdownMenuItem
						data-active={activeFilterSubmenu === "created-at"}
						onFocus={() => setActiveFilterSubmenu("created-at")}
						onPointerEnter={() => setActiveFilterSubmenu("created-at")}
						onSelect={(event) => event.preventDefault()}
						className="mb-0 h-8 rounded-lg py-0 text-gray-600 focus:bg-gray-100 focus:text-gray-900 data-[active=true]:bg-gray-100"
					>
						<RiCalendarLine className="size-4" />
						<span className="flex-1">Created at</span>
						<RiArrowRightSLine className="size-4" aria-hidden="true" />
					</DropdownMenuItem>

					<div
						id="patient-filter-submenu-panel"
						aria-hidden={activeFilterSubmenu === null}
						className={cn(
							"absolute top-0 right-[100%] z-50 w-[13.75rem] max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl bg-white text-sm text-gray-700 shadow-[0_0_0_1px_rgba(0,0,0,0.06),0_1px_2px_-1px_rgba(0,0,0,0.06),0_0.5rem_1.5rem_-0.25rem_rgba(0,0,0,0.12)] transition-[translate,opacity] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none",
							activeFilterSubmenu === "age"
								? "translate-y-9"
								: activeFilterSubmenu === "created-at"
									? "translate-y-18"
									: "translate-y-0",
							activeFilterSubmenu === null ? "pointer-events-none opacity-0" : "opacity-100",
						)}
					>
						<div hidden={activeFilterSubmenu !== "gender"} className="p-1">
							<RadioGroup
								value={genderFilter || "all"}
								onValueChange={(nextGenderFilter) => {
									onGenderFilterChange(
										nextGenderFilter === "all" ? "" : (nextGenderFilter as PatientGenderFilter),
									);
								}}
								className="flex flex-col gap-0.5"
								disabled={isPending}
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
						</div>

						<div hidden={activeFilterSubmenu !== "age"} className="p-1">
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
								disabled={isPending}
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
						</div>

						<div hidden={activeFilterSubmenu !== "created-at"} className="p-1">
							<DateRangeMenuItems
								from={createdFrom}
								to={createdTo}
								onDateRangeApply={onCreatedAtRangeApply}
								onCustomDateRangeSelect={setCustomDateRangeFilter}
							/>
						</div>
					</div>
				</DropdownMenuContent>
			</DropdownMenu>
			<SetDateRangeDialog
				dateRangeFilter={customDateRangeFilter}
				onClose={() => setCustomDateRangeFilter(null)}
			/>
		</>
	);
}
