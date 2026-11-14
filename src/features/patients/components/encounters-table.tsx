"use client";

import { DateFilterSection, FilterGroup, FilterSection } from "@/components/filter-menu";

import { SetDateRangeDialog, type DateRangeFilter } from "@/components/date-range-filter";
import { useMemo, useState } from "react";
import { authClient } from "@/lib/better-auth/auth.client";
import Link from "next/link";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import type {
	EncounterDepartmentFilter,
	EncounterType,
	EncounterTypeFilter,
} from "@/features/patients/types";
import { CopyIdButton } from "@/components/copy-id-button";
import { IndeterminateCheckbox } from "@/components/indeterminate-checkbox";
import { TableBulkActionSeparator } from "@/components/table-bulk-action-separator";
import { AnimatedBulkBar } from "@/components/animated-bulk-bar";
import { CreateEncounterDrawer } from "@/features/patients/components/create-encounter-drawer";
import { AnimatedFilterChips } from "@/components/animated-filter-chips";
import { FilterChip, formatChecklistFilterLabel } from "@/components/filter-chip";
import { ExportButton } from "@/components/export-button";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
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
	columnVisibilityFeature,
	type ColumnDef,
	flexRender,
	tableFeatures,
	type RowSelectionState,
	type OnChangeFn,
	type SortingState,
	useTable,
	rowSortingFeature,
	rowSelectionFeature,
} from "@tanstack/react-table";

import {
	RiArchiveLine,
	RiArrowDownSLine,
	RiArrowLeftSLine,
	RiArrowRightSLine,
	RiArrowUpSLine,
	RiCloseLine,
	RiEyeLine,
	RiMore2Fill,
	RiSearchLine,
	RiShare2Line,
} from "@remixicon/react";
import { format } from "date-fns";

const configuredTableFeatures = tableFeatures({
	columnVisibilityFeature,
	rowSortingFeature,
	rowSelectionFeature,
});

const ROWS_PER_PAGE_OPTIONS = [14, 28, 42];

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

