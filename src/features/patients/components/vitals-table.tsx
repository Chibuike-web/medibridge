"use client";

import {
	DateRangeMenuItems,
	SetDateRangeDialog,
	type DateRangeFilter,
} from "@/components/date-range-filter";
import { useMemo, useState } from "react";
import {
	type ColumnDef,
	flexRender,
	createSortedRowModel,
	stockFeatures,
	sortFns,
	tableFeatures,
	type OnChangeFn,
	type RowSelectionState,
	type SortingState,
	useTable,
} from "@tanstack/react-table";

const configuredTableFeatures = tableFeatures({
	...stockFeatures,
	sortFns,
	sortedRowModel: createSortedRowModel(),
});
import { format } from "date-fns";
import {
	RiArchiveLine,
	RiArrowDownSLine,
	RiArrowRightSLine,
	RiArrowUpSLine,
	RiCalendarLine,
	RiCloseLine,
	RiEyeLine,
	RiFileList2Line,
	RiFilter3Line,
	RiMore2Fill,
	RiSearchLine,
	RiShare2Line,
} from "@remixicon/react";
import { CopyIdButton } from "@/components/copy-id-button";
import { IndeterminateCheckbox } from "@/components/indeterminate-checkbox";
import { TableBulkActionSeparator } from "@/components/table-bulk-action-separator";
import { AnimatedBulkBar } from "@/components/animated-bulk-bar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { CreateVitalsDrawer } from "@/features/patients/components/create-vitals-drawer";
import { VitalDetailsDrawer } from "@/features/patients/components/vital-details-drawer";
import { VitalsChart } from "@/features/patients/components/vitals-chart";
import type {
	EncounterTypeFilter,
	VitalEncounterOption,
	VitalType,
} from "@/features/patients/types";
import { authClient } from "@/lib/better-auth/auth.client";
import { cn } from "@/lib/utils/cn";
import { parseDateParam } from "@/lib/utils/parse-date-param";

type VitalFilterSubmenu = "date-recorded" | "encounter-type" | "created-at";

const ROWS_PER_PAGE_OPTIONS = [14, 28, 42];

const numericVitalColumnIds = new Set([
	"systolic",
	"heartRate",
	"respiratoryRate",
	"temperature",
	"oxygenSaturation",
	"weight",
	"bmi",
]);

const vitalEncounterTypeFilterOptions: {
	label: string;
	value: EncounterTypeFilter;
}[] = [
	{ label: "Emergency Visit", value: "emergency-visit" },
	{ label: "Routine Checkup", value: "routine-checkup" },
	{ label: "Follow-up Visit", value: "follow-up-visit" },
	{ label: "Outpatient Visit", value: "outpatient-visit" },
];

type VitalsTableProps = {
	patientId: string;
	encounterId?: string;
	encounterOptions: VitalEncounterOption[];
	vitals: VitalType[];
	readings: VitalType[];
	page: number;
	limit: number;
	totalPages: number;
	query: string;
	recordedFrom: string;
	recordedTo: string;
	createdFrom: string;
	createdTo: string;
	isPending: boolean;
	onQueryChange: (query: string) => void;
	onRecordedAtRangeApply: (recordedFrom: string, recordedTo: string) => void;
	onCreatedAtRangeApply: (createdFrom: string, createdTo: string) => void;
	onFiltersClear: () => void;
	onPreviousPage: () => void;
	onNextPage: () => void;
	onLimitChange: (limit: number) => void;
};

