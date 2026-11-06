"use client";

import { DateFilterMenu, FilterGroup, FilterPopover } from "@/components/filter-menu";

import { useMemo, useState } from "react";
import { authClient } from "@/lib/better-auth/auth.client";
import { IndeterminateCheckbox } from "@/components/indeterminate-checkbox";
import { StatusBadge } from "@/components/status-badge";
import { TableBulkActionSeparator } from "@/components/table-bulk-action-separator";
import { AnimatedBulkBar } from "@/components/animated-bulk-bar";
import { FilterChip, formatChecklistFilterLabel } from "@/components/filter-chip";
import { ExportButton } from "@/components/export-button";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CreateDiagnosisDrawer } from "@/features/patients/components/create-diagnosis-drawer";
import { DiagnosisDetailsDrawer } from "@/features/patients/components/diagnosis-details-drawer";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
	type DiagnosisDetailsType,
	DiagnosisType,
	type DiagnosisStatusFilter,
} from "@/features/patients/types";
import { format } from "date-fns";
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

import useSWR from "swr";
import { useRouter } from "next/navigation";

type DiagnosisDetailsRequestError = Error & { status?: number };
import {
	RiArchiveLine,
	RiArrowDownSLine,
	RiArrowLeftSLine,
	RiArrowRightSLine,
	RiArrowUpSLine,
	RiCalendarLine,
	RiCloseLine,
	RiCheckboxCircleLine,
	RiEyeLine,
	RiHistoryLine,
	RiMore2Fill,
	RiPulseLine,
	RiSearchLine,
	RiShare2Line,
} from "@remixicon/react";
import { CopyIdButton } from "@/components/copy-id-button";
import { SetDateRangeDialog, type DateRangeFilter } from "@/components/date-range-filter";
import { Input } from "@/components/ui/input";

const configuredTableFeatures = tableFeatures({
	columnVisibilityFeature,
	rowSortingFeature,
	rowSelectionFeature,
});

const ROWS_PER_PAGE_OPTIONS = [14, 28, 42];

const diagnosisStatusFilterOptions: {
	label: string;
	value: DiagnosisStatusFilter;
}[] = [
	{ label: "Active", value: "active" },
	{ label: "Resolved", value: "resolved" },
];

type DiagnosesTableProps = {
	patientId: string;
	encounterId?: string;
	diagnoses: DiagnosisType[];
	page: number;
	limit: number;
	totalPages: number;
	query: string;
	sorting: SortingState;
	onSortingChange: OnChangeFn<SortingState>;
	createdFrom: string;
	createdTo: string;
	diagnosedFrom: string;
	diagnosedTo: string;
	isPending: boolean;
	lastReviewedFrom: string;
	lastReviewedTo: string;
	statusFilters: DiagnosisStatusFilter[];
	onCreatedAtRangeApply: (createdFrom: string, createdTo: string) => void;
	onDiagnosedAtRangeApply: (diagnosedFrom: string, diagnosedTo: string) => void;
	onLastReviewedRangeApply: (lastReviewedFrom: string, lastReviewedTo: string) => void;
	onFiltersClear: () => void;
	onQueryChange: (query: string) => void;
	onPreviousPage: () => void;
	onNextPage: () => void;
	onLimitChange: (limit: number) => void;
	onStatusFiltersChange: (statusFilters: DiagnosisStatusFilter[]) => void;
};

