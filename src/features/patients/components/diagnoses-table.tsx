"use client";

import { useMemo, useState } from "react";
import { IndeterminateCheckbox } from "@/components/indeterminate-checkbox";
import { StatusBadge } from "@/components/status-badge";
import { TableBulkActionSeparator } from "@/components/table-bulk-action-separator";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { CreateDiagnosisDrawer } from "@/features/patients/components/create-diagnosis-drawer";
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
import { DiagnosisType, type DiagnosisStatusFilter } from "@/features/patients/types";
import { endOfDay, format, isSameDay, startOfDay, subDays, subYears } from "date-fns";
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
	RiArrowRightLine,
	RiArchiveLine,
	RiArrowDownSLine,
	RiArrowUpSLine,
	RiCalendarLine,
	RiCheckLine,
	RiCloseLine,
	RiCheckboxCircleLine,
	RiEyeLine,
	RiFilter3Line,
	RiHistoryLine,
	RiMore2Fill,
	RiPulseLine,
	RiSearchLine,
	RiShare2Line,
} from "@remixicon/react";
import { CopyIdButton } from "@/components/copy-id-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import type { DateRange } from "react-day-picker";

const ROWS_PER_PAGE_OPTIONS = [14, 28, 42];

type DiagnosisFilterSubmenu = "status" | "last-reviewed" | "diagnosed-at" | "created-at";

type DiagnosisDateFilterPreset = {
	label: string;
	getRange: (today: Date) => DiagnosisDateCompleteRange;
};

type DiagnosisDateCompleteRange = {
	from: Date;
	to: Date;
};

const diagnosisStatusFilterOptions: {
	label: string;
	value: DiagnosisStatusFilter;
}[] = [
	{ label: "Active", value: "active" },
	{ label: "Resolved", value: "resolved" },
];

const diagnosisDateFilterPresets: DiagnosisDateFilterPreset[] = [
	{
		label: "Today",
		getRange: (today) => ({ from: startOfDay(today), to: endOfDay(today) }),
	},
	{
		label: "Last 7 days",
		getRange: (today) => ({
			from: startOfDay(subDays(today, 6)),
			to: endOfDay(today),
		}),
	},
	{
		label: "Last 30 days",
		getRange: (today) => ({
			from: startOfDay(subDays(today, 29)),
			to: endOfDay(today),
		}),
	},
	{
		label: "Last year",
		getRange: (today) => ({
			from: startOfDay(subYears(today, 1)),
			to: endOfDay(today),
		}),
	},
	{
		label: "Last 5 years",
		getRange: (today) => ({
			from: startOfDay(subYears(today, 5)),
			to: endOfDay(today),
		}),
	},
];

type DiagnosesTableProps = {
	diagnoses: DiagnosisType[];
	page: number;
	limit: number;
	totalPages: number;
	query: string;
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
	onQueryChange: (query: string) => void;
	onPreviousPage: () => void;
	onNextPage: () => void;
	onLimitChange: (limit: number) => void;
	onStatusFiltersChange: (statusFilters: DiagnosisStatusFilter[]) => void;
};

