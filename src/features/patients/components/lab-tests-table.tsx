"use client";

import { useMemo, useState } from "react";
import type {
	LabTestFlagFilter,
	LabTestStatusFilter,
	LabTestType,
} from "@/features/patients/types";
import { CopyIdButton } from "@/components/copy-id-button";
import { CreateLabTestDrawer } from "@/features/patients/components/create-lab-test-drawer";
import { IndeterminateCheckbox } from "@/components/indeterminate-checkbox";
import { LabTestDetailsDrawer } from "@/features/patients/components/lab-test-details-drawer";
import { StatusBadge } from "@/components/status-badge";
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
	RiCheckboxCircleLine,
	RiCheckLine,
	RiCloseLine,
	RiEyeLine,
	RiFlagLine,
	RiFilter3Line,
	RiMore2Fill,
	RiSearchLine,
	RiShare2Line,
} from "@remixicon/react";
import { endOfDay, format, isSameDay, startOfDay, subDays } from "date-fns";
import type { DateRange } from "react-day-picker";

const ROWS_PER_PAGE_OPTIONS = [14, 28, 42];

type LabTestFilterSubmenu = "status" | "flag" | "created-at";

type LabTestDateFilterPreset = {
	label: string;
	getRange: (today: Date) => LabTestDateCompleteRange;
};

type LabTestDateCompleteRange = {
	from: Date;
	to: Date;
};

const labTestStatusFilterOptions: {
	label: string;
	value: LabTestStatusFilter;
}[] = [
	{ label: "Pending", value: "pending" },
	{ label: "Completed", value: "completed" },
	{ label: "Cancelled", value: "cancelled" },
];

const labTestFlagFilterOptions: {
	label: string;
	value: LabTestFlagFilter;
}[] = [
	{ label: "Within range", value: "within-range" },
	{ label: "Abnormal", value: "abnormal" },
	{ label: "High", value: "high" },
	{ label: "Low", value: "low" },
	{ label: "Critical", value: "critical" },
	{ label: "Pending", value: "pending" },
	{ label: "Borderline", value: "borderline" },
	{ label: "Invalid", value: "invalid" },
	{ label: "Cancelled", value: "cancelled" },
	{ label: "Inconclusive", value: "inconclusive" },
];