export function DiagnosesTable({
	patientId,
	encounterId,
	diagnoses,
	page,
	limit,
	totalPages,
	query,
	createdFrom,
	createdTo,
	diagnosedFrom,
	diagnosedTo,
	isPending,
	lastReviewedFrom,
	lastReviewedTo,
	statusFilters,
	onCreatedAtRangeApply,
	onDiagnosedAtRangeApply,
	onLastReviewedRangeApply,
	onFiltersClear,
	onQueryChange,
	onPreviousPage,
	onNextPage,
	onLimitChange,
	onStatusFiltersChange,
	sorting,
	onSortingChange,
}: DiagnosesTableProps) {
	const router = useRouter();
	const { data: activeMemberRole } = authClient.useActiveMemberRole();
	const canArchive = activeMemberRole?.role === "owner" || activeMemberRole?.role === "admin";
	const visibleDiagnosisRowIds = useMemo(
		() => diagnoses.map((diagnosis) => diagnosis.diagnosisId).join(","),
		[diagnoses],
	);
	const [customDateRangeFilter, setCustomDateRangeFilter] = useState<DateRangeFilter | null>(null);
	const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false);
	const [isDetailsDrawerOpen, setIsDetailsDrawerOpen] = useState(false);
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const diagnosisDetailsQuery = useSWR(
		isDetailsDrawerOpen && selectedId ? (["patient-diagnosis-details", selectedId] as const) : null,
		([, selectedId]) => fetchPatientDiagnosisDetails(selectedId),
		{
			dedupingInterval: 0,
			onError: (error: DiagnosisDetailsRequestError) => {
				if (error.status === 401 || error.status === 403) {
					router.refresh();
				}
			},
			shouldRetryOnError: (error: DiagnosisDetailsRequestError) =>
				error.status !== 401 && error.status !== 403,
		},
	);

	function handleViewDiagnosisDetails(diagnosisId: string) {
		setSelectedId(diagnosisId);
		setIsDetailsDrawerOpen(true);
	}

	const columns = useMemo(
		() => getDiagnosesColumns({ canArchive, onViewDiagnosisDetails: handleViewDiagnosisDetails }),
		[canArchive],
	);

	return (
		<div className="px-6 py-8 text-sm">
			<h1 className="mx-auto max-w-7xl text-lg font-semibold no-line-height">Diagnoses</h1>
			<div className="mx-auto mt-4 mb-4 flex max-w-7xl flex-wrap items-center gap-2">
				<div className="relative min-w-0 grow-[999] basis-80">
					<RiSearchLine className="size-4 pointer-events-none absolute bottom-0 left-2 flex h-full items-center justify-center text-gray-400" />
					<Input
						type="search"
						className="pl-8"
						placeholder={
							encounterId
								? "Search by diagnosis or diagnosis ID"
								: "Search by diagnosis, diagnosis ID, or encounter ID"
						}
						value={query}
						onChange={(event) => onQueryChange(event.target.value)}
					/>
				</div>
				<div className="flex grow flex-wrap items-center gap-2 max-md:w-full">
					<FilterGroup
						activeFilterCount={
							(statusFilters.length > 0 ? 1 : 0) +
							(lastReviewedFrom || lastReviewedTo ? 1 : 0) +
							(diagnosedFrom || diagnosedTo ? 1 : 0) +
							(createdFrom || createdTo ? 1 : 0)
						}
					>
						<FilterPopover label="Status" icon={RiCheckboxCircleLine}>
							<RadioGroup
								value={statusFilters[0] ?? "all"}
								onValueChange={(nextStatusFilter) => {
									onStatusFiltersChange(
										nextStatusFilter === "all" ? [] : [nextStatusFilter as DiagnosisStatusFilter],
									);
								}}
								className="flex flex-col gap-0.5"
							>
								<div className="flex h-8 items-center gap-2 rounded-lg px-2 hover:bg-gray-100">
									<RadioGroupItem value="all" id="diagnosis-status-all" />
									<Label
										htmlFor="diagnosis-status-all"
										className="cursor-pointer w-full leading-normal font-normal"
									>
										All
									</Label>
								</div>
								{diagnosisStatusFilterOptions.map((statusOption) => (
									<div
										key={statusOption.value}
										className="flex h-8 items-center gap-2 rounded-lg px-2 hover:bg-gray-100"
									>
										<RadioGroupItem
											value={statusOption.value}
											id={`diagnosis-status-${statusOption.value}`}
										/>
										<Label
											htmlFor={`diagnosis-status-${statusOption.value}`}
											className="cursor-pointer w-full leading-normal font-normal"
										>
											{statusOption.label}
										</Label>
									</div>
								))}
							</RadioGroup>
						</FilterPopover>
						<DateFilterMenu
							label="Last updated"
							icon={RiHistoryLine}
							from={lastReviewedFrom}
							to={lastReviewedTo}
							onDateRangeApply={onLastReviewedRangeApply}
							onCustomDateRangeSelect={setCustomDateRangeFilter}
						/>
						<DateFilterMenu
							label="Diagnosed At"
							icon={RiPulseLine}
							from={diagnosedFrom}
							to={diagnosedTo}
							onDateRangeApply={onDiagnosedAtRangeApply}
							onCustomDateRangeSelect={setCustomDateRangeFilter}
						/>
						<DateFilterMenu
							label="Created at"
							icon={RiCalendarLine}
							from={createdFrom}
							to={createdTo}
							onDateRangeApply={onCreatedAtRangeApply}
							onCustomDateRangeSelect={setCustomDateRangeFilter}
						/>
					</FilterGroup>
					<ExportButton />
					<Button className="flex-1" type="button" onClick={() => setIsCreateDrawerOpen(true)}>
						Add diagnosis
					</Button>
				</div>
			</div>
			<DiagnosisActiveFilterChips
				createdFrom={createdFrom}
				createdTo={createdTo}
				diagnosedFrom={diagnosedFrom}
				diagnosedTo={diagnosedTo}
				lastReviewedFrom={lastReviewedFrom}
				lastReviewedTo={lastReviewedTo}
				statusFilters={statusFilters}
				onCreatedAtRangeApply={onCreatedAtRangeApply}
				onDiagnosedAtRangeApply={onDiagnosedAtRangeApply}
				onLastReviewedRangeApply={onLastReviewedRangeApply}
				onStatusFiltersChange={onStatusFiltersChange}
				onFiltersClear={onFiltersClear}
			/>
			<DiagnosesTableContent
				key={visibleDiagnosisRowIds}
				canArchive={canArchive}
				diagnoses={diagnoses}
				columns={columns}
				sorting={sorting}
				onSortingChange={onSortingChange}
				page={page}
				limit={limit}
				totalPages={totalPages}
				isPending={isPending}
				onViewDiagnosisDetails={handleViewDiagnosisDetails}
				onPreviousPage={onPreviousPage}
				onNextPage={onNextPage}
				onLimitChange={onLimitChange}
			/>
			<CreateDiagnosisDrawer
				open={isCreateDrawerOpen}
				onOpenChange={setIsCreateDrawerOpen}
				patientId={patientId}
				encounterId={encounterId}
			/>
			<SetDateRangeDialog
				dateRangeFilter={customDateRangeFilter}
				onClose={() => setCustomDateRangeFilter(null)}
			/>
			<DiagnosisDetailsDrawer
				open={isDetailsDrawerOpen}
				onOpenChange={setIsDetailsDrawerOpen}
				diagnosis={diagnosisDetailsQuery.data ?? null}
				isLoading={diagnosisDetailsQuery.isLoading}
				onDiagnosisUpdated={() => {
					diagnosisDetailsQuery.mutate();
				}}
			/>
		</div>
	);
}

