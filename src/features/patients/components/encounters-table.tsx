"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import type {
	EncounterDepartmentFilter,
	EncounterType,
	EncounterTypeFilter,
} from "@/features/patients/types";
import { CopyIdButton } from "@/components/copy-id-button";
import { IndeterminateCheckbox } from "@/components/indeterminate-checkbox";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils/cn";
import { parseDateParam } from "@/lib/utils/parse-date-param";
import {
	type ColumnDef,
	flexRender,
	getCoreRowModel,
	getSortedRowModel,
	type SortingState,
	useReactTable,
} from "@tanstack/react-table";
import {
	RiArchiveLine,
	RiArrowDownSLine,
	RiArrowRightLine,
	RiArrowUpSLine,
	RiCalendarLine,
	RiCheckLine,
	RiCloseLine,
	RiCheckboxCircleLine,
	RiErrorWarningLine,
	RiFilter3Line,
	RiMore2Fill,
	RiSearchLine,
	RiShare2Line,
	RiBuilding4Line,
	RiFileList2Line,
} from "@remixicon/react";
import { endOfDay, format, isSameDay, startOfDay, subDays } from "date-fns";
import type { DateRange } from "react-day-picker";

const ROWS_PER_PAGE_OPTIONS = [14, 28, 42];

type EncounterFilterSubmenu = "type" | "department" | "encounter-date" | "created-at";

type EncounterDateFilterPreset = {
	label: string;
	getRange: (today: Date) => EncounterDateCompleteRange;
};

type EncounterDateCompleteRange = {
	from: Date;
	to: Date;
};

const encounterTypeFilterOptions: {
	label: string;
	value: EncounterTypeFilter;
}[] = [
	{ label: "Emergency Visit", value: "emergency-visit" },
	{ label: "Routine Checkup", value: "routine-checkup" },
	{ label: "Follow-up Visit", value: "follow-up-visit" },
	{ label: "Outpatient Visit", value: "outpatient-visit" },
];

const encounterDepartmentFilterOptions: {
	label: string;
	value: EncounterDepartmentFilter;
}[] = [
	{ label: "Emergency Medicine", value: "emergency-medicine" },
	{ label: "General Medicine", value: "general-medicine" },
	{ label: "Cardiology", value: "cardiology" },
	{ label: "Endocrinology", value: "endocrinology" },
	{ label: "Family Medicine", value: "family-medicine" },
	{ label: "Nephrology", value: "nephrology" },
];

