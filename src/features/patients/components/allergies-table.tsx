"use client";

import { DateFilterMenu, FilterGroup, FilterPopover } from "@/components/filter-menu";

import { SetDateRangeDialog, type DateRangeFilter } from "@/components/date-range-filter";
import { useMemo, useState } from "react";
import { authClient } from "@/lib/better-auth/auth.client";
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
import { TableBulkActionSeparator } from "@/components/table-bulk-action-separator";
import { AnimatedBulkBar } from "@/components/animated-bulk-bar";
import { FilterChip, formatChecklistFilterLabel } from "@/components/filter-chip";
import { ExportButton } from "@/components/export-button";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
	type OnChangeFn,
	type RowSelectionState,
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
	RiBarChartBoxLine,
	RiCalendarLine,
	RiCheckboxCircleLine,
	RiCloseLine,
	RiEyeLine,
	RiMore2Fill,
	RiSearchLine,
	RiShare2Line,
} from "@remixicon/react";
import { format } from "date-fns";
import useSWR from "swr";
import { useRouter } from "next/navigation";

const configuredTableFeatures = tableFeatures({
	columnVisibilityFeature,
	rowSortingFeature,
	rowSelectionFeature,
});

type AllergyDetailsRequestError = Error & { status?: number };

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

type AllergiesTableProps = {
	patientId: string;
	encounterId?: string;
	allergies: AllergyType[];
	page: number;
	limit: number;
	totalPages: number;
	query: string;
	sorting: SortingState;
	onSortingChange: OnChangeFn<SortingState>;
	createdFrom: string;
	createdTo: string;
	statusFilters: AllergyStatusFilter[];
	severityFilters: AllergySeverityFilter[];
	isPending: boolean;
	onQueryChange: (query: string) => void;
	onCreatedAtRangeApply: (createdFrom: string, createdTo: string) => void;
	onStatusFiltersChange: (statusFilters: AllergyStatusFilter[]) => void;
	onSeverityFiltersChange: (severityFilters: AllergySeverityFilter[]) => void;
	onFiltersClear: () => void;
	onPreviousPage: () => void;
	onNextPage: () => void;
	onLimitChange: (limit: number) => void;
};