const labTestDateFilterPresets: LabTestDateFilterPreset[] = [
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

type LabTestsTableProps = {
	patientId: string;
	labTests: LabTestType[];
	page: number;
	limit: number;
	totalPages: number;
	query: string;
	createdFrom: string;
	createdTo: string;
	statusFilters: LabTestStatusFilter[];
	flagFilters: LabTestFlagFilter[];
	isPending: boolean;
	onQueryChange: (query: string) => void;
	onCreatedAtRangeApply: (createdFrom: string, createdTo: string) => void;
	onStatusFiltersChange: (statusFilters: LabTestStatusFilter[]) => void;
	onFlagFiltersChange: (flagFilters: LabTestFlagFilter[]) => void;
	onPreviousPage: () => void;
	onNextPage: () => void;
	onLimitChange: (limit: number) => void;
};

export function LabTestsTable({
	patientId,
	labTests,
	page,
	limit,
	totalPages,
	query,
	createdFrom,
	createdTo,
	statusFilters,
	flagFilters,
	isPending,
	onQueryChange,
	onCreatedAtRangeApply,
	onStatusFiltersChange,
	onFlagFiltersChange,
	onPreviousPage,
	onNextPage,
	onLimitChange,
}: LabTestsTableProps) {
	void patientId;

	const [sorting, setSorting] = useState<SortingState>([]);
	const [activeFilterSubmenu, setActiveFilterSubmenu] =
		useState<LabTestFilterSubmenu | null>(null);
	const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false);
	const [isDetailsDrawerOpen, setIsDetailsDrawerOpen] = useState(false);
	const [selectedTest, setSelectedTest] = useState<LabTestType | null>(null);

	function handleViewLabTestDetails(labTest: LabTestType) {
		setSelectedTest(labTest);
		setIsDetailsDrawerOpen(true);
	}

	const columns = useMemo(
		() => getLabTestsColumns({ onViewLabTestDetails: handleViewLabTestDetails }),
		[],
	);

	const table = useReactTable({
		data: labTests,
		columns,
		enableRowSelection: true,
		onSortingChange: setSorting,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		state: {
			sorting,
		},
	});
	return (
		<div className="px-6 py-8 text-sm">
			<h1 className="mx-auto max-w-7xl text-xl font-semibold no-line-height">Lab Tests</h1>
			<div className="mx-auto mt-7 mb-4 flex max-w-7xl items-center gap-2">
				<div className="relative w-full">
					<RiSearchLine className="size-4 pointer-events-none absolute bottom-0 left-2 flex h-full items-center justify-center text-gray-400" />
					<Input
						type="search"
						className="pl-8"
						placeholder="Search by test, result, status, or lab ID"
						value={query}
						onChange={(event) => onQueryChange(event.target.value)}
					/>
				</div>
					<DropdownMenu
						onOpenChange={(isLabTestFilterMenuOpen) => {
							if (!isLabTestFilterMenuOpen) {
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
							className="w-[13.75rem] rounded-xl border-gray-200 bg-white text-sm text-gray-700 shadow-xl"
						>
							<DropdownMenuSub
								open={activeFilterSubmenu === "status"}
								onOpenChange={(isStatusSubmenuOpen) => {
									setActiveFilterSubmenu((prev) => {
										if (isStatusSubmenuOpen) return "status";
										if (prev === "status") return null;
										return prev;
									});
								}}
							>
								<DropdownMenuSubTrigger className="rounded-lg focus:bg-gray-100 focus:text-gray-900 data-[state=open]:bg-gray-100 py-2">
									<RiCheckboxCircleLine className="size-4.5" />
									<span className="block">Status</span>
								</DropdownMenuSubTrigger>
								<DropdownMenuSubContent
									alignOffset={-5}
									className="w-[13.75rem] rounded-xl border border-gray-200 bg-white p-1 text-sm text-gray-700 shadow-xl"
								>
									<LabTestCheckboxFilterList
										name="lab-test-status"
										options={labTestStatusFilterOptions}
										selectedValues={statusFilters}
										isPending={isPending}
										onSelectedValuesChange={onStatusFiltersChange}
									/>
								</DropdownMenuSubContent>
							</DropdownMenuSub>

							<DropdownMenuSub
								open={activeFilterSubmenu === "flag"}
								onOpenChange={(isFlagSubmenuOpen) => {
									setActiveFilterSubmenu((prev) => {
										if (isFlagSubmenuOpen) return "flag";
										if (prev === "flag") return null;
										return prev;
									});
								}}
							>
								<DropdownMenuSubTrigger className="rounded-lg focus:bg-gray-100 focus:text-gray-900 data-[state=open]:bg-gray-100 py-2">
									<RiFlagLine className="size-4.5" />
									<span className="block">Flag</span>
								</DropdownMenuSubTrigger>
								<DropdownMenuSubContent
									alignOffset={-5}
									className="w-[13.75rem] rounded-xl border border-gray-200 bg-white p-1 text-sm text-gray-700 shadow-xl"
								>
									<LabTestCheckboxFilterList
										name="lab-test-flag"
										options={labTestFlagFilterOptions}
										selectedValues={flagFilters}
										isPending={isPending}
										onSelectedValuesChange={onFlagFiltersChange}
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
									alignOffset={-5}
									className="w-max max-w-[calc(100vw-2rem)] rounded-xl border border-gray-200 bg-white p-0 text-sm text-gray-700 shadow-xl"
								>
									<LabTestDateFilterContent
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
						<Button
							className="text-sm"
							type="button"
							onClick={() => setIsCreateDrawerOpen(true)}
						>
							Add lab test
						</Button>
				</div>
				<LabTestActiveFilterPills
					createdFrom={createdFrom}
					createdTo={createdTo}
					statusFilters={statusFilters}
					flagFilters={flagFilters}
					onCreatedAtRangeApply={onCreatedAtRangeApply}
					onStatusFiltersChange={onStatusFiltersChange}
					onFlagFiltersChange={onFlagFiltersChange}
				/>
				<div className="mx-auto max-w-7xl overflow-x-auto rounded-xl border border-gray-200 text-sm">
				<Table className="min-w-[76rem] border-separate border-spacing-0 bg-gray-50 text-left">
					<TableHeader className="text-sm font-semibold text-gray-600">
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow key={headerGroup.id}>
								{headerGroup.headers.map((header) => (
									<TableHead
										key={header.id}
										tabIndex={header.column.getCanSort() ? 0 : undefined}
										aria-sort={
											header.column.getCanSort()
												? header.column.getIsSorted() === "asc"
													? "ascending"
													: header.column.getIsSorted() === "desc"
														? "descending"
														: "none"
												: undefined
										}
										onClick={
											header.column.getCanSort()
												? header.column.getToggleSortingHandler()
												: undefined
										}
										onKeyDown={(event) => {
											if (header.column.getCanSort() && (event.key === "Enter" || event.key === " ")) {
												event.preventDefault();
												header.column.getToggleSortingHandler()?.(event);
											}
										}}
										className={cn(
											"z-10 h-10 bg-gray-50 px-3 py-0 text-gray-600 whitespace-nowrap",
											header.column.getCanSort()
												? "cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gray-400"
												: "",
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
								<TableRow
									key={row.id}
									role="button"
									tabIndex={0}
									onClick={() => handleViewLabTestDetails(row.original)}
									onKeyDown={(event) => {
										if (event.key === "Enter" || event.key === " ") {
											event.preventDefault();
											handleViewLabTestDetails(row.original);
										}
									}}
									className="group min-h-14 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gray-400"
								>
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
									No matching lab tests found.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
				<div className="flex gap-3 border-t border-gray-200 bg-white p-3 text-sm text-gray-500 items-center justify-between">
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
				<CreateLabTestDrawer
					open={isCreateDrawerOpen}
					onOpenChange={setIsCreateDrawerOpen}
				/>
				<LabTestDetailsDrawer
					open={isDetailsDrawerOpen}
					onOpenChange={setIsDetailsDrawerOpen}
					labTest={selectedTest}
				/>
			</div>
		);
	}

function LabTestCheckboxFilterList<TValue extends string>({
	name,
	options,
	selectedValues,
	isPending,
	onSelectedValuesChange,
}: {
	name: string;
	options: { label: string; value: TValue }[];
	selectedValues: TValue[];
	isPending: boolean;
	onSelectedValuesChange: (selectedValues: TValue[]) => void;
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

function LabTestActiveFilterPills({
	createdFrom,
	createdTo,
	statusFilters,
	flagFilters,
	onCreatedAtRangeApply,
	onStatusFiltersChange,
	onFlagFiltersChange,
}: {
	createdFrom: string;
	createdTo: string;
	statusFilters: LabTestStatusFilter[];
	flagFilters: LabTestFlagFilter[];
	onCreatedAtRangeApply: (createdFrom: string, createdTo: string) => void;
	onStatusFiltersChange: (statusFilters: LabTestStatusFilter[]) => void;
	onFlagFiltersChange: (flagFilters: LabTestFlagFilter[]) => void;
}) {
	const hasCreatedAtFilter = Boolean(createdFrom || createdTo);
	const hasStatusFilters = statusFilters.length > 0;
	const hasFlagFilters = flagFilters.length > 0;

	if (!hasCreatedAtFilter && !hasStatusFilters && !hasFlagFilters) {
		return null;
	}

	return (
		<div className="mx-auto mb-4 flex max-w-7xl flex-wrap gap-2">
			{statusFilters.map((statusFilter) => (
				<LabTestFilterPill
					key={statusFilter}
					label={`Status: ${formatLabTestFilterValue(statusFilter)}`}
					onRemove={() => {
						onStatusFiltersChange(
							statusFilters.filter((currentStatusFilter) => currentStatusFilter !== statusFilter),
						);
					}}
				/>
			))}
			{flagFilters.map((flagFilter) => (
				<LabTestFilterPill
					key={flagFilter}
					label={`Flag: ${formatLabTestFilterValue(flagFilter)}`}
					onRemove={() => {
						onFlagFiltersChange(
							flagFilters.filter((currentFlagFilter) => currentFlagFilter !== flagFilter),
						);
					}}
				/>
			))}
			{hasCreatedAtFilter ? (
				<LabTestFilterPill
					label={`Created: ${formatDateRangeFilterLabel(createdFrom, createdTo)}`}
					onRemove={() => onCreatedAtRangeApply("", "")}
				/>
			) : null}
		</div>
	);
}

function LabTestFilterPill({ label, onRemove }: { label: string; onRemove: () => void }) {
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

function LabTestDateFilterContent({
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
				<LabTestDatePresetList from={from} to={to} onDateRangeApply={onDateRangeApply} />
			</div>

			<div className="w-88 shrink-0 border-l border-gray-100 p-3">
				<LabTestCustomRangeCalendarPanel
					key={`${from}:${to}`}
					from={from}
					to={to}
					isPending={isPending}
					onDateRangeApply={onDateRangeApply}
				/>
			</div>
		</div>
	);
}

function LabTestDatePresetList({
	from,
	to,
	onDateRangeApply,
}: {
	from: string;
	to: string;
	onDateRangeApply: (from: string, to: string) => void;
}) {
	const selectedTestDateRange = getDateRangeFromParams(from, to);
	const today = new Date();

	return (
		<>
			{labTestDateFilterPresets.map((preset) => {
				const presetRange = preset.getRange(today);
				return (
					<LabTestDatePresetButton
						key={preset.label}
						label={preset.label}
						isSelected={isSameDateRange(selectedTestDateRange, presetRange)}
						onSelect={() => {
							onDateRangeApply(formatUrlDate(presetRange.from), formatUrlDate(presetRange.to));
						}}
					/>
				);
			})}
		</>
	);
}

function LabTestCustomRangeCalendarPanel({
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
	const selectedTestDateRange = getDateRangeFromParams(from, to);
	const [draftLabTestDateRange, setDraftLabTestDateRange] = useState<DateRange | undefined>(
		selectedTestDateRange,
	);

	return (
		<div className="flex min-w-0 flex-col">
			<div className="flex items-center gap-3">
				<LabTestDateFieldPlaceholder value={draftLabTestDateRange?.from} label="Start date" />
				<RiArrowRightLine className="size-5 shrink-0 text-gray-400" aria-hidden="true" />
				<LabTestDateFieldPlaceholder value={draftLabTestDateRange?.to} label="End date" />
			</div>

			<Calendar
				mode="range"
				selected={draftLabTestDateRange}
				onSelect={(nextDraftLabTestDateRange) => {
					setDraftLabTestDateRange(nextDraftLabTestDateRange);
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
						setDraftLabTestDateRange(undefined);
						onDateRangeApply("", "");
					}}
				>
					Reset
				</Button>
				<Button
					type="button"
					className="min-w-40 flex-1 text-sm"
					disabled={!draftLabTestDateRange?.from || !draftLabTestDateRange?.to || isPending}
					onClick={() => {
						if (!draftLabTestDateRange?.from || !draftLabTestDateRange?.to) return;

						onDateRangeApply(
							formatUrlDate(draftLabTestDateRange.from),
							formatUrlDate(draftLabTestDateRange.to),
						);
					}}
				>
					Apply
				</Button>
			</div>
		</div>
	);
}

function LabTestDatePresetButton({
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

function LabTestDateFieldPlaceholder({ label, value }: { label: string; value?: Date }) {
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

	if (!parsedFromDate && !parsedToDate) return undefined;

	return { from: parsedFromDate, to: parsedToDate };
}


function isSameDateRange(range: DateRange | undefined, presetRange: LabTestDateCompleteRange) {
	if (!range?.from || !range.to) return false;

	return isSameDay(range.from, presetRange.from) && isSameDay(range.to, presetRange.to);
}

function formatUrlDate(date: Date) {
	return format(date, "yyyy-MM-dd");
}

function formatLabTestFilterValue(value: string) {
	return value
		.split("-")
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(" ");
}

function getLabTestsColumns({
	onViewLabTestDetails,
}: {
	onViewLabTestDetails: (labTest: LabTestType) => void;
}): ColumnDef<LabTestType>[] {
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
				<div
					className="w-max"
					onClick={(event) => event.stopPropagation()}
					onKeyDown={(event) => event.stopPropagation()}
				>
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
			header: "Test",
			accessorKey: "test",
			enableSorting: true,
			cell: ({ row }) => (
				<div className="w-max" onClick={(event) => event.stopPropagation()}>
					<span className="font-medium text-gray-800">{row.original.test}</span>
				</div>
			),
		},
		{
			header: "Lab ID",
			accessorKey: "labId",
			enableSorting: false,
			cell: ({ row }) => (
				<div onKeyDown={(event) => event.stopPropagation()}>
					<CopyIdButton id={row.original.labId} />
				</div>
			),
		},
		{
			header: "Reference Range",
			accessorKey: "referenceRange",
			enableSorting: false,
			cell: ({ row }) => (
				<div className="w-max" onClick={(event) => event.stopPropagation()}>
					{row.original.referenceRange}
				</div>
			),
		},
			{
				header: "Flag",
				accessorKey: "flag",
				enableSorting: true,
				cell: ({ row }) => (
					<div className="w-max" onClick={(event) => event.stopPropagation()}>
						{row.original.flag || row.original.interpretation}
					</div>
				),
			},
		{
			id: "createdAt",
			header: "Created at",
			accessorFn: (row) => row.createdAtSortValue,
			enableSorting: true,
			cell: ({ row }) => (
				<div className="w-max" onClick={(event) => event.stopPropagation()}>
					{row.original.createdAtLabel}
				</div>
			),
		},
		{
			header: "Status",
			accessorKey: "status",
			enableSorting: false,
			cell: ({ row }) => (
				<div className="w-max" onClick={(event) => event.stopPropagation()}>
					<StatusBadge status={row.original.status} />
				</div>
			),
		},
		{
			id: "actions",
			header: "",
			enableSorting: false,
			cell: ({ row }) => {
				const canUpdateLabTestStatus = row.original.status === "Pending";

				return (
					<div
						className="flex justify-end"
						onClick={(event) => event.stopPropagation()}
						onKeyDown={(event) => event.stopPropagation()}
					>
						<DropdownMenu>
							<DropdownMenuTrigger
								type="button"
								className="inline-flex size-9 items-center justify-center rounded-md border border-transparent text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
								aria-label={`Open actions for ${row.original.test}`}
							>
								<RiMore2Fill className="size-5" aria-hidden />
							</DropdownMenuTrigger>
							<DropdownMenuContent
								align="end"
								className="w-[13.75rem] rounded-xl border-white/20 bg-gray-800 text-sm text-white ring ring-gray-800"
							>
								<DropdownMenuItem
									className="gap-3 rounded-lg text-white focus:bg-white/10 focus:text-white py-2"
									onSelect={() => onViewLabTestDetails(row.original)}
								>
									<RiEyeLine className="text-white" />
									<span>View details</span>
								</DropdownMenuItem>
							<DropdownMenuItem className="gap-3 rounded-lg text-white focus:bg-white/10 focus:text-white py-2">
								<RiShare2Line className="text-white" />
								<span>Export</span>
							</DropdownMenuItem>
								{canUpdateLabTestStatus ? (
									<>
										<DropdownMenuItem className="gap-3 rounded-lg text-white focus:bg-white/10 focus:text-white py-2">
											<RiCheckLine className="text-white" />
											<span>Mark as completed</span>
										</DropdownMenuItem>
										<DropdownMenuItem className="gap-3 rounded-lg text-white focus:bg-white/10 focus:text-white py-2">
											<RiCloseLine className="text-white" />
											<span>Cancel</span>
										</DropdownMenuItem>
									</>
								) : null}
								<DropdownMenuSeparator className="bg-white/20" />
								<DropdownMenuItem className="gap-3 rounded-lg text-white focus:bg-white/10 focus:text-white py-2">
									<RiArchiveLine className="text-white" />
									<span>Archive</span>
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				);
			},
		},
	];
}
