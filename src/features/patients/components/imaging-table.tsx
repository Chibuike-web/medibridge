"use client";

import {
	DateRangeMenuItems,
	SetDateRangeDialog,
	type DateRangeFilter,
} from "@/components/date-range-filter";
import { useMemo, useState } from "react";
import { authClient } from "@/lib/better-auth/auth.client";
import { CreateImagingDrawer } from "@/features/patients/components/create-imaging-drawer";
import { ImagingDetailsDrawer } from "@/features/patients/components/imaging-details-drawer";
import type {
	ImagingModalityFilter,
	ImagingStatusFilter,
	ImagingType,
} from "@/features/patients/types";
import { CopyIdButton } from "@/components/copy-id-button";
import { IndeterminateCheckbox } from "@/components/indeterminate-checkbox";
import { StatusBadge } from "@/components/status-badge";
import { TableBulkActionSeparator } from "@/components/table-bulk-action-separator";
import { AnimatedBulkBar } from "@/components/animated-bulk-bar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
	RiCheckboxCircleLine,
	RiCheckLine,
	RiCloseLine,
	RiEyeLine,
	RiFilter3Line,
	RiMore2Fill,
	RiScan2Line,
	RiSearchLine,
	RiShare2Line,
} from "@remixicon/react";
import { format } from "date-fns";

const ROWS_PER_PAGE_OPTIONS = [14, 28, 42];

type ImagingFilterSubmenu = "status" | "modality" | "ordered-at" | "created-at";

const imagingStatusFilterOptions: {
	label: string;
	value: ImagingStatusFilter;
}[] = [
	{ label: "Pending", value: "pending" },
	{ label: "Completed", value: "completed" },
	{ label: "Cancelled", value: "cancelled" },
];

const imagingModalityFilterOptions: {
	label: string;
	value: ImagingModalityFilter;
}[] = [
	{ label: "CT", value: "ct" },
	{ label: "MRI", value: "mri" },
	{ label: "Ultrasound", value: "ultrasound" },
	{ label: "X-ray", value: "x-ray" },
];

type ImagingTableProps = {
	patientId: string;
	encounterId?: string;
	imagingStudies: ImagingType[];
	page: number;
	limit: number;
	totalPages: number;
	query: string;
	orderedFrom: string;
	orderedTo: string;
	createdFrom: string;
	createdTo: string;
	statusFilters: ImagingStatusFilter[];
	modalityFilters: ImagingModalityFilter[];
	isPending: boolean;
	onQueryChange: (query: string) => void;
	onOrderedAtRangeApply: (orderedFrom: string, orderedTo: string) => void;
	onCreatedAtRangeApply: (createdFrom: string, createdTo: string) => void;
	onStatusFiltersChange: (statusFilters: ImagingStatusFilter[]) => void;
	onModalityFiltersChange: (modalityFilters: ImagingModalityFilter[]) => void;
	onFiltersClear: () => void;
	onPreviousPage: () => void;
	onNextPage: () => void;
	onLimitChange: (limit: number) => void;
};