export function AllergiesTable({
	patientId,
	encounterId,
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
	onFiltersClear,
	onPreviousPage,
	onNextPage,
	onLimitChange,
	sorting,
	onSortingChange,
}: AllergiesTableProps) {
	const router = useRouter();
	const { data: activeMemberRole } = authClient.useActiveMemberRole();
	const canArchive = activeMemberRole?.role === "owner" || activeMemberRole?.role === "admin";
	const visibleAllergyRowIds = useMemo(
		() => allergies.map((allergy) => allergy.allergyId).join(","),
		[allergies],
	);
	const [customDateRangeFilter, setCustomDateRangeFilter] = useState<DateRangeFilter | null>(null);
	const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false);
	const [isDetailsDrawerOpen, setIsDetailsDrawerOpen] = useState(false);
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const allergyDetailsQuery = useSWR(
		isDetailsDrawerOpen && selectedId ? (["patient-allergy-details", selectedId] as const) : null,
		([, selectedId]) => fetchPatientAllergyDetails(selectedId),
		{
			dedupingInterval: 0,
			onError: (error: AllergyDetailsRequestError) => {
				if (error.status === 401 || error.status === 403) {
					router.refresh();
				}
			},
			shouldRetryOnError: (error: AllergyDetailsRequestError) =>
				error.status !== 401 && error.status !== 403,
		},
	);
	function handleViewAllergyDetails(allergyId: string) {
		setSelectedId(allergyId);
		setIsDetailsDrawerOpen(true);
	}
	const columns = useMemo(
		() => getAllergiesColumns({ canArchive, onViewAllergyDetails: handleViewAllergyDetails }),
		[canArchive],
	);
	return (
		<div className="px-6 py-8 text-sm">
			<h1 className="mx-auto max-w-7xl text-lg font-semibold no-line-height">Allergies</h1>
			<div className="mx-auto mt-4 mb-4 flex max-w-7xl flex-wrap items-center gap-2">
				<div className="relative min-w-0 grow-[999] basis-80">
					<RiSearchLine className="size-4 pointer-events-none absolute bottom-0 left-2 flex h-full items-center justify-center text-gray-400" />
					<Input
						type="search"
						className="pl-8"
						placeholder={
							encounterId
								? "Search by allergen, reaction, severity, or allergy ID"
								: "Search by allergen, reaction, severity, allergy ID, or encounter ID"
						}
						value={query}
						onChange={(event) => onQueryChange(event.target.value)}
					/>
				</div>
				<div className="flex grow flex-wrap items-center gap-2 max-md:w-full">
					<FilterGroup
						activeFilterCount={
							(statusFilters.length > 0 ? 1 : 0) +
							(severityFilters.length > 0 ? 1 : 0) +
							(createdFrom || createdTo ? 1 : 0)
						}
					>
						<FilterPopover label="Status" icon={RiCheckboxCircleLine}>
							<RadioGroup
								value={statusFilters[0] ?? "all"}
								onValueChange={(nextStatusFilter) => {
									onStatusFiltersChange(
										nextStatusFilter === "all" ? [] : [nextStatusFilter as AllergyStatusFilter],
									);
								}}
								className="flex flex-col gap-0.5"
							>
								<div className="flex h-8 items-center gap-2 rounded-lg px-2 hover:bg-gray-100">
									<RadioGroupItem value="all" id="allergy-status-all" />
									<Label
										htmlFor="allergy-status-all"
										className="cursor-pointer w-full leading-normal font-normal"
									>
										All
									</Label>
								</div>
								{allergyStatusFilterOptions.map((statusOption) => (
									<div
										key={statusOption.value}
										className="flex h-8 items-center gap-2 rounded-lg px-2 hover:bg-gray-100"
									>
										<RadioGroupItem
											value={statusOption.value}
											id={`allergy-status-${statusOption.value}`}
										/>
										<Label
											htmlFor={`allergy-status-${statusOption.value}`}
											className="cursor-pointer w-full leading-normal font-normal"
										>
											{statusOption.label}
										</Label>
									</div>
								))}
							</RadioGroup>
						</FilterPopover>
						<FilterPopover label="Severity" icon={RiBarChartBoxLine}>
							<AllergyCheckboxFilterList
								name="allergy-severity"
								options={allergySeverityFilterOptions}
								selectedValues={severityFilters}
								onSelectedValuesChange={onSeverityFiltersChange}
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
						Add allergy
					</Button>
				</div>
			</div>
			<AllergyActiveFilterChips
				createdFrom={createdFrom}
				createdTo={createdTo}
				statusFilters={statusFilters}
				severityFilters={severityFilters}
				onCreatedAtRangeApply={onCreatedAtRangeApply}
				onStatusFiltersChange={onStatusFiltersChange}
				onSeverityFiltersChange={onSeverityFiltersChange}
				onFiltersClear={onFiltersClear}
			/>
			<AllergiesTableContent
				key={visibleAllergyRowIds}
				canArchive={canArchive}
				allergies={allergies}
				columns={columns}
				sorting={sorting}
				onSortingChange={onSortingChange}
				page={page}
				limit={limit}
				totalPages={totalPages}
				isPending={isPending}
				onViewAllergyDetails={handleViewAllergyDetails}
				onPreviousPage={onPreviousPage}
				onNextPage={onNextPage}
				onLimitChange={onLimitChange}
			/>
			<CreateAllergyDrawer
				open={isCreateDrawerOpen}
				onOpenChange={setIsCreateDrawerOpen}
				patientId={patientId}
				encounterId={encounterId}
			/>
			<AllergyDetailsDrawer
				open={isDetailsDrawerOpen}
				onOpenChange={setIsDetailsDrawerOpen}
				allergy={allergyDetailsQuery.data ?? null}
				isLoading={allergyDetailsQuery.isLoading}
				onAllergyUpdated={() => {
					allergyDetailsQuery.mutate();
				}}
			/>
		</div>
	);
}

