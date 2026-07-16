"use client";

import { useMemo, useState } from "react";
import type {
	AllergyDetailsType,
	AllergySeverityFilter,
	AllergyStatusFilter,
	AllergyType,
} from "@/features/patients/types";
import { AllergyDetailsDrawer } from "@/features/patients/components/allergy-details-drawer";
import { CreateAllergyDrawer } from "@/features/patients/components/create-allergy-drawer";
import { CopyIdButton } from "@/components/copy-id-button";
import { IndeterminateCheckbox } from "@/components/indeterminate-checkbox";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
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
	type OnChangeFn,
	type RowSelectionState,
	type SortingState,
	useReactTable,
} from "@tanstack/react-table";
import {
	RiArchiveLine,
	RiArrowRightLine,
	RiArrowDownSLine,
	RiArrowUpSLine,
	RiBarChartBoxLine,
	RiCalendarLine,
	RiCheckLine,
	RiCheckboxCircleLine,
	RiCloseLine,
	RiEyeLine,
	RiFilter3Line,
	RiMore2Fill,
	RiSearchLine,
	RiShare2Line,
} from "@remixicon/react";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { endOfDay, format, isSameDay, startOfDay, subDays } from "date-fns";
import type { DateRange } from "react-day-picker";
import useSWR from "swr";

type AllergyFilterSubmenu = "status" | "severity" | "created-at";

type AllergyDateFilterPreset = {
	label: string;
	getRange: (today: Date) => AllergyDateCompleteRange;
};

type AllergyDateCompleteRange = {
	from: Date;
	to: Date;
};

const ROWS_PER_PAGE_OPTIONS = [14, 28, 42];

const allergyStatusFilterOptions: {
	label: string;
	value: AllergyStatusFilter;
}[] = [
	{ label: "Active", value: "active" },
	{ label: "Inactive", value: "inactive" },
];

const allergySeverityFilterOptions: {
	label: string;
	value: AllergySeverityFilter;
}[] = [
	{ label: "Mild", value: "mild" },
	{ label: "Moderate", value: "moderate" },
	{ label: "Severe", value: "severe" },
];