export function DiagnosesTable({
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
	onQueryChange,
	onPreviousPage,
	onNextPage,
	onLimitChange,
	onStatusFiltersChange,
}: DiagnosesTableProps) {
	const columns = useMemo(() => getDiagnosesColumns(), []);
	const visibleDiagnosisRowIds = useMemo(
		() => diagnoses.map((diagnosis) => diagnosis.diagnosisId).join(","),
		[diagnoses],
	);
	const [sorting, setSorting] = useState<SortingState>([{ id: "name", desc: false }]);
	const [activeDiagnosisFilterSubmenu, setActiveDiagnosisFilterSubmenu] =
		useState<DiagnosisFilterSubmenu | null>(null);
	const [isCreateDiagnosisDrawerOpen, setIsCreateDiagnosisDrawerOpen] = useState(false);

	return (
		<div className="p-8 text-sm">
			<h1 className="mx-auto max-w-7xl text-xl font-semibold">Diagnoses</h1>
			<div className="mx-auto mt-7 mb-4 flex max-w-7xl items-center gap-2">
				<div className="relative w-full">
					<RiSearchLine className="size-4 pointer-events-none absolute bottom-0 left-2 flex h-full items-center justify-center text-gray-400" />
					<Input
						type="search"
						className="w-full pl-8"
						placeholder="Search by patient name or ID"
						value={query}
						onChange={(event) => onQueryChange(event.target.value)}
					/>
				</div>
				<DropdownMenu
					onOpenChange={(isDiagnosisFilterMenuOpen) => {
						if (!isDiagnosisFilterMenuOpen) {
							setActiveDiagnosisFilterSubmenu(null);
						}
					}}
				>
					<DropdownMenuTrigger asChild>
						<Button
							variant="outline"
							className="gap-2 border-gray-200 bg-white text-sm text-gray-600 hover:bg-gray-50 data-[state=open]:border-gray-400 data-[state=open]:ring-4 data-[state=open]:ring-gray-200"
						>
							<RiFilter3Line aria-hidden className="size-5 text-gray-600" />
							Filter
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent
						align="end"
						sideOffset={8}
						className="w-[13.75rem] rounded-xl border border-gray-200 bg-white p-1 text-sm text-gray-700 shadow-xl"
					>
						<DropdownMenuSub
							open={activeDiagnosisFilterSubmenu === "status"}
							onOpenChange={(isStatusSubmenuOpen) => {
								setActiveDiagnosisFilterSubmenu((currentActiveDiagnosisFilterSubmenu) =>
									isStatusSubmenuOpen
										? "status"
										: currentActiveDiagnosisFilterSubmenu === "status"
											? null
											: currentActiveDiagnosisFilterSubmenu,
								);
							}}
						>
							<DropdownMenuSubTrigger className="rounded-lg py-2 text-gray-600 focus:bg-gray-100 focus:text-gray-900 data-[state=open]:bg-gray-100">
								<RiCheckboxCircleLine className="size-4.5" /> <span className="block">Status</span>
							</DropdownMenuSubTrigger>
							<DropdownMenuSubContent
								sideOffset={12}
								alignOffset={-5}
								className="w-[13.75rem] rounded-xl border border-gray-200 bg-white p-1 text-sm text-gray-700 shadow-xl"
							>
								{diagnosisStatusFilterOptions.map((statusOption) => {
									const isStatusSelected = statusFilters.includes(statusOption.value);
									const statusOptionId = `diagnosis-status-${statusOption.value}`;

									return (
										<DropdownMenuItem
											key={statusOption.value}
											className="rounded-lg p-0 focus:bg-gray-100 focus:text-gray-900"
											onSelect={(event) => {
												event.preventDefault();
											}}
										>
											<Label
												htmlFor={statusOptionId}
												className="flex w-full cursor-pointer items-center gap-2 px-2 py-2 leading-normal font-normal"
											>
												<Checkbox
													id={statusOptionId}
													checked={isStatusSelected}
													disabled={isPending}
													onCheckedChange={(checked) => {
														onStatusFiltersChange(
															checked === true
																? [...statusFilters, statusOption.value]
																: statusFilters.filter(
																		(statusFilter) => statusFilter !== statusOption.value,
																	),
														);
													}}
													className="[&_svg]:!text-current"
												/>
												<span>{statusOption.label}</span>
											</Label>
										</DropdownMenuItem>
									);
								})}
							</DropdownMenuSubContent>
						</DropdownMenuSub>

						<DropdownMenuSub
							open={activeDiagnosisFilterSubmenu === "last-reviewed"}
							onOpenChange={(isLastReviewedSubmenuOpen) => {
								setActiveDiagnosisFilterSubmenu((currentActiveDiagnosisFilterSubmenu) =>
									isLastReviewedSubmenuOpen
										? "last-reviewed"
										: currentActiveDiagnosisFilterSubmenu === "last-reviewed"
											? null
											: currentActiveDiagnosisFilterSubmenu,
								);
							}}
						>
							<DropdownMenuSubTrigger className="rounded-lg py-2 text-gray-600 focus:bg-gray-100 focus:text-gray-900 data-[state=open]:bg-gray-100">
								<RiHistoryLine className="text-lg" /> <span className="block">Last updated</span>
							</DropdownMenuSubTrigger>
							<DropdownMenuSubContent
								sideOffset={8}
								alignOffset={-5}
								className="w-max max-w-[calc(100vw-2rem)] rounded-xl border border-gray-200 bg-white p-0 text-sm text-gray-700 shadow-xl"
							>
								<DiagnosisDateFilterContent
									from={lastReviewedFrom}
									to={lastReviewedTo}
									isPending={isPending}
									onDateRangeApply={onLastReviewedRangeApply}
								/>
							</DropdownMenuSubContent>
						</DropdownMenuSub>

						<DropdownMenuSub
							open={activeDiagnosisFilterSubmenu === "diagnosed-at"}
							onOpenChange={(isDiagnosedAtSubmenuOpen) => {
								setActiveDiagnosisFilterSubmenu((currentActiveDiagnosisFilterSubmenu) =>
									isDiagnosedAtSubmenuOpen
										? "diagnosed-at"
										: currentActiveDiagnosisFilterSubmenu === "diagnosed-at"
											? null
											: currentActiveDiagnosisFilterSubmenu,
								);
							}}
						>
							<DropdownMenuSubTrigger className="rounded-lg py-2 text-gray-600 focus:bg-gray-100 focus:text-gray-900 data-[state=open]:bg-gray-100">
								<RiPulseLine className="size-4.5" /> <span className="block">Diagnosed At</span>
							</DropdownMenuSubTrigger>
							<DropdownMenuSubContent
								sideOffset={8}
								alignOffset={-5}
								className="w-max max-w-[calc(100vw-2rem)] rounded-xl border border-gray-200 bg-white p-0 text-sm text-gray-700 shadow-xl"
							>
								<DiagnosisDateFilterContent
									from={diagnosedFrom}
									to={diagnosedTo}
									isPending={isPending}
									onDateRangeApply={onDiagnosedAtRangeApply}
								/>
							</DropdownMenuSubContent>
						</DropdownMenuSub>
						<DropdownMenuSub
							open={activeDiagnosisFilterSubmenu === "created-at"}
							onOpenChange={(isCreatedAtSubmenuOpen) => {
								setActiveDiagnosisFilterSubmenu((currentActiveDiagnosisFilterSubmenu) =>
									isCreatedAtSubmenuOpen
										? "created-at"
										: currentActiveDiagnosisFilterSubmenu === "created-at"
											? null
											: currentActiveDiagnosisFilterSubmenu,
								);
							}}
						>
							<DropdownMenuSubTrigger className="rounded-lg py-2 text-gray-600 focus:bg-gray-100 focus:text-gray-900 data-[state=open]:bg-gray-100">
								<RiCalendarLine className="size-4.5" /> <span className="block">Created at</span>
							</DropdownMenuSubTrigger>
							<DropdownMenuSubContent
								sideOffset={8}
								alignOffset={-5}
								className="w-max max-w-[calc(100vw-2rem)] rounded-xl border border-gray-200 bg-white p-0 text-sm text-gray-700 shadow-xl"
							>
								<DiagnosisDateFilterContent
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
					className="gap-2 border-gray-200 bg-white text-sm text-gray-600 hover:bg-gray-50 data-[state=open]:border-gray-400 data-[state=open]:ring-4 data-[state=open]:ring-gray-200"
				>
					<RiShare2Line aria-hidden className="size-5 text-gray-600" />
					Export
				</Button>
				<Button
					className="text-sm"
					type="button"
					onClick={() => setIsCreateDiagnosisDrawerOpen(true)}
				>
					Add diagnosis
				</Button>
			</div>
			<DiagnosisActiveFilterPills
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
			/>
			<DiagnosesTableContent
				key={visibleDiagnosisRowIds}
				diagnoses={diagnoses}
				columns={columns}
				sorting={sorting}
				onSortingChange={setSorting}
				page={page}
				limit={limit}
				totalPages={totalPages}
				isPending={isPending}
				onPreviousPage={onPreviousPage}
				onNextPage={onNextPage}
				onLimitChange={onLimitChange}
			/>
			<CreateDiagnosisDrawer
				open={isCreateDiagnosisDrawerOpen}
				onOpenChange={setIsCreateDiagnosisDrawerOpen}
			/>
		</div>
	);
}

