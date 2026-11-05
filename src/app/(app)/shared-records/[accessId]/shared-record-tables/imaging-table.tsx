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
	RiScan2Line,
} from "@remixicon/react";
import {
	columnVisibilityFeature,
	type ColumnDef,
	flexRender,
	functionalUpdate,
	tableFeatures,
	type SortingState,
	useTable,
	rowSortingFeature,
	columnSizingFeature,
} from "@tanstack/react-table";

import { CopyIdButton } from "@/components/copy-id-button";
import { StatusBadge } from "@/components/status-badge";
import { FilterChip, formatChecklistFilterLabel } from "@/components/filter-chip";
import { ExportButton } from "@/components/export-button";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
import type { ImagingType } from "@/features/patients/types";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { SharedImagingDetailsDrawer } from "./imaging-details-drawer";

const configuredTableFeatures = tableFeatures({
	columnVisibilityFeature,
	rowSortingFeature,
	columnSizingFeature,
});

type ImagingDetailsRequestError = Error & { status?: number };

const ROWS_PER_PAGE_OPTIONS = [14, 28, 42];
const imagingStatusFilterOptions = [
	{ label: "Pending", value: "Pending" },
	{ label: "Completed", value: "Completed" },
	{ label: "Cancelled", value: "Cancelled" },
] as const;
const imagingModalityFilterOptions: {
	label: string;
	value: SharedImagingRow["modality"];
}[] = ["CT", "MRI", "Ultrasound", "X-ray"].map((value) => ({
	label: value,
	value: value as SharedImagingRow["modality"],
}));
export type SharedImagingRow = {
	study: string;
	modality: "CT" | "MRI" | "Ultrasound" | "X-ray";
	region: string;
	impression: string;
	orderedAt: string;
	orderedAtValue: string;
	createdAt: string;
	createdAtValue: string;
	imagingId: string;
	status: "Pending" | "Completed" | "Cancelled";
};