function DiagnosesTableContent({
	canArchive,
	diagnoses,
	columns,
	sorting,
	onSortingChange,
	page,
	limit,
	totalPages,
	isPending,
	onViewDiagnosisDetails,
	onPreviousPage,
	onNextPage,
	onLimitChange,
}: {
	canArchive: boolean;
	diagnoses: DiagnosisType[];
	columns: ColumnDef<typeof configuredTableFeatures, DiagnosisType>[];
	sorting: SortingState;
	onSortingChange: OnChangeFn<SortingState>;
	page: number;
	limit: number;
	totalPages: number;
	isPending: boolean;
	onViewDiagnosisDetails: (diagnosisId: string) => void;
	onPreviousPage: () => void;
	onNextPage: () => void;
	onLimitChange: (limit: number) => void;
}) {
	const [selectedDiagnosisRows, setSelectedDiagnosisRows] = useState<RowSelectionState>({});
	const table = useTable({
		features: configuredTableFeatures,
		data: diagnoses,
		columns,
		enableRowSelection: true,
		getRowId: (row) => row.diagnosisId,
		manualSorting: true,
		onSortingChange,
		onRowSelectionChange: setSelectedDiagnosisRows,
		state: {
			sorting,
			rowSelection: selectedDiagnosisRows,
		},
	});
	const selectedDiagnoses = table.getSelectedRowModel().rows.map((row) => row.original);
	const fitsOnSmallestPage =
		totalPages === 1 && table.getRowModel().rows.length <= ROWS_PER_PAGE_OPTIONS[0];

	return (
		<>
			<div className="mx-auto max-w-7xl overflow-x-auto rounded-xl border border-gray-200 text-sm">
				<Table
					aria-busy={isPending}
					className="min-w-[78rem] border-separate border-spacing-0 bg-gray-50 text-left"
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
									onClick={() => onViewDiagnosisDetails(row.original.diagnosisId)}
									onKeyDown={(event) => {
										if (event.key === "Enter" || event.key === " ") {
											event.preventDefault();
											onViewDiagnosisDetails(row.original.diagnosisId);
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
									No matching diagnoses found.
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
			<DiagnosesBulkActionBar
				canArchive={canArchive}
				selectedDiagnoses={selectedDiagnoses}
				onClearSelection={() => table.resetRowSelection()}
				onViewDiagnosisDetails={onViewDiagnosisDetails}
			/>
		</>
	);
}

function DiagnosesBulkActionBar({
	canArchive,
	selectedDiagnoses,
	onClearSelection,
	onViewDiagnosisDetails,
}: {
	canArchive: boolean;
	selectedDiagnoses: DiagnosisType[];
	onClearSelection: () => void;
	onViewDiagnosisDetails: (diagnosisId: string) => void;
}) {
	const selectedDiagnosisCount = selectedDiagnoses.length;
	const singleSelectedDiagnosis = selectedDiagnosisCount === 1 ? selectedDiagnoses[0] : undefined;

	if (selectedDiagnosisCount === 0) {
		return null;
	}

	return (
		<AnimatedBulkBar>
			<span className="shrink-0 whitespace-nowrap text-sm font-medium">
				{selectedDiagnosisCount} {selectedDiagnosisCount === 1 ? "item" : "items"} selected
			</span>
			<TableBulkActionSeparator />
			<div className="flex items-center">
				{singleSelectedDiagnosis ? (
					<>
						<Button
							type="button"
							onClick={() => {
								onViewDiagnosisDetails(singleSelectedDiagnosis.diagnosisId);
							}}
							variant="ghost"
							size="sm"
							className="h-9 gap-2 rounded-lg border-0 px-2 text-white hover:bg-white/10 hover:text-white focus-visible:border-0 focus-visible:ring-2 focus-visible:ring-white/30"
						>
							<RiEyeLine className="size-5" aria-hidden={true} />
							<span>View details</span>
						</Button>
					</>
				) : null}
				<Button
					type="button"
					variant="ghost"
					size="sm"
					className="gap-2 border-0 px-2.5 has-[>svg:first-child]:pl-2.5 text-white hover:bg-white/10 hover:text-white focus-visible:border-0 focus-visible:ring-2 focus-visible:ring-white/30"
				>
					<RiShare2Line className="size-5" aria-hidden={true} />
					<span>Export {selectedDiagnosisCount > 1 ? "all" : null}</span>
				</Button>
				{canArchive ? (
					<Button
						type="button"
						variant="ghost"
						size="sm"
						className="gap-2 border-0 px-2.5 has-[>svg:first-child]:pl-2.5 text-white hover:bg-white/10 hover:text-white focus-visible:border-0 focus-visible:ring-2 focus-visible:ring-white/30"
					>
						<RiArchiveLine className="size-5" aria-hidden={true} />
						<span>Archive {selectedDiagnosisCount > 1 ? "all" : null}</span>
					</Button>
				) : null}
			</div>
			<Button
				type="button"
				onClick={onClearSelection}
				variant="ghost"
				size="icon"
				className="size-8 border-0 text-white hover:bg-white/10 hover:text-white focus-visible:border-0 focus-visible:ring-2 focus-visible:ring-white/30"
				aria-label="Clear selected diagnoses"
			>
				<RiCloseLine className="size-5" aria-hidden={true} />
			</Button>
		</AnimatedBulkBar>
	);
}

function DiagnosisActiveFilterChips({
	createdFrom,
	createdTo,
	diagnosedFrom,
	diagnosedTo,
	lastReviewedFrom,
	lastReviewedTo,
	statusFilters,
	onCreatedAtRangeApply,
	onDiagnosedAtRangeApply,
	onLastReviewedRangeApply,
	onStatusFiltersChange,
	onFiltersClear,
}: {
	createdFrom: string;
	createdTo: string;
	diagnosedFrom: string;
	diagnosedTo: string;
	lastReviewedFrom: string;
	lastReviewedTo: string;
	statusFilters: DiagnosisStatusFilter[];
	onCreatedAtRangeApply: (createdFrom: string, createdTo: string) => void;
	onDiagnosedAtRangeApply: (diagnosedFrom: string, diagnosedTo: string) => void;
	onLastReviewedRangeApply: (lastReviewedFrom: string, lastReviewedTo: string) => void;
	onStatusFiltersChange: (statusFilters: DiagnosisStatusFilter[]) => void;
	onFiltersClear: () => void;
}) {
	const hasCreatedAtFilter = Boolean(createdFrom || createdTo);
	const hasDiagnosedAtFilter = Boolean(diagnosedFrom || diagnosedTo);
	const hasLastReviewedFilter = Boolean(lastReviewedFrom || lastReviewedTo);
	const hasStatusFilters = statusFilters.length > 0;

	if (!hasCreatedAtFilter && !hasDiagnosedAtFilter && !hasLastReviewedFilter && !hasStatusFilters) {
		return null;
	}

	return (
		<div className="mx-auto mb-4 flex max-w-7xl flex-wrap gap-2">
			{hasStatusFilters ? (
				<FilterChip
					name="Status"
					value={formatChecklistFilterLabel(
						statusFilters.map((statusFilter) => {
							const statusOption = diagnosisStatusFilterOptions.find(
								(option) => option.value === statusFilter,
							);

							return statusOption?.label ?? statusFilter;
						}),
					)}
					onRemove={() => onStatusFiltersChange([])}
				/>
			) : null}
			{hasDiagnosedAtFilter ? (
				<FilterChip
					name="Diagnosed"
					value={formatDateRangeFilterLabel(diagnosedFrom, diagnosedTo)}
					onRemove={() => onDiagnosedAtRangeApply("", "")}
				/>
			) : null}
			{hasLastReviewedFilter ? (
				<FilterChip
					name="Last reviewed"
					value={formatDateRangeFilterLabel(lastReviewedFrom, lastReviewedTo)}
					onRemove={() => onLastReviewedRangeApply("", "")}
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

async function fetchPatientDiagnosisDetails(selectedId: string) {
	const response = await fetch(`/api/patient-diagnosis-details/${encodeURIComponent(selectedId)}`);

	if (!response.ok) {
		throw Object.assign(new Error("Unable to load diagnosis details."), {
			status: response.status,
		});
	}

	const result = (await response.json()) as { diagnosis: DiagnosisDetailsType | null };

	return result.diagnosis;
}

function getDiagnosesColumns({
	canArchive,
	onViewDiagnosisDetails,
}: {
	canArchive: boolean;
	onViewDiagnosisDetails: (diagnosisId: string) => void;
}): ColumnDef<typeof configuredTableFeatures, DiagnosisType>[] {
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
						onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
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
			header: "Diagnosis name",
			accessorKey: "name",
			enableSorting: true,
			cell: ({ row }) => <span className="font-medium text-gray-800">{row.original.name}</span>,
		},
		{
			id: "diagnosedAt",
			header: "Diagnosed At",
			accessorFn: (row) => row.diagnosedAtSortValue,
			enableSorting: true,
			cell: ({ row }) => row.original.diagnosedAtLabel,
		},
		{
			id: "lastReviewed",
			header: "Last Reviewed",
			accessorFn: (row) => row.lastReviewedSortValue,
			enableSorting: true,
			cell: ({ row }) => row.original.lastReviewedLabel,
		},
		{
			header: "Diagnosis ID",
			accessorKey: "diagnosisId",
			enableSorting: false,
			cell: ({ row }) => <CopyIdButton id={row.original.diagnosisId} />,
		},
		{
			id: "createdAt",
			header: "Created At",
			accessorFn: (row) => row.createdAtSortValue,
			enableSorting: true,
			cell: ({ row }) => row.original.createdAtLabel,
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
							aria-label={`Open actions for ${row.original.name}`}
						>
							<RiMore2Fill className="size-5" aria-hidden />
						</DropdownMenuTrigger>
						<DropdownMenuContent
							align="end"
							className="w-50 rounded-xl border-white/20 bg-gray-800 text-sm text-white ring ring-gray-800"
						>
							<DropdownMenuItem
								className="rounded-lg text-white focus:bg-white/10 focus:text-white py-2"
								onSelect={() => {
									onViewDiagnosisDetails(row.original.diagnosisId);
								}}
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