export function VitalsTable({
	patientId,
	encounterId,
	encounterOptions,
	vitals,
	readings,
	page,
	limit,
	totalPages,
	query,
	recordedFrom,
	recordedTo,
	createdFrom,
	createdTo,
	isPending,
	onQueryChange,
	onRecordedAtRangeApply,
	onCreatedAtRangeApply,
	onFiltersClear,
	onPreviousPage,
	onNextPage,
	onLimitChange,
}: VitalsTableProps) {
	const { data: activeMemberRole } = authClient.useActiveMemberRole();
	const canArchive = activeMemberRole?.role === "owner" || activeMemberRole?.role === "admin";
	const visibleVitalRowIds = useMemo(
		() => vitals.map((vital) => vital.vitalId).join(","),
		[vitals],
	);
	const [sorting, setSorting] = useState<SortingState>([]);
	const [activeFilterSubmenu, setActiveFilterSubmenu] = useState<VitalFilterSubmenu | null>(null);
	const [customDateRangeFilter, setCustomDateRangeFilter] = useState<DateRangeFilter | null>(null);
	const [isVitalsFilterMenuOpen, setIsVitalsFilterMenuOpen] = useState(false);
	const [selectedEncounterTypeFilters, setSelectedEncounterTypeFilters] = useState<
		EncounterTypeFilter[]
	>([]);
	const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false);
	const [isDetailsDrawerOpen, setIsDetailsDrawerOpen] = useState(false);
	const [selectedVitalId, setSelectedVitalId] = useState<string | null>(null);
	const selectedVital =
		[...vitals, ...readings].find((vital) => vital.vitalId === selectedVitalId) ?? null;

	function handleViewVitalDetails(vitalId: string) {
		setSelectedVitalId(vitalId);
		setIsDetailsDrawerOpen(true);
	}

	const columns = useMemo(
		() => getVitalsColumns({ canArchive, onViewVitalDetails: handleViewVitalDetails }),
		[canArchive],
	);

	return (
		<div className="flex flex-col gap-5 px-6 py-8 text-sm">
			<h1 className="mx-auto w-full max-w-7xl text-lg font-semibold no-line-height">Vitals</h1>
			<VitalsChart readings={readings} />
			<div className="mx-auto flex w-full max-w-7xl items-center gap-2">
				<div className="relative w-full">
					<RiSearchLine className="pointer-events-none absolute bottom-0 left-2 flex h-full size-4 items-center justify-center text-gray-400" />
					<Input
						type="search"
						className="pl-8"
						aria-label="Search vitals"
						placeholder="Search by vital ID or clinical notes"
						value={query}
						onChange={(event) => onQueryChange(event.target.value)}
					/>
				</div>
				<DropdownMenu
					open={isVitalsFilterMenuOpen}
					onOpenChange={(nextIsVitalsFilterMenuOpen) => {
						setIsVitalsFilterMenuOpen(nextIsVitalsFilterMenuOpen);

						if (!nextIsVitalsFilterMenuOpen) {
							setActiveFilterSubmenu(null);
						}
					}}
				>
					<DropdownMenuTrigger asChild>
						<Button variant="outline" className="bg-white text-gray-600 hover:bg-gray-50">
							<RiFilter3Line aria-hidden className="size-5 text-gray-600" />
							Filter
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent
						onPointerLeave={() => setActiveFilterSubmenu(null)}
						align="end"
						className="relative w-[13.75rem] overflow-visible rounded-xl bg-white text-sm text-gray-700"
					>
						<DropdownMenuItem
							data-active={activeFilterSubmenu === "date-recorded"}
							onFocus={() => setActiveFilterSubmenu("date-recorded")}
							onPointerEnter={() => setActiveFilterSubmenu("date-recorded")}
							onSelect={(event) => event.preventDefault()}
							className="h-9 rounded-lg py-0 text-gray-600 focus:bg-gray-100 focus:text-gray-900 data-[active=true]:bg-gray-100"
						>
							<RiCalendarLine className="size-4" />
							<span className="flex-1">Date recorded</span>
							<RiArrowRightSLine className="size-4" aria-hidden="true" />
						</DropdownMenuItem>

						<DropdownMenuItem
							data-active={activeFilterSubmenu === "encounter-type"}
							onFocus={() => setActiveFilterSubmenu("encounter-type")}
							onPointerEnter={() => setActiveFilterSubmenu("encounter-type")}
							onSelect={(event) => event.preventDefault()}
							className="h-9 rounded-lg py-0 text-gray-600 focus:bg-gray-100 focus:text-gray-900 data-[active=true]:bg-gray-100"
						>
							<RiFileList2Line className="size-4" />
							<span className="flex-1">Encounter type</span>
							<RiArrowRightSLine className="size-4" aria-hidden="true" />
						</DropdownMenuItem>

						<DropdownMenuItem
							data-active={activeFilterSubmenu === "created-at"}
							onFocus={() => setActiveFilterSubmenu("created-at")}
							onPointerEnter={() => setActiveFilterSubmenu("created-at")}
							onSelect={(event) => event.preventDefault()}
							className="mb-0 h-9 rounded-lg py-0 text-gray-600 focus:bg-gray-100 focus:text-gray-900 data-[active=true]:bg-gray-100"
						>
							<RiCalendarLine className="size-4" />
							<span className="flex-1">Created at</span>
							<RiArrowRightSLine className="size-4" aria-hidden="true" />
						</DropdownMenuItem>

						<div
							id="vitals-filter-submenu-panel"
							aria-hidden={activeFilterSubmenu === null}
							className={cn(
								"absolute top-0 right-[100%] z-50 w-[13.75rem] max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl bg-white text-sm text-gray-700 shadow-[0_0_0_1px_rgba(0,0,0,0.06),0_1px_2px_-1px_rgba(0,0,0,0.06),0_0.5rem_1.5rem_-0.25rem_rgba(0,0,0,0.12)] transition-[translate,opacity] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none",
								activeFilterSubmenu === "encounter-type"
									? "translate-y-10"
									: activeFilterSubmenu === "created-at"
										? "translate-y-20"
										: "translate-y-0",
								activeFilterSubmenu === null ? "pointer-events-none opacity-0" : "opacity-100",
							)}
						>
							<div hidden={activeFilterSubmenu !== "date-recorded"} className="p-1">
								<DateRangeMenuItems
									from={recordedFrom}
									to={recordedTo}
									onDateRangeApply={onRecordedAtRangeApply}
									onCustomDateRangeSelect={setCustomDateRangeFilter}
								/>
							</div>

							<div hidden={activeFilterSubmenu !== "encounter-type"} className="p-1">
								{vitalEncounterTypeFilterOptions.map((option) => {
									const inputId = `vital-encounter-type-${option.value}`;
									const isSelected = selectedEncounterTypeFilters.includes(option.value);

									return (
										<Label
											key={option.value}
											htmlFor={inputId}
											className="flex h-9 cursor-pointer items-center gap-2 rounded-lg px-2 text-sm font-normal text-gray-600 hover:bg-gray-100"
										>
											<Checkbox
												id={inputId}
												checked={isSelected}
												onCheckedChange={(isChecked) => {
													setSelectedEncounterTypeFilters((previousFilters) =>
														isChecked
															? [...previousFilters, option.value]
															: previousFilters.filter((filter) => filter !== option.value),
													);
												}}
											/>
											{option.label}
										</Label>
									);
								})}
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
				<Button variant="outline" className="bg-white text-gray-600 hover:bg-gray-50">
					<RiShare2Line aria-hidden className="size-5 text-gray-600" />
					Export
				</Button>
				<Button type="button" onClick={() => setIsCreateDrawerOpen(true)}>
					Add vitals
				</Button>
			</div>
			<VitalActiveFilterPills
				recordedFrom={recordedFrom}
				recordedTo={recordedTo}
				createdFrom={createdFrom}
				createdTo={createdTo}
				onRecordedAtRangeApply={onRecordedAtRangeApply}
				onCreatedAtRangeApply={onCreatedAtRangeApply}
				onFiltersClear={onFiltersClear}
			/>
			<VitalsTableContent
				key={visibleVitalRowIds}
				canArchive={canArchive}
				vitals={vitals}
				columns={columns}
				sorting={sorting}
				onSortingChange={setSorting}
				page={page}
				limit={limit}
				totalPages={totalPages}
				isPending={isPending}
				onViewVitalDetails={handleViewVitalDetails}
				onPreviousPage={onPreviousPage}
				onNextPage={onNextPage}
				onLimitChange={onLimitChange}
			/>
			<CreateVitalsDrawer
				open={isCreateDrawerOpen}
				onOpenChange={setIsCreateDrawerOpen}
				patientId={patientId}
				encounterId={encounterId}
				encounterOptions={encounterOptions}
			/>
			<VitalDetailsDrawer
				open={isDetailsDrawerOpen}
				onOpenChange={setIsDetailsDrawerOpen}
				vital={selectedVital}
			/>
		</div>
	);
}

