"use client";

import { DateFilterMenu, FilterGroup, FilterPopover } from "@/components/filter-menu";

import { SetDateRangeDialog, type DateRangeFilter } from "@/components/date-range-filter";
import { useMemo, useState } from "react";
import { authClient } from "@/lib/better-auth/auth.client";
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
import { TableBulkActionSeparator } from "@/components/table-bulk-action-separator";
import { AnimatedBulkBar } from "@/components/animated-bulk-bar";
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
	RiCalendarLine,
	RiCheckboxCircleLine,
	RiCheckLine,
	RiCloseLine,
	RiEyeLine,
	RiFlagLine,
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

type LabTestsTableProps = {
	patientId: string;
	encounterId?: string;
	labTests: LabTestType[];
	page: number;
	limit: number;
	totalPages: number;
	query: string;
	sorting: SortingState;
	onSortingChange: OnChangeFn<SortingState>;
	createdFrom: string;
	createdTo: string;
	statusFilters: LabTestStatusFilter[];
	flagFilters: LabTestFlagFilter[];
	isPending: boolean;
	onQueryChange: (query: string) => void;
	onCreatedAtRangeApply: (createdFrom: string, createdTo: string) => void;
	onStatusFiltersChange: (statusFilters: LabTestStatusFilter[]) => void;
	onFlagFiltersChange: (flagFilters: LabTestFlagFilter[]) => void;
	onFiltersClear: () => void;
	onPreviousPage: () => void;
	onNextPage: () => void;
	onLimitChange: (limit: number) => void;
};

export function LabTestsTable({
	patientId,
	encounterId,
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
	onFiltersClear,
	onPreviousPage,
	onNextPage,
	onLimitChange,
	sorting,
	onSortingChange,
}: LabTestsTableProps) {
	const { data: activeMemberRole } = authClient.useActiveMemberRole();
	const canArchive = activeMemberRole?.role === "owner" || activeMemberRole?.role === "admin";

	const [selectedLabTestRows, setSelectedLabTestRows] = useState<RowSelectionState>({});
	const [customDateRangeFilter, setCustomDateRangeFilter] = useState<DateRangeFilter | null>(null);
	const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false);
	const [isDetailsDrawerOpen, setIsDetailsDrawerOpen] = useState(false);
	const [selectedTest, setSelectedTest] = useState<LabTestType | null>(null);

	function handleViewLabTestDetails(labTest: LabTestType) {
		setSelectedTest(labTest);
		setIsDetailsDrawerOpen(true);
	}

	const columns = useMemo(
		() => getLabTestsColumns({ canArchive, onViewLabTestDetails: handleViewLabTestDetails }),
		[canArchive],
	);

	const table = useTable({
		features: configuredTableFeatures,
		data: labTests,
		columns,
		enableRowSelection: true,
		getRowId: (row) => row.labId,
		manualSorting: true,
		onSortingChange,
		onRowSelectionChange: setSelectedLabTestRows,
		state: {
			sorting,
			rowSelection: selectedLabTestRows,
		},
	});
	const selectedLabTests = table.getSelectedRowModel().rows.map((row) => row.original);
	const fitsOnSmallestPage =
		totalPages === 1 && table.getRowModel().rows.length <= ROWS_PER_PAGE_OPTIONS[0];

	return (
		<div className="px-6 py-8 text-sm">
			<h1 className="mx-auto max-w-7xl text-lg font-semibold no-line-height">Lab Tests</h1>
			<div className="mx-auto mt-4 mb-4 flex max-w-7xl flex-wrap items-center gap-2">
				<div className="relative min-w-0 grow-[999] basis-80">
					<RiSearchLine className="size-4 pointer-events-none absolute bottom-0 left-2 flex h-full items-center justify-center text-gray-400" />
					<Input
						type="search"
						className="pl-8"
						placeholder={
							encounterId
								? "Search by test, result, or lab ID"
								: "Search by test, result, lab ID, or encounter ID"
						}
						value={query}
						onChange={(event) => onQueryChange(event.target.value)}
					/>
				</div>
				<div className="flex grow flex-wrap items-center gap-2 max-md:w-full">
					<FilterGroup
						activeFilterCount={
							(statusFilters.length > 0 ? 1 : 0) +
							(flagFilters.length > 0 ? 1 : 0) +
							(createdFrom || createdTo ? 1 : 0)
						}
					>
						<FilterPopover label="Status" icon={RiCheckboxCircleLine}>
							<LabTestCheckboxFilterList
								name="lab-test-status"
								options={labTestStatusFilterOptions}
								selectedValues={statusFilters}
								onSelectedValuesChange={onStatusFiltersChange}
							/>
						</FilterPopover>
						<FilterPopover label="Flag" icon={RiFlagLine}>
							<LabTestCheckboxFilterList
								name="lab-test-flag"
								options={labTestFlagFilterOptions}
								selectedValues={flagFilters}
								onSelectedValuesChange={onFlagFiltersChange}
							/>
						</FilterPopover>
						<DateFilterMenu
							label="Created at"
							icon={RiCalendarLine}
							from={createdFrom}
							to={createdTo}
							onDateRangeApply={onCreatedAtRangeApply}
							onCustomDateRangeSelect={setCustomDateRangeFilter}
						/>
					</FilterGroup>
					<SetDateRangeDialog
						dateRangeFilter={customDateRangeFilter}
						onClose={() => setCustomDateRangeFilter(null)}
					/>
					<ExportButton />
					<Button className="flex-1" type="button" onClick={() => setIsCreateDrawerOpen(true)}>
						Add lab test
					</Button>
				</div>
			</div>
			<LabTestActiveFilterChips
				createdFrom={createdFrom}
				createdTo={createdTo}
				statusFilters={statusFilters}
				flagFilters={flagFilters}
				onCreatedAtRangeApply={onCreatedAtRangeApply}
				onStatusFiltersChange={onStatusFiltersChange}
				onFlagFiltersChange={onFlagFiltersChange}
				onFiltersClear={onFiltersClear}
			/>
			<div className="mx-auto max-w-7xl overflow-x-auto rounded-xl border border-gray-200 text-sm">
				<Table
					aria-busy={isPending}
					className="min-w-[76rem] border-separate border-spacing-0 bg-gray-50 text-left"
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
											header.column.id === "referenceRange" && "text-right",
											header.column.getCanSort()
												? "cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gray-400"
												: "",
										)}
									>
										<div
											className={cn(
												"flex items-center gap-3",
												header.column.id === "referenceRange" ? "justify-end" : "justify-between",
											)}
										>
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
												"border-b border-gray-200 px-3 py-3 text-sm text-gray-600 transition-colors group-hover:bg-gray-100",
												row.getIsSelected() ? "bg-gray-100" : "bg-white",
												rowPosition === table.getRowModel().rows.length - 1 && "border-b-0",
												cell.column.id === "referenceRange" && "text-right",
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
			<LabTestsBulkActionBar
				canArchive={canArchive}
				selectedLabTests={selectedLabTests}
				onClearSelection={() => table.resetRowSelection()}
				onViewLabTestDetails={handleViewLabTestDetails}
			/>
			<CreateLabTestDrawer
				open={isCreateDrawerOpen}
				onOpenChange={setIsCreateDrawerOpen}
				patientId={patientId}
				encounterId={encounterId}
			/>
			<LabTestDetailsDrawer
				patientId={patientId}
				open={isDetailsDrawerOpen}
				onOpenChange={setIsDetailsDrawerOpen}
				labTest={labTests.find((labTest) => labTest.labId === selectedTest?.labId) ?? selectedTest}
			/>
		</div>
	);
}

