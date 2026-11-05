"use client";

import { DateFilterMenu, FilterGroup, FilterPopover } from "@/components/filter-menu";

import { SetDateRangeDialog, type DateRangeFilter } from "@/components/date-range-filter";
import { useMemo, useOptimistic, useState, useTransition } from "react";
import {
	RiArrowDownSLine,
	RiArrowUpSLine,
	RiShare2Line,
	RiEyeLine,
	RiMore2Fill,
	RiSearchLine,
	RiCalendarLine,
	RiCheckboxCircleLine,
	RiHistoryLine,
	RiPulseLine,
} from "@remixicon/react";
import {
	type ColumnDef,
	flexRender,
	functionalUpdate,
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
import { format } from "date-fns";
import { useTableUrlNavigation } from "@/features/patients/components/table-url-navigation";
import { useDebouncedCallback } from "@/hooks/use-debounced";
import type { DiagnosisDetailsType } from "@/features/patients/types";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { SharedDiagnosisDetailsDrawer } from "./diagnosis-details-drawer";

type DiagnosisDetailsRequestError = Error & { status?: number };

const ROWS_PER_PAGE_OPTIONS = [14, 28, 42];
const diagnosisStatusFilterOptions = [
	{ label: "Active", value: "Active" },
	{ label: "Resolved", value: "Resolved" },
] as const;
export type SharedDiagnosisRow = {
	name: string;
	diagnosedAt: string;
	diagnosedAtValue: string;
	lastReviewed: string;
	lastReviewedValue: string;
	diagnosisId: string;
	createdAt: string;
	createdAtValue: string;
	status: "Active" | "Resolved";
};

export function SharedDiagnosesTable({
	accessId,
	rows,
	page,
	limit,
	totalPages,
	searchQuery,
	sort,
	order,
	statusFilters,
	diagnosedFrom,
	diagnosedTo,
	reviewedFrom,
	reviewedTo,
	createdFrom,
	createdTo,
}: {
	accessId: string;
	rows: SharedDiagnosisRow[];
	page: number;
	limit: number;
	totalPages: number;
	searchQuery: string;
	sort: string;
	order: string;
	statusFilters: SharedDiagnosisRow["status"][];
	diagnosedFrom: string;
	diagnosedTo: string;
	reviewedFrom: string;
	reviewedTo: string;
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
	const [optimisticDiagnosedFrom, setOptimisticDiagnosedFrom] = useOptimistic(diagnosedFrom);
	const [optimisticDiagnosedTo, setOptimisticDiagnosedTo] = useOptimistic(diagnosedTo);
	const [optimisticReviewedFrom, setOptimisticReviewedFrom] = useOptimistic(reviewedFrom);
	const [optimisticReviewedTo, setOptimisticReviewedTo] = useOptimistic(reviewedTo);
	const [optimisticCreatedFrom, setOptimisticCreatedFrom] = useOptimistic(createdFrom);
	const [optimisticCreatedTo, setOptimisticCreatedTo] = useOptimistic(createdTo);
	const [customDateRangeFilter, setCustomDateRangeFilter] = useState<DateRangeFilter | null>(null);
	const [isPending, startTransition] = useTransition();
	const [optimisticSort, setOptimisticSort] = useOptimistic(sort);
	const [optimisticOrder, setOptimisticOrder] = useOptimistic(order);
	const sorting: SortingState = optimisticSort
		? [{ id: optimisticSort, desc: optimisticOrder === "desc" }]
		: [];

	// Restore URL changes while preserving typing ahead of our pending search.
	if (previousSearchQuery !== searchQuery) {
		setPreviousSearchQuery(searchQuery);
		setNavigatedQuery(null);
		if (searchQuery !== navigatedQuery) setQuery(searchQuery);
	}

	function navigateTable(
		{
			nextPage = 1,
			nextSort = optimisticSort,
			nextOrder = optimisticOrder,
			nextLimit = optimisticLimit,
			nextQuery = query,
			nextStatusFilters = optimisticStatusFilters,
			nextDiagnosedFrom = optimisticDiagnosedFrom,
			nextDiagnosedTo = optimisticDiagnosedTo,
			nextReviewedFrom = optimisticReviewedFrom,
			nextReviewedTo = optimisticReviewedTo,
			nextCreatedFrom = optimisticCreatedFrom,
			nextCreatedTo = optimisticCreatedTo,
		}: {
			nextPage?: number;
			nextSort?: string;
			nextOrder?: string;
			nextLimit?: number;
			nextQuery?: string;
			nextStatusFilters?: SharedDiagnosisRow["status"][];
			nextDiagnosedFrom?: string;
			nextDiagnosedTo?: string;
			nextReviewedFrom?: string;
			nextReviewedTo?: string;
			nextCreatedFrom?: string;
			nextCreatedTo?: string;
		},
		{ replace = false }: { replace?: boolean } = {},
	) {
		const values = {
			diagnosesPage: nextPage === 1 ? "" : String(nextPage),
			diagnosesSort: nextSort,
			diagnosesOrder: nextSort ? nextOrder : "",
			diagnosesLimit: nextLimit === 14 ? "" : String(nextLimit),
			diagnosesQuery: nextQuery,
			diagnosesStatus: nextStatusFilters.join(","),
			diagnosesDiagnosedFrom: nextDiagnosedFrom,
			diagnosesDiagnosedTo: nextDiagnosedTo,
			diagnosesReviewedFrom: nextReviewedFrom,
			diagnosesReviewedTo: nextReviewedTo,
			diagnosesCreatedFrom: nextCreatedFrom,
			diagnosesCreatedTo: nextCreatedTo,
		};

		startTransition(() => {
			setNavigatedQuery(nextQuery);
			setOptimisticQuery(nextQuery);
			setOptimisticPage(nextPage);
			setOptimisticSort(nextSort);
			setOptimisticOrder(nextOrder);
			setOptimisticLimit(nextLimit);
			setOptimisticStatusFilters(nextStatusFilters);
			setOptimisticDiagnosedFrom(nextDiagnosedFrom);
			setOptimisticDiagnosedTo(nextDiagnosedTo);
			setOptimisticReviewedFrom(nextReviewedFrom);
			setOptimisticReviewedTo(nextReviewedTo);
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
	function handleStatusFiltersChange(nextStatusFilters: SharedDiagnosisRow["status"][]) {
		navigateTable({ nextStatusFilters });
	}
	function handleDiagnosedRangeApply(nextDiagnosedFrom: string, nextDiagnosedTo: string) {
		navigateTable({ nextDiagnosedFrom, nextDiagnosedTo });
	}
	function handleReviewedRangeApply(nextReviewedFrom: string, nextReviewedTo: string) {
		navigateTable({ nextReviewedFrom, nextReviewedTo });
	}
	function handleCreatedRangeApply(nextCreatedFrom: string, nextCreatedTo: string) {
		navigateTable({ nextCreatedFrom, nextCreatedTo });
	}
	function handleFiltersClear() {
		navigateTable({
			nextStatusFilters: [],
			nextDiagnosedFrom: "",
			nextDiagnosedTo: "",
			nextReviewedFrom: "",
			nextReviewedTo: "",
			nextCreatedFrom: "",
			nextCreatedTo: "",
		});
	}
	const router = useRouter();
	const [isDetailsDrawerOpen, setIsDetailsDrawerOpen] = useState(false);
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const diagnosisDetailsQuery = useSWR(
		isDetailsDrawerOpen && selectedId
			? (["shared-diagnosis-details", accessId, selectedId] as const)
			: null,
		([, accessId, selectedId]) => fetchSharedDiagnosisDetails(accessId, selectedId),
		{
			dedupingInterval: 0,
			onError: (error: DiagnosisDetailsRequestError) => {
				if (error.status === 401) {
					router.refresh();
				}
			},
			shouldRetryOnError: (error: DiagnosisDetailsRequestError) => error.status !== 401,
		},
	);
	function handleViewDiagnosisDetails(diagnosisId: string) {
		setSelectedId(diagnosisId);
		setIsDetailsDrawerOpen(true);
	}
	const columns = useMemo<ColumnDef<typeof configuredTableFeatures, SharedDiagnosisRow>[]>(
		() => [
			{
				id: "select",
				header: () => <Checkbox aria-label="Select all diagnoses" disabled />,
				cell: ({ row }) => <Checkbox aria-label={`Select ${row.original.name}`} disabled />,
				enableSorting: false,
				size: 40,
			},
			{
				header: "Diagnosis name",
				accessorKey: "name",
				enableSorting: true,
				cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
			},
			{
				header: "Diagnosed At",
				accessorKey: "diagnosedAt",
				enableSorting: true,
			},
			{
				header: "Last Reviewed",
				accessorKey: "lastReviewed",
				enableSorting: true,
			},
			{
				header: "Diagnosis ID",
				accessorKey: "diagnosisId",
				enableSorting: false,
				cell: ({ row }) => <CopyIdButton id={row.original.diagnosisId} />,
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
				cell: ({ row }) => (
					<RowMenu onViewDetails={() => handleViewDiagnosisDetails(row.original.diagnosisId)} />
				),
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
		manualSorting: true,
		onSortingChange: (updater) => {
			const [nextSorting] = functionalUpdate(updater, sorting);
			navigateTable({
				nextSort: nextSorting?.id ?? "",
				nextOrder: nextSorting?.desc ? "desc" : "asc",
			});
		},
		state: { sorting },
	});

	return (
		<div>
			<h2 className="text-lg font-semibold text-gray-900">Diagnoses</h2>
			<div className="mt-7 mb-4 flex flex-wrap items-center gap-2">
				<div className="relative min-w-0 grow-[999] basis-80">
					<RiSearchLine className="size-4 pointer-events-none absolute bottom-0 left-2 flex h-full items-center justify-center text-gray-400" />
					<Input
						type="search"
						value={query}
						onChange={(event) => handleQueryChange(event.target.value)}
						placeholder="Search by diagnosis or diagnosis ID"
						className="pl-8"
					/>
				</div>
				<div className="flex grow flex-wrap items-center gap-2 max-md:w-full">
					<FilterGroup
						activeFilterCount={
							(optimisticStatusFilters.length > 0 ? 1 : 0) +
							(optimisticReviewedFrom || optimisticReviewedTo ? 1 : 0) +
							(optimisticDiagnosedFrom || optimisticDiagnosedTo ? 1 : 0) +
							(optimisticCreatedFrom || optimisticCreatedTo ? 1 : 0)
						}
					>
						<FilterPopover label="Status" icon={RiCheckboxCircleLine}>
							<RadioGroup
								value={optimisticStatusFilters[0] ?? "all"}
								onValueChange={(nextStatusFilter) => {
									handleStatusFiltersChange(
										nextStatusFilter === "all"
											? []
											: [nextStatusFilter as SharedDiagnosisRow["status"]],
									);
								}}
								className="flex flex-col gap-0.5"
							>
								<div className="flex h-8 items-center gap-2 rounded-lg px-2 hover:bg-gray-100">
									<RadioGroupItem value="all" id="shared-diagnosis-status-all" />
									<Label
										htmlFor="shared-diagnosis-status-all"
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
											id={`shared-diagnosis-status-${statusOption.value}`}
										/>
										<Label
											htmlFor={`shared-diagnosis-status-${statusOption.value}`}
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
							from={optimisticReviewedFrom}
							to={optimisticReviewedTo}
							onDateRangeApply={handleReviewedRangeApply}
							onCustomDateRangeSelect={setCustomDateRangeFilter}
						/>
						<DateFilterMenu
							label="Diagnosed At"
							icon={RiPulseLine}
							from={optimisticDiagnosedFrom}
							to={optimisticDiagnosedTo}
							onDateRangeApply={handleDiagnosedRangeApply}
							onCustomDateRangeSelect={setCustomDateRangeFilter}
						/>
						<DateFilterMenu
							label="Created at"
							icon={RiCalendarLine}
							from={optimisticCreatedFrom}
							to={optimisticCreatedTo}
							onDateRangeApply={handleCreatedRangeApply}
							onCustomDateRangeSelect={setCustomDateRangeFilter}
						/>
					</FilterGroup>
					<SetDateRangeDialog
						dateRangeFilter={customDateRangeFilter}
						onClose={() => setCustomDateRangeFilter(null)}
					/>
					<ExportButton />
				</div>
			</div>
			{optimisticStatusFilters.length > 0 ||
			optimisticDiagnosedFrom ||
			optimisticDiagnosedTo ||
			optimisticReviewedFrom ||
			optimisticReviewedTo ||
			optimisticCreatedFrom ||
			optimisticCreatedTo ? (
				<div className="mb-4 flex flex-wrap gap-2">
					{optimisticStatusFilters.length > 0 ? (
						<FilterChip
							name="Status"
							value={formatChecklistFilterLabel(optimisticStatusFilters)}
							onRemove={() => handleStatusFiltersChange([])}
						/>
					) : null}
					{optimisticDiagnosedFrom || optimisticDiagnosedTo ? (
						<FilterChip
							name="Diagnosed"
							value={formatDateRangeFilterLabel(optimisticDiagnosedFrom, optimisticDiagnosedTo)}
							onRemove={() => handleDiagnosedRangeApply("", "")}
						/>
					) : null}
					{optimisticReviewedFrom || optimisticReviewedTo ? (
						<FilterChip
							name="Reviewed"
							value={formatDateRangeFilterLabel(optimisticReviewedFrom, optimisticReviewedTo)}
							onRemove={() => handleReviewedRangeApply("", "")}
						/>
					) : null}
					{optimisticCreatedFrom || optimisticCreatedTo ? (
						<FilterChip
							name="Created"
							value={formatDateRangeFilterLabel(optimisticCreatedFrom, optimisticCreatedTo)}
							onRemove={() => handleCreatedRangeApply("", "")}
						/>
					) : null}
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
									No matching diagnoses found.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
				<div className="flex items-center justify-between gap-3 overflow-x-auto border-t border-gray-200 bg-white p-3 text-sm whitespace-nowrap text-gray-500">
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
			<SharedDiagnosisDetailsDrawer
				open={isDetailsDrawerOpen}
				onOpenChange={setIsDetailsDrawerOpen}
				diagnosis={diagnosisDetailsQuery.data ?? null}
				isLoading={diagnosisDetailsQuery.isLoading}
			/>
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
function RowMenu({ onViewDetails }: { onViewDetails: () => void }) {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				type="button"
				className="inline-flex size-9 items-center justify-center rounded-md border border-transparent text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
				aria-label="Open diagnosis actions"
			>
				<RiMore2Fill className="size-5" aria-hidden="true" />
			</DropdownMenuTrigger>
			<DropdownMenuContent
				align="end"
				className="w-50 rounded-xl border-white/20 bg-gray-800 text-sm text-white ring ring-gray-800"
			>
				<DropdownMenuItem
					className="rounded-lg text-white focus:bg-white/10 focus:text-white py-2"
					onSelect={onViewDetails}
				>
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

async function fetchSharedDiagnosisDetails(accessId: string, diagnosisId: string) {
	const response = await fetch(
		`/api/shared-diagnosis-details/${encodeURIComponent(accessId)}/${encodeURIComponent(diagnosisId)}`,
	);

	if (!response.ok) {
		throw Object.assign(new Error("Unable to load diagnosis details."), {
			status: response.status,
		});
	}

	const result = (await response.json()) as { diagnosis: DiagnosisDetailsType | null };

	return result.diagnosis;
}