function DiagnosesTableContent({
	diagnoses,
	columns,
	sorting,
	onSortingChange,
	page,
	limit,
	totalPages,
	isPending,
	onPreviousPage,
	onNextPage,
	onLimitChange,
}: {
	diagnoses: DiagnosisType[];
	columns: ColumnDef<DiagnosisType>[];
	sorting: SortingState;
	onSortingChange: OnChangeFn<SortingState>;
	page: number;
	limit: number;
	totalPages: number;
	isPending: boolean;
	onPreviousPage: () => void;
	onNextPage: () => void;
	onLimitChange: (limit: number) => void;
}) {
	const [selectedDiagnosisRows, setSelectedDiagnosisRows] = useState<RowSelectionState>({});
	const table = useReactTable({
		data: diagnoses,
		columns,
		enableRowSelection: true,
		getRowId: (row) => row.diagnosisId,
		onSortingChange,
		onRowSelectionChange: setSelectedDiagnosisRows,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		state: {
			sorting,
			rowSelection: selectedDiagnosisRows,
		},
	});
	const selectedDiagnoses = table.getSelectedRowModel().rows.map((row) => row.original);

	return (
		<>
			<div className="mx-auto max-w-7xl overflow-x-auto rounded-xl border border-gray-200 text-sm">
				<Table className="w-full min-w-[78rem] border-separate border-spacing-0 bg-gray-50 text-left">
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
									No diagnoses found.
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
			<DiagnosesBulkActionBar
				selectedDiagnoses={selectedDiagnoses}
				onClearSelection={() => table.resetRowSelection()}
			/>
		</>
	);
}