function LabTestsBulkActionBar({
	canArchive,
	selectedLabTests,
	onClearSelection,
	onViewLabTestDetails,
}: {
	canArchive: boolean;
	selectedLabTests: LabTestType[];
	onClearSelection: () => void;
	onViewLabTestDetails: (labTest: LabTestType) => void;
}) {
	const selectedLabTestCount = selectedLabTests.length;
	const singleSelectedLabTest = selectedLabTestCount === 1 ? selectedLabTests[0] : undefined;

	if (selectedLabTestCount === 0) return null;

	return (
		<AnimatedBulkBar>
			<span className="shrink-0 whitespace-nowrap text-sm font-medium">
				{selectedLabTestCount} {selectedLabTestCount === 1 ? "item" : "items"} selected
			</span>
			<TableBulkActionSeparator />
			<div className="flex items-center">
				{singleSelectedLabTest ? (
					<Button
						type="button"
						onClick={() => onViewLabTestDetails(singleSelectedLabTest)}
						variant="ghost"
						size="sm"
						className="h-9 gap-2 rounded-lg border-0 px-2 text-white hover:bg-white/10 hover:text-white focus-visible:border-0 focus-visible:ring-2 focus-visible:ring-white/30"
					>
						<RiEyeLine className="size-5" aria-hidden />
						<span>View details</span>
					</Button>
				) : null}
				<Button
					type="button"
					variant="ghost"
					size="sm"
					className="gap-2 border-0 px-2.5 has-[>svg:first-child]:pl-2.5 text-white hover:bg-white/10 hover:text-white focus-visible:border-0 focus-visible:ring-2 focus-visible:ring-white/30"
				>
					<RiShare2Line className="size-5" aria-hidden />
					<span>Export {selectedLabTestCount > 1 ? "all" : null}</span>
				</Button>
				{canArchive ? (
					<Button
						type="button"
						variant="ghost"
						size="sm"
						className="gap-2 border-0 px-2.5 has-[>svg:first-child]:pl-2.5 text-white hover:bg-white/10 hover:text-white focus-visible:border-0 focus-visible:ring-2 focus-visible:ring-white/30"
					>
						<RiArchiveLine className="size-5" aria-hidden />
						<span>Archive {selectedLabTestCount > 1 ? "all" : null}</span>
					</Button>
				) : null}
			</div>
			<Button
				type="button"
				onClick={onClearSelection}
				variant="ghost"
				size="icon"
				className="size-8 border-0 text-white hover:bg-white/10 hover:text-white focus-visible:border-0 focus-visible:ring-2 focus-visible:ring-white/30"
				aria-label="Clear selected lab tests"
			>
				<RiCloseLine className="size-5" aria-hidden />
			</Button>
		</AnimatedBulkBar>
	);
}