function AllergiesTableContent({
	canArchive,
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
	canArchive: boolean;
	allergies: AllergyType[];
	columns: ColumnDef<typeof configuredTableFeatures, AllergyType>[];
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
	const table = useTable({
		features: configuredTableFeatures,
		data: allergies,
		columns,
		enableRowSelection: true,
		getRowId: (row) => row.allergyId,
		manualSorting: true,
		onSortingChange,
		onRowSelectionChange: setSelectedAllergyRows,
		state: {
			sorting,
			rowSelection: selectedAllergyRows,
		},
	});
	const selectedAllergies = table.getSelectedRowModel().rows.map((row) => row.original);

	const fitsOnSmallestPage =
		totalPages === 1 && table.getRowModel().rows.length <= ROWS_PER_PAGE_OPTIONS[0];

	return (
		<>
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
												"border-b border-gray-200 px-3 py-3 text-sm text-gray-600 transition-colors group-hover:bg-gray-100",
												row.getIsSelected() ? "bg-gray-100" : "bg-white",
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
			<AllergiesBulkActionBar
				canArchive={canArchive}
				selectedAllergies={selectedAllergies}
				onClearSelection={() => table.resetRowSelection()}
				onViewAllergyDetails={onViewAllergyDetails}
			/>
		</>
	);
}

function AllergiesBulkActionBar({
	canArchive,
	selectedAllergies,
	onClearSelection,
	onViewAllergyDetails,
}: {
	canArchive: boolean;
	selectedAllergies: AllergyType[];
	onClearSelection: () => void;
	onViewAllergyDetails: (allergyId: string) => void;
}) {
	const selectedAllergyCount = selectedAllergies.length;
	const singleSelectedAllergy = selectedAllergyCount === 1 ? selectedAllergies[0] : undefined;

	if (selectedAllergyCount === 0) return null;

	return (
		<AnimatedBulkBar>
			<span className="shrink-0 whitespace-nowrap text-sm font-medium">
				{selectedAllergyCount} {selectedAllergyCount === 1 ? "item" : "items"} selected
			</span>
			<TableBulkActionSeparator />
			<div className="flex items-center">
				{singleSelectedAllergy ? (
					<Button
						type="button"
						onClick={() => onViewAllergyDetails(singleSelectedAllergy.allergyId)}
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
					<span>Export {selectedAllergyCount > 1 ? "all" : null}</span>
				</Button>
				{canArchive ? (
					<Button
						type="button"
						variant="ghost"
						size="sm"
						className="gap-2 border-0 px-2.5 has-[>svg:first-child]:pl-2.5 text-white hover:bg-white/10 hover:text-white focus-visible:border-0 focus-visible:ring-2 focus-visible:ring-white/30"
					>
						<RiArchiveLine className="size-5" aria-hidden />
						<span>Archive {selectedAllergyCount > 1 ? "all" : null}</span>
					</Button>
				) : null}
			</div>
			<Button
				type="button"
				onClick={onClearSelection}
				variant="ghost"
				size="icon"
				className="size-8 border-0 text-white hover:bg-white/10 hover:text-white focus-visible:border-0 focus-visible:ring-2 focus-visible:ring-white/30"
				aria-label="Clear selected allergies"
			>
				<RiCloseLine className="size-5" aria-hidden />
			</Button>
		</AnimatedBulkBar>
	);
}

function AllergyActiveFilterChips({
	createdFrom,
	createdTo,
	statusFilters,
	severityFilters,
	onCreatedAtRangeApply,
	onStatusFiltersChange,
	onSeverityFiltersChange,
	onFiltersClear,
}: {
	createdFrom: string;
	createdTo: string;
	statusFilters: AllergyStatusFilter[];
	severityFilters: AllergySeverityFilter[];
	onCreatedAtRangeApply: (createdFrom: string, createdTo: string) => void;
	onStatusFiltersChange: (statusFilters: AllergyStatusFilter[]) => void;
	onSeverityFiltersChange: (severityFilters: AllergySeverityFilter[]) => void;
	onFiltersClear: () => void;
}) {
	const hasCreatedAtFilter = Boolean(createdFrom || createdTo);
	const hasStatusFilters = statusFilters.length > 0;
	const hasSeverityFilters = severityFilters.length > 0;

	if (!hasCreatedAtFilter && !hasStatusFilters && !hasSeverityFilters) {
		return null;
	}

	return (
		<div className="mx-auto mb-4 flex max-w-7xl flex-wrap gap-2">
			{hasStatusFilters ? (
				<FilterChip
					name="Status"
					value={formatChecklistFilterLabel(
						statusFilters.map((statusFilter) => formatAllergyFilterValue(statusFilter)),
					)}
					onRemove={() => onStatusFiltersChange([])}
				/>
			) : null}
			{hasSeverityFilters ? (
				<FilterChip
					name="Severity"
					value={formatChecklistFilterLabel(
						severityFilters.map((severityFilter) => formatAllergyFilterValue(severityFilter)),
					)}
					onRemove={() => onSeverityFiltersChange([])}
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

function formatAllergyFilterValue(value: string) {
	return value.charAt(0).toUpperCase() + value.slice(1);
}

async function fetchPatientAllergyDetails(selectedId: string) {
	const response = await fetch(`/api/patient-allergy-details/${encodeURIComponent(selectedId)}`);

	if (!response.ok) {
		throw Object.assign(new Error("Unable to load allergy details."), {
			status: response.status,
		});
	}

	const result = (await response.json()) as { allergy: AllergyDetailsType | null };

	return result.allergy;
}

function getAllergiesColumns({
	canArchive,
	onViewAllergyDetails,
}: {
	canArchive: boolean;
	onViewAllergyDetails: (allergyId: string) => void;
}): ColumnDef<typeof configuredTableFeatures, AllergyType>[] {
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
							className="w-50 rounded-xl border-white/20 bg-gray-800 text-sm text-white ring ring-gray-800"
						>
							<DropdownMenuItem
								className="rounded-lg text-white focus:bg-white/10 focus:text-white py-2"
								onSelect={() => onViewAllergyDetails(row.original.allergyId)}
							>
								<RiEyeLine className="text-white" />
								<span>View details</span>
							</DropdownMenuItem>
							<DropdownMenuItem className="rounded-lg text-white focus:bg-white/10 focus:text-white py-2">
								<RiShare2Line className="text-white" />
								<span>Export</span>
							</DropdownMenuItem>
							{canArchive ? (
								<>
									<DropdownMenuSeparator className="bg-white/20" />
									<DropdownMenuItem className="rounded-lg text-white focus:bg-white/10 focus:text-white py-2">
										<RiArchiveLine className="text-white" />
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

function AllergyCheckboxFilterList<TValue extends string>({
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
