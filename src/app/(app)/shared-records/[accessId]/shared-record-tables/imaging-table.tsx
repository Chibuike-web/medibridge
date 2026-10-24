"use client";

import {
	DateRangeMenuItems,
	SetDateRangeDialog,
	type DateRangeFilter,
} from "@/components/date-range-filter";
import { useMemo, useRef, useState, useTransition } from "react";
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
	RiScan2Line,
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
import { useDebouncedCallback } from "@/hooks/use-debounced";
import { getSharedImagingTableAction } from "../shared-record-table-actions";

type ImagingFilterSubmenu = "status" | "modality" | "ordered-at" | "created-at";
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
}: {
	accessId: string;
	rows: SharedImagingRow[];
}) {
	const [tableRows, setTableRows] = useState(rows);
	const [recordSearchQuery, setRecordSearchQuery] = useState("");
	const [statusFilters, setStatusFilters] = useState<SharedImagingRow["status"][]>([]);
	const [modalityFilters, setModalityFilters] = useState<SharedImagingRow["modality"][]>([]);
	const [orderedFrom, setOrderedFrom] = useState("");
	const [orderedTo, setOrderedTo] = useState("");
	const [createdFrom, setCreatedFrom] = useState("");
	const [createdTo, setCreatedTo] = useState("");
	const [activeFilterSubmenu, setActiveFilterSubmenu] = useState<ImagingFilterSubmenu | null>(null);
	const [customDateRangeFilter, setCustomDateRangeFilter] = useState<DateRangeFilter | null>(null);
	const [isPending, startTransition] = useTransition();
	const latestRequestIdRef = useRef(0);
	const [sorting, setSorting] = useState<SortingState>([{ id: "study", desc: false }]);
	function refreshTable({
		nextQuery = recordSearchQuery,
		nextStatusFilters = statusFilters,
		nextModalityFilters = modalityFilters,
		nextOrderedFrom = orderedFrom,
		nextOrderedTo = orderedTo,
		nextCreatedFrom = createdFrom,
		nextCreatedTo = createdTo,
	}: {
		nextQuery?: string;
		nextStatusFilters?: SharedImagingRow["status"][];
		nextModalityFilters?: SharedImagingRow["modality"][];
		nextOrderedFrom?: string;
		nextOrderedTo?: string;
		nextCreatedFrom?: string;
		nextCreatedTo?: string;
	}) {
		const requestId = ++latestRequestIdRef.current;
		startTransition(async () => {
			const nextRows = await getSharedImagingTableAction({
				accessId,
				query: nextQuery,
				statusFilters: nextStatusFilters,
				modalityFilters: nextModalityFilters,
				orderedFrom: nextOrderedFrom,
				orderedTo: nextOrderedTo,
				createdFrom: nextCreatedFrom,
				createdTo: nextCreatedTo,
			});
			if (latestRequestIdRef.current === requestId) setTableRows(nextRows);
		});
	}
	const debouncedSearch = useDebouncedCallback(
		(nextQuery: string) => refreshTable({ nextQuery }),
		300,
	);
	function handleQueryChange(nextQuery: string) {
		setRecordSearchQuery(nextQuery);
		debouncedSearch(nextQuery);
	}
	function handleStatusFiltersChange(nextStatusFilters: SharedImagingRow["status"][]) {
		setStatusFilters(nextStatusFilters);
		refreshTable({ nextStatusFilters });
	}
	function handleModalityFiltersChange(nextModalityFilters: SharedImagingRow["modality"][]) {
		setModalityFilters(nextModalityFilters);
		refreshTable({ nextModalityFilters });
	}
	function handleOrderedRangeApply(nextOrderedFrom: string, nextOrderedTo: string) {
		setOrderedFrom(nextOrderedFrom);
		setOrderedTo(nextOrderedTo);
		refreshTable({ nextOrderedFrom, nextOrderedTo });
	}
	function handleCreatedRangeApply(nextCreatedFrom: string, nextCreatedTo: string) {
		setCreatedFrom(nextCreatedFrom);
		setCreatedTo(nextCreatedTo);
		refreshTable({ nextCreatedFrom, nextCreatedTo });
	}
	function handleFiltersClear() {
		setStatusFilters([]);
		setModalityFilters([]);
		setOrderedFrom("");
		setOrderedTo("");
		setCreatedFrom("");
		setCreatedTo("");
		refreshTable({
			nextStatusFilters: [],
			nextModalityFilters: [],
			nextOrderedFrom: "",
			nextOrderedTo: "",
			nextCreatedFrom: "",
			nextCreatedTo: "",
		});
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
				cell: () => <RowMenu />,
				enableSorting: false,
				size: 40,
			},
		],
		[],
	);
	const table = useTable({
		features: configuredTableFeatures,
		data: tableRows,
		columns,
		onSortingChange: setSorting,
		state: { sorting },
	});

	return (
		<div>
			<h2 className="text-lg font-semibold text-gray-900">Imaging</h2>
			<div className="mt-7 mb-4 flex items-center gap-2">
				<div className="relative min-w-0 flex-1">
					<RiSearchLine className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-gray-400" />
					<Input
						type="search"
						value={recordSearchQuery}
						onChange={(event) => handleQueryChange(event.target.value)}
						placeholder="Search by study, modality, region, impression, or imaging ID"
						className="pl-10"
					/>
				</div>
				<DropdownMenu
					onOpenChange={(open) => {
						if (!open) setActiveFilterSubmenu(null);
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
						<FilterSubmenu
							open={activeFilterSubmenu === "status"}
							onOpenChange={(open) => setActiveFilterSubmenu(open ? "status" : null)}
							icon={<RiCheckboxCircleLine className="size-4.5" />}
							label="Status"
						>
							<CheckboxFilterList
								name="shared-imaging-status"
								options={imagingStatusFilterOptions}
								selectedValues={statusFilters}
								onSelectedValuesChange={handleStatusFiltersChange}
							/>
						</FilterSubmenu>
						<FilterSubmenu
							open={activeFilterSubmenu === "modality"}
							onOpenChange={(open) => setActiveFilterSubmenu(open ? "modality" : null)}
							icon={<RiScan2Line className="size-4.5" />}
							label="Modality"
						>
							<CheckboxFilterList
								name="shared-imaging-modality"
								options={imagingModalityFilterOptions}
								selectedValues={modalityFilters}
								onSelectedValuesChange={handleModalityFiltersChange}
							/>
						</FilterSubmenu>
						<FilterSubmenu
							open={activeFilterSubmenu === "ordered-at"}
							onOpenChange={(open) => setActiveFilterSubmenu(open ? "ordered-at" : null)}
							icon={<RiCalendarLine className="size-4.5" />}
							label="Ordered at"
						>
							<DateRangeMenuItems
								from={orderedFrom}
								to={orderedTo}
								onDateRangeApply={handleOrderedRangeApply}
								onCustomDateRangeSelect={setCustomDateRangeFilter}
							/>
						</FilterSubmenu>
						<FilterSubmenu
							open={activeFilterSubmenu === "created-at"}
							onOpenChange={(open) => setActiveFilterSubmenu(open ? "created-at" : null)}
							icon={<RiCalendarLine className="size-4.5" />}
							label="Created at"
						>
							<DateRangeMenuItems
								from={createdFrom}
								to={createdTo}
								onDateRangeApply={handleCreatedRangeApply}
								onCustomDateRangeSelect={setCustomDateRangeFilter}
							/>
						</FilterSubmenu>
					</DropdownMenuContent>
				</DropdownMenu>
				<SetDateRangeDialog
					dateRangeFilter={customDateRangeFilter}
					onClose={() => setCustomDateRangeFilter(null)}
				/>
				<Button type="button" variant="outline" className="bg-white text-gray-600 hover:bg-gray-50">
					<RiShare2Line aria-hidden="true" />
					Export
				</Button>
			</div>
			{statusFilters.length > 0 ||
			modalityFilters.length > 0 ||
			orderedFrom ||
			orderedTo ||
			createdFrom ||
			createdTo ? (
				<div className="mb-4 flex items-start gap-4">
					<div className="flex flex-1 flex-wrap gap-2">
						{statusFilters.map((status) => (
							<FilterPill
								key={status}
								label={`Status: ${status}`}
								onRemove={() =>
									handleStatusFiltersChange(statusFilters.filter((value) => value !== status))
								}
							/>
						))}
						{modalityFilters.map((modality) => (
							<FilterPill
								key={modality}
								label={`Modality: ${modality}`}
								onRemove={() =>
									handleModalityFiltersChange(modalityFilters.filter((value) => value !== modality))
								}
							/>
						))}
						{orderedFrom || orderedTo ? (
							<FilterPill
								label={`Ordered: ${formatDateRangeFilterLabel(orderedFrom, orderedTo)}`}
								onRemove={() => handleOrderedRangeApply("", "")}
							/>
						) : null}
						{createdFrom || createdTo ? (
							<FilterPill
								label={`Created: ${formatDateRangeFilterLabel(createdFrom, createdTo)}`}
								onRemove={() => handleCreatedRangeApply("", "")}
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
						className="transition-opacity data-[pending=true]:opacity-80"
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
									No matching imaging studies found.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>
		</div>
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

function FilterSubmenu({
	open,
	onOpenChange,
	icon,
	label,
	children,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	icon: React.ReactNode;
	label: string;
	children: React.ReactNode;
}) {
	return (
		<DropdownMenuSub open={open} onOpenChange={onOpenChange}>
			<DropdownMenuSubTrigger className="rounded-lg py-2 focus:bg-gray-100 focus:text-gray-900 data-[state=open]:bg-gray-100">
				{icon}
				<span className="flex-1">{label}</span>
			</DropdownMenuSubTrigger>
			<DropdownMenuSubContent
				alignOffset={-5}
				className="w-[13.75rem] rounded-xl bg-white p-1 text-sm text-gray-700"
			>
				{children}
			</DropdownMenuSubContent>
		</DropdownMenuSub>
	);
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
				aria-label="Open imaging actions"
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