type EncountersTableProps = {
	patientId: string;
	encounters: EncounterType[];
	page: number;
	limit: number;
	totalPages: number;
	query: string;
	sorting: SortingState;
	onSortingChange: OnChangeFn<SortingState>;
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
	onFiltersClear: () => void;
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
	onFiltersClear,
	onPreviousPage,
	onNextPage,
	onLimitChange,
	sorting,
	onSortingChange,
}: EncountersTableProps) {
	const router = useRouter();
	const { data: activeMemberRole } = authClient.useActiveMemberRole();
	const canArchive = activeMemberRole?.role === "owner" || activeMemberRole?.role === "admin";
	const columns = useMemo(
		() => getEncountersColumns(patientId, canArchive),
		[canArchive, patientId],
	);
	const [selectedEncounterRows, setSelectedEncounterRows] = useState<RowSelectionState>({});
	const [isCreateEncounterDrawerOpen, setIsCreateEncounterDrawerOpen] = useState(false);
	const [customDateRangeFilter, setCustomDateRangeFilter] = useState<DateRangeFilter | null>(null);
	const table = useTable({
		features: configuredTableFeatures,
		data: encounters,
		columns,
		enableRowSelection: true,
		getRowId: (row) => row.encounterId,
		manualSorting: true,
		onSortingChange,
		onRowSelectionChange: setSelectedEncounterRows,
		state: { sorting, rowSelection: selectedEncounterRows },
	});
	const selectedEncounters = table.getSelectedRowModel().rows.map((row) => row.original);

	const fitsOnSmallestPage =
		totalPages === 1 && table.getRowModel().rows.length <= ROWS_PER_PAGE_OPTIONS[0];

	return (
		<div className="px-6 py-8 text-sm">
			<h1 className="mx-auto max-w-7xl text-lg font-semibold no-line-height">Encounters</h1>
			<div className="mx-auto mt-4 mb-4 flex max-w-7xl flex-wrap items-center gap-2">
				<div className="relative min-w-0 grow-[999] basis-80">
					<RiSearchLine className="size-4 pointer-events-none absolute bottom-0 left-2 flex h-full items-center justify-center text-gray-400" />
					<Input
						type="search"
						className="pl-8"
						placeholder="Search by type, department, physician, or encounter ID"
						value={query}
						onChange={(event) => onQueryChange(event.target.value)}
					/>
				</div>
				<div className="flex grow flex-wrap items-center gap-2 max-md:w-full">
					<FilterGroup
						activeFilterCount={
							(encounterFrom || encounterTo ? 1 : 0) +
							(encounterTypeFilters.length > 0 ? 1 : 0) +
							(createdFrom || createdTo ? 1 : 0) +
							(departmentFilters.length > 0 ? 1 : 0)
						}
					>
						<DateFilterSection
							label="Encounter date"
							from={encounterFrom}
							to={encounterTo}
							onDateRangeApply={onEncounterDateRangeApply}
							onCustomDateRangeSelect={setCustomDateRangeFilter}
						/>
						<FilterSection label="Encounter type">
							<EncounterCheckboxFilterList
								name="encounter-type"
								options={encounterTypeFilterOptions}
								selectedValues={encounterTypeFilters}
								onSelectedValuesChange={onEncounterTypeFiltersChange}
							/>
						</FilterSection>
						<DateFilterSection
							label="Created at"
							from={createdFrom}
							to={createdTo}
							onDateRangeApply={onCreatedAtRangeApply}
							onCustomDateRangeSelect={setCustomDateRangeFilter}
						/>
						<FilterSection label="Department">
							<EncounterCheckboxFilterList
								name="encounter-department"
								options={encounterDepartmentFilterOptions}
								selectedValues={departmentFilters}
								onSelectedValuesChange={onDepartmentFiltersChange}
							/>
						</FilterSection>
					</FilterGroup>
					<SetDateRangeDialog
						dateRangeFilter={customDateRangeFilter}
						onClose={() => setCustomDateRangeFilter(null)}
					/>
					<ExportButton />
					<Button
						className="flex-1"
						type="button"

						onClick={() => setIsCreateEncounterDrawerOpen(true)}
					>
						Create encounter
					</Button>
					<CreateEncounterDrawer
						open={isCreateEncounterDrawerOpen}
						onOpenChange={setIsCreateEncounterDrawerOpen}
						patientId={patientId}
					/>
				</div>
			</div>
			<EncounterActiveFilterChips
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
				onFiltersClear={onFiltersClear}
			/>
			<div className="mx-auto max-w-7xl overflow-x-auto rounded-xl border border-gray-200 text-sm">
				<Table
					aria-busy={isPending}
					className="min-w-[72rem] border-separate border-spacing-0 bg-gray-50 text-left"
				>
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
											if (
												header.column.getCanSort() &&
												(event.key === "Enter" || event.key === " ")
											) {
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
					<TableBody
						data-pending={isPending || undefined}
						className="overflow-hidden rounded-t-xl outline outline-gray-200 transition-opacity data-[pending=true]:opacity-80 data-[pending=true]:delay-150"
					>
						{table.getRowModel().rows.length > 0 ? (
							table.getRowModel().rows.map((row, rowPosition) => (
								<TableRow
									key={row.id}
									role="link"
									tabIndex={0}
									onClick={() =>
										router.push(
											`/dashboard/patients/${patientId}/encounters/${row.original.encounterId}` as Route,
										)
									}
									onKeyDown={(event) => {
										if (
											event.target === event.currentTarget &&
											(event.key === "Enter" || event.key === " ")
										) {
											event.preventDefault();
											router.push(
												`/dashboard/patients/${patientId}/encounters/${row.original.encounterId}` as Route,
											);
										}
									}}
									onMouseEnter={() =>
										router.prefetch(
											`/dashboard/patients/${patientId}/encounters/${row.original.encounterId}` as Route,
										)
									}
									className="group min-h-14 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gray-400"
								>
									{row.getVisibleCells().map((cell) => (
										<TableCell
											key={cell.id}
											className={cn(
												"border-b border-gray-200 px-3 py-3 text-sm text-gray-600 transition-colors group-hover:bg-gray-100",
												row.getIsSelected() ? "bg-gray-100" : "bg-white",
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
									No matching encounters found.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
				{fitsOnSmallestPage ? null : (
					<div className="flex items-center justify-between gap-3 overflow-x-auto border-t border-gray-200 bg-white p-3 text-sm whitespace-nowrap text-gray-500">
						<div className="flex items-center gap-3">
							<span>Rows per page</span>
							<Select
								value={String(limit)}
								onValueChange={(value) => onLimitChange(Number(value))}
								disabled={isPending}
							>
								<SelectTrigger className="h-8 w-[4.25rem] bg-white px-2 text-gray-700">
									<SelectValue aria-label="Rows per page" placeholder="Rows" />
								</SelectTrigger>
								<SelectContent className="w-20" align="start">
									{ROWS_PER_PAGE_OPTIONS.map((pageSize) => (
										<SelectItem key={pageSize} value={String(pageSize)}>
											{pageSize}
										</SelectItem>
									))}
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
									size="icon"
									aria-label="Previous"
									onClick={onPreviousPage}
									disabled={page <= 1 || isPending}
									className="text-gray-700 shadow-none"
								>
									<RiArrowLeftSLine aria-hidden="true" />
								</Button>
								<Button
									type="button"
									variant="outline"
									size="icon"
									aria-label="Next"
									onClick={onNextPage}
									disabled={page >= totalPages || isPending}
									className="text-gray-700 shadow-none"
								>
									<RiArrowRightSLine aria-hidden="true" />
								</Button>
							</div>
						</div>
					</div>
				)}
			</div>
			<EncountersBulkActionBar
				canArchive={canArchive}
				selectedEncounters={selectedEncounters}
				onClearSelection={() => table.resetRowSelection()}
				onViewEncounterDetails={(encounterId) =>
					router.push(`/dashboard/patients/${patientId}/encounters/${encounterId}` as Route)
				}
			/>
		</div>
	);
}

function EncountersBulkActionBar({
	canArchive,
	selectedEncounters,
	onClearSelection,
	onViewEncounterDetails,
}: {
	canArchive: boolean;
	selectedEncounters: EncounterType[];
	onClearSelection: () => void;
	onViewEncounterDetails: (encounterId: string) => void;
}) {
	const singleSelectedEncounter =
		selectedEncounters.length === 1 ? selectedEncounters[0] : undefined;

	if (selectedEncounters.length === 0) return null;

	return (
		<AnimatedBulkBar>
			<span className="shrink-0 whitespace-nowrap text-sm font-medium">
				{selectedEncounters.length} {selectedEncounters.length === 1 ? "item" : "items"} selected
			</span>
			<TableBulkActionSeparator />
			<div className="flex items-center">
				{singleSelectedEncounter ? (
					<Button
						type="button"
						onClick={() => onViewEncounterDetails(singleSelectedEncounter.encounterId)}
						variant="ghost"
						size="sm"
						className="gap-2 border-0 px-2.5 has-[>svg:first-child]:pl-2.5 text-white hover:bg-white/10 hover:text-white focus-visible:border-0 focus-visible:ring-2 focus-visible:ring-white/30"
					>
						<RiEyeLine className="size-4" aria-hidden />
						<span>View details</span>
					</Button>
				) : null}
				<Button
					type="button"
					variant="ghost"
					size="sm"
					className="gap-2 border-0 px-2.5 has-[>svg:first-child]:pl-2.5 text-white hover:bg-white/10 hover:text-white focus-visible:border-0 focus-visible:ring-2 focus-visible:ring-white/30"
				>
					<RiShare2Line className="size-4" aria-hidden />
					<span>Export {selectedEncounters.length > 1 ? "all" : null}</span>
				</Button>
				{canArchive ? (
					<Button
						type="button"
						variant="ghost"
						size="sm"
						className="gap-2 border-0 px-2.5 has-[>svg:first-child]:pl-2.5 text-white hover:bg-white/10 hover:text-white focus-visible:border-0 focus-visible:ring-2 focus-visible:ring-white/30"
					>
						<RiArchiveLine className="size-4" aria-hidden />
						<span>Archive {selectedEncounters.length > 1 ? "all" : null}</span>
					</Button>
				) : null}
			</div>
			<Button
				type="button"
				onClick={onClearSelection}
				variant="ghost"
				size="icon"
				className="size-8 border-0 text-white hover:bg-white/10 hover:text-white focus-visible:border-0 focus-visible:ring-2 focus-visible:ring-white/30"
				aria-label="Clear selected encounters"
			>
				<RiCloseLine className="size-4" aria-hidden />
			</Button>
		</AnimatedBulkBar>
	);
}

function EncounterActiveFilterChips({
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
	onFiltersClear,
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
	onFiltersClear: () => void;
}) {
	const hasEncounterDateFilter = Boolean(encounterFrom || encounterTo);
	const hasCreatedAtFilter = Boolean(createdFrom || createdTo);
	const hasEncounterTypeFilters = encounterTypeFilters.length > 0;
	const hasDepartmentFilters = departmentFilters.length > 0;

	return (
		<AnimatedFilterChips
			isVisible={
				hasEncounterDateFilter ||
				hasCreatedAtFilter ||
				hasEncounterTypeFilters ||
				hasDepartmentFilters
			}
		>
			<div className="mx-auto mb-4 flex max-w-7xl flex-wrap gap-2">
				{hasEncounterTypeFilters ? (
					<FilterChip
						name="Type"
						value={formatChecklistFilterLabel(
							encounterTypeFilters.map((encounterTypeFilter) =>
								encounterTypeFilter
									.split("-")
									.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
									.join(" "),
							),
						)}
						onRemove={() => onEncounterTypeFiltersChange([])}
					/>
				) : null}
				{hasDepartmentFilters ? (
					<FilterChip
						name="Department"
						value={formatChecklistFilterLabel(
							departmentFilters.map((departmentFilter) =>
								departmentFilter
									.split("-")
									.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
									.join(" "),
							),
						)}
						onRemove={() => onDepartmentFiltersChange([])}
					/>
				) : null}
				{hasEncounterDateFilter ? (
					<FilterChip
						name="Encounter"
						value={formatDateRangeFilterLabel(encounterFrom, encounterTo)}
						onRemove={() => onEncounterDateRangeApply("", "")}
					/>
				) : null}
				{hasCreatedAtFilter ? (
					<FilterChip
						name="Created"
						value={formatDateRangeFilterLabel(createdFrom, createdTo)}
						onRemove={() => onCreatedAtRangeApply("", "")}
					/>
				) : null}
				<Button
					type="button"
					variant="ghost"
					size="sm"
					className="h-8.5 text-gray-600"
					onClick={onFiltersClear}
				>
					Clear all
				</Button>
			</div>
		</AnimatedFilterChips>
	);
}

function formatDateRangeFilterLabel(from: string, to: string) {
	const parsedFromDate = parseDateParam(from);
	const parsedToDate = parseDateParam(to);

	if (parsedFromDate && parsedToDate && from === to) {
		return format(parsedFromDate, "MMM d, yyyy");
	}

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

function getEncountersColumns(
	patientId: string,
	canArchive: boolean,
): ColumnDef<typeof configuredTableFeatures, EncounterType>[] {
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
				<div className="flex justify-end" onClick={(event) => event.stopPropagation()}>
					<DropdownMenu>
						<DropdownMenuTrigger
							type="button"
							className="inline-flex size-9 cursor-pointer items-center justify-center rounded-md border border-transparent text-gray-500 transition hover:bg-gray-200 hover:text-gray-800 data-[state=open]:bg-gray-200 data-[state=open]:text-gray-800"
							aria-label={`Open actions for ${row.original.encounterId}`}
						>
							<RiMore2Fill className="size-4" aria-hidden />
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="rounded-xl bg-white text-sm text-gray-700">
							<DropdownMenuItem asChild>
								<Link
									href={
										`/dashboard/patients/${patientId}/encounters/${row.original.encounterId}` as Route
									}
									className="rounded-lg"
								>
									<RiEyeLine />
									<span>View details</span>
								</Link>
							</DropdownMenuItem>
							<DropdownMenuItem className="rounded-lg">
								<RiShare2Line />
								<span>Export</span>
							</DropdownMenuItem>
							{canArchive ? (
								<>
									<DropdownMenuSeparator />
									<DropdownMenuItem className="rounded-lg">
										<RiArchiveLine />
										<span>Archive</span>
									</DropdownMenuItem>
								</>
							) : null}
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			),
		},
	];
}

function EncounterCheckboxFilterList<T extends string>({
	name,
	options,
	selectedValues,
	onSelectedValuesChange,
}: {
	name: string;
	options: { label: string; value: T }[];
	selectedValues: T[];
	onSelectedValuesChange: (selectedValues: T[]) => void;
}) {
	return options.map((option) => {
		const isSelected = selectedValues.includes(option.value);
		const optionId = `${name}-${option.value}`;

		return (
			<Label
				key={option.value}
				htmlFor={optionId}
				className="flex h-9 w-full cursor-pointer items-center gap-2 rounded-lg px-2 leading-normal font-normal hover:bg-gray-100"
			>
				<Checkbox
					id={optionId}
					checked={isSelected}
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
		);
	});
}
