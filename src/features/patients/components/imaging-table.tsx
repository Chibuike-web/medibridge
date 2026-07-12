"use client";

import { useMemo, useState } from "react";
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
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
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
	RiArrowDownSLine,
	RiArrowRightLine,
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
import { endOfDay, format, isSameDay, startOfDay, subDays } from "date-fns";
import type { DateRange } from "react-day-picker";

const ROWS_PER_PAGE_OPTIONS = [14, 28, 42];

type ImagingFilterSubmenu = "status" | "modality" | "ordered-at" | "created-at";

type ImagingDateFilterPreset = {
	label: string;
	getRange: (today: Date) => ImagingDateCompleteRange;
};

type ImagingDateCompleteRange = {
	from: Date;
	to: Date;
};

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

const imagingDateFilterPresets: ImagingDateFilterPreset[] = [
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

type ImagingTableProps = {
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
	onPreviousPage: () => void;
	onNextPage: () => void;
	onLimitChange: (limit: number) => void;
};

export function ImagingTable({
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
	onPreviousPage,
	onNextPage,
	onLimitChange,
}: ImagingTableProps) {
	const [sorting, setSorting] = useState<SortingState>([]);
	const [activeFilterSubmenu, setActiveFilterSubmenu] = useState<ImagingFilterSubmenu | null>(null);
	const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false);
	const [isDetailsDrawerOpen, setIsDetailsDrawerOpen] = useState(false);
	const [selectedStudy, setSelectedStudy] = useState<ImagingType | null>(null);

	function handleViewImagingDetails(imaging: ImagingType) {
		setSelectedStudy(imaging);
		setIsDetailsDrawerOpen(true);
	}

	const columns = useMemo(
		() => getImagingColumns({ onViewImagingDetails: handleViewImagingDetails }),
		[],
	);

	const table = useReactTable({
		data: imagingStudies,
		columns,
		enableRowSelection: true,
		onSortingChange: setSorting,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		state: {
			sorting,
		},
	});

	return (
		<div className="px-6 py-8 text-sm">
			<h1 className="mx-auto max-w-7xl text-xl font-semibold">Imaging</h1>
			<div className="mx-auto mt-7 mb-4 flex max-w-7xl items-center gap-2">
				<div className="relative w-full">
					<RiSearchLine className="size-4 pointer-events-none absolute bottom-0 left-2 flex h-full items-center justify-center text-gray-400" />
					<Input
						type="search"
						className="pl-8"
						placeholder="Search by study, modality, region, impression, status, or imaging ID"
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
						className="w-[13.75rem] rounded-xl border-gray-200 bg-white text-sm text-gray-700 shadow-xl"
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
								<RiCheckboxCircleLine className="size-4.5" />
								<span className="block">Status</span>
							</DropdownMenuSubTrigger>
							<DropdownMenuSubContent
								alignOffset={-5}
								className="w-[13.75rem] rounded-xl border border-gray-200 bg-white p-1 text-sm text-gray-700 shadow-xl"
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
								<RiScan2Line className="size-4.5" />
								<span className="block">Modality</span>
							</DropdownMenuSubTrigger>
							<DropdownMenuSubContent
								alignOffset={-5}
								className="w-[13.75rem] rounded-xl border border-gray-200 bg-white p-1 text-sm text-gray-700 shadow-xl"
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
								<RiCalendarLine className="size-4.5" />
								<span className="block">Ordered at</span>
							</DropdownMenuSubTrigger>
							<DropdownMenuSubContent
								alignOffset={-5}
								className="w-max max-w-[calc(100vw-2rem)] rounded-xl border border-gray-200 bg-white p-0 text-sm text-gray-700 shadow-xl"
							>
								<ImagingDateFilterContent
									from={orderedFrom}
									to={orderedTo}
									isPending={isPending}
									onDateRangeApply={onOrderedAtRangeApply}
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
								<RiCalendarLine className="size-4.5" />
								<span className="block">Created at</span>
							</DropdownMenuSubTrigger>
							<DropdownMenuSubContent
								alignOffset={-5}
								className="w-max max-w-[calc(100vw-2rem)] rounded-xl border border-gray-200 bg-white p-0 text-sm text-gray-700 shadow-xl"
							>
								<ImagingDateFilterContent
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
				<Button type="button" className="text-sm" onClick={() => setIsCreateDrawerOpen(true)}>
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
						{table.getRowModel().rows.map((row, rowPosition) => (
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
											"border-b border-gray-200 bg-white px-3 py-3 text-sm text-gray-600",
											rowPosition === table.getRowModel().rows.length - 1 && "border-b-0",
										)}
									>
										{flexRender(cell.column.columnDef.cell, cell.getContext())}
									</TableCell>
								))}
							</TableRow>
						))}
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
			<CreateImagingDrawer open={isCreateDrawerOpen} onOpenChange={setIsCreateDrawerOpen} />
			<ImagingDetailsDrawer
				open={isDetailsDrawerOpen}
				onOpenChange={setIsDetailsDrawerOpen}
				imaging={selectedStudy}
			/>
		</div>
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
}) {
	const hasOrderedAtFilter = Boolean(orderedFrom || orderedTo);
	const hasCreatedAtFilter = Boolean(createdFrom || createdTo);
	const hasStatusFilters = statusFilters.length > 0;
	const hasModalityFilters = modalityFilters.length > 0;

	if (!hasOrderedAtFilter && !hasCreatedAtFilter && !hasStatusFilters && !hasModalityFilters) {
		return null;
	}

	return (
		<div className="mx-auto mb-4 flex max-w-7xl flex-wrap gap-2">
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
	);
}

