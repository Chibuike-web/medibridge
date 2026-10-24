"use client";

import {
	DateRangeMenuItems,
	SetDateRangeDialog,
	type DateRangeFilter,
} from "@/components/date-range-filter";
import { useMemo, useOptimistic, useState, useTransition } from "react";
import {
	RiArrowDownSLine,
	RiArrowUpSLine,
	RiShare2Line,
	RiEyeLine,
	RiFilter3Line,
	RiMore2Fill,
	RiSearchLine,
	RiCloseLine,
	RiCalendarLine,
	RiCheckboxCircleLine,
} from "@remixicon/react";
import {
	type ColumnDef,
	flexRender,
	createSortedRowModel,
	stockFeatures,
	sortFns,
	tableFeatures,
	type SortingState,
	useTable,
} from "@tanstack/react-table";

const configuredTableFeatures = tableFeatures({
	...stockFeatures,
	sortFns,
	sortedRowModel: createSortedRowModel(),
});
import { CopyIdButton } from "@/components/copy-id-button";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
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
import { format } from "date-fns";
import { useTableUrlNavigation } from "@/features/patients/components/table-url-navigation";
import { useDebouncedCallback } from "@/hooks/use-debounced";

const ROWS_PER_PAGE_OPTIONS = [14, 28, 42];
type ProcedureFilterSubmenu = "status" | "created-at";
const procedureStatusFilterOptions = [
	{ label: "Pending", value: "Pending" },
	{ label: "Completed", value: "Completed" },
	{ label: "Cancelled", value: "Cancelled" },
] as const;
export type SharedProcedureRow = {
	procedure: string;
	indication: string;
	facility: string;
	procedureId: string;
	createdAt: string;
	createdAtValue: string;
	status: "Pending" | "Completed" | "Cancelled";
};

