"use client";

import { useMemo, useState } from "react";
import type {
	ProcedureDetailsType,
	ProcedureStatusFilter,
	ProcedureType,
} from "@/features/patients/types";
import { CreateProcedureDrawer } from "@/features/patients/components/create-procedure-drawer";
import { ProcedureDetailsDrawer } from "@/features/patients/components/procedure-details-drawer";
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
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
	RiArrowRightLine,
	RiArrowDownSLine,
	RiArrowUpSLine,
	RiCalendarLine,
	RiCheckLine,
	RiCheckboxCircleLine,
	RiCloseLine,
	RiFilter3Line,
	RiEyeLine,
	RiMore2Fill,
	RiSearchLine,
	RiShare2Line,
} from "@remixicon/react";
import { parseDateParam } from "@/lib/utils/parse-date-param";
import { endOfDay, format, isSameDay, startOfDay, subDays } from "date-fns";
import type { DateRange } from "react-day-picker";
import useSWR from "swr";

const ROWS_PER_PAGE_OPTIONS = [14, 28, 42];

type ProcedureFilterSubmenu = "status" | "created-at";

type ProcedureDateFilterPreset = {
	label: string;
	getRange: (today: Date) => ProcedureDateCompleteRange;
};

type ProcedureDateCompleteRange = {
	from: Date;
	to: Date;
};

const procedureStatusFilterOptions: {
	label: string;
	value: ProcedureStatusFilter;
}[] = [
	{ label: "Pending", value: "pending" },
	{ label: "Completed", value: "completed" },
	{ label: "Cancelled", value: "cancelled" },
];

const procedureDateFilterPresets: ProcedureDateFilterPreset[] = [
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
];

type ProceduresTableProps = {
	procedures: ProcedureType[];
	page: number;
	limit: number;
	totalPages: number;
	query: string;
	createdFrom: string;
	createdTo: string;
	statusFilters: ProcedureStatusFilter[];
	isPending: boolean;
	onQueryChange: (query: string) => void;
	onCreatedAtRangeApply: (createdFrom: string, createdTo: string) => void;
	onStatusFiltersChange: (statusFilters: ProcedureStatusFilter[]) => void;
	onPreviousPage: () => void;
	onNextPage: () => void;
	onLimitChange: (limit: number) => void;
};