function LabTestActiveFilterChips({
	createdFrom,
	createdTo,
	statusFilters,
	flagFilters,
	onCreatedAtRangeApply,
	onStatusFiltersChange,
	onFlagFiltersChange,
	onFiltersClear,
}: {
	createdFrom: string;
	createdTo: string;
	statusFilters: LabTestStatusFilter[];
	flagFilters: LabTestFlagFilter[];
	onCreatedAtRangeApply: (createdFrom: string, createdTo: string) => void;
	onStatusFiltersChange: (statusFilters: LabTestStatusFilter[]) => void;
	onFlagFiltersChange: (flagFilters: LabTestFlagFilter[]) => void;
	onFiltersClear: () => void;
}) {
	const hasCreatedAtFilter = Boolean(createdFrom || createdTo);
	const hasStatusFilters = statusFilters.length > 0;
	const hasFlagFilters = flagFilters.length > 0;

	if (!hasCreatedAtFilter && !hasStatusFilters && !hasFlagFilters) {
		return null;
	}

	return (
		<div className="mx-auto mb-4 flex max-w-7xl flex-wrap gap-2">
			{hasStatusFilters ? (
				<FilterChip
					name="Status"
					value={formatChecklistFilterLabel(
						statusFilters.map((statusFilter) => formatLabTestFilterValue(statusFilter)),
					)}
					onRemove={() => onStatusFiltersChange([])}
				/>
			) : null}
			{hasFlagFilters ? (
				<FilterChip
					name="Flag"
					value={formatChecklistFilterLabel(
						flagFilters.map((flagFilter) => formatLabTestFilterValue(flagFilter)),
					)}
					onRemove={() => onFlagFiltersChange([])}
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

function formatLabTestFilterValue(value: string) {
	return value
		.split("-")
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(" ");
}

function getLabTestsColumns({
	canArchive,
	onViewLabTestDetails,
}: {
	canArchive: boolean;
	onViewLabTestDetails: (labTest: LabTestType) => void;
}): ColumnDef<typeof configuredTableFeatures, LabTestType>[] {
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
				<div className="ml-auto w-max" onClick={(event) => event.stopPropagation()}>
					{row.original.referenceRange || "-"}
				</div>
			),
		},
		{
			header: "Flag",
			accessorKey: "flag",
			enableSorting: true,
			cell: ({ row }) => (
				<div className="w-max" onClick={(event) => event.stopPropagation()}>
					{row.original.flag || "-"}
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
								className="inline-flex size-9 cursor-pointer items-center justify-center rounded-md border border-transparent text-gray-500 transition hover:bg-gray-200 hover:text-gray-800 data-[state=open]:bg-gray-200 data-[state=open]:text-gray-800"
								aria-label={`Open actions for ${row.original.test}`}
							>
								<RiMore2Fill className="size-5" aria-hidden />
							</DropdownMenuTrigger>
							<DropdownMenuContent
								align="end"
								className="w-50 rounded-xl bg-white text-sm text-gray-700"
							>
								<DropdownMenuItem
									className="rounded-lg"
									onSelect={() => onViewLabTestDetails(row.original)}
								>
									<RiEyeLine />
									<span>View details</span>
								</DropdownMenuItem>
								<DropdownMenuItem className="rounded-lg">
									<RiShare2Line />
									<span>Export</span>
								</DropdownMenuItem>
								{canUpdateLabTestStatus ? (
									<>
										<DropdownMenuItem className="rounded-lg">
											<RiCheckLine />
											<span>Mark as completed</span>
										</DropdownMenuItem>
										<DropdownMenuItem className="rounded-lg text-rose-600 focus:bg-rose-50 focus:text-rose-600">
											<RiCloseLine className="text-current" />
											<span>Cancel</span>
										</DropdownMenuItem>
									</>
								) : null}
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
				);
			},
		},
	];
}

function LabTestCheckboxFilterList<TValue extends string>({
	name,
	options,
	selectedValues,
	onSelectedValuesChange,
}: {
	name: string;
	options: { label: string; value: TValue }[];
	selectedValues: TValue[];
	onSelectedValuesChange: (selectedValues: TValue[]) => void;
}) {
	return (
		<>
			{options.map((option) => {
				const isSelected = selectedValues.includes(option.value);
				const optionId = `${name}-${option.value}`;

				return (
					<Label
						key={option.value}
						htmlFor={optionId}
						className="flex h-8 w-full cursor-pointer items-center gap-3 rounded-lg px-2 leading-normal font-normal hover:bg-gray-100"
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
			})}
		</>
	);
}