const encounterDateFilterPresets: EncounterDateFilterPreset[] = [
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

type EncountersTableProps = {
	patientId: string;
	encounters: EncounterType[];
	page: number;
	limit: number;
	totalPages: number;
	query: string;
	encounterFrom: string;
	encounterTo: string;
	createdFrom: string;
	createdTo: string;
	encounterTypeFilters: EncounterTypeFilter[];
	departmentFilters: EncounterDepartmentFilter[];
	isPending: boolean;
	onQueryChange: (query: string) => void;
	onEncounterDateRangeApply: (encounterFrom: string, encounterTo: string) => void;
	onCreatedAtRangeApply: (createdFrom: string, createdTo: string) => void;
	onEncounterTypeFiltersChange: (encounterTypeFilters: EncounterTypeFilter[]) => void;
	onDepartmentFiltersChange: (departmentFilters: EncounterDepartmentFilter[]) => void;
	onPreviousPage: () => void;
	onNextPage: () => void;
	onLimitChange: (limit: number) => void;
};

export function EncountersTable({
	patientId,
	encounters,
	page,
	limit,
	totalPages,
	query,
	encounterFrom,
	encounterTo,
	createdFrom,
	createdTo,
	encounterTypeFilters,
	departmentFilters,
	isPending,
	onQueryChange,
	onEncounterDateRangeApply,
	onCreatedAtRangeApply,
	onEncounterTypeFiltersChange,
	onDepartmentFiltersChange,
	onPreviousPage,
	onNextPage,
	onLimitChange,
}: EncountersTableProps) {
	const columns = useMemo(() => getEncountersColumns(patientId), [patientId]);
	const [sorting, setSorting] = useState<SortingState>([]);
	const [activeFilterSubmenu, setActiveFilterSubmenu] = useState<EncounterFilterSubmenu | null>(
		null,
	);
	const hasActiveFilters = Boolean(
		query ||
		encounterFrom ||
		encounterTo ||
		createdFrom ||
		createdTo ||
		encounterTypeFilters.length > 0 ||
		departmentFilters.length > 0,
	);
	const emptyMessage = hasActiveFilters
		? "No encounters match the current filters."
		: "No encounters found.";

	const table = useReactTable({
		data: encounters,
		columns,
		enableRowSelection: true,
		onSortingChange: setSorting,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		state: { sorting },
	});

	return (
		<div className="px-6 py-8 text-sm">
			<h1 className="mx-auto max-w-7xl text-xl font-semibold">Encounters</h1>
			<div className="mx-auto mt-7 mb-4 flex max-w-7xl items-center gap-2">
				<div className="relative w-full">
					<RiSearchLine className="size-4 pointer-events-none absolute bottom-0 left-2 flex h-full items-center justify-center text-gray-400" />
					<Input
						type="search"
						className="pl-8"
						placeholder="Search by type, department, physician, or encounter ID"
						value={query}
						onChange={(event) => onQueryChange(event.target.value)}
					/>
				</div>
				<DropdownMenu
					onOpenChange={(isEncounterFilterMenuOpen) => {
						if (!isEncounterFilterMenuOpen) {
							setActiveFilterSubmenu(null);
						}
					}}
				>
					<DropdownMenuTrigger asChild>
						<Button
							variant="outline"
							className="border-gray-200 bg-white text-sm text-gray-600 hover:bg-gray-50 data-[state=open]:border-gray-400 data-[state=open]:ring-4 data-[state=open]:ring-gray-200"
						>
							<RiFilter3Line aria-hidden className="size-5 text-gray-600" />
							Filter
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent
						align="end"
						sideOffset={8}
						className="w-[13.75rem] rounded-xl border-gray-200 bg-white text-sm text-gray-700 shadow-xl"
					>
						<DropdownMenuSub
							open={activeFilterSubmenu === "type"}
							onOpenChange={(isTypeSubmenuOpen) => {
								setActiveFilterSubmenu((prev) => {
									if (isTypeSubmenuOpen) return "type";
									if (prev === "type") return null;
									return prev;
								});
							}}
						>
							<DropdownMenuSubTrigger className="rounded-lg focus:bg-gray-100 focus:text-gray-900 data-[state=open]:bg-gray-100 py-2">
								<RiFileList2Line className="size-4.5" />
								<span className="block">Type</span>
							</DropdownMenuSubTrigger>
							<DropdownMenuSubContent
								sideOffset={12}
								alignOffset={-5}
								className="w-[13.75rem] rounded-xl border border-gray-200 bg-white p-1 text-sm text-gray-700 shadow-xl"
							>
								<EncounterCheckboxFilterList
									name="encounter-type"
									options={encounterTypeFilterOptions}
									selectedValues={encounterTypeFilters}
									isPending={isPending}
									onSelectedValuesChange={onEncounterTypeFiltersChange}
								/>
							</DropdownMenuSubContent>
						</DropdownMenuSub>

						<DropdownMenuSub
							open={activeFilterSubmenu === "department"}
							onOpenChange={(isDepartmentSubmenuOpen) => {
								setActiveFilterSubmenu((prev) => {
									if (isDepartmentSubmenuOpen) return "department";
									if (prev === "department") return null;
									return prev;
								});
							}}
						>
							<DropdownMenuSubTrigger className="rounded-lg focus:bg-gray-100 focus:text-gray-900 data-[state=open]:bg-gray-100 py-2">
								<RiBuilding4Line className="size-4.5" />
								<span className="block">Department</span>
							</DropdownMenuSubTrigger>
							<DropdownMenuSubContent
								sideOffset={12}
								alignOffset={-5}
								className="w-[13.75rem] rounded-xl border border-gray-200 bg-white p-1 text-sm text-gray-700 shadow-xl"
							>
								<EncounterCheckboxFilterList
									name="encounter-department"
									options={encounterDepartmentFilterOptions}
									selectedValues={departmentFilters}
									isPending={isPending}
									onSelectedValuesChange={onDepartmentFiltersChange}
								/>
							</DropdownMenuSubContent>
						</DropdownMenuSub>

						<DropdownMenuSub
							open={activeFilterSubmenu === "encounter-date"}
							onOpenChange={(isEncounterDateSubmenuOpen) => {
								setActiveFilterSubmenu((prev) => {
									if (isEncounterDateSubmenuOpen) return "encounter-date";
									if (prev === "encounter-date") return null;
									return prev;
								});
							}}
						>
							<DropdownMenuSubTrigger className="rounded-lg focus:bg-gray-100 focus:text-gray-900 data-[state=open]:bg-gray-100 py-2">
								<RiCalendarLine className="size-4.5" />
								<span className="block">Encounter date</span>
							</DropdownMenuSubTrigger>
							<DropdownMenuSubContent
								sideOffset={8}
								alignOffset={-5}
								className="w-max max-w-[calc(100vw-2rem)] rounded-xl border border-gray-200 bg-white p-0 text-sm text-gray-700 shadow-xl"
							>
								<EncounterDateFilterContent
									from={encounterFrom}
									to={encounterTo}
									isPending={isPending}
									onDateRangeApply={onEncounterDateRangeApply}
								/>
							</DropdownMenuSubContent>
						</DropdownMenuSub>

						<DropdownMenuSub
							open={activeFilterSubmenu === "created-at"}
							onOpenChange={(isCreatedAtSubmenuOpen) => {
								setActiveFilterSubmenu((prev) => {
									if (isCreatedAtSubmenuOpen) return "created-at";
									if (prev === "created-at") return null;
									return prev;
								});
							}}
						>
							<DropdownMenuSubTrigger className="rounded-lg focus:bg-gray-100 focus:text-gray-900 data-[state=open]:bg-gray-100 py-2">
								<RiCalendarLine className="size-4.5" />
								<span className="block">Created at</span>
							</DropdownMenuSubTrigger>
							<DropdownMenuSubContent
								sideOffset={8}
								alignOffset={-5}
								className="w-max max-w-[calc(100vw-2rem)] rounded-xl border border-gray-200 bg-white p-0 text-sm text-gray-700 shadow-xl"
							>
								<EncounterDateFilterContent
									from={createdFrom}
									to={createdTo}
									isPending={isPending}
									onDateRangeApply={onCreatedAtRangeApply}
								/>
							</DropdownMenuSubContent>
						</DropdownMenuSub>
					</DropdownMenuContent>
				</DropdownMenu>
				<Button
					variant="outline"
					className="border-gray-200 bg-white text-sm text-gray-600 hover:bg-gray-50 data-[state=open]:border-gray-400 data-[state=open]:ring-4 data-[state=open]:ring-gray-200"
				>
					<RiShare2Line aria-hidden className="size-5 text-gray-600" />
					Export
				</Button>
				<Button className="text-sm">Create encounter</Button>
			</div>
			<EncounterActiveFilterPills
				encounterFrom={encounterFrom}
				encounterTo={encounterTo}
				createdFrom={createdFrom}
				createdTo={createdTo}
				encounterTypeFilters={encounterTypeFilters}
				departmentFilters={departmentFilters}
				onEncounterDateRangeApply={onEncounterDateRangeApply}
				onCreatedAtRangeApply={onCreatedAtRangeApply}
				onEncounterTypeFiltersChange={onEncounterTypeFiltersChange}
				onDepartmentFiltersChange={onDepartmentFiltersChange}
			/>
			<div className="mx-auto max-w-7xl overflow-x-auto rounded-xl border border-gray-200 text-sm">
				<Table className="min-w-[72rem] border-separate border-spacing-0 bg-gray-50 text-left">
					<TableHeader className="h-12 text-sm font-semibold text-gray-600">
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow key={headerGroup.id} className="h-12">
								{headerGroup.headers.map((header) => (
									<TableHead
										key={header.id}
										onClick={header.column.getToggleSortingHandler()}
										onKeyDown={(event) => {
											if (event.key === "Enter") {
												header.column.getToggleSortingHandler()?.(event);
											}
										}}
										className={cn(
											"z-10 h-12 bg-gray-50 px-3 py-0 text-gray-600 whitespace-nowrap",
											header.column.getCanSort() ? "cursor-pointer select-none" : "",
										)}
									>
										<div className="flex items-center justify-between gap-3">
											{header.isPlaceholder
												? null
												: flexRender(header.column.columnDef.header, header.getContext())}
											{header.column.getCanSort() ? (
												<div className="-space-y-2">
													<RiArrowUpSLine
														className={cn(
															"size-4 text-gray-800",
															header.column.getIsSorted() === "desc" ? "opacity-30" : "",
														)}
														aria-hidden
													/>
													<RiArrowDownSLine
														className={cn(
															"size-4 text-gray-800",
															header.column.getIsSorted() === "asc" ? "opacity-30" : "",
														)}
														aria-hidden
													/>
												</div>
											) : null}
										</div>
									</TableHead>
								))}
							</TableRow>
						))}
					</TableHeader>
					<TableBody className="overflow-hidden rounded-t-xl outline outline-gray-200">
						{table.getRowModel().rows.length > 0 ? (
							table.getRowModel().rows.map((row, rowPosition) => (
								<TableRow key={row.id} className="group min-h-14">
									{row.getVisibleCells().map((cell) => (
										<TableCell
											key={cell.id}
											className={cn(
												"border-b border-gray-200 bg-white px-3 py-3 text-sm text-gray-600",
												rowPosition === table.getRowModel().rows.length - 1 && "border-b-0",
											)}
										>
											{flexRender(cell.column.columnDef.cell, cell.getContext())}
										</TableCell>
									))}
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell
									colSpan={columns.length}
									className="h-32 bg-white px-3 py-0 text-center text-sm text-gray-500"
								>
									{emptyMessage}
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
				<div className="flex flex-col gap-3 border-t border-gray-200 bg-white p-3 text-sm text-gray-500 sm:flex-row sm:items-center sm:justify-between">
					<div className="flex items-center gap-3">
						<span>Rows per page</span>
						<Select
							value={String(limit)}
							onValueChange={(value) => onLimitChange(Number(value))}
							disabled={isPending}
						>
							<SelectTrigger className="h-8 w-[4.25rem] border-gray-200 bg-white px-2 text-gray-700 shadow-none">
								<SelectValue aria-label="Rows per page" placeholder="Rows" />
							</SelectTrigger>
							<SelectContent>
								<SelectGroup className="p-1">
									{ROWS_PER_PAGE_OPTIONS.map((pageSize) => (
										<SelectItem key={pageSize} value={String(pageSize)}>
											{pageSize}
										</SelectItem>
									))}
								</SelectGroup>
							</SelectContent>
						</Select>
					</div>
					<div className="flex items-center gap-3">
						<span>
							Page {page} of {totalPages}
						</span>
						<div className="flex items-center gap-2">
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={onPreviousPage}
								disabled={page <= 1 || isPending}
								className="border-gray-200 px-3 text-gray-700 shadow-none transition"
							>
								Previous
							</Button>
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={onNextPage}
								disabled={page >= totalPages || isPending}
								className="border-gray-200 px-3 text-gray-700 shadow-none transition"
							>
								Next
							</Button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

function EncounterCheckboxFilterList<T extends string>({
	name,
	options,
	selectedValues,
	isPending,
	onSelectedValuesChange,
}: {
	name: string;
	options: { label: string; value: T }[];
	selectedValues: T[];
	isPending: boolean;
	onSelectedValuesChange: (selectedValues: T[]) => void;
}) {
	return (
		<>
			{options.map((option) => {
				const isSelected = selectedValues.includes(option.value);
				const optionId = `${name}-${option.value}`;

				return (
					<DropdownMenuItem
						key={option.value}
						className="rounded-lg p-0 focus:bg-gray-100 focus:text-gray-900"
						onSelect={(event) => {
							event.preventDefault();
						}}
					>
						<Label
							htmlFor={optionId}
							className="flex w-full cursor-pointer items-center gap-3 px-2 py-2 leading-normal font-normal"
						>
							<Checkbox
								id={optionId}
								checked={isSelected}
								disabled={isPending}
								onCheckedChange={(checked) => {
									onSelectedValuesChange(
										checked === true
											? [...selectedValues, option.value]
											: selectedValues.filter((selectedValue) => selectedValue !== option.value),
									);
								}}
								className="[&_svg]:!text-current"
							/>
							<span>{option.label}</span>
						</Label>
					</DropdownMenuItem>
				);
			})}
		</>
	);
}

function EncounterActiveFilterPills({
	encounterFrom,
	encounterTo,
	createdFrom,
	createdTo,
	encounterTypeFilters,
	departmentFilters,
	onEncounterDateRangeApply,
	onCreatedAtRangeApply,
	onEncounterTypeFiltersChange,
	onDepartmentFiltersChange,
}: {
	encounterFrom: string;
	encounterTo: string;
	createdFrom: string;
	createdTo: string;
	encounterTypeFilters: EncounterTypeFilter[];
	departmentFilters: EncounterDepartmentFilter[];
	onEncounterDateRangeApply: (encounterFrom: string, encounterTo: string) => void;
	onCreatedAtRangeApply: (createdFrom: string, createdTo: string) => void;
	onEncounterTypeFiltersChange: (encounterTypeFilters: EncounterTypeFilter[]) => void;
	onDepartmentFiltersChange: (departmentFilters: EncounterDepartmentFilter[]) => void;
}) {
	const hasEncounterDateFilter = Boolean(encounterFrom || encounterTo);
	const hasCreatedAtFilter = Boolean(createdFrom || createdTo);
	const hasEncounterTypeFilters = encounterTypeFilters.length > 0;
	const hasDepartmentFilters = departmentFilters.length > 0;

	if (
		!hasEncounterDateFilter &&
		!hasCreatedAtFilter &&
		!hasEncounterTypeFilters &&
		!hasDepartmentFilters
	) {
		return null;
	}

	return (
		<div className="mx-auto mb-4 flex max-w-7xl flex-wrap gap-2">
			{encounterTypeFilters.map((encounterTypeFilter) => (
				<EncounterFilterPill
					key={encounterTypeFilter}
					label={`Type: ${formatEncounterFilterValue(encounterTypeFilter)}`}
					onRemove={() => {
						onEncounterTypeFiltersChange(
							encounterTypeFilters.filter(
								(currentEncounterTypeFilter) => currentEncounterTypeFilter !== encounterTypeFilter,
							),
						);
					}}
				/>
			))}
			{departmentFilters.map((departmentFilter) => (
				<EncounterFilterPill
					key={departmentFilter}
					label={`Department: ${formatEncounterFilterValue(departmentFilter)}`}
					onRemove={() => {
						onDepartmentFiltersChange(
							departmentFilters.filter(
								(currentDepartmentFilter) => currentDepartmentFilter !== departmentFilter,
							),
						);
					}}
				/>
			))}
			{hasEncounterDateFilter ? (
				<EncounterFilterPill
					label={`Encounter: ${formatDateRangeFilterLabel(encounterFrom, encounterTo)}`}
					onRemove={() => onEncounterDateRangeApply("", "")}
				/>
			) : null}
			{hasCreatedAtFilter ? (
				<EncounterFilterPill
					label={`Created: ${formatDateRangeFilterLabel(createdFrom, createdTo)}`}
					onRemove={() => onCreatedAtRangeApply("", "")}
				/>
			) : null}
		</div>
	);
}

function EncounterFilterPill({ label, onRemove }: { label: string; onRemove: () => void }) {
	return (
		<span className="inline-flex items-center gap-3 rounded-full border border-gray-200 bg-gray-100 py-1.5 pr-1.5 pl-3 text-sm font-medium text-gray-600 shadow-xs">
			<span>{label}</span>
			<button
				type="button"
				onClick={onRemove}
				className="flex size-5 items-center justify-center rounded-full bg-gray-800 text-white transition hover:bg-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-300"
				aria-label={`Remove ${label} filter`}
			>
				<RiCloseLine className="size-4" aria-hidden="true" />
			</button>
		</span>
	);
}

function EncounterDateFilterContent({
	from,
	to,
	isPending,
	onDateRangeApply,
}: {
	from: string;
	to: string;
	isPending: boolean;
	onDateRangeApply: (from: string, to: string) => void;
}) {
	return (
		<div className="flex w-max">
			<div className="flex w-50 shrink-0 flex-col p-1 text-sm text-gray-600">
				<EncounterDatePresetList from={from} to={to} onDateRangeApply={onDateRangeApply} />
			</div>

			<div className="w-88 shrink-0 border-l border-gray-100 p-3">
				<EncounterCustomRangeCalendarPanel
					from={from}
					to={to}
					isPending={isPending}
					onDateRangeApply={onDateRangeApply}
				/>
			</div>
		</div>
	);
}

function EncounterDatePresetList({
	from,
	to,
	onDateRangeApply,
}: {
	from: string;
	to: string;
	onDateRangeApply: (from: string, to: string) => void;
}) {
	const selectedEncounterDateRange = getDateRangeFromParams(from, to);
	const today = new Date();

	return (
		<>
			{encounterDateFilterPresets.map((preset) => {
				const presetRange = preset.getRange(today);
				return (
					<EncounterDatePresetButton
						key={preset.label}
						label={preset.label}
						isSelected={isSameDateRange(selectedEncounterDateRange, presetRange)}
						onSelect={() => {
							onDateRangeApply(formatUrlDate(presetRange.from), formatUrlDate(presetRange.to));
						}}
					/>
				);
			})}
		</>
	);
}

function EncounterCustomRangeCalendarPanel({
	from,
	to,
	isPending,
	onDateRangeApply,
}: {
	from: string;
	to: string;
	isPending: boolean;
	onDateRangeApply: (from: string, to: string) => void;
}) {
	const selectedEncounterDateRange = getDateRangeFromParams(from, to);
	const selectedEncounterDateRangeKey = getDateRangeKey(selectedEncounterDateRange);
	const [draftEncounterDateRange, setDraftEncounterDateRange] = useState<DateRange | undefined>(
		selectedEncounterDateRange,
	);
	const [previousSelectedEncounterDateRangeKey, setPreviousSelectedEncounterDateRangeKey] =
		useState(selectedEncounterDateRangeKey);

	if (selectedEncounterDateRangeKey !== previousSelectedEncounterDateRangeKey) {
		setPreviousSelectedEncounterDateRangeKey(selectedEncounterDateRangeKey);
		setDraftEncounterDateRange(selectedEncounterDateRange);
	}

	return (
		<div className="flex min-w-0 flex-col">
			<div className="flex items-center gap-3">
				<EncounterDateFieldPlaceholder value={draftEncounterDateRange?.from} label="Start date" />
				<RiArrowRightLine className="size-5 shrink-0 text-gray-400" aria-hidden="true" />
				<EncounterDateFieldPlaceholder value={draftEncounterDateRange?.to} label="End date" />
			</div>

			<Calendar
				mode="range"
				selected={draftEncounterDateRange}
				onSelect={(nextDraftEncounterDateRange) => {
					setDraftEncounterDateRange(nextDraftEncounterDateRange);
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
						setDraftEncounterDateRange(undefined);
						onDateRangeApply("", "");
					}}
				>
					Reset
				</Button>
				<Button
					type="button"
					className="min-w-40 flex-1 text-sm"
					disabled={!draftEncounterDateRange?.from || !draftEncounterDateRange?.to || isPending}
					onClick={() => {
						if (!draftEncounterDateRange?.from || !draftEncounterDateRange?.to) return;

						onDateRangeApply(
							formatUrlDate(draftEncounterDateRange.from),
							formatUrlDate(draftEncounterDateRange.to),
						);
					}}
				>
					Apply
				</Button>
			</div>
		</div>
	);
}

function EncounterDatePresetButton({
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

function EncounterDateFieldPlaceholder({ label, value }: { label: string; value?: Date }) {
	return (
		<div className="flex h-9 min-w-0 flex-1 items-center gap-3 rounded-lg border border-gray-200 bg-white px-2 text-left text-sm font-medium text-gray-500">
			<RiCalendarLine className="size-5 shrink-0 text-gray-400" aria-hidden="true" />
			<span className="sr-only">{label}</span>
			<span className="truncate">{value ? format(value, "dd/MM/yyyy") : "DD/MM/YYYY"}</span>
		</div>
	);
}

function formatDateRangeFilterLabel(from: string, to: string) {
	const parsedFromDate = parseDateParam(from);
	const parsedToDate = parseDateParam(to);

	if (parsedFromDate && parsedToDate) {
		return `${format(parsedFromDate, "MMM d, yyyy")} - ${format(parsedToDate, "MMM d, yyyy")}`;
	}

	if (parsedFromDate) {
		return `From ${format(parsedFromDate, "MMM d, yyyy")}`;
	}

	if (parsedToDate) {
		return `Until ${format(parsedToDate, "MMM d, yyyy")}`;
	}

	return "Any date";
}

function getDateRangeFromParams(from: string, to: string): DateRange | undefined {
	const parsedFromDate = parseDateParam(from);
	const parsedToDate = parseDateParam(to);

	if (!parsedFromDate && !parsedToDate) {
		return undefined;
	}

	return {
		from: parsedFromDate ?? undefined,
		to: parsedToDate ?? undefined,
	};
}

function getDateRangeKey(dateRange?: DateRange) {
	return `${dateRange?.from?.toISOString() ?? ""}:${dateRange?.to?.toISOString() ?? ""}`;
}

function isSameDateRange(left?: DateRange, right?: DateRange) {
	if (!left?.from || !left?.to || !right?.from || !right?.to) {
		return false;
	}

	return isSameDay(left.from, right.from) && isSameDay(left.to, right.to);
}

function formatUrlDate(date: Date) {
	return format(date, "yyyy-MM-dd");
}

function formatEncounterFilterValue(value: string) {
	return value
		.split("-")
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(" ");
}

function getEncountersColumns(patientId: string): ColumnDef<EncounterType>[] {
	return [
		{
			id: "select",
			header: ({ table }) => (
				<div
					className="flex items-center justify-center"
					onClick={(event) => event.stopPropagation()}
				>
					<IndeterminateCheckbox
						checked={table.getIsAllPageRowsSelected()}
						indeterminate={table.getIsSomePageRowsSelected()}
						onCheckedChange={(value) => {
							table.toggleAllPageRowsSelected(!!value);
						}}
					/>
				</div>
			),
			cell: ({ row }) => (
				<div className="w-max" onClick={(event) => event.stopPropagation()}>
					<IndeterminateCheckbox
						checked={row.getIsSelected()}
						disabled={!row.getCanSelect()}
						indeterminate={row.getIsSomeSelected()}
						onCheckedChange={(value) => {
							row.toggleSelected(!!value);
						}}
					/>
				</div>
			),
			enableSorting: false,
		},
		{
			id: "encounterDate",
			header: "Encounter date",
			accessorFn: (row) => row.encounterDateSortValue,
			enableSorting: true,
			cell: ({ row }) => (
				<span className="font-medium text-gray-800">{row.original.encounterDateLabel}</span>
			),
		},
		{
			header: "Encounter Type",
			accessorKey: "encounterType",
			enableSorting: true,
		},
		{
			header: "Encounter ID",
			accessorKey: "encounterId",
			enableSorting: false,
			cell: ({ row }) => <CopyIdButton id={row.original.encounterId} />,
		},
		{
			header: "Department",
			accessorKey: "department",
			enableSorting: true,
		},
		{
			header: "Physician",
			accessorKey: "physician",
			enableSorting: true,
		},
		{
			id: "actions",
			header: "",
			enableSorting: false,
			cell: ({ row }) => (
				<div className="flex justify-end">
					<DropdownMenu>
						<DropdownMenuTrigger
							type="button"
							className="inline-flex size-9 items-center justify-center rounded-md border border-transparent text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
							aria-label={`Open actions for ${row.original.encounterId}`}
						>
							<RiMore2Fill className="size-5" aria-hidden />
						</DropdownMenuTrigger>
						<DropdownMenuContent
							align="end"
							className="w-[13.75rem] rounded-xl border-white/20 bg-gray-800 text-sm text-white ring ring-gray-800"
						>
							<DropdownMenuItem asChild className="py-2">
								<Link
									href={
										`/dashboard/patients/${patientId}/encounters/${row.original.encounterId}` as Route
									}
									className="flex items-center gap-3 rounded-lg text-white focus:bg-white/10 focus:text-white"
								>
									<RiErrorWarningLine className="text-white" />
									<span>View details</span>
								</Link>
							</DropdownMenuItem>
							<DropdownMenuItem className="gap-3 rounded-lg text-white focus:bg-white/10 focus:text-white py-2">
								<RiShare2Line className="text-white" />
								<span>Export</span>
							</DropdownMenuItem>
							<DropdownMenuSeparator className="bg-white/20" />
							<DropdownMenuItem className="gap-3 rounded-lg text-white focus:bg-white/10 focus:text-white py-2">
								<RiArchiveLine className="text-white" />
								<span>Archive</span>
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			),
		},
	];
}