export function SharedProceduresTable({
	rows,
	page,
	limit,
	totalPages,
	searchQuery,
	statusFilters,
	createdFrom,
	createdTo,
}: {
	rows: SharedProcedureRow[];
	page: number;
	limit: number;
	totalPages: number;
	searchQuery: string;
	statusFilters: SharedProcedureRow["status"][];
	createdFrom: string;
	createdTo: string;
}) {
	const navigateTableUrl = useTableUrlNavigation();
	const [optimisticPage, setOptimisticPage] = useOptimistic(page);
	const [optimisticLimit, setOptimisticLimit] = useOptimistic(limit);
	const [query, setQuery] = useState(searchQuery);
	const [previousSearchQuery, setPreviousSearchQuery] = useState(searchQuery);
	const [navigatedQuery, setNavigatedQuery] = useState<string | null>(null);
	const [optimisticQuery, setOptimisticQuery] = useOptimistic(searchQuery);
	const [optimisticStatusFilters, setOptimisticStatusFilters] = useOptimistic(statusFilters);
	const [optimisticCreatedFrom, setOptimisticCreatedFrom] = useOptimistic(createdFrom);
	const [optimisticCreatedTo, setOptimisticCreatedTo] = useOptimistic(createdTo);
	const [activeFilterSubmenu, setActiveFilterSubmenu] = useState<ProcedureFilterSubmenu | null>(
		null,
	);
	const [isPending, startTransition] = useTransition();
	const [sorting, setSorting] = useState<SortingState>([{ id: "procedure", desc: false }]);

	// Restore URL changes while preserving typing ahead of our pending search.
	if (previousSearchQuery !== searchQuery) {
		setPreviousSearchQuery(searchQuery);
		setNavigatedQuery(null);
		if (searchQuery !== navigatedQuery) setQuery(searchQuery);
	}

	function navigateTable(
		{
			nextPage = 1,
			nextLimit = optimisticLimit,
			nextQuery = query,
			nextStatusFilters = optimisticStatusFilters,
			nextCreatedFrom = optimisticCreatedFrom,
			nextCreatedTo = optimisticCreatedTo,
		}: {
			nextPage?: number;
			nextLimit?: number;
			nextQuery?: string;
			nextStatusFilters?: SharedProcedureRow["status"][];
			nextCreatedFrom?: string;
			nextCreatedTo?: string;
		},
		{ replace = false }: { replace?: boolean } = {},
	) {
		const values = {
			proceduresPage: nextPage === 1 ? "" : String(nextPage),
			proceduresLimit: nextLimit === 14 ? "" : String(nextLimit),
			proceduresQuery: nextQuery,
			proceduresStatus: nextStatusFilters.join(","),
			proceduresCreatedFrom: nextCreatedFrom,
			proceduresCreatedTo: nextCreatedTo,
		};

		startTransition(() => {
			setNavigatedQuery(nextQuery);
			setOptimisticQuery(nextQuery);
			setOptimisticPage(nextPage);
			setOptimisticLimit(nextLimit);
			setOptimisticStatusFilters(nextStatusFilters);
			setOptimisticCreatedFrom(nextCreatedFrom);
			setOptimisticCreatedTo(nextCreatedTo);
			navigateTableUrl(values, { replace });
		});
	}

	const debouncedSearch = useDebouncedCallback((nextQuery: string) => {
		if (nextQuery !== query || nextQuery === optimisticQuery) return;
		navigateTable({ nextQuery }, { replace: true });
	}, 300);

	function handleQueryChange(nextQuery: string) {
		setQuery(nextQuery);
		debouncedSearch(nextQuery);
	}
	function handleStatusFiltersChange(nextStatusFilters: SharedProcedureRow["status"][]) {
		navigateTable({ nextStatusFilters });
	}
	function handleCreatedAtRangeApply(nextCreatedFrom: string, nextCreatedTo: string) {
		navigateTable({ nextCreatedFrom, nextCreatedTo });
	}
	function handleFiltersClear() {
		navigateTable({
			nextStatusFilters: [],
			nextCreatedFrom: "",
			nextCreatedTo: "",
		});
	}
	const columns = useMemo<ColumnDef<typeof configuredTableFeatures, SharedProcedureRow>[]>(
		() => [
			{
				id: "select",
				header: () => <Checkbox aria-label="Select all procedures" disabled />,
				cell: ({ row }) => <Checkbox aria-label={`Select ${row.original.procedure}`} disabled />,
				enableSorting: false,
				size: 40,
			},
			{
				header: "Procedure",
				accessorKey: "procedure",
				enableSorting: true,
				cell: ({ row }) => <span className="font-medium">{row.original.procedure}</span>,
			},
			{ header: "Indication", accessorKey: "indication", enableSorting: true },
			{ header: "Facility", accessorKey: "facility", enableSorting: true },
			{
				header: "Procedure ID",
				accessorKey: "procedureId",
				enableSorting: false,
				cell: ({ row }) => <CopyIdButton id={row.original.procedureId} />,
			},
			{ header: "Created At", accessorKey: "createdAt", enableSorting: true },
			{
				header: "Status",
				accessorKey: "status",
				enableSorting: true,
				cell: ({ row }) => <StatusBadge status={row.original.status} />,
			},
			{
				id: "actions",
				header: "",
				cell: () => <RowMenu />,
				enableSorting: false,
				size: 40,
			},
		],
		[],
	);
	const table = useTable({
		features: configuredTableFeatures,
		data: rows,
		columns,
		onSortingChange: setSorting,
		state: { sorting },
	});
	return (
		<div>
			<h2 className="text-lg font-semibold text-gray-900">Procedures</h2>
			<div className="mt-7 mb-4 flex items-center gap-2">
				<div className="relative min-w-0 flex-1">
					<RiSearchLine className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-gray-400" />
					<Input
						type="search"
						value={query}
						onChange={(event) => handleQueryChange(event.target.value)}
						placeholder="Search by procedure, indication, facility, or procedure ID"
						className="pl-10"
					/>
				</div>
				<ProcedureFilterMenu
					activeFilterSubmenu={activeFilterSubmenu}
					statusFilters={optimisticStatusFilters}
					createdFrom={optimisticCreatedFrom}
					createdTo={optimisticCreatedTo}
					isPending={isPending}
					onActiveFilterSubmenuChange={setActiveFilterSubmenu}
					onStatusFiltersChange={handleStatusFiltersChange}
					onCreatedAtRangeApply={handleCreatedAtRangeApply}
				/>
				<Button type="button" variant="outline" className="bg-white text-gray-600 hover:bg-gray-50">
					<RiShare2Line aria-hidden="true" />
					Export
				</Button>
			</div>
			{optimisticStatusFilters.length > 0 || optimisticCreatedFrom || optimisticCreatedTo ? (
				<div className="mb-4 flex items-start gap-4">
					<div className="flex flex-1 flex-wrap gap-2">
						{optimisticStatusFilters.map((status) => (
							<FilterPill
								key={status}
								label={`Status: ${status}`}
								onRemove={() =>
									handleStatusFiltersChange(
										optimisticStatusFilters.filter((value) => value !== status),
									)
								}
							/>
						))}
						{optimisticCreatedFrom || optimisticCreatedTo ? (
							<FilterPill
								label={`Created: ${formatDateRangeFilterLabel(optimisticCreatedFrom, optimisticCreatedTo)}`}
								onRemove={() => handleCreatedAtRangeApply("", "")}
							/>
						) : null}
					</div>
					<Button
						type="button"
						variant="ghost"
						size="sm"
						className="h-8.5 text-gray-600"
						onClick={handleFiltersClear}
					>
						Clear all
					</Button>
				</div>
			) : null}
			<div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
				<Table aria-busy={isPending}>
					<TableHeader>
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow key={headerGroup.id} className="bg-gray-50 hover:bg-gray-50">
								{headerGroup.headers.map((header) => (
									<TableHead
										key={header.id}
										style={{ width: header.getSize() }}
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
											"h-10 whitespace-nowrap bg-gray-50 px-3 py-0 text-gray-600",
											header.column.getCanSort() &&
												"cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gray-400",
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
														aria-hidden="true"
													/>
													<RiArrowDownSLine
														className={cn(
															"size-4 text-gray-800",
															header.column.getIsSorted() === "asc" ? "opacity-30" : "",
														)}
														aria-hidden="true"
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
						className="transition-opacity data-[pending=true]:opacity-80 data-[pending=true]:delay-150"
					>
						{table.getRowModel().rows.length > 0 ? (
							table.getRowModel().rows.map((row) => (
								<TableRow key={row.id}>
									{row.getVisibleCells().map((cell) => (
										<TableCell key={cell.id}>
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
									No matching procedures found.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
				<div className="flex items-center justify-between gap-3 border-t border-gray-200 bg-white p-3 text-sm text-gray-500">
					<div className="flex items-center gap-3">
						<span>Rows per page</span>
						<Select
							value={String(optimisticLimit)}
							onValueChange={(value) => navigateTable({ nextLimit: Number(value) })}
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
							Page {optimisticPage} of {totalPages}
						</span>
						<div className="flex items-center gap-2">
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={() => navigateTable({ nextPage: Math.max(optimisticPage - 1, 1) })}
								disabled={optimisticPage <= 1 || isPending}
								className="text-gray-700 shadow-none"
							>
								Previous
							</Button>
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={() =>
									navigateTable({ nextPage: Math.min(optimisticPage + 1, totalPages) })
								}
								disabled={optimisticPage >= totalPages || isPending}
								className="text-gray-700 shadow-none"
							>
								Next
							</Button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

function ProcedureFilterMenu({
	activeFilterSubmenu,
	statusFilters,
	createdFrom,
	createdTo,
	isPending,
	onActiveFilterSubmenuChange,
	onStatusFiltersChange,
	onCreatedAtRangeApply,
}: {
	activeFilterSubmenu: ProcedureFilterSubmenu | null;
	statusFilters: SharedProcedureRow["status"][];
	createdFrom: string;
	createdTo: string;
	isPending: boolean;
	onActiveFilterSubmenuChange: (submenu: ProcedureFilterSubmenu | null) => void;
	onStatusFiltersChange: (values: SharedProcedureRow["status"][]) => void;
	onCreatedAtRangeApply: (from: string, to: string) => void;
}) {
	const [customDateRangeFilter, setCustomDateRangeFilter] = useState<DateRangeFilter | null>(null);

	return (
		<>
			<DropdownMenu
				onOpenChange={(open) => {
					if (!open) onActiveFilterSubmenuChange(null);
				}}
			>
				<DropdownMenuTrigger asChild>
					<Button
						type="button"
						variant="outline"
						className="bg-white text-gray-600 hover:bg-gray-50"
					>
						<RiFilter3Line aria-hidden="true" />
						Filter
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent
					align="end"
					className="w-[13.75rem] rounded-xl bg-white text-sm text-gray-700"
				>
					<DropdownMenuSub
						open={activeFilterSubmenu === "status"}
						onOpenChange={(open) => onActiveFilterSubmenuChange(open ? "status" : null)}
					>
						<DropdownMenuSubTrigger className="rounded-lg py-2 focus:bg-gray-100 focus:text-gray-900 data-[state=open]:bg-gray-100">
							<RiCheckboxCircleLine className="size-4" />
							<span className="flex-1">Status</span>
						</DropdownMenuSubTrigger>
						<DropdownMenuSubContent
							alignOffset={-5}
							className="w-[13.75rem] rounded-xl bg-white p-1 text-sm text-gray-700"
						>
							<CheckboxFilterList
								name="shared-procedure-status"
								options={procedureStatusFilterOptions}
								selectedValues={statusFilters}
								isPending={isPending}
								onSelectedValuesChange={onStatusFiltersChange}
							/>
						</DropdownMenuSubContent>
					</DropdownMenuSub>
					<DropdownMenuSub
						open={activeFilterSubmenu === "created-at"}
						onOpenChange={(open) => onActiveFilterSubmenuChange(open ? "created-at" : null)}
					>
						<DropdownMenuSubTrigger className="rounded-lg py-2 focus:bg-gray-100 focus:text-gray-900 data-[state=open]:bg-gray-100">
							<RiCalendarLine className="size-4" />
							<span className="flex-1">Created at</span>
						</DropdownMenuSubTrigger>
						<DropdownMenuSubContent
							alignOffset={-5}
							className="w-[13.75rem] rounded-xl bg-white p-1 text-sm text-gray-700"
						>
							<DateRangeMenuItems
								from={createdFrom}
								to={createdTo}
								onDateRangeApply={onCreatedAtRangeApply}
								onCustomDateRangeSelect={setCustomDateRangeFilter}
							/>
						</DropdownMenuSubContent>
					</DropdownMenuSub>
				</DropdownMenuContent>
			</DropdownMenu>
			<SetDateRangeDialog
				dateRangeFilter={customDateRangeFilter}
				onClose={() => setCustomDateRangeFilter(null)}
			/>
		</>
	);
}

function FilterPill({ label, onRemove }: { label: string; onRemove: () => void }) {
	return (
		<span className="inline-flex items-center gap-3 rounded-full border border-gray-200 bg-gray-100 py-1.5 pr-1.5 pl-3 text-sm font-medium text-gray-600 shadow-xs">
			<span>{label}</span>
			<Button
				size="icon"
				type="button"
				onClick={onRemove}
				className="flex size-5 rounded-full text-white hover:bg-gray-500 focus-visible:ring-2 focus-visible:ring-gray-300"
				aria-label={`Remove ${label} filter`}
			>
				<RiCloseLine className="size-4" aria-hidden="true" />
			</Button>
		</span>
	);
}

function CheckboxFilterList<TValue extends string>({
	name,
	options,
	selectedValues,
	isPending,
	onSelectedValuesChange,
}: {
	name: string;
	options: readonly { label: string; value: TValue }[];
	selectedValues: TValue[];
	isPending: boolean;
	onSelectedValuesChange: (values: TValue[]) => void;
}) {
	return options.map((option) => {
		const selected = selectedValues.includes(option.value);
		const id = `${name}-${option.value}`;
		return (
			<DropdownMenuItem
				key={option.value}
				className="rounded-lg p-0 focus:bg-gray-100 focus:text-gray-900"
				onSelect={(event) => event.preventDefault()}
			>
				<Label
					htmlFor={id}
					className="flex w-full cursor-pointer items-center gap-3 px-2 py-2 leading-normal font-normal"
				>
					<Checkbox
						id={id}
						checked={selected}
						disabled={isPending}
						onCheckedChange={(checked) =>
							onSelectedValuesChange(
								checked === true
									? [...selectedValues, option.value]
									: selectedValues.filter((value) => value !== option.value),
							)
						}
						className="[&_svg]:!text-current"
					/>
					<span>{option.label}</span>
				</Label>
			</DropdownMenuItem>
		);
	});
}
function formatDateRangeFilterLabel(from: string, to: string) {
	const fromDate = parseDateParam(from);
	const toDate = parseDateParam(to);
	if (fromDate && toDate)
		return `${format(fromDate, "MMM d, yyyy")} - ${format(toDate, "MMM d, yyyy")}`;
	if (fromDate) return `From ${format(fromDate, "MMM d, yyyy")}`;
	if (toDate) return `Until ${format(toDate, "MMM d, yyyy")}`;
	return "Any date";
}
function RowMenu() {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				type="button"
				className="inline-flex size-9 items-center justify-center rounded-md border border-transparent text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
				aria-label="Open procedure actions"
			>
				<RiMore2Fill className="size-5" aria-hidden="true" />
			</DropdownMenuTrigger>
			<DropdownMenuContent
				align="end"
				className="w-50 rounded-xl border-white/20 bg-gray-800 text-sm text-white ring ring-gray-800"
			>
				<DropdownMenuItem className="rounded-lg text-white focus:bg-white/10 focus:text-white py-2">
					<RiEyeLine className="text-white" aria-hidden="true" />
					<span>View details</span>
				</DropdownMenuItem>
				<DropdownMenuItem className="rounded-lg text-white focus:bg-white/10 focus:text-white py-2">
					<RiShare2Line className="text-white" aria-hidden="true" />
					<span>Export</span>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