function DiagnosesBulkActionBar({
	selectedDiagnoses,
	onClearSelection,
}: {
	selectedDiagnoses: DiagnosisType[];
	onClearSelection: () => void;
}) {
	const selectedDiagnosisCount = selectedDiagnoses.length;
	const singleSelectedDiagnosis = selectedDiagnosisCount === 1 ? selectedDiagnoses[0] : undefined;

	if (selectedDiagnosisCount === 0) {
		return null;
	}

	return (
		<div className="no-scrollbar fixed right-4 bottom-6 left-4 z-50 flex items-center gap-4 overflow-x-auto rounded-xl border border-white/20 bg-gray-800 px-4 py-2 text-white shadow-[0_1rem_2.5rem_rgba(15,23,42,0.35)] ring ring-gray-800 sm:right-auto sm:left-1/2 sm:w-max sm:max-w-[calc(100vw-2rem)] sm:-translate-x-1/2">
			<span className="shrink-0 whitespace-nowrap text-sm font-medium">
				{selectedDiagnosisCount} {selectedDiagnosisCount === 1 ? "item" : "items"} selected
			</span>
			<TableBulkActionSeparator />
			{singleSelectedDiagnosis ? (
				<>
					<button
						type="button"
						className="inline-flex h-9 shrink-0 items-center gap-2 rounded-lg px-2 text-sm font-medium text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
					>
						<RiEyeLine className="size-5" aria-hidden={true} />
						<span>View details</span>
					</button>
					<TableBulkActionSeparator />
				</>
			) : null}
			<button
				type="button"
				className="inline-flex h-9 shrink-0 items-center gap-2 rounded-lg px-2 text-sm font-medium text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
			>
				<RiShare2Line className="size-5" aria-hidden={true} />
				<span>Export</span>
			</button>
			<TableBulkActionSeparator />
			<button
				type="button"
				className="inline-flex h-9 shrink-0 items-center gap-2 rounded-lg px-2 text-sm font-medium text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
			>
				<RiArchiveLine className="size-5" aria-hidden={true} />
				<span>Archive</span>
			</button>
			<button
				type="button"
				onClick={onClearSelection}
				className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
				aria-label="Clear selected diagnoses"
			>
				<RiCloseLine className="size-5" aria-hidden={true} />
			</button>
		</div>
	);
}