export function ProceduresTable({
	procedures,
	page,
	limit,
	totalPages,
	query,
	createdFrom,
	createdTo,
	statusFilters,
	isPending,
	onQueryChange,
	onCreatedAtRangeApply,
	onStatusFiltersChange,
	onPreviousPage,
	onNextPage,
	onLimitChange,
}: ProceduresTableProps) {
	const [isCreateProcedureDrawerOpen, setIsCreateProcedureDrawerOpen] = useState(false);
	const [isProcedureDetailsDrawerOpen, setIsProcedureDetailsDrawerOpen] = useState(false);
	const [selectedProcedureId, setSelectedProcedureId] = useState<string | null>(null);
	const [sorting, setSorting] = useState<SortingState>([]);
	const [activeProcedureFilterSubmenu, setActiveProcedureFilterSubmenu] =
		useState<ProcedureFilterSubmenu | null>(null);
	const procedureDetailsQuery = useSWR(
		selectedProcedureId ? (["patient-procedure-details", selectedProcedureId] as const) : null,
		([, selectedProcedureId]) => fetchPatientProcedureDetails(selectedProcedureId),
	);

	function handleViewProcedureDetails(procedureId: string) {
		setSelectedProcedureId(procedureId);
		setIsProcedureDetailsDrawerOpen(true);
	}

	const hasActiveFilters = Boolean(query || createdFrom || createdTo || statusFilters.length > 0);

	const columns = useMemo(
		() => getProceduresColumns({ onViewProcedureDetails: handleViewProcedureDetails }),
		[],
	);

	const table = useReactTable({
		data: procedures,
		columns,
		enableRowSelection: true,
		onSortingChange: setSorting,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		state: {
			sorting,
		},
	});
	const emptyMessage = hasActiveFilters
		? "No procedures match the current filters."
		: "No procedures found.";

	return (
		<div className="px-6 py-8 text-sm">
			<h1 className="mx-auto max-w-7xl text-xl font-semibold">Procedures</h1>
			<div className="mx-auto mt-7 mb-4 flex max-w-7xl items-center gap-2">
				<div className="relative w-full">
					<RiSearchLine className="size-4 pointer-events-none absolute bottom-0 left-2 flex h-full items-center justify-center text-gray-400" />
					<Input
						type="search"
						className="pl-8"
						placeholder="Search by procedure, indication, facility, status, or procedure ID"
						value={query}
						onChange={(event) => onQueryChange(event.target.value)}
					/>
				</div>
				<DropdownMenu
					onOpenChange={(isProcedureFilterMenuOpen) => {
						if (!isProcedureFilterMenuOpen) {
							setActiveProcedureFilterSubmenu(null);
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
							open={activeProcedureFilterSubmenu === "status"}
							onOpenChange={(isStatusSubmenuOpen) => {
								setActiveProcedureFilterSubmenu((prev) => {
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
								sideOffset={12}
								alignOffset={-5}
								className="w-[13.75rem] rounded-xl border border-gray-200 bg-white p-1 text-sm text-gray-700 shadow-xl"
							>
								{procedureStatusFilterOptions.map((statusOption) => {
									const isStatusSelected = statusFilters.includes(statusOption.value);
									const statusOptionId = `procedure-status-${statusOption.value}`;

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
												className="w-full cursor-pointer px-2 py-2 leading-normal font-normal"
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
							open={activeProcedureFilterSubmenu === "created-at"}
							onOpenChange={(isCreatedAtSubmenuOpen) => {
								setActiveProcedureFilterSubmenu((prev) => {
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
								<ProcedureDateFilterContent
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
					onClick={() => setIsCreateProcedureDrawerOpen(true)}
				>
					Add procedure
				</Button>
			</div>
			<ProcedureActiveFilterPills
				createdFrom={createdFrom}
				createdTo={createdTo}
				statusFilters={statusFilters}
				onCreatedAtRangeApply={onCreatedAtRangeApply}
				onStatusFiltersChange={onStatusFiltersChange}
			/>
			<div className="mx-auto max-w-7xl overflow-x-auto rounded-xl border border-gray-200 text-sm">
				<Table className="min-w-[76rem] border-separate border-spacing-0 bg-gray-50 text-left">
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
				<CreateProcedureDrawer
					open={isCreateProcedureDrawerOpen}
					onOpenChange={setIsCreateProcedureDrawerOpen}
				/>
				<ProcedureDetailsDrawer
					open={isProcedureDetailsDrawerOpen}
					onOpenChange={setIsProcedureDetailsDrawerOpen}
					procedure={procedureDetailsQuery.data ?? null}
					isLoading={procedureDetailsQuery.isLoading}
				/>
			</div>
		);
	}

function ProcedureActiveFilterPills({
	createdFrom,
	createdTo,
	statusFilters,
	onCreatedAtRangeApply,
	onStatusFiltersChange,
}: {
	createdFrom: string;
	createdTo: string;
	statusFilters: ProcedureStatusFilter[];
	onCreatedAtRangeApply: (createdFrom: string, createdTo: string) => void;
	onStatusFiltersChange: (statusFilters: ProcedureStatusFilter[]) => void;
}) {
	const hasCreatedAtFilter = Boolean(createdFrom || createdTo);
	const hasStatusFilters = statusFilters.length > 0;

	if (!hasCreatedAtFilter && !hasStatusFilters) {
		return null;
	}

	return (
		<div className="mx-auto mb-4 flex max-w-7xl flex-wrap gap-2">
			{statusFilters.map((statusFilter) => {
				const statusOption = procedureStatusFilterOptions.find(
					(option) => option.value === statusFilter,
				);

				return (
					<ProcedureFilterPill
						key={statusFilter}
						label={`Status: ${statusOption?.label ?? formatProcedureFilterValue(statusFilter)}`}
						onRemove={() => {
							onStatusFiltersChange(
								statusFilters.filter(
									(currentStatusFilter) => currentStatusFilter !== statusFilter,
								),
							);
						}}
					/>
				);
			})}
			{hasCreatedAtFilter ? (
				<ProcedureFilterPill
					label={`Created: ${formatDateRangeFilterLabel(createdFrom, createdTo)}`}
					onRemove={() => onCreatedAtRangeApply("", "")}
				/>
			) : null}
		</div>
	);
}

function ProcedureFilterPill({ label, onRemove }: { label: string; onRemove: () => void }) {
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

function ProcedureDateFilterContent({
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
				<ProcedureDatePresetList from={from} to={to} onDateRangeApply={onDateRangeApply} />
			</div>

			<div className="w-88 shrink-0 border-l border-gray-100 p-3">
				<ProcedureCustomRangeCalendarPanel
					from={from}
					to={to}
					isPending={isPending}
					onDateRangeApply={onDateRangeApply}
				/>
			</div>
		</div>
	);
}

function ProcedureDatePresetList({
	from,
	to,
	onDateRangeApply,
}: {
	from: string;
	to: string;
	onDateRangeApply: (from: string, to: string) => void;
}) {
	const selectedProcedureDateRange = getDateRangeFromParams(from, to);
	const today = new Date();
	const isPresetDateRangeSelected = procedureDateFilterPresets.some((preset) =>
		isSameDateRange(selectedProcedureDateRange, preset.getRange(today)),
	);

	return (
		<>
			{procedureDateFilterPresets.map((preset) => {
				const presetRange = preset.getRange(today);
				return (
					<ProcedureDatePresetButton
						key={preset.label}
						label={preset.label}
						isSelected={isSameDateRange(selectedProcedureDateRange, presetRange)}
						onSelect={() => {
							onDateRangeApply(formatUrlDate(presetRange.from), formatUrlDate(presetRange.to));
						}}
					/>
				);
			})}
			<DropdownMenuItem
				onSelect={(event) => {
					event.preventDefault();
				}}
				className="mt-1 flex h-9 w-full items-center justify-between rounded-lg px-3 text-left font-medium text-gray-700 focus:bg-gray-50"
			>
				<span>Custom range</span>
				{selectedProcedureDateRange && !isPresetDateRangeSelected ? (
					<RiCheckLine className="size-5 text-gray-700" aria-hidden="true" />
				) : (
					<RiArrowRightLine className="size-5 text-gray-400" aria-hidden="true" />
				)}
			</DropdownMenuItem>
		</>
	);
}

function ProcedureCustomRangeCalendarPanel({
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
	const selectedProcedureDateRange = getDateRangeFromParams(from, to);
	const selectedProcedureDateRangeKey = getDateRangeKey(selectedProcedureDateRange);
	const [draftProcedureDateRange, setDraftProcedureDateRange] = useState<DateRange | undefined>(
		selectedProcedureDateRange,
	);
	const [previousSelectedProcedureDateRangeKey, setPreviousSelectedProcedureDateRangeKey] =
		useState(selectedProcedureDateRangeKey);

	if (selectedProcedureDateRangeKey !== previousSelectedProcedureDateRangeKey) {
		setPreviousSelectedProcedureDateRangeKey(selectedProcedureDateRangeKey);
		setDraftProcedureDateRange(selectedProcedureDateRange);
	}

	return (
		<div className="flex min-w-0 flex-col">
			<div className="flex items-center gap-3">
				<ProcedureDateFieldPlaceholder value={draftProcedureDateRange?.from} label="Start date" />
				<RiArrowRightLine className="size-5 shrink-0 text-gray-400" aria-hidden="true" />
				<ProcedureDateFieldPlaceholder value={draftProcedureDateRange?.to} label="End date" />
			</div>

			<Calendar
				mode="range"
				selected={draftProcedureDateRange}
				onSelect={(nextDraftProcedureDateRange) => {
					setDraftProcedureDateRange(nextDraftProcedureDateRange);
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
						setDraftProcedureDateRange(undefined);
						onDateRangeApply("", "");
					}}
				>
					Reset
				</Button>
				<Button
					type="button"
					className="min-w-40 flex-1 text-sm"
					disabled={!draftProcedureDateRange?.from || !draftProcedureDateRange?.to || isPending}
					onClick={() => {
						if (!draftProcedureDateRange?.from || !draftProcedureDateRange?.to) return;

						onDateRangeApply(
							formatUrlDate(draftProcedureDateRange.from),
							formatUrlDate(draftProcedureDateRange.to),
						);
					}}
				>
					Apply
				</Button>
			</div>
		</div>
	);
}

function ProcedureDatePresetButton({
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

function ProcedureDateFieldPlaceholder({ label, value }: { label: string; value?: Date }) {
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

function isSameDateRange(range: DateRange | undefined, presetRange: ProcedureDateCompleteRange) {
	if (!range?.from || !range.to) return false;

	return isSameDay(range.from, presetRange.from) && isSameDay(range.to, presetRange.to);
}

function formatUrlDate(date: Date) {
	return format(date, "yyyy-MM-dd");
}

function formatProcedureFilterValue(value: string) {
	return value.charAt(0).toUpperCase() + value.slice(1);
}

async function fetchPatientProcedureDetails(selectedProcedureId: string) {
	const response = await fetch(
		`/api/patient-procedure-details/${encodeURIComponent(selectedProcedureId)}`,
	);

	if (!response.ok) {
		throw new Error("Unable to load procedure details.");
	}

	const result = (await response.json()) as { procedure: ProcedureDetailsType | null };

	return result.procedure;
}

function getProceduresColumns({
	onViewProcedureDetails,
}: {
	onViewProcedureDetails: (procedureId: string) => void;
}): ColumnDef<ProcedureType>[] {
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
			header: "Procedure",
			accessorKey: "procedure",
			enableSorting: true,
			cell: ({ row }) => (
				<span className="font-medium text-gray-800">{row.original.procedure}</span>
			),
		},
		{
			header: "Procedure ID",
			accessorKey: "procedureId",
			enableSorting: false,
			cell: ({ row }) => <CopyIdButton id={row.original.procedureId} />,
		},
		{
			id: "createdAt",
			header: "Created At",
			accessorFn: (row) => row.createdAtSortValue,
			enableSorting: true,
			cell: ({ row }) => row.original.createdAtLabel,
		},
		{
			header: "Indication",
			accessorKey: "indication",
			enableSorting: true,
			cell: ({ row }) => (
				<span className="block max-w-[18rem] whitespace-normal">{row.original.indication}</span>
			),
		},
		{
			header: "Facility",
			accessorKey: "facility",
			enableSorting: true,
			cell: ({ row }) => (
				<span className="block max-w-[22rem] whitespace-normal">{row.original.facility}</span>
			),
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
			cell: ({ row }) => {
				const canUpdateProcedureStatus = row.original.status === "Pending";

				return (
					<div className="flex justify-end">
						<DropdownMenu>
							<DropdownMenuTrigger
								type="button"
								className="inline-flex size-9 items-center justify-center rounded-md border border-transparent text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
								aria-label={`Open actions for ${row.original.procedure}`}
							>
								<RiMore2Fill className="size-5" aria-hidden />
							</DropdownMenuTrigger>
							<DropdownMenuContent
								align="end"
								className="w-[13.75rem] rounded-xl border-white/20 bg-gray-800 text-sm text-white ring ring-gray-800"
							>
								<DropdownMenuItem
									className="gap-3 rounded-lg text-white focus:bg-white/10 focus:text-white py-2"
									onSelect={() => onViewProcedureDetails(row.original.procedureId)}
								>
									<RiEyeLine className="text-white" />
									<span>View details</span>
								</DropdownMenuItem>
							<DropdownMenuItem className="gap-3 rounded-lg text-white focus:bg-white/10 focus:text-white py-2">
								<RiShare2Line className="text-white" />
								<span>Export</span>
							</DropdownMenuItem>
								{canUpdateProcedureStatus ? (
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