const allergyDateFilterPresets: AllergyDateFilterPreset[] = [
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

type AllergiesTableProps = {
	allergies: AllergyType[];
	page: number;
	limit: number;
	totalPages: number;
	query: string;
	createdFrom: string;
	createdTo: string;
	statusFilters: AllergyStatusFilter[];
	severityFilters: AllergySeverityFilter[];
	isPending: boolean;
	onQueryChange: (query: string) => void;
	onCreatedAtRangeApply: (createdFrom: string, createdTo: string) => void;
	onStatusFiltersChange: (statusFilters: AllergyStatusFilter[]) => void;
	onSeverityFiltersChange: (severityFilters: AllergySeverityFilter[]) => void;
	onPreviousPage: () => void;
	onNextPage: () => void;
	onLimitChange: (limit: number) => void;
};

export function AllergiesTable({
	allergies,
	page,
	limit,
	totalPages,
	query,
	createdFrom,
	createdTo,
	statusFilters,
	severityFilters,
	isPending,
	onQueryChange,
	onCreatedAtRangeApply,
	onStatusFiltersChange,
	onSeverityFiltersChange,
	onPreviousPage,
	onNextPage,
	onLimitChange,
}: AllergiesTableProps) {
	const visibleAllergyRowIds = useMemo(
		() => allergies.map((allergy) => allergy.allergyId).join(","),
		[allergies],
	);
	const [sorting, setSorting] = useState<SortingState>([]);
	const [activeFilterSubmenu, setActiveFilterSubmenu] = useState<AllergyFilterSubmenu | null>(null);
	const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false);
	const [isDetailsDrawerOpen, setIsDetailsDrawerOpen] = useState(false);
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const allergyDetailsQuery = useSWR(
		selectedId ? (["patient-allergy-details", selectedId] as const) : null,
		([, selectedId]) => fetchPatientAllergyDetails(selectedId),
	);
	function handleViewAllergyDetails(allergyId: string) {
		setSelectedId(allergyId);
		setIsDetailsDrawerOpen(true);
	}
	const columns = useMemo(
		() => getAllergiesColumns({ onViewAllergyDetails: handleViewAllergyDetails }),
		[],
	);
	return (
		<div className="px-6 py-8 text-sm">
			<h1 className="mx-auto max-w-7xl text-xl font-semibold no-line-height">Allergies</h1>
			<div className="mx-auto mt-7 mb-4 flex max-w-7xl items-center gap-2">
				<div className="relative w-full">
					<RiSearchLine className="size-4 pointer-events-none absolute bottom-0 left-2 flex h-full items-center justify-center text-gray-400" />
					<Input
						type="search"
						className="pl-8"
						placeholder="Search by allergen, reaction, severity, status, or allergy ID"
						value={query}
						onChange={(event) => onQueryChange(event.target.value)}
					/>
				</div>
				<DropdownMenu
					onOpenChange={(isAllergyFilterMenuOpen) => {
						if (!isAllergyFilterMenuOpen) {
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
								<RiCheckboxCircleLine className="size-4.5" /> <span className="block">Status</span>
							</DropdownMenuSubTrigger>
							<DropdownMenuSubContent
								alignOffset={-5}
								className="w-[13.75rem] rounded-xl border border-gray-200 bg-white p-1 text-sm text-gray-700 shadow-xl"
							>
								<AllergyCheckboxFilterList
									name="allergy-status"
									options={allergyStatusFilterOptions}
									selectedValues={statusFilters}
									isPending={isPending}
									onSelectedValuesChange={onStatusFiltersChange}
								/>
							</DropdownMenuSubContent>
						</DropdownMenuSub>

						<DropdownMenuSub
							open={activeFilterSubmenu === "severity"}
							onOpenChange={(isSeveritySubmenuOpen) => {
								setActiveFilterSubmenu((prev) => {
									if (isSeveritySubmenuOpen) return "severity";
									if (prev === "severity") return null;
									return prev;
								});
							}}
						>
							<DropdownMenuSubTrigger className="rounded-lg focus:bg-gray-100 focus:text-gray-900 data-[state=open]:bg-gray-100 py-2">
								<RiBarChartBoxLine className="text-lg" /> <span className="block">Severity</span>
							</DropdownMenuSubTrigger>
							<DropdownMenuSubContent
								alignOffset={-5}
								className="w-[13.75rem] rounded-xl border border-gray-200 bg-white p-1 text-sm text-gray-700 shadow-xl"
							>
								<AllergyCheckboxFilterList
									name="allergy-severity"
									options={allergySeverityFilterOptions}
									selectedValues={severityFilters}
									isPending={isPending}
									onSelectedValuesChange={onSeverityFiltersChange}
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
								<RiCalendarLine className="size-4.5" /> <span className="block">Created at</span>
							</DropdownMenuSubTrigger>
							<DropdownMenuSubContent
								alignOffset={-5}
								className="w-max max-w-[calc(100vw-2rem)] rounded-xl border border-gray-200 bg-white p-0 text-sm text-gray-700 shadow-xl"
							>
								<AllergyDateFilterContent
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
				<Button className="text-sm" type="button" onClick={() => setIsCreateDrawerOpen(true)}>
					Add allergy
				</Button>
			</div>
			<AllergyActiveFilterPills
				createdFrom={createdFrom}
				createdTo={createdTo}
				statusFilters={statusFilters}
				severityFilters={severityFilters}
				onCreatedAtRangeApply={onCreatedAtRangeApply}
				onStatusFiltersChange={onStatusFiltersChange}
				onSeverityFiltersChange={onSeverityFiltersChange}
			/>
			<AllergiesTableContent
				key={visibleAllergyRowIds}
				allergies={allergies}
				columns={columns}
				sorting={sorting}
				onSortingChange={setSorting}
				page={page}
				limit={limit}
				totalPages={totalPages}
				isPending={isPending}
				onViewAllergyDetails={handleViewAllergyDetails}
				onPreviousPage={onPreviousPage}
				onNextPage={onNextPage}
				onLimitChange={onLimitChange}
			/>
			<CreateAllergyDrawer open={isCreateDrawerOpen} onOpenChange={setIsCreateDrawerOpen} />
			<AllergyDetailsDrawer
				open={isDetailsDrawerOpen}
				onOpenChange={setIsDetailsDrawerOpen}
				allergy={allergyDetailsQuery.data ?? null}
				isLoading={allergyDetailsQuery.isLoading}
			/>
		</div>
	);
}

function AllergiesTableContent({
	allergies,
	columns,
	sorting,
	onSortingChange,
	page,
	limit,
	totalPages,
	isPending,
	onViewAllergyDetails,
	onPreviousPage,
	onNextPage,
	onLimitChange,
}: {
	allergies: AllergyType[];
	columns: ColumnDef<AllergyType>[];
	sorting: SortingState;
	onSortingChange: OnChangeFn<SortingState>;
	page: number;
	limit: number;
	totalPages: number;
	isPending: boolean;
	onViewAllergyDetails: (allergyId: string) => void;
	onPreviousPage: () => void;
	onNextPage: () => void;
	onLimitChange: (limit: number) => void;
}) {
	const [selectedAllergyRows, setSelectedAllergyRows] = useState<RowSelectionState>({});
	const table = useReactTable({
		data: allergies,
		columns,
		enableRowSelection: true,
		getRowId: (row) => row.allergyId,
		onSortingChange,
		onRowSelectionChange: setSelectedAllergyRows,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		state: {
			sorting,
			rowSelection: selectedAllergyRows,
		},
	});
	return (
		<div className="mx-auto max-w-7xl overflow-x-auto rounded-xl border border-gray-200 text-sm">
			<Table className="min-w-[72rem] border-separate border-spacing-0 bg-gray-50 text-left">
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
								onClick={() => onViewAllergyDetails(row.original.allergyId)}
								onKeyDown={(event) => {
									if (event.key === "Enter" || event.key === " ") {
										event.preventDefault();
										onViewAllergyDetails(row.original.allergyId);
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
										<div
											className="inline-block max-w-full"
											onClick={(event) => event.stopPropagation()}
											onKeyDown={(event) => event.stopPropagation()}
										>
											{flexRender(cell.column.columnDef.cell, cell.getContext())}
										</div>
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
								No matching allergies found.
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
	);
}

function AllergyCheckboxFilterList<TValue extends string>({
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

function AllergyActiveFilterPills({
	createdFrom,
	createdTo,
	statusFilters,
	severityFilters,
	onCreatedAtRangeApply,
	onStatusFiltersChange,
	onSeverityFiltersChange,
}: {
	createdFrom: string;
	createdTo: string;
	statusFilters: AllergyStatusFilter[];
	severityFilters: AllergySeverityFilter[];
	onCreatedAtRangeApply: (createdFrom: string, createdTo: string) => void;
	onStatusFiltersChange: (statusFilters: AllergyStatusFilter[]) => void;
	onSeverityFiltersChange: (severityFilters: AllergySeverityFilter[]) => void;
}) {
	const hasCreatedAtFilter = Boolean(createdFrom || createdTo);
	const hasStatusFilters = statusFilters.length > 0;
	const hasSeverityFilters = severityFilters.length > 0;

	if (!hasCreatedAtFilter && !hasStatusFilters && !hasSeverityFilters) {
		return null;
	}

	return (
		<div className="mx-auto mb-4 flex max-w-7xl flex-wrap gap-2">
			{statusFilters.map((statusFilter) => (
				<AllergyFilterPill
					key={statusFilter}
					label={`Status: ${formatAllergyFilterValue(statusFilter)}`}
					onRemove={() => {
						onStatusFiltersChange(
							statusFilters.filter((currentStatusFilter) => currentStatusFilter !== statusFilter),
						);
					}}
				/>
			))}
			{severityFilters.map((severityFilter) => (
				<AllergyFilterPill
					key={severityFilter}
					label={`Severity: ${formatAllergyFilterValue(severityFilter)}`}
					onRemove={() => {
						onSeverityFiltersChange(
							severityFilters.filter(
								(currentSeverityFilter) => currentSeverityFilter !== severityFilter,
							),
						);
					}}
				/>
			))}
			{hasCreatedAtFilter ? (
				<AllergyFilterPill
					label={`Created: ${formatDateRangeFilterLabel(createdFrom, createdTo)}`}
					onRemove={() => onCreatedAtRangeApply("", "")}
				/>
			) : null}
		</div>
	);
}

function AllergyFilterPill({ label, onRemove }: { label: string; onRemove: () => void }) {
	return (
		<span className="inline-flex items-center gap-3 rounded-full border border-gray-200 bg-gray-100 py-1.5 pr-1.5 pl-3 text-sm font-medium text-gray-600 shadow-xs">
			<span>{label}</span>
			<button
				type="button"
				onClick={onRemove}
				className="flex items-center justify-center bg-gray-800 text-white size-5 rounded-full transition hover:bg-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-300"
				aria-label={`Remove ${label} filter`}
			>
				<RiCloseLine className="size-4" aria-hidden="true" />
			</button>
		</span>
	);
}

function AllergyDateFilterContent({
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
				<AllergyDatePresetList from={from} to={to} onDateRangeApply={onDateRangeApply} />
			</div>

			<div className="w-88 shrink-0 border-l border-gray-100 p-3">
				<AllergyCustomRangeCalendarPanel
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

function AllergyDatePresetList({
	from,
	to,
	onDateRangeApply,
}: {
	from: string;
	to: string;
	onDateRangeApply: (from: string, to: string) => void;
}) {
	const selectedAllergyDateRange = getDateRangeFromParams(from, to);
	const today = new Date();

	return (
		<>
			{allergyDateFilterPresets.map((preset) => {
				const presetRange = preset.getRange(today);
				return (
					<AllergyDatePresetButton
						key={preset.label}
						label={preset.label}
						isSelected={isSameDateRange(selectedAllergyDateRange, presetRange)}
						onSelect={() => {
							onDateRangeApply(formatUrlDate(presetRange.from), formatUrlDate(presetRange.to));
						}}
					/>
				);
			})}
		</>
	);
}

function AllergyCustomRangeCalendarPanel({
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
	const selectedAllergyDateRange = getDateRangeFromParams(from, to);
	const [draftAllergyDateRange, setDraftAllergyDateRange] = useState<DateRange | undefined>(
		selectedAllergyDateRange,
	);

	return (
		<div className="flex min-w-0 flex-col">
			<div className="flex items-center gap-3">
				<AllergyDateFieldPlaceholder value={draftAllergyDateRange?.from} label="Start date" />
				<RiArrowRightLine className="size-5 shrink-0 text-gray-400" aria-hidden="true" />
				<AllergyDateFieldPlaceholder value={draftAllergyDateRange?.to} label="End date" />
			</div>

			<Calendar
				mode="range"
				selected={draftAllergyDateRange}
				onSelect={(nextDraftAllergyDateRange) => {
					setDraftAllergyDateRange(nextDraftAllergyDateRange);
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
						setDraftAllergyDateRange(undefined);
						onDateRangeApply("", "");
					}}
				>
					Reset
				</Button>
				<Button
					type="button"
					className="min-w-40 flex-1 text-sm"
					disabled={!draftAllergyDateRange?.from || !draftAllergyDateRange?.to || isPending}
					onClick={() => {
						if (!draftAllergyDateRange?.from || !draftAllergyDateRange?.to) return;

						onDateRangeApply(
							formatUrlDate(draftAllergyDateRange.from),
							formatUrlDate(draftAllergyDateRange.to),
						);
					}}
				>
					Apply
				</Button>
			</div>
		</div>
	);
}

function AllergyDatePresetButton({
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

function AllergyDateFieldPlaceholder({ label, value }: { label: string; value?: Date }) {
	return (
		<div className="flex h-9 text-sm min-w-0 flex-1 items-center gap-3 rounded-lg border border-gray-200 bg-white px-2 text-left font-medium text-gray-500">
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

function isSameDateRange(range: DateRange | undefined, presetRange: AllergyDateCompleteRange) {
	if (!range?.from || !range.to) return false;

	return isSameDay(range.from, presetRange.from) && isSameDay(range.to, presetRange.to);
}

function formatUrlDate(date: Date) {
	return format(date, "yyyy-MM-dd");
}

function formatAllergyFilterValue(value: string) {
	return value.charAt(0).toUpperCase() + value.slice(1);
}

async function fetchPatientAllergyDetails(selectedId: string) {
	const response = await fetch(`/api/patient-allergy-details/${encodeURIComponent(selectedId)}`);

	if (!response.ok) {
		throw new Error("Unable to load allergy details.");
	}

	const result = (await response.json()) as { allergy: AllergyDetailsType | null };

	return result.allergy;
}

function getAllergiesColumns({
	onViewAllergyDetails,
}: {
	onViewAllergyDetails: (allergyId: string) => void;
}): ColumnDef<AllergyType>[] {
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
			header: "Allergen",
			accessorKey: "allergen",
			enableSorting: true,
			cell: ({ row }) => <span className="font-medium text-gray-800">{row.original.allergen}</span>,
		},
		{
			header: "Allergy ID",
			accessorKey: "allergyId",
			enableSorting: false,
			cell: ({ row }) => <CopyIdButton id={row.original.allergyId} />,
		},
		{
			header: "Reaction",
			accessorKey: "reaction",
			enableSorting: false,
		},
		{
			id: "createdAt",
			header: "Created at",
			accessorFn: (row) => row.createdAtSortValue,
			enableSorting: true,
			cell: ({ row }) => row.original.createdAtLabel,
		},
		{
			header: "Severity",
			accessorKey: "severity",
			enableSorting: true,
		},
		{
			header: "Status",
			accessorKey: "status",
			enableSorting: false,
			cell: ({ row }) => <StatusBadge status={row.original.status} />,
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
							aria-label={`Open actions for ${row.original.allergen}`}
						>
							<RiMore2Fill className="size-5" aria-hidden />
						</DropdownMenuTrigger>
						<DropdownMenuContent
							align="end"
							className="w-[13.75rem] rounded-xl border-white/20 bg-gray-800 text-sm text-white ring ring-gray-800"
						>
							<DropdownMenuItem
								className="gap-3 rounded-lg text-white focus:bg-white/10 focus:text-white py-2"
								onSelect={() => onViewAllergyDetails(row.original.allergyId)}
							>
								<RiEyeLine className="text-white" />
								<span>View details</span>
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