function DiagnosisActiveFilterPills({
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
			{statusFilters.map((statusFilter) => {
				const statusOption = diagnosisStatusFilterOptions.find(
					(option) => option.value === statusFilter,
				);

				return (
					<DiagnosisFilterPill
						key={statusFilter}
						label={`Status: ${statusOption?.label ?? statusFilter}`}
						onRemove={() => {
							onStatusFiltersChange(
								statusFilters.filter((currentStatusFilter) => currentStatusFilter !== statusFilter),
							);
						}}
					/>
				);
			})}
			{hasDiagnosedAtFilter ? (
				<DiagnosisFilterPill
					label={`Diagnosed: ${formatDateRangeFilterLabel(diagnosedFrom, diagnosedTo)}`}
					onRemove={() => onDiagnosedAtRangeApply("", "")}
				/>
			) : null}
			{hasLastReviewedFilter ? (
				<DiagnosisFilterPill
					label={`Last reviewed: ${formatDateRangeFilterLabel(lastReviewedFrom, lastReviewedTo)}`}
					onRemove={() => onLastReviewedRangeApply("", "")}
				/>
			) : null}
			{hasCreatedAtFilter ? (
				<DiagnosisFilterPill
					label={`Created: ${formatDateRangeFilterLabel(createdFrom, createdTo)}`}
					onRemove={() => onCreatedAtRangeApply("", "")}
				/>
			) : null}
		</div>
	);
}

function DiagnosisFilterPill({ label, onRemove }: { label: string; onRemove: () => void }) {
	return (
		<span className="inline-flex items-center gap-3 rounded-full border border-gray-200 bg-gray-100 py-1.5 pr-1.5 pl-3 text-sm font-medium text-gray-600 shadow-xs">
			<span>{label}</span>
			<button
				type="button"
				onClick={onRemove}
				className="flex items-center justify-center bg-gray-800 text-white size-5 rounded-full transition hover:bg-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-300"
				aria-label={`Remove ${label} filter`}
			>
				<RiCloseLine className="size-4" aria-hidden={true} />
			</button>
		</span>
	);
}

function DiagnosisDateFilterContent({
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
				<DiagnosisDatePresetList from={from} to={to} onDateRangeApply={onDateRangeApply} />
			</div>

			<div className="w-88 shrink-0 border-l border-gray-100 p-3">
				<DiagnosisCustomRangeCalendarPanel
					from={from}
					to={to}
					isPending={isPending}
					onDateRangeApply={onDateRangeApply}
				/>
			</div>
		</div>
	);
}

function DiagnosisDatePresetList({
	from,
	to,
	onDateRangeApply,
}: {
	from: string;
	to: string;
	onDateRangeApply: (from: string, to: string) => void;
}) {
	const selectedDiagnosisDateRange = getDateRangeFromParams(from, to);
	const today = new Date();

	return (
		<>
			{diagnosisDateFilterPresets.map((preset) => {
				const presetRange = preset.getRange(today);
				return (
					<DiagnosisDatePresetButton
						key={preset.label}
						label={preset.label}
						isSelected={isSameDateRange(selectedDiagnosisDateRange, presetRange)}
						onSelect={() => {
							onDateRangeApply(formatUrlDate(presetRange.from), formatUrlDate(presetRange.to));
						}}
					/>
				);
			})}
		</>
	);
}