function ImagingFilterPill({ label, onRemove }: { label: string; onRemove: () => void }) {
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

function ImagingDateFilterContent({
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
				<ImagingDatePresetList from={from} to={to} onDateRangeApply={onDateRangeApply} />
			</div>

			<div className="w-88 shrink-0 border-l border-gray-100 p-3">
				<ImagingCustomRangeCalendarPanel
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

function ImagingDatePresetList({
	from,
	to,
	onDateRangeApply,
}: {
	from: string;
	to: string;
	onDateRangeApply: (from: string, to: string) => void;
}) {
	const selectedImagingDateRange = getDateRangeFromParams(from, to);
	const today = new Date();

	return (
		<>
			{imagingDateFilterPresets.map((preset) => {
				const presetRange = preset.getRange(today);
				return (
					<ImagingDatePresetButton
						key={preset.label}
						label={preset.label}
						isSelected={isSameDateRange(selectedImagingDateRange, presetRange)}
						onSelect={() => {
							onDateRangeApply(formatUrlDate(presetRange.from), formatUrlDate(presetRange.to));
						}}
					/>
				);
			})}
		</>
	);
}

function ImagingCustomRangeCalendarPanel({
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
	const selectedImagingDateRange = getDateRangeFromParams(from, to);
	const [draftImagingDateRange, setDraftImagingDateRange] = useState<DateRange | undefined>(
		selectedImagingDateRange,
	);

	return (
		<div className="flex min-w-0 flex-col">
			<div className="flex items-center gap-3">
				<ImagingDateFieldPlaceholder value={draftImagingDateRange?.from} label="Start date" />
				<RiArrowRightLine className="size-5 shrink-0 text-gray-400" aria-hidden="true" />
				<ImagingDateFieldPlaceholder value={draftImagingDateRange?.to} label="End date" />
			</div>

			<Calendar
				mode="range"
				selected={draftImagingDateRange}
				onSelect={(nextDraftImagingDateRange) => {
					setDraftImagingDateRange(nextDraftImagingDateRange);
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
						setDraftImagingDateRange(undefined);
						onDateRangeApply("", "");
					}}
				>
					Reset
				</Button>
				<Button
					type="button"
					className="min-w-40 flex-1 text-sm"
					disabled={!draftImagingDateRange?.from || !draftImagingDateRange?.to || isPending}
					onClick={() => {
						if (!draftImagingDateRange?.from || !draftImagingDateRange?.to) return;

						onDateRangeApply(
							formatUrlDate(draftImagingDateRange.from),
							formatUrlDate(draftImagingDateRange.to),
						);
					}}
				>
					Apply
				</Button>
			</div>
		</div>
	);
}

function ImagingDatePresetButton({
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

function ImagingDateFieldPlaceholder({ label, value }: { label: string; value?: Date }) {
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

	if (!parsedFromDate && !parsedToDate) {
		return undefined;
	}

	return {
		from: parsedFromDate ?? undefined,
		to: parsedToDate ?? undefined,
	};
}


function isSameDateRange(left?: DateRange, right?: DateRange) {
	if (!left?.from || !left?.to || !right?.from || !right?.to) {
		return false;
	}

	return isSameDay(left.from, right.from) && isSameDay(left.to, right.to);
}

function formatUrlDate(date: Date) {
	return format(date, "yyyy-MM-dd");
}

function formatImagingFilterValue(value: string) {
	return value
		.split("-")
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(" ");
}

function getImagingColumns({
	onViewImagingDetails,
}: {
	onViewImagingDetails: (imaging: ImagingType) => void;
}): ColumnDef<ImagingType>[] {
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
					{row.original.impression}
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
								className="w-[13.75rem] rounded-xl border-white/20 bg-gray-800 text-sm text-white ring ring-gray-800"
							>
								<DropdownMenuItem
									className="gap-3 rounded-lg text-white focus:bg-white/10 focus:text-white py-2"
									onSelect={() => onViewImagingDetails(row.original)}
								>
									<RiEyeLine className="text-white" />
									<span>View details</span>
								</DropdownMenuItem>
								<DropdownMenuItem className="gap-3 rounded-lg text-white focus:bg-white/10 focus:text-white py-2">
									<RiShare2Line className="text-white" />
									<span>Export</span>
								</DropdownMenuItem>
								{canUpdateImagingStatus ? (
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
