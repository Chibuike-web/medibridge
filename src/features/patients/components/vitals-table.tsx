"use client";

import { useMemo, useState } from "react";
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
import { endOfDay, format, isSameDay, startOfDay, subDays } from "date-fns";
import type { DateRange } from "react-day-picker";
import {
	RiArchiveLine,
	RiArrowDownSLine,
	RiArrowRightSLine,
	RiArrowRightLine,
	RiArrowUpSLine,
	RiCalendarLine,
	RiCheckLine,
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
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
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

type VitalFilterSubmenu = "encounter-date" | "encounter-type" | "created-at";

type VitalDateCompleteRange = {
	from: Date;
	to: Date;
};

type VitalDateFilterPreset = {
	label: string;
	getRange: (today: Date) => VitalDateCompleteRange;
};

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

const vitalDateFilterPresets: VitalDateFilterPreset[] = [
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
	onPreviousPage: () => void;
	onNextPage: () => void;
	onLimitChange: (limit: number) => void;
	onVitalCreated: (vital: VitalType) => void;
};

export function VitalsTable({
	patientId,
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
	onPreviousPage,
	onNextPage,
	onLimitChange,
	onVitalCreated,
}: VitalsTableProps) {
	const { data: activeMemberRole } = authClient.useActiveMemberRole();
	const canArchive = activeMemberRole?.role === "owner" || activeMemberRole?.role === "admin";
	const visibleVitalRowIds = useMemo(
		() => vitals.map((vital) => vital.vitalId).join(","),
		[vitals],
	);
	const [sorting, setSorting] = useState<SortingState>([]);
	const [activeFilterSubmenu, setActiveFilterSubmenu] = useState<VitalFilterSubmenu | null>(null);
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
			<h1 className="mx-auto w-full max-w-7xl text-xl font-semibold no-line-height">Vitals</h1>
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
						className="relative w-[13.75rem] overflow-visible rounded-xl border-gray-200 bg-white text-sm text-gray-700 shadow-xl"
					>
						<DropdownMenuItem
							data-active={activeFilterSubmenu === "encounter-date"}
							onFocus={() => setActiveFilterSubmenu("encounter-date")}
							onPointerEnter={() => setActiveFilterSubmenu("encounter-date")}
							onSelect={(event) => event.preventDefault()}
							className="h-9 rounded-lg py-0 text-gray-600 focus:bg-gray-100 focus:text-gray-900 data-[active=true]:bg-gray-100"
						>
							<RiCalendarLine className="size-4.5" />
							<span>Encounter date</span>
							<RiArrowRightSLine className="ml-auto size-4.5" aria-hidden="true" />
						</DropdownMenuItem>

						<DropdownMenuItem
							data-active={activeFilterSubmenu === "encounter-type"}
							onFocus={() => setActiveFilterSubmenu("encounter-type")}
							onPointerEnter={() => setActiveFilterSubmenu("encounter-type")}
							onSelect={(event) => event.preventDefault()}
							className="h-9 rounded-lg py-0 text-gray-600 focus:bg-gray-100 focus:text-gray-900 data-[active=true]:bg-gray-100"
						>
							<RiFileList2Line className="size-4.5" />
							<span>Encounter type</span>
							<RiArrowRightSLine className="ml-auto size-4.5" aria-hidden="true" />
						</DropdownMenuItem>

						<DropdownMenuItem
							data-active={activeFilterSubmenu === "created-at"}
							onFocus={() => setActiveFilterSubmenu("created-at")}
							onPointerEnter={() => setActiveFilterSubmenu("created-at")}
							onSelect={(event) => event.preventDefault()}
							className="h-9 rounded-lg py-0 text-gray-600 focus:bg-gray-100 focus:text-gray-900 data-[active=true]:bg-gray-100"
						>
							<RiCalendarLine className="size-4.5" />
							<span>Created at</span>
							<RiArrowRightSLine className="ml-auto size-4.5" aria-hidden="true" />
						</DropdownMenuItem>

						<div
							id="vitals-filter-submenu-panel"
							aria-hidden={activeFilterSubmenu === null}
							className={cn(
								"absolute top-0 right-[100%] z-50 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-gray-200 bg-white text-sm text-gray-700 shadow-xl transition-[transform,opacity] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none",
								activeFilterSubmenu === "encounter-date" || activeFilterSubmenu === "created-at"
									? "w-max"
									: "w-[13.75rem]",
								activeFilterSubmenu === "encounter-type"
									? "translate-y-9"
									: activeFilterSubmenu === "created-at"
										? "translate-y-18"
										: "translate-y-0",
								activeFilterSubmenu === null ? "pointer-events-none opacity-0" : "opacity-100",
							)}
						>
							<div hidden={activeFilterSubmenu !== "encounter-date"}>
								<VitalDateFilterContent
									from={recordedFrom}
									to={recordedTo}
									isPending={isPending}
									onDateRangeApply={onRecordedAtRangeApply}
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
												disabled={isPending}
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

							<div hidden={activeFilterSubmenu !== "created-at"}>
								<VitalDateFilterContent
									from={createdFrom}
									to={createdTo}
									isPending={isPending}
									onDateRangeApply={onCreatedAtRangeApply}
								/>
							</div>
						</div>
					</DropdownMenuContent>
				</DropdownMenu>
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
				encounterOptions={encounterOptions}
				onCreated={onVitalCreated}
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
	columns: ColumnDef<VitalType>[];
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
	const table = useReactTable({
		data: vitals,
		columns,
		enableRowSelection: true,
		getRowId: (row) => row.vitalId,
		onSortingChange,
		onRowSelectionChange: setSelectedVitalRows,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
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
				<Table className="min-w-[78rem] border-separate border-spacing-0 bg-gray-50 text-left">
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
					<TableBody className="overflow-hidden rounded-t-xl outline outline-gray-200">
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
							<SelectTrigger className="h-8 w-[4.25rem] border-gray-200 bg-white px-2 text-gray-700 shadow-none">
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
		<div className="no-scrollbar fixed right-4 bottom-6 left-4 z-50 flex h-12 items-center gap-4 overflow-x-auto rounded-xl border border-white/20 bg-gray-800 pr-2 pl-4 text-white shadow-[0_1rem_2.5rem_rgba(15,23,42,0.35)] ring ring-gray-800 sm:right-auto sm:left-1/2 sm:w-max sm:max-w-[calc(100vw-2rem)] sm:-translate-x-1/2">
			<span className="shrink-0 text-sm font-medium whitespace-nowrap">
				{selectedVitalCount} {selectedVitalCount === 1 ? "item" : "items"} selected
			</span>
			<TableBulkActionSeparator />
			<div className="flex items-center">
				{singleSelectedVital ? (
					<button
						type="button"
						onClick={() => onViewVitalDetails(singleSelectedVital.vitalId)}
						className="inline-flex h-9 shrink-0 items-center gap-2 rounded-lg px-2 text-sm font-medium text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
					>
						<RiEyeLine className="size-5" aria-hidden />
						<span>View details</span>
					</button>
				) : null}
				<button
					type="button"
					className="inline-flex h-8 shrink-0 items-center gap-2 rounded-md px-2.5 text-sm font-medium text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
				>
					<RiShare2Line className="size-5" aria-hidden />
					<span>Export {selectedVitalCount > 1 ? "all" : null}</span>
				</button>
				{canArchive ? (
					<button
						type="button"
						className="inline-flex h-8 shrink-0 items-center gap-2 rounded-md px-2.5 text-sm font-medium text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
					>
						<RiArchiveLine className="size-5" aria-hidden />
						<span>Archive {selectedVitalCount > 1 ? "all" : null}</span>
					</button>
				) : null}
			</div>
			<button
				type="button"
				onClick={onClearSelection}
				className="inline-flex size-8 shrink-0 items-center justify-center rounded-md text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
				aria-label="Clear selected vitals"
			>
				<RiCloseLine className="size-5" aria-hidden />
			</button>
		</div>
	);
}

function VitalActiveFilterPills({
	recordedFrom,
	recordedTo,
	createdFrom,
	createdTo,
	onRecordedAtRangeApply,
	onCreatedAtRangeApply,
}: {
	recordedFrom: string;
	recordedTo: string;
	createdFrom: string;
	createdTo: string;
	onRecordedAtRangeApply: (recordedFrom: string, recordedTo: string) => void;
	onCreatedAtRangeApply: (createdFrom: string, createdTo: string) => void;
}) {
	const hasRecordedAtFilter = Boolean(recordedFrom || recordedTo);
	const hasCreatedAtFilter = Boolean(createdFrom || createdTo);

	if (!hasRecordedAtFilter && !hasCreatedAtFilter) return null;

	return (
		<div className="mx-auto flex w-full max-w-7xl flex-wrap gap-2">
			{hasRecordedAtFilter ? (
				<VitalFilterPill
					label={`Encounter: ${formatDateRangeFilterLabel(recordedFrom, recordedTo)}`}
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
	);
}

function VitalFilterPill({ label, onRemove }: { label: string; onRemove: () => void }) {
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

function VitalDateFilterContent({
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
				<VitalDatePresetList from={from} to={to} onDateRangeApply={onDateRangeApply} />
			</div>
			<div className="w-88 shrink-0 border-l border-gray-100 p-3">
				<VitalCustomRangeCalendarPanel
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

function VitalDatePresetList({
	from,
	to,
	onDateRangeApply,
}: {
	from: string;
	to: string;
	onDateRangeApply: (from: string, to: string) => void;
}) {
	const selectedDateRange = getDateRangeFromParams(from, to);
	const today = new Date();

	return (
		<>
			{vitalDateFilterPresets.map((preset) => {
				const presetRange = preset.getRange(today);

				return (
					<DropdownMenuItem
						key={preset.label}
						onSelect={(event) => {
							event.preventDefault();
							onDateRangeApply(formatUrlDate(presetRange.from), formatUrlDate(presetRange.to));
						}}
						className="flex h-9 w-full items-center justify-between rounded-lg px-3 text-left font-medium text-gray-700 focus:bg-gray-50"
					>
						<span>{preset.label}</span>
						{isSameDateRange(selectedDateRange, presetRange) ? (
							<RiCheckLine className="size-5 text-gray-700" aria-hidden="true" />
						) : null}
					</DropdownMenuItem>
				);
			})}
		</>
	);
}

function VitalCustomRangeCalendarPanel({
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
	const [draftDateRange, setDraftDateRange] = useState<DateRange | undefined>(
		getDateRangeFromParams(from, to),
	);

	return (
		<div className="flex min-w-0 flex-col">
			<div className="flex items-center gap-3">
				<VitalDateFieldPlaceholder value={draftDateRange?.from} label="Start date" />
				<RiArrowRightLine className="size-5 shrink-0 text-gray-400" aria-hidden="true" />
				<VitalDateFieldPlaceholder value={draftDateRange?.to} label="End date" />
			</div>
			<Calendar
				mode="range"
				selected={draftDateRange}
				onSelect={setDraftDateRange}
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
					className="min-w-28"
					disabled={isPending}
					onClick={() => {
						setDraftDateRange(undefined);
						onDateRangeApply("", "");
					}}
				>
					Reset
				</Button>
				<Button
					type="button"
					className="min-w-40 flex-1"
					disabled={!draftDateRange?.from || !draftDateRange?.to || isPending}
					onClick={() => {
						if (!draftDateRange?.from || !draftDateRange?.to) return;

						onDateRangeApply(formatUrlDate(draftDateRange.from), formatUrlDate(draftDateRange.to));
					}}
				>
					Apply
				</Button>
			</div>
		</div>
	);
}

function VitalDateFieldPlaceholder({ label, value }: { label: string; value?: Date }) {
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

	if (parsedFromDate) return `From ${format(parsedFromDate, "MMM d, yyyy")}`;

	if (parsedToDate) return `Until ${format(parsedToDate, "MMM d, yyyy")}`;

	return "Any date";
}

function getDateRangeFromParams(from: string, to: string): DateRange | undefined {
	const parsedFromDate = parseDateParam(from);
	const parsedToDate = parseDateParam(to);

	if (!parsedFromDate && !parsedToDate) return undefined;

	return { from: parsedFromDate, to: parsedToDate };
}

function isSameDateRange(range: DateRange | undefined, presetRange: VitalDateCompleteRange) {
	if (!range?.from || !range.to) return false;

	return isSameDay(range.from, presetRange.from) && isSameDay(range.to, presetRange.to);
}

function formatUrlDate(date: Date) {
	return format(date, "yyyy-MM-dd");
}

function getVitalsColumns({
	canArchive,
	onViewVitalDetails,
}: {
	canArchive: boolean;
	onViewVitalDetails: (vitalId: string) => void;
}): ColumnDef<VitalType>[] {
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
			header: "Encounter date",
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
							className="w-[13.75rem] rounded-xl border-white/20 bg-gray-800 text-sm text-white ring ring-gray-800"
						>
							<DropdownMenuItem
								className="gap-3 rounded-lg py-2 text-white focus:bg-white/10 focus:text-white"
								onSelect={() => onViewVitalDetails(row.original.vitalId)}
							>
								<RiEyeLine className="text-white" />
								<span>View details</span>
							</DropdownMenuItem>
							<DropdownMenuItem className="gap-3 rounded-lg py-2 text-white focus:bg-white/10 focus:text-white">
								<RiShare2Line className="text-white" />
								<span>Export</span>
							</DropdownMenuItem>
							{canArchive ? (
								<>
									<DropdownMenuSeparator className="bg-white/20" />
									<DropdownMenuItem className="gap-3 rounded-lg py-2 text-white focus:bg-white/10 focus:text-white">
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