function DiagnosisCustomRangeCalendarPanel({
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
	const selectedDiagnosisDateRange = getDateRangeFromParams(from, to);
	const selectedDiagnosisDateRangeKey = getDateRangeKey(selectedDiagnosisDateRange);
	const [draftDiagnosisDateRange, setDraftDiagnosisDateRange] = useState<DateRange | undefined>(
		selectedDiagnosisDateRange,
	);
	const [previousSelectedDiagnosisDateRangeKey, setPreviousSelectedDiagnosisDateRangeKey] =
		useState(selectedDiagnosisDateRangeKey);

	if (selectedDiagnosisDateRangeKey !== previousSelectedDiagnosisDateRangeKey) {
		setPreviousSelectedDiagnosisDateRangeKey(selectedDiagnosisDateRangeKey);
		setDraftDiagnosisDateRange(selectedDiagnosisDateRange);
	}

	return (
		<div className="flex min-w-0 flex-col">
			<div className="flex items-center gap-3">
				<DiagnosisDateFieldPlaceholder value={draftDiagnosisDateRange?.from} label="Start date" />
				<RiArrowRightLine className="size-5 shrink-0 text-gray-400" aria-hidden="true" />
				<DiagnosisDateFieldPlaceholder value={draftDiagnosisDateRange?.to} label="End date" />
			</div>

			<Calendar
				mode="range"
				selected={draftDiagnosisDateRange}
				onSelect={(nextDraftDiagnosisDateRange) => {
					setDraftDiagnosisDateRange(nextDraftDiagnosisDateRange);
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
						setDraftDiagnosisDateRange(undefined);
						onDateRangeApply("", "");
					}}
				>
					Reset
				</Button>
				<Button
					type="button"
					className="min-w-40 flex-1 text-sm"
					disabled={!draftDiagnosisDateRange?.from || !draftDiagnosisDateRange?.to || isPending}
					onClick={() => {
						if (!draftDiagnosisDateRange?.from || !draftDiagnosisDateRange?.to) return;

						onDateRangeApply(
							formatUrlDate(draftDiagnosisDateRange.from),
							formatUrlDate(draftDiagnosisDateRange.to),
						);
					}}
				>
					Apply
				</Button>
			</div>
		</div>
	);
}

function DiagnosisDatePresetButton({
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

function DiagnosisDateFieldPlaceholder({ label, value }: { label: string; value?: Date }) {
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

function getDateRangeKey(range?: DateRange) {
	return `${range?.from ? formatUrlDate(range.from) : ""}:${range?.to ? formatUrlDate(range.to) : ""}`;
}

function isSameDateRange(range: DateRange | undefined, presetRange: DiagnosisDateCompleteRange) {
	if (!range?.from || !range.to) return false;

	return isSameDay(range.from, presetRange.from) && isSameDay(range.to, presetRange.to);
}

function formatUrlDate(date: Date) {
	return format(date, "yyyy-MM-dd");
}

function getDiagnosesColumns(): ColumnDef<DiagnosisType>[] {
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
							className="w-[13.75rem] rounded-xl border border-white/20 bg-gray-800 text-sm text-white ring ring-gray-800"
						>
							<DropdownMenuItem className="flex items-center gap-3 rounded-lg text-white focus:bg-white/10 focus:text-white py-2">
								<RiEyeLine className="text-white" />
								<span>View details</span>
							</DropdownMenuItem>
							<DropdownMenuSeparator className="bg-white/20" />
							<DropdownMenuItem className="flex items-center gap-3 rounded-lg text-white focus:bg-white/10 focus:text-white py-2">
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
