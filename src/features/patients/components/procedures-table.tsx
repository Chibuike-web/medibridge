"use client";

import {
	DateRangeMenuItems,
	SetDateRangeDialog,
	type DateRangeFilter,
} from "@/components/date-range-filter";
import { useMemo, useState } from "react";
import { authClient } from "@/lib/better-auth/auth.client";
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
import { TableBulkActionSeparator } from "@/components/table-bulk-action-separator";
import { AnimatedBulkBar } from "@/components/animated-bulk-bar";
import { Button } from "@/components/ui/button";
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
	createSortedRowModel,
	stockFeatures,
	sortFns,
	tableFeatures,
	type RowSelectionState,
	type SortingState,
	useTable,
} from "@tanstack/react-table";

const configuredTableFeatures = tableFeatures({
	...stockFeatures,
	sortFns,
	sortedRowModel: createSortedRowModel(),
});
import {
	RiArchiveLine,
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
import { format } from "date-fns";
import useSWR from "swr";
import { useRouter } from "next/navigation";

type ProcedureDetailsRequestError = Error & { status?: number };

const ROWS_PER_PAGE_OPTIONS = [14, 28, 42];

type ProcedureFilterSubmenu = "status" | "created-at";

const procedureStatusFilterOptions: {
	label: string;
	value: ProcedureStatusFilter;
}[] = [
	{ label: "Pending", value: "pending" },
	{ label: "Completed", value: "completed" },
	{ label: "Cancelled", value: "cancelled" },
];

type ProceduresTableProps = {
	patientId: string;
	encounterId?: string;
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
	onFiltersClear: () => void;
	onPreviousPage: () => void;
	onNextPage: () => void;
	onLimitChange: (limit: number) => void;
};

export function ProceduresTable({
	patientId,
	encounterId,
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
	onFiltersClear,
	onPreviousPage,
	onNextPage,
	onLimitChange,
}: ProceduresTableProps) {
	const router = useRouter();
	const { data: activeMemberRole } = authClient.useActiveMemberRole();
	const canArchive = activeMemberRole?.role === "owner" || activeMemberRole?.role === "admin";
	const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false);
	const [isDetailsDrawerOpen, setIsDetailsDrawerOpen] = useState(false);
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const [sorting, setSorting] = useState<SortingState>([]);
	const [selectedProcedureRows, setSelectedProcedureRows] = useState<RowSelectionState>({});
	const [activeFilterSubmenu, setActiveFilterSubmenu] = useState<ProcedureFilterSubmenu | null>(
		null,
	);
	const [customDateRangeFilter, setCustomDateRangeFilter] = useState<DateRangeFilter | null>(null);
	const procedureDetailsQuery = useSWR(
		isDetailsDrawerOpen && selectedId ? (["patient-procedure-details", selectedId] as const) : null,
		([, selectedId]) => fetchPatientProcedureDetails(selectedId),
		{
			dedupingInterval: 0,
			onError: (error: ProcedureDetailsRequestError) => {
				if (error.status === 401 || error.status === 403) {
					router.refresh();
				}
			},
			shouldRetryOnError: (error: ProcedureDetailsRequestError) =>
				error.status !== 401 && error.status !== 403,
		},
	);

	function handleViewProcedureDetails(procedureId: string) {
		setSelectedId(procedureId);
		setIsDetailsDrawerOpen(true);
	}

	const columns = useMemo(
		() => getProceduresColumns({ canArchive, onViewProcedureDetails: handleViewProcedureDetails }),
		[canArchive],
	);

	const table = useTable({
		features: configuredTableFeatures,
		data: procedures,
		columns,
		enableRowSelection: true,
		getRowId: (row) => row.procedureId,
		onSortingChange: setSorting,
		onRowSelectionChange: setSelectedProcedureRows,
		state: {
			sorting,
			rowSelection: selectedProcedureRows,
		},
	});
	const selectedProcedures = table.getSelectedRowModel().rows.map((row) => row.original);

	return (
		<div className="px-6 py-8 text-sm">
			<h1 className="mx-auto max-w-7xl text-lg font-semibold no-line-height">Procedures</h1>
			<div className="mx-auto mt-7 mb-4 flex max-w-7xl items-center gap-2">
				<div className="relative w-full">
					<RiSearchLine className="size-4 pointer-events-none absolute bottom-0 left-2 flex h-full items-center justify-center text-gray-400" />
					<Input
						type="search"
						className="pl-8"
						placeholder={
							encounterId
								? "Search by procedure, indication, facility, or procedure ID"
								: "Search by procedure, indication, facility, procedure ID, or encounter ID"
						}
						value={query}
						onChange={(event) => onQueryChange(event.target.value)}
					/>
				</div>
				<DropdownMenu
					onOpenChange={(isProcedureFilterMenuOpen) => {
						if (!isProcedureFilterMenuOpen) {
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
						align="end"
						className="w-[13.75rem] rounded-xl bg-white text-sm text-gray-700"
					>
						<DropdownMenuSub
							open={activeFilterSubmenu === "status"}
							onOpenChange={(isStatusSubmenuOpen) => {
								setActiveFilterSubmenu((prev) => {
									if (isStatusSubmenuOpen) return "status";
									if (prev === "status") return null;
									return prev;
								});
							}}
						>
							<DropdownMenuSubTrigger className="rounded-lg focus:bg-gray-100 focus:text-gray-900 data-[state=open]:bg-gray-100 py-2">
								<RiCheckboxCircleLine className="size-4" />
								<span className="flex-1">Status</span>
							</DropdownMenuSubTrigger>
							<DropdownMenuSubContent
								alignOffset={-5}
								className="w-[13.75rem] rounded-xl bg-white p-1 text-sm text-gray-700"
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
							open={activeFilterSubmenu === "created-at"}
							onOpenChange={(isCreatedAtSubmenuOpen) => {
								setActiveFilterSubmenu((prev) => {
									if (isCreatedAtSubmenuOpen) return "created-at";
									if (prev === "created-at") return null;
									return prev;
								});
							}}
						>
							<DropdownMenuSubTrigger className="rounded-lg focus:bg-gray-100 focus:text-gray-900 data-[state=open]:bg-gray-100 py-2">
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
				<Button variant="outline" className="bg-white text-gray-600 hover:bg-gray-50">
					<RiShare2Line aria-hidden className="size-5 text-gray-600" />
					Export
				</Button>
				<Button type="button" onClick={() => setIsCreateDrawerOpen(true)}>
					Add procedure
				</Button>
			</div>
			<ProcedureActiveFilterPills
				createdFrom={createdFrom}
				createdTo={createdTo}
				statusFilters={statusFilters}
				onCreatedAtRangeApply={onCreatedAtRangeApply}
				onStatusFiltersChange={onStatusFiltersChange}
				onFiltersClear={onFiltersClear}
			/>
			<div className="mx-auto max-w-7xl overflow-x-auto rounded-xl border border-gray-200 text-sm">
				<Table
					aria-busy={isPending}
					className="min-w-[76rem] border-separate border-spacing-0 bg-gray-50 text-left"
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
					<TableBody className="overflow-hidden rounded-t-xl outline outline-gray-200">
						{table.getRowModel().rows.length > 0 ? (
							table.getRowModel().rows.map((row, rowPosition) => (
								<TableRow
									key={row.id}
									role="button"
									tabIndex={0}
									onClick={() => handleViewProcedureDetails(row.original.procedureId)}
									onKeyDown={(event) => {
										if (event.key === "Enter" || event.key === " ") {
											event.preventDefault();
											handleViewProcedureDetails(row.original.procedureId);
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
									No matching procedures found.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
				<div className="flex gap-3 border-t border-gray-200 bg-white p-3 text-sm text-gray-500 items-center justify-between">
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
			<ProceduresBulkActionBar
				canArchive={canArchive}
				selectedProcedures={selectedProcedures}
				onClearSelection={() => table.resetRowSelection()}
				onViewProcedureDetails={handleViewProcedureDetails}
			/>
			<CreateProcedureDrawer
				open={isCreateDrawerOpen}
				onOpenChange={setIsCreateDrawerOpen}
				patientId={patientId}
				encounterId={encounterId}
			/>
			<ProcedureDetailsDrawer
				open={isDetailsDrawerOpen}
				onOpenChange={setIsDetailsDrawerOpen}
				procedure={procedureDetailsQuery.data ?? null}
				isLoading={procedureDetailsQuery.isLoading}
				onProcedureUpdated={() => {
					procedureDetailsQuery.mutate();
				}}
			/>
		</div>
	);
}

function ProceduresBulkActionBar({
	canArchive,
	selectedProcedures,
	onClearSelection,
	onViewProcedureDetails,
}: {
	canArchive: boolean;
	selectedProcedures: ProcedureType[];
	onClearSelection: () => void;
	onViewProcedureDetails: (procedureId: string) => void;
}) {
	const selectedProcedureCount = selectedProcedures.length;
	const singleSelectedProcedure = selectedProcedureCount === 1 ? selectedProcedures[0] : undefined;

	if (selectedProcedureCount === 0) return null;

	return (
		<AnimatedBulkBar>
			<span className="shrink-0 whitespace-nowrap text-sm font-medium">
				{selectedProcedureCount} {selectedProcedureCount === 1 ? "item" : "items"} selected
			</span>
			<TableBulkActionSeparator />
			<div className="flex items-center">
				{singleSelectedProcedure ? (
					<Button
						type="button"
						onClick={() => onViewProcedureDetails(singleSelectedProcedure.procedureId)}
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
					<span>Export {selectedProcedureCount > 1 ? "all" : null}</span>
				</Button>
				{canArchive ? (
					<Button
						type="button"
						variant="ghost"
						size="sm"
						className="gap-2 border-0 px-2.5 has-[>svg:first-child]:pl-2.5 text-white hover:bg-white/10 hover:text-white focus-visible:border-0 focus-visible:ring-2 focus-visible:ring-white/30"
					>
						<RiArchiveLine className="size-5" aria-hidden />
						<span>Archive {selectedProcedureCount > 1 ? "all" : null}</span>
					</Button>
				) : null}
			</div>
			<Button
				type="button"
				onClick={onClearSelection}
				variant="ghost"
				size="icon"
				className="size-8 border-0 text-white hover:bg-white/10 hover:text-white focus-visible:border-0 focus-visible:ring-2 focus-visible:ring-white/30"
				aria-label="Clear selected procedures"
			>
				<RiCloseLine className="size-5" aria-hidden />
			</Button>
		</AnimatedBulkBar>
	);
}

function ProcedureActiveFilterPills({
	createdFrom,
	createdTo,
	statusFilters,
	onCreatedAtRangeApply,
	onStatusFiltersChange,
	onFiltersClear,
}: {
	createdFrom: string;
	createdTo: string;
	statusFilters: ProcedureStatusFilter[];
	onCreatedAtRangeApply: (createdFrom: string, createdTo: string) => void;
	onStatusFiltersChange: (statusFilters: ProcedureStatusFilter[]) => void;
	onFiltersClear: () => void;
}) {
	const hasCreatedAtFilter = Boolean(createdFrom || createdTo);
	const hasStatusFilters = statusFilters.length > 0;

	if (!hasCreatedAtFilter && !hasStatusFilters) {
		return null;
	}

	return (
		<div className="mx-auto mb-4 flex max-w-7xl items-start gap-4">
			<div className="flex flex-1 flex-wrap gap-2">
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

function ProcedureFilterPill({ label, onRemove }: { label: string; onRemove: () => void }) {
	return (
		<span className="inline-flex items-center gap-3 rounded-full border border-gray-200 bg-gray-100 py-1.5 pr-1.5 pl-3 text-sm font-medium text-gray-600 shadow-xs">
			<span>{label}</span>
			<Button
				type="button"
				onClick={onRemove}
				size="icon"
				className="flex text-white size-5 rounded-full hover:bg-gray-500 focus-visible:ring-2 focus-visible:ring-gray-300"
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

	if (parsedFromDate) {
		return `From ${format(parsedFromDate, "MMM d, yyyy")}`;
	}

	if (parsedToDate) {
		return `Until ${format(parsedToDate, "MMM d, yyyy")}`;
	}

	return "Any date";
}

function formatProcedureFilterValue(value: string) {
	return value.charAt(0).toUpperCase() + value.slice(1);
}

async function fetchPatientProcedureDetails(selectedId: string) {
	const response = await fetch(`/api/patient-procedure-details/${encodeURIComponent(selectedId)}`);

	if (!response.ok) {
		throw Object.assign(new Error("Unable to load procedure details."), {
			status: response.status,
		});
	}

	const result = (await response.json()) as { procedure: ProcedureDetailsType | null };

	return result.procedure;
}

function getProceduresColumns({
	canArchive,
	onViewProcedureDetails,
}: {
	canArchive: boolean;
	onViewProcedureDetails: (procedureId: string) => void;
}): ColumnDef<typeof configuredTableFeatures, ProcedureType>[] {
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
								className="w-50 rounded-xl border-white/20 bg-gray-800 text-sm text-white ring ring-gray-800"
							>
								<DropdownMenuItem
									className="rounded-lg text-white focus:bg-white/10 focus:text-white py-2"
									onSelect={() => onViewProcedureDetails(row.original.procedureId)}
								>
									<RiEyeLine className="text-white" />
									<span>View details</span>
								</DropdownMenuItem>
								<DropdownMenuItem className="rounded-lg text-white focus:bg-white/10 focus:text-white py-2">
									<RiShare2Line className="text-white" />
									<span>Export</span>
								</DropdownMenuItem>
								{canUpdateProcedureStatus ? (
									<>
										<DropdownMenuItem className="rounded-lg text-white focus:bg-white/10 focus:text-white py-2">
											<RiCheckLine className="text-white" />
											<span>Mark as completed</span>
										</DropdownMenuItem>
										<DropdownMenuItem className="rounded-lg text-white focus:bg-white/10 focus:text-white py-2">
											<RiCloseLine className="text-white" />
											<span>Cancel</span>
										</DropdownMenuItem>
									</>
								) : null}
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
				);
			},
		},
	];
}