export function SharedImagingTable({
	accessId,
	rows,
	page,
	limit,
	totalPages,
	searchQuery,
	sort,
	order,
	statusFilters,
	modalityFilters,
	orderedFrom,
	orderedTo,
	createdFrom,
	createdTo,
}: {
	accessId: string;
	rows: SharedImagingRow[];
	page: number;
	limit: number;
	totalPages: number;
	searchQuery: string;
	sort: string;
	order: string;
	statusFilters: SharedImagingRow["status"][];
	modalityFilters: SharedImagingRow["modality"][];
	orderedFrom: string;
	orderedTo: string;
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
	const [optimisticModalityFilters, setOptimisticModalityFilters] = useOptimistic(modalityFilters);
	const [optimisticOrderedFrom, setOptimisticOrderedFrom] = useOptimistic(orderedFrom);
	const [optimisticOrderedTo, setOptimisticOrderedTo] = useOptimistic(orderedTo);
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
			nextModalityFilters = optimisticModalityFilters,
			nextOrderedFrom = optimisticOrderedFrom,
			nextOrderedTo = optimisticOrderedTo,
			nextCreatedFrom = optimisticCreatedFrom,
			nextCreatedTo = optimisticCreatedTo,
		}: {
			nextPage?: number;
			nextSort?: string;
			nextOrder?: string;
			nextLimit?: number;
			nextQuery?: string;
			nextStatusFilters?: SharedImagingRow["status"][];
			nextModalityFilters?: SharedImagingRow["modality"][];
			nextOrderedFrom?: string;
			nextOrderedTo?: string;
			nextCreatedFrom?: string;
			nextCreatedTo?: string;
		},
		{ replace = false }: { replace?: boolean } = {},
	) {
		const values = {
			imagingPage: nextPage === 1 ? "" : String(nextPage),
			imagingSort: nextSort,
			imagingOrder: nextSort ? nextOrder : "",
			imagingLimit: nextLimit === 14 ? "" : String(nextLimit),
			imagingQuery: nextQuery,
			imagingStatus: nextStatusFilters.join(","),
			imagingModality: nextModalityFilters.join(","),
			imagingOrderedFrom: nextOrderedFrom,
			imagingOrderedTo: nextOrderedTo,
			imagingCreatedFrom: nextCreatedFrom,
			imagingCreatedTo: nextCreatedTo,
		};

		startTransition(() => {
			setNavigatedQuery(nextQuery);
			setOptimisticQuery(nextQuery);
			setOptimisticPage(nextPage);
			setOptimisticSort(nextSort);
			setOptimisticOrder(nextOrder);
			setOptimisticLimit(nextLimit);
			setOptimisticStatusFilters(nextStatusFilters);
			setOptimisticModalityFilters(nextModalityFilters);
			setOptimisticOrderedFrom(nextOrderedFrom);
			setOptimisticOrderedTo(nextOrderedTo);
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
	function handleStatusFiltersChange(nextStatusFilters: SharedImagingRow["status"][]) {
		navigateTable({ nextStatusFilters });
	}
	function handleModalityFiltersChange(nextModalityFilters: SharedImagingRow["modality"][]) {
		navigateTable({ nextModalityFilters });
	}
	function handleOrderedRangeApply(nextOrderedFrom: string, nextOrderedTo: string) {
		navigateTable({ nextOrderedFrom, nextOrderedTo });
	}
	function handleCreatedRangeApply(nextCreatedFrom: string, nextCreatedTo: string) {
		navigateTable({ nextCreatedFrom, nextCreatedTo });
	}
	function handleFiltersClear() {
		navigateTable({
			nextStatusFilters: [],
			nextModalityFilters: [],
			nextOrderedFrom: "",
			nextOrderedTo: "",
			nextCreatedFrom: "",
			nextCreatedTo: "",
		});
	}
	const router = useRouter();
	const [isDetailsDrawerOpen, setIsDetailsDrawerOpen] = useState(false);
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const imagingDetailsQuery = useSWR(
		isDetailsDrawerOpen && selectedId
			? (["shared-imaging-details", accessId, selectedId] as const)
			: null,
		([, accessId, selectedId]) => fetchSharedImagingDetails(accessId, selectedId),
		{
			dedupingInterval: 0,
			onError: (error: ImagingDetailsRequestError) => {
				if (error.status === 401) {
					router.refresh();
				}
			},
			shouldRetryOnError: (error: ImagingDetailsRequestError) => error.status !== 401,
		},
	);
	function handleViewImagingDetails(imagingId: string) {
		setSelectedId(imagingId);
		setIsDetailsDrawerOpen(true);
	}
	const columns = useMemo<ColumnDef<typeof configuredTableFeatures, SharedImagingRow>[]>(
		() => [
			{
				id: "select",
				header: () => <Checkbox aria-label="Select all imaging studies" disabled />,
				cell: ({ row }) => <Checkbox aria-label={`Select ${row.original.study}`} disabled />,
				enableSorting: false,
				size: 40,
			},
			{
				header: "Study",
				accessorKey: "study",
				enableSorting: true,
				cell: ({ row }) => <span className="font-medium">{row.original.study}</span>,
			},
			{ header: "Modality", accessorKey: "modality", enableSorting: true },
			{ header: "Region", accessorKey: "region", enableSorting: true },
			{ header: "Impression", accessorKey: "impression", enableSorting: true },
			{ header: "Ordered At", accessorKey: "orderedAt", enableSorting: true },
			{
				header: "Imaging ID",
				accessorKey: "imagingId",
				enableSorting: false,
				cell: ({ row }) => <CopyIdButton id={row.original.imagingId} />,
			},
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
					<RowMenu onViewDetails={() => handleViewImagingDetails(row.original.imagingId)} />
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

	const fitsOnSmallestPage =
		totalPages === 1 && table.getRowModel().rows.length <= ROWS_PER_PAGE_OPTIONS[0];

	return (
		<div>
			<h2 className="text-lg font-semibold text-gray-900">Imaging</h2>
			<div className="mt-4 mb-4 flex flex-wrap items-center gap-2">
				<div className="relative min-w-0 grow-[999] basis-80">
					<RiSearchLine className="size-4 pointer-events-none absolute bottom-0 left-2 flex h-full items-center justify-center text-gray-400" />
					<Input
						type="search"
						value={query}
						onChange={(event) => handleQueryChange(event.target.value)}
						placeholder="Search by study, modality, region, impression, or imaging ID"
						className="pl-8"
					/>
				</div>
				<div className="flex grow flex-wrap items-center gap-2 max-md:w-full">
					<FilterGroup
						activeFilterCount={
							(optimisticStatusFilters.length > 0 ? 1 : 0) +
							(optimisticModalityFilters.length > 0 ? 1 : 0) +
							(optimisticOrderedFrom || optimisticOrderedTo ? 1 : 0) +
							(optimisticCreatedFrom || optimisticCreatedTo ? 1 : 0)
						}
					>
						<FilterPopover label="Status" icon={RiCheckboxCircleLine}>
							<CheckboxFilterList
								name="shared-imaging-status"
								options={imagingStatusFilterOptions}
								selectedValues={optimisticStatusFilters}
								onSelectedValuesChange={handleStatusFiltersChange}
							/>
						</FilterPopover>
						<FilterPopover label="Modality" icon={RiScan2Line}>
							<CheckboxFilterList
								name="shared-imaging-modality"
								options={imagingModalityFilterOptions}
								selectedValues={optimisticModalityFilters}
								onSelectedValuesChange={handleModalityFiltersChange}
							/>
						</FilterPopover>
						<DateFilterMenu
							label="Ordered at"
							icon={RiCalendarLine}
							from={optimisticOrderedFrom}
							to={optimisticOrderedTo}
							onDateRangeApply={handleOrderedRangeApply}
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
			optimisticModalityFilters.length > 0 ||
			optimisticOrderedFrom ||
			optimisticOrderedTo ||
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
					{optimisticModalityFilters.length > 0 ? (
						<FilterChip
							name="Modality"
							value={formatChecklistFilterLabel(optimisticModalityFilters)}
							onRemove={() => handleModalityFiltersChange([])}
						/>
					) : null}
					{optimisticOrderedFrom || optimisticOrderedTo ? (
						<FilterChip
							name="Ordered"
							value={formatDateRangeFilterLabel(optimisticOrderedFrom, optimisticOrderedTo)}
							onRemove={() => handleOrderedRangeApply("", "")}
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
								<TableRow
									key={row.id}
									role="button"
									tabIndex={0}
									onClick={() => handleViewImagingDetails(row.original.imagingId)}
									onKeyDown={(event) => {
										if (event.key === "Enter" || event.key === " ") {
											event.preventDefault();
											handleViewImagingDetails(row.original.imagingId);
										}
									}}
									className="cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gray-400"
								>
									{row.getVisibleCells().map((cell) => (
										<TableCell key={cell.id}>
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
									No matching imaging studies found.
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
				)}
			</div>
			<SharedImagingDetailsDrawer
				open={isDetailsDrawerOpen}
				onOpenChange={setIsDetailsDrawerOpen}
				imaging={imagingDetailsQuery.data ?? null}
				isLoading={imagingDetailsQuery.isLoading}
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
				aria-label="Open imaging actions"
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

async function fetchSharedImagingDetails(accessId: string, imagingId: string) {
	const response = await fetch(
		`/api/shared-imaging-details/${encodeURIComponent(accessId)}/${encodeURIComponent(imagingId)}`,
	);

	if (!response.ok) {
		throw Object.assign(new Error("Unable to load imaging details."), {
			status: response.status,
		});
	}

	const result = (await response.json()) as { imaging: ImagingType | null };

	return result.imaging;
}

function CheckboxFilterList<TValue extends string>({
	name,
	options,
	selectedValues,
	onSelectedValuesChange,
}: {
	name: string;
	options: readonly { label: string; value: TValue }[];
	selectedValues: TValue[];
	onSelectedValuesChange: (values: TValue[]) => void;
}) {
	return options.map((option) => {
		const selected = selectedValues.includes(option.value);
		const id = `${name}-${option.value}`;
		return (
			<Label
				key={option.value}
				htmlFor={id}
				className="flex h-8 w-full cursor-pointer items-center gap-3 rounded-lg px-2 leading-normal font-normal hover:bg-gray-100"
			>
				<Checkbox
					id={id}
					checked={selected}
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
		);
	});
}