function VitalsTableContent({
	canArchive,
	vitals,
	columns,
	sorting,
	onSortingChange,
	page,
	limit,
	totalPages,
	isPending,
	onViewVitalDetails,
	onPreviousPage,
	onNextPage,
	onLimitChange,
}: {
	canArchive: boolean;
	vitals: VitalType[];
	columns: ColumnDef<typeof configuredTableFeatures, VitalType>[];
	sorting: SortingState;
	onSortingChange: OnChangeFn<SortingState>;
	page: number;
	limit: number;
	totalPages: number;
	isPending: boolean;
	onViewVitalDetails: (vitalId: string) => void;
	onPreviousPage: () => void;
	onNextPage: () => void;
	onLimitChange: (limit: number) => void;
}) {
	const [selectedVitalRows, setSelectedVitalRows] = useState<RowSelectionState>({});
	const table = useTable({
		features: configuredTableFeatures,
		data: vitals,
		columns,
		enableRowSelection: true,
		getRowId: (row) => row.vitalId,
		onSortingChange,
		onRowSelectionChange: setSelectedVitalRows,
		state: {
			sorting,
			rowSelection: selectedVitalRows,
		},
	});
	const selectedVitals = table.getSelectedRowModel().rows.map((row) => row.original);
	const rows = table.getRowModel().rows;

	return (
		<>
			<div className="mx-auto w-full max-w-7xl overflow-x-auto rounded-xl border border-gray-200 text-sm">
				<Table
					aria-busy={isPending}
					className="min-w-[78rem] border-separate border-spacing-0 bg-gray-50 text-left"
				>
					<TableHeader className="text-sm font-semibold text-gray-600">
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow key={headerGroup.id}>
								{headerGroup.headers.map((header) => {
									const canSort = header.column.getCanSort();
									const sortDirection = header.column.getIsSorted();
									const isNumeric = numericVitalColumnIds.has(header.column.id);

									return (
										<TableHead
											key={header.id}
											scope="col"
											tabIndex={canSort ? 0 : undefined}
											aria-sort={
												canSort
													? sortDirection === "asc"
														? "ascending"
														: sortDirection === "desc"
															? "descending"
															: "none"
													: undefined
											}
											onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
											onKeyDown={(event) => {
												if (canSort && (event.key === "Enter" || event.key === " ")) {
													event.preventDefault();
													header.column.getToggleSortingHandler()?.(event);
												}
											}}
											className={cn(
												"z-10 h-10 bg-gray-50 px-3 py-0 text-gray-600 whitespace-nowrap",
												isNumeric ? "text-right" : "text-left",
												canSort &&
													"cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gray-400",
											)}
										>
											<div
												className={cn(
													"flex items-center gap-1",
													isNumeric ? "justify-end" : "justify-between",
												)}
											>
												{header.isPlaceholder
													? null
													: flexRender(header.column.columnDef.header, header.getContext())}
												{canSort ? (
													<div className="-space-y-2">
														<RiArrowUpSLine
															className={cn(
																"size-4 text-gray-800",
																sortDirection === "desc" && "opacity-30",
															)}
															aria-hidden
														/>
														<RiArrowDownSLine
															className={cn(
																"size-4 text-gray-800",
																sortDirection === "asc" && "opacity-30",
															)}
															aria-hidden
														/>
													</div>
												) : null}
											</div>
										</TableHead>
									);
								})}
							</TableRow>
						))}
					</TableHeader>
					<TableBody
						data-pending={isPending || undefined}
						className="overflow-hidden rounded-t-xl outline outline-gray-200 transition-opacity data-[pending=true]:opacity-80 data-[pending=true]:delay-150"
					>
						{rows.length > 0 ? (
							rows.map((row, rowPosition) => (
								<TableRow
									key={row.id}
									role="button"
									tabIndex={0}
									onClick={() => onViewVitalDetails(row.original.vitalId)}
									onKeyDown={(event) => {
										if (event.key === "Enter" || event.key === " ") {
											event.preventDefault();
											onViewVitalDetails(row.original.vitalId);
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
												numericVitalColumnIds.has(cell.column.id) && "text-right",
												rowPosition === rows.length - 1 && "border-b-0",
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
									No matching vitals.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
				<div className="flex items-center justify-between gap-3 border-t border-gray-200 bg-white p-3 text-sm text-gray-500">
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
								size="sm"
								onClick={onPreviousPage}
								disabled={page <= 1 || isPending}
								className="text-gray-700 shadow-none"
							>
								Previous
							</Button>
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={onNextPage}
								disabled={page >= totalPages || isPending}
								className="text-gray-700 shadow-none"
							>
								Next
							</Button>
						</div>
					</div>
				</div>
			</div>
			<VitalsBulkActionBar
				canArchive={canArchive}
				selectedVitals={selectedVitals}
				onClearSelection={() => table.resetRowSelection()}
				onViewVitalDetails={onViewVitalDetails}
			/>
		</>
	);
}

function VitalsBulkActionBar({
	canArchive,
	selectedVitals,
	onClearSelection,
	onViewVitalDetails,
}: {
	canArchive: boolean;
	selectedVitals: VitalType[];
	onClearSelection: () => void;
	onViewVitalDetails: (vitalId: string) => void;
}) {
	const selectedVitalCount = selectedVitals.length;
	const singleSelectedVital = selectedVitalCount === 1 ? selectedVitals[0] : undefined;

	if (selectedVitalCount === 0) return null;

	return (
		<AnimatedBulkBar>
			<span className="shrink-0 text-sm font-medium whitespace-nowrap">
				{selectedVitalCount} {selectedVitalCount === 1 ? "item" : "items"} selected
			</span>
			<TableBulkActionSeparator />
			<div className="flex items-center">
				{singleSelectedVital ? (
					<Button
						type="button"
						onClick={() => onViewVitalDetails(singleSelectedVital.vitalId)}
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
					<span>Export {selectedVitalCount > 1 ? "all" : null}</span>
				</Button>
				{canArchive ? (
					<Button
						type="button"
						variant="ghost"
						size="sm"
						className="gap-2 border-0 px-2.5 has-[>svg:first-child]:pl-2.5 text-white hover:bg-white/10 hover:text-white focus-visible:border-0 focus-visible:ring-2 focus-visible:ring-white/30"
					>
						<RiArchiveLine className="size-5" aria-hidden />
						<span>Archive {selectedVitalCount > 1 ? "all" : null}</span>
					</Button>
				) : null}
			</div>
			<Button
				type="button"
				onClick={onClearSelection}
				variant="ghost"
				size="icon"
				className="size-8 border-0 text-white hover:bg-white/10 hover:text-white focus-visible:border-0 focus-visible:ring-2 focus-visible:ring-white/30"
				aria-label="Clear selected vitals"
			>
				<RiCloseLine className="size-5" aria-hidden />
			</Button>
		</AnimatedBulkBar>
	);
}

function VitalActiveFilterPills({
	recordedFrom,
	recordedTo,
	createdFrom,
	createdTo,
	onRecordedAtRangeApply,
	onCreatedAtRangeApply,
	onFiltersClear,
}: {
	recordedFrom: string;
	recordedTo: string;
	createdFrom: string;
	createdTo: string;
	onRecordedAtRangeApply: (recordedFrom: string, recordedTo: string) => void;
	onCreatedAtRangeApply: (createdFrom: string, createdTo: string) => void;
	onFiltersClear: () => void;
}) {
	const hasRecordedAtFilter = Boolean(recordedFrom || recordedTo);
	const hasCreatedAtFilter = Boolean(createdFrom || createdTo);

	if (!hasRecordedAtFilter && !hasCreatedAtFilter) return null;

	return (
		<div className="mx-auto flex w-full max-w-7xl items-start gap-4">
			<div className="flex flex-1 flex-wrap gap-2">
				{hasRecordedAtFilter ? (
					<VitalFilterPill
						label={`Recorded: ${formatDateRangeFilterLabel(recordedFrom, recordedTo)}`}
						onRemove={() => onRecordedAtRangeApply("", "")}
					/>
				) : null}
				{hasCreatedAtFilter ? (
					<VitalFilterPill
						label={`Created: ${formatDateRangeFilterLabel(createdFrom, createdTo)}`}
						onRemove={() => onCreatedAtRangeApply("", "")}
					/>
				) : null}
			</div>
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

function VitalFilterPill({ label, onRemove }: { label: string; onRemove: () => void }) {
	return (
		<span className="inline-flex items-center gap-3 rounded-full border border-gray-200 bg-gray-100 py-1.5 pr-1.5 pl-3 text-sm font-medium text-gray-600 shadow-xs">
			<span>{label}</span>
			<Button
				type="button"
				onClick={onRemove}
				size="icon"
				className="flex size-5 rounded-full text-white hover:bg-gray-500 focus-visible:ring-2 focus-visible:ring-gray-300"
				aria-label={`Remove ${label} filter`}
			>
				<RiCloseLine className="size-4" aria-hidden="true" />
			</Button>
		</span>
	);
}

function formatDateRangeFilterLabel(from: string, to: string) {
	const parsedFromDate = parseDateParam(from);
	const parsedToDate = parseDateParam(to);

	if (parsedFromDate && parsedToDate) {
		return `${format(parsedFromDate, "MMM d, yyyy")} - ${format(parsedToDate, "MMM d, yyyy")}`;
	}

	if (parsedFromDate) return `From ${format(parsedFromDate, "MMM d, yyyy")}`;

	if (parsedToDate) return `Until ${format(parsedToDate, "MMM d, yyyy")}`;

	return "Any date";
}

function getVitalsColumns({
	canArchive,
	onViewVitalDetails,
}: {
	canArchive: boolean;
	onViewVitalDetails: (vitalId: string) => void;
}): ColumnDef<typeof configuredTableFeatures, VitalType>[] {
	return [
		{
			id: "select",
			header: ({ table }) => (
				<div
					className="flex items-center justify-center"
					onClick={(event) => event.stopPropagation()}
				>
					<IndeterminateCheckbox
						aria-label="Select all vitals on this page"
						checked={table.getIsAllPageRowsSelected()}
						indeterminate={table.getIsSomePageRowsSelected()}
						onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
					/>
				</div>
			),
			cell: ({ row }) => (
				<div className="w-max" onClick={(event) => event.stopPropagation()}>
					<IndeterminateCheckbox
						aria-label={`Select vital ${row.original.vitalId}`}
						checked={row.getIsSelected()}
						disabled={!row.getCanSelect()}
						indeterminate={row.getIsSomeSelected()}
						onCheckedChange={(value) => row.toggleSelected(!!value)}
					/>
				</div>
			),
			enableSorting: false,
		},
		{
			accessorKey: "recordedAt",
			header: "Date recorded",
			enableSorting: true,
			cell: ({ row }) => format(row.original.recordedAt, "d MMM yyyy, h:mm a"),
		},
		{
			accessorKey: "vitalId",
			header: "Vital ID",
			enableSorting: false,
			cell: ({ row }) => <CopyIdButton id={row.original.vitalId} />,
		},
		{
			accessorKey: "systolic",
			header: "BP (mmHg)",
			enableSorting: true,
			cell: ({ row }) => `${row.original.systolic}/${row.original.diastolic}`,
		},
		{ accessorKey: "heartRate", header: "HR (bpm)", enableSorting: true },
		{ accessorKey: "respiratoryRate", header: "RR (breaths/min)", enableSorting: true },
		{ accessorKey: "temperature", header: "Temp (°C)", enableSorting: true },
		{ accessorKey: "oxygenSaturation", header: "SpO₂ (%)", enableSorting: true },
		{ accessorKey: "weight", header: "Weight (kg)", enableSorting: true },
		{
			accessorKey: "bmi",
			header: "BMI",
			enableSorting: true,
			cell: ({ row }) => row.original.bmi.toFixed(1),
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
							aria-label={`Open actions for vital ${row.original.vitalId}`}
						>
							<RiMore2Fill className="size-5" aria-hidden />
						</DropdownMenuTrigger>
						<DropdownMenuContent
							align="end"
							className="w-50 rounded-xl border-white/20 bg-gray-800 text-sm text-white ring ring-gray-800"
						>
							<DropdownMenuItem
								className="rounded-lg py-2 text-white focus:bg-white/10 focus:text-white"
								onSelect={() => onViewVitalDetails(row.original.vitalId)}
							>
								<RiEyeLine className="text-white" />
								<span>View details</span>
							</DropdownMenuItem>
							<DropdownMenuItem className="rounded-lg py-2 text-white focus:bg-white/10 focus:text-white">
								<RiShare2Line className="text-white" />
								<span>Export</span>
							</DropdownMenuItem>
							{canArchive ? (
								<>
									<DropdownMenuSeparator className="bg-white/20" />
									<DropdownMenuItem className="rounded-lg py-2 text-white focus:bg-white/10 focus:text-white">
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