export function ImagingTable({
	patientId,
	encounterId,
	imagingStudies,
	page,
	limit,
	totalPages,
	query,
	orderedFrom,
	orderedTo,
	createdFrom,
	createdTo,
	statusFilters,
	modalityFilters,
	isPending,
	onQueryChange,
	onOrderedAtRangeApply,
	onCreatedAtRangeApply,
	onStatusFiltersChange,
	onModalityFiltersChange,
	onFiltersClear,
	onPreviousPage,
	onNextPage,
	onLimitChange,
}: ImagingTableProps) {
	const { data: activeMemberRole } = authClient.useActiveMemberRole();
	const canArchive = activeMemberRole?.role === "owner" || activeMemberRole?.role === "admin";
	const [sorting, setSorting] = useState<SortingState>([]);
	const [selectedImagingRows, setSelectedImagingRows] = useState<RowSelectionState>({});
	const [activeFilterSubmenu, setActiveFilterSubmenu] = useState<ImagingFilterSubmenu | null>(null);
	const [customDateRangeFilter, setCustomDateRangeFilter] = useState<DateRangeFilter | null>(null);
	const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false);
	const [isDetailsDrawerOpen, setIsDetailsDrawerOpen] = useState(false);
	const [selectedStudy, setSelectedStudy] = useState<ImagingType | null>(null);

	function handleViewImagingDetails(imaging: ImagingType) {
		setSelectedStudy(imaging);
		setIsDetailsDrawerOpen(true);
	}

	const columns = useMemo(
		() => getImagingColumns({ canArchive, onViewImagingDetails: handleViewImagingDetails }),
		[canArchive],
	);

	const table = useTable({
		features: configuredTableFeatures,
		data: imagingStudies,
		columns,
		enableRowSelection: true,
		getRowId: (row) => row.imagingId,
		onSortingChange: setSorting,
		onRowSelectionChange: setSelectedImagingRows,
		state: {
			sorting,
			rowSelection: selectedImagingRows,
		},
	});
	const selectedImagingRecords = table.getSelectedRowModel().rows.map((row) => row.original);
	return (
		<div className="px-6 py-8 text-sm">
			<h1 className="mx-auto max-w-7xl text-lg font-semibold no-line-height">Imaging</h1>
			<div className="mx-auto mt-7 mb-4 flex max-w-7xl items-center gap-2">
				<div className="relative w-full">
					<RiSearchLine className="size-4 pointer-events-none absolute bottom-0 left-2 flex h-full items-center justify-center text-gray-400" />
					<Input
						type="search"
						className="pl-8"
						placeholder={
							encounterId
								? "Search by study, modality, region, impression, or imaging ID"
								: "Search by study, modality, region, impression, imaging ID, or encounter ID"
						}
						value={query}
						onChange={(event) => onQueryChange(event.target.value)}
					/>
				</div>
				<DropdownMenu
					onOpenChange={(isImagingFilterMenuOpen) => {
						if (!isImagingFilterMenuOpen) {
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
								<ImagingCheckboxFilterList
									name="imaging-status"
									options={imagingStatusFilterOptions}
									selectedValues={statusFilters}
									isPending={isPending}
									onSelectedValuesChange={onStatusFiltersChange}
								/>
							</DropdownMenuSubContent>
						</DropdownMenuSub>

						<DropdownMenuSub
							open={activeFilterSubmenu === "modality"}
							onOpenChange={(isModalitySubmenuOpen) => {
								setActiveFilterSubmenu((prev) => {
									if (isModalitySubmenuOpen) return "modality";
									if (prev === "modality") return null;
									return prev;
								});
							}}
						>
							<DropdownMenuSubTrigger className="rounded-lg focus:bg-gray-100 focus:text-gray-900 data-[state=open]:bg-gray-100 py-2">
								<RiScan2Line className="size-4" />
								<span className="flex-1">Modality</span>
							</DropdownMenuSubTrigger>
							<DropdownMenuSubContent
								alignOffset={-5}
								className="w-[13.75rem] rounded-xl bg-white p-1 text-sm text-gray-700"
							>
								<ImagingCheckboxFilterList
									name="imaging-modality"
									options={imagingModalityFilterOptions}
									selectedValues={modalityFilters}
									isPending={isPending}
									onSelectedValuesChange={onModalityFiltersChange}
								/>
							</DropdownMenuSubContent>
						</DropdownMenuSub>

						<DropdownMenuSub
							open={activeFilterSubmenu === "ordered-at"}
							onOpenChange={(isOrderedAtSubmenuOpen) => {
								setActiveFilterSubmenu((prev) => {
									if (isOrderedAtSubmenuOpen) return "ordered-at";
									if (prev === "ordered-at") return null;
									return prev;
								});
							}}
						>
							<DropdownMenuSubTrigger className="rounded-lg focus:bg-gray-100 focus:text-gray-900 data-[state=open]:bg-gray-100 py-2">
								<RiCalendarLine className="size-4" />
								<span className="flex-1">Ordered at</span>
							</DropdownMenuSubTrigger>
							<DropdownMenuSubContent
								alignOffset={-5}
								className="w-[13.75rem] rounded-xl bg-white p-1 text-sm text-gray-700"
							>
								<DateRangeMenuItems
									from={orderedFrom}
									to={orderedTo}
									onDateRangeApply={onOrderedAtRangeApply}
									onCustomDateRangeSelect={setCustomDateRangeFilter}
								/>
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
					Add imaging
				</Button>
			</div>
			<ImagingActiveFilterPills
				orderedFrom={orderedFrom}
				orderedTo={orderedTo}
				createdFrom={createdFrom}
				createdTo={createdTo}
				statusFilters={statusFilters}
				modalityFilters={modalityFilters}
				onOrderedAtRangeApply={onOrderedAtRangeApply}
				onCreatedAtRangeApply={onCreatedAtRangeApply}
				onStatusFiltersChange={onStatusFiltersChange}
				onModalityFiltersChange={onModalityFiltersChange}
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
									onClick={() => handleViewImagingDetails(row.original)}
									onKeyDown={(event) => {
										if (event.key === "Enter" || event.key === " ") {
											event.preventDefault();
											handleViewImagingDetails(row.original);
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
			<ImagingBulkActionBar
				canArchive={canArchive}
				selectedImagingRecords={selectedImagingRecords}
				onClearSelection={() => table.resetRowSelection()}
				onViewImagingDetails={handleViewImagingDetails}
			/>
			<CreateImagingDrawer
				open={isCreateDrawerOpen}
				onOpenChange={setIsCreateDrawerOpen}
				patientId={patientId}
				encounterId={encounterId}
			/>
			<ImagingDetailsDrawer
				patientId={patientId}
				open={isDetailsDrawerOpen}
				onOpenChange={setIsDetailsDrawerOpen}
				imaging={
					imagingStudies.find((imaging) => imaging.imagingId === selectedStudy?.imagingId) ??
					selectedStudy
				}
			/>
		</div>
	);
}

function ImagingBulkActionBar({
	canArchive,
	selectedImagingRecords,
	onClearSelection,
	onViewImagingDetails,
}: {
	canArchive: boolean;
	selectedImagingRecords: ImagingType[];
	onClearSelection: () => void;
	onViewImagingDetails: (imaging: ImagingType) => void;
}) {
	const selectedImagingCount = selectedImagingRecords.length;
	const singleSelectedImaging = selectedImagingCount === 1 ? selectedImagingRecords[0] : undefined;

	if (selectedImagingCount === 0) return null;

	return (
		<AnimatedBulkBar>
			<span className="shrink-0 whitespace-nowrap text-sm font-medium">
				{selectedImagingCount} {selectedImagingCount === 1 ? "item" : "items"} selected
			</span>
			<TableBulkActionSeparator />
			<div className="flex items-center">
				{singleSelectedImaging ? (
					<Button
						type="button"
						onClick={() => onViewImagingDetails(singleSelectedImaging)}
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
					<span>Export {selectedImagingCount > 1 ? "all" : null}</span>
				</Button>
				{canArchive ? (
					<Button
						type="button"
						variant="ghost"
						size="sm"
						className="gap-2 border-0 px-2.5 has-[>svg:first-child]:pl-2.5 text-white hover:bg-white/10 hover:text-white focus-visible:border-0 focus-visible:ring-2 focus-visible:ring-white/30"
					>
						<RiArchiveLine className="size-5" aria-hidden />
						<span>Archive {selectedImagingCount > 1 ? "all" : null}</span>
					</Button>
				) : null}
			</div>
			<Button
				type="button"
				onClick={onClearSelection}
				variant="ghost"
				size="icon"
				className="size-8 border-0 text-white hover:bg-white/10 hover:text-white focus-visible:border-0 focus-visible:ring-2 focus-visible:ring-white/30"
				aria-label="Clear selected imaging records"
			>
				<RiCloseLine className="size-5" aria-hidden />
			</Button>
		</AnimatedBulkBar>
	);
}

function ImagingCheckboxFilterList<TValue extends string>({
	name,
	options,
	selectedValues,
	isPending,
	onSelectedValuesChange,
}: {
	name: string;
	options: { label: string; value: TValue }[];
	selectedValues: TValue[];
	isPending: boolean;
	onSelectedValuesChange: (selectedValues: TValue[]) => void;
}) {
	return (
		<>
			{options.map((option) => {
				const isSelected = selectedValues.includes(option.value);
				const optionId = `${name}-${option.value}`;

				return (
					<DropdownMenuItem
						key={option.value}
						className="rounded-lg p-0 focus:bg-gray-100 focus:text-gray-900"
						onSelect={(event) => {
							event.preventDefault();
						}}
					>
						<Label
							htmlFor={optionId}
							className="flex w-full cursor-pointer items-center gap-3 px-2 py-2 leading-normal font-normal"
						>
							<Checkbox
								id={optionId}
								checked={isSelected}
								disabled={isPending}
								onCheckedChange={(checked) => {
									onSelectedValuesChange(
										checked === true
											? [...selectedValues, option.value]
											: selectedValues.filter((selectedValue) => selectedValue !== option.value),
									);
								}}
								className="[&_svg]:!text-current"
							/>
							<span>{option.label}</span>
						</Label>
					</DropdownMenuItem>
				);
			})}
		</>
	);
}

function ImagingActiveFilterPills({
	orderedFrom,
	orderedTo,
	createdFrom,
	createdTo,
	statusFilters,
	modalityFilters,
	onOrderedAtRangeApply,
	onCreatedAtRangeApply,
	onStatusFiltersChange,
	onModalityFiltersChange,
	onFiltersClear,
}: {
	orderedFrom: string;
	orderedTo: string;
	createdFrom: string;
	createdTo: string;
	statusFilters: ImagingStatusFilter[];
	modalityFilters: ImagingModalityFilter[];
	onOrderedAtRangeApply: (orderedFrom: string, orderedTo: string) => void;
	onCreatedAtRangeApply: (createdFrom: string, createdTo: string) => void;
	onStatusFiltersChange: (statusFilters: ImagingStatusFilter[]) => void;
	onModalityFiltersChange: (modalityFilters: ImagingModalityFilter[]) => void;
	onFiltersClear: () => void;
}) {
	const hasOrderedAtFilter = Boolean(orderedFrom || orderedTo);
	const hasCreatedAtFilter = Boolean(createdFrom || createdTo);
	const hasStatusFilters = statusFilters.length > 0;
	const hasModalityFilters = modalityFilters.length > 0;

	if (!hasOrderedAtFilter && !hasCreatedAtFilter && !hasStatusFilters && !hasModalityFilters) {
		return null;
	}

	return (
		<div className="mx-auto mb-4 flex max-w-7xl items-start gap-4">
			<div className="flex flex-1 flex-wrap gap-2">
				{statusFilters.map((statusFilter) => (
					<ImagingFilterPill
						key={statusFilter}
						label={`Status: ${formatImagingFilterValue(statusFilter)}`}
						onRemove={() => {
							onStatusFiltersChange(
								statusFilters.filter((currentStatusFilter) => currentStatusFilter !== statusFilter),
							);
						}}
					/>
				))}
				{modalityFilters.map((modalityFilter) => (
					<ImagingFilterPill
						key={modalityFilter}
						label={`Modality: ${formatImagingFilterValue(modalityFilter)}`}
						onRemove={() => {
							onModalityFiltersChange(
								modalityFilters.filter(
									(currentModalityFilter) => currentModalityFilter !== modalityFilter,
								),
							);
						}}
					/>
				))}
				{hasOrderedAtFilter ? (
					<ImagingFilterPill
						label={`Ordered: ${formatDateRangeFilterLabel(orderedFrom, orderedTo)}`}
						onRemove={() => onOrderedAtRangeApply("", "")}
					/>
				) : null}
				{hasCreatedAtFilter ? (
					<ImagingFilterPill
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

function ImagingFilterPill({ label, onRemove }: { label: string; onRemove: () => void }) {
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

	if (parsedFromDate) {
		return `From ${format(parsedFromDate, "MMM d, yyyy")}`;
	}

	if (parsedToDate) {
		return `Until ${format(parsedToDate, "MMM d, yyyy")}`;
	}

	return "Any date";
}

function formatImagingFilterValue(value: string) {
	return value
		.split("-")
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(" ");
}

function getImagingColumns({
	canArchive,
	onViewImagingDetails,
}: {
	canArchive: boolean;
	onViewImagingDetails: (imaging: ImagingType) => void;
}): ColumnDef<typeof configuredTableFeatures, ImagingType>[] {
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
				<div
					className="w-max"
					onClick={(event) => event.stopPropagation()}
					onKeyDown={(event) => event.stopPropagation()}
				>
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
			header: "Study",
			accessorKey: "study",
			enableSorting: true,
			cell: ({ row }) => (
				<div className="w-max" onClick={(event) => event.stopPropagation()}>
					<span className="font-medium text-gray-800">{row.original.study}</span>
				</div>
			),
		},
		{
			header: "Imaging ID",
			accessorKey: "imagingId",
			enableSorting: false,
			cell: ({ row }) => (
				<div onKeyDown={(event) => event.stopPropagation()}>
					<CopyIdButton id={row.original.imagingId} />
				</div>
			),
		},
		{
			header: "Modality",
			accessorKey: "modality",
			enableSorting: true,
			cell: ({ row }) => (
				<div className="w-max" onClick={(event) => event.stopPropagation()}>
					{row.original.modality}
				</div>
			),
		},
		{
			header: "Region",
			accessorKey: "region",
			enableSorting: true,
			cell: ({ row }) => (
				<div className="w-max" onClick={(event) => event.stopPropagation()}>
					{row.original.region}
				</div>
			),
		},
		{
			header: "Impression",
			accessorKey: "impression",
			enableSorting: false,
			cell: ({ row }) => (
				<div
					className="max-w-[18rem] whitespace-normal"
					onClick={(event) => event.stopPropagation()}
				>
					{row.original.impression || "-"}
				</div>
			),
		},
		{
			id: "orderedAt",
			header: "Ordered At",
			accessorFn: (row) => row.orderedAtSortValue,
			enableSorting: true,
			cell: ({ row }) => (
				<div className="w-max" onClick={(event) => event.stopPropagation()}>
					{row.original.orderedAtLabel}
				</div>
			),
		},
		{
			header: "Status",
			accessorKey: "status",
			enableSorting: false,
			cell: ({ row }) => (
				<div className="w-max" onClick={(event) => event.stopPropagation()}>
					<StatusBadge status={row.original.status} />
				</div>
			),
		},
		{
			id: "actions",
			header: "",
			enableSorting: false,
			cell: ({ row }) => {
				const canUpdateImagingStatus = row.original.status === "Pending";

				return (
					<div
						className="flex justify-end"
						onClick={(event) => event.stopPropagation()}
						onKeyDown={(event) => event.stopPropagation()}
					>
						<DropdownMenu>
							<DropdownMenuTrigger
								type="button"
								className="inline-flex size-9 items-center justify-center rounded-md border border-transparent text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
								aria-label={`Open actions for ${row.original.study}`}
							>
								<RiMore2Fill className="size-5" aria-hidden />
							</DropdownMenuTrigger>
							<DropdownMenuContent
								align="end"
								className="w-50 rounded-xl border-white/20 bg-gray-800 text-sm text-white ring ring-gray-800"
							>
								<DropdownMenuItem
									className="rounded-lg text-white focus:bg-white/10 focus:text-white py-2"
									onSelect={() => onViewImagingDetails(row.original)}
								>
									<RiEyeLine className="text-white" />
									<span>View details</span>
								</DropdownMenuItem>
								<DropdownMenuItem className="rounded-lg text-white focus:bg-white/10 focus:text-white py-2">
									<RiShare2Line className="text-white" />
									<span>Export</span>
								</DropdownMenuItem>
								{canUpdateImagingStatus ? (
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
