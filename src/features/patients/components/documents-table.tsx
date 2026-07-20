"use client";

import { useMemo, useState, useTransition } from "react";
import useSWR from "swr";
import { CreateDocumentDrawer as CreateDocumentDrawerComponent } from "@/features/patients/components/create-document-drawer";
import { DocumentDetailsDrawer as DocumentDetailsDrawerComponent } from "@/features/patients/components/document-details-drawer";
import { IndeterminateCheckbox } from "@/components/indeterminate-checkbox";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
	Drawer,
	DrawerClose,
	DrawerContent,
	DrawerDescription,
	DrawerFooter,
	DrawerHeader,
	DrawerTitle,
} from "@/components/ui/drawer";
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
import { Checkbox } from "@/components/ui/checkbox";
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
import { Textarea } from "@/components/ui/textarea";
import type { DocumentType } from "@/features/patients/types";
import {
	createPatientDocumentAction,
	removePatientDocumentAction,
	updatePatientDocumentAction,
} from "@/features/patients/server/actions";
import { cn } from "@/lib/utils/cn";
import { parseDateParam } from "@/lib/utils/parse-date-param";
import {
	type ColumnDef,
	flexRender,
	getCoreRowModel,
	getSortedRowModel,
	type RowSelectionState,
	type SortingState,
	useReactTable,
} from "@tanstack/react-table";
import {
	RiArrowDownSLine,
	RiArrowRightLine,
	RiArrowUpSLine,
	RiArchiveLine,
	RiCalendarLine,
	RiCheckLine,
	RiCloseLine,
	RiEditLine,
	RiEyeLine,
	RiFileTextLine,
	RiFilter3Line,
	RiMore2Fill,
	RiSearchLine,
	RiShare2Line,
	RiUploadCloud2Line,
} from "@remixicon/react";
import { endOfDay, format, isSameDay, startOfDay, subDays } from "date-fns";
import type { DateRange } from "react-day-picker";
import pdfFileFormat from "@/assets/file-formats/pdf.svg";
import pngFileFormat from "@/assets/file-formats/png.svg";
import jpgFileFormat from "@/assets/file-formats/jpg.svg";
import docFileFormat from "@/assets/file-formats/doc.svg";
import { CopyIdButton } from "@/components/copy-id-button";
import { TableBulkActionSeparator } from "@/components/table-bulk-action-separator";

const ROWS_PER_PAGE_OPTIONS = [14, 28, 42];

type DocumentDateFilterPreset = {
	label: string;
	getRange: (today: Date) => DocumentDateCompleteRange;
};

type DocumentDateCompleteRange = {
	from: Date;
	to: Date;
};

type DocumentFilterSubmenu = "document-type" | "created-at";

const documentDateFilterPresets: DocumentDateFilterPreset[] = [
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
const fileFormat: Record<string, string> = {
	pdf: pdfFileFormat,
	jpg: jpgFileFormat,
	png: pngFileFormat,
	doc: docFileFormat,
	docx: docFileFormat,
};

type DocumentsTableProps = {
	patientId: string;
	documents: DocumentType[];
	page: number;
	limit: number;
	totalPages: number;
	query: string;
	createdFrom: string;
	createdTo: string;
	documentTypeFilters: string[];
	isPending: boolean;
	onQueryChange: (query: string) => void;
	onDocumentTypeFiltersChange: (categories: string[]) => void;
	onCreatedAtRangeApply: (from: string, to: string) => void;
	onPreviousPage: () => void;
	onNextPage: () => void;
	onLimitChange: (limit: number) => void;
	onDocumentsChanged: () => void;
};

const DOCUMENT_TYPE = [
	"Lab Report",
	"Imaging",
	"Cardiology",
	"Clinical Summary",
	"Referral",
	"Pathology",
];

export function DocumentsTable({
	patientId,
	documents,
	page,
	limit,
	totalPages,
	query,
	createdFrom,
	createdTo,
	documentTypeFilters,
	isPending,
	onQueryChange,
	onDocumentTypeFiltersChange,
	onCreatedAtRangeApply,
	onPreviousPage,
	onNextPage,
	onLimitChange,
	onDocumentsChanged,
}: DocumentsTableProps) {
	const [sorting, setSorting] = useState<SortingState>([]);
	const [selectedDocumentRows, setSelectedDocumentRows] = useState<RowSelectionState>({});
	const [activeFilterSubmenu, setActiveFilterSubmenu] = useState<DocumentFilterSubmenu | null>(
		null,
	);
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const [isDetailsDrawerOpen, setIsDetailsDrawerOpen] = useState(false);
	const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false);
	const documentDetailsQuery = useSWR(
		selectedId ? (["patient-document-details", selectedId] as const) : null,
		([, documentId]) => fetchPatientDocumentDetails(documentId),
	);

	function handleViewDocumentDetails(documentId: string) {
		setSelectedId(documentId);
		setIsDetailsDrawerOpen(true);
	}

	const columns = useMemo(
		() => getDocumentColumns({ onViewDocumentDetails: handleViewDocumentDetails }),
		[],
	);
	const table = useReactTable({
		data: documents,
		columns,
		enableRowSelection: true,
		getRowId: (row) => row.documentId,
		onSortingChange: setSorting,
		onRowSelectionChange: setSelectedDocumentRows,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		state: { sorting, rowSelection: selectedDocumentRows },
	});
	const selectedDocuments = table.getSelectedRowModel().rows.map((row) => row.original);

	return (
		<div className="px-6 py-8 text-sm">
			<h1 className="mx-auto max-w-7xl text-xl font-semibold no-line-height">Documents</h1>
			<div className="mx-auto mt-7 mb-4 flex max-w-7xl items-center gap-2">
				<div className="relative w-full">
					<RiSearchLine className="pointer-events-none absolute bottom-0 left-2 flex h-full size-4 items-center justify-center text-gray-400" />
					<Input
						type="search"
						className="pl-8"
						placeholder="Search by name, document ID, or encounter ID"
						value={query}
						onChange={(event) => onQueryChange(event.target.value)}
					/>
				</div>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button
							variant="outline"
							className="bg-white text-sm text-gray-600 hover:bg-gray-50"
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
							open={activeFilterSubmenu === "document-type"}
							onOpenChange={(isDocumentTypeSubmenuOpen) => {
								setActiveFilterSubmenu((prev) => {
									if (isDocumentTypeSubmenuOpen) return "document-type";
									if (prev === "document-type") return null;
									return prev;
								});
							}}
						>
							<DropdownMenuSubTrigger className="rounded-lg py-2 focus:bg-gray-100 focus:text-gray-900 data-[state=open]:bg-gray-100">
								<RiFileTextLine className="size-4.5" />
								<span>Document Type </span>
							</DropdownMenuSubTrigger>
							<DropdownMenuSubContent
								alignOffset={-5}
								className="w-[13.75rem] rounded-xl border border-gray-200 bg-white p-1 text-sm text-gray-700 shadow-xl"
							>
								{DOCUMENT_TYPE.map((documentType) => {
									const documentTypeId = `document-type-${documentType.toLowerCase().replaceAll(" ", "-")}`;
									return (
										<DropdownMenuItem
											key={documentType}
											className="rounded-lg p-0 focus:bg-gray-100 focus:text-gray-900"
											onSelect={(event) => event.preventDefault()}
										>
											<Label
												htmlFor={documentTypeId}
												className="flex w-full cursor-pointer items-center gap-3 px-2 py-2 leading-normal font-normal"
											>
												<Checkbox
													id={documentTypeId}
													checked={documentTypeFilters.includes(documentType)}
													onCheckedChange={(checked) =>
														onDocumentTypeFiltersChange(
															checked
																? [...documentTypeFilters, documentType]
																: documentTypeFilters.filter((docType) => docType !== documentType),
														)
													}
													className="[&_svg]:!text-current"
												/>
												<span>{documentType}</span>
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
							<DropdownMenuSubTrigger className="rounded-lg py-2 focus:bg-gray-100 focus:text-gray-900 data-[state=open]:bg-gray-100">
								<RiCalendarLine className="size-4.5" />
								<span>Created at</span>
							</DropdownMenuSubTrigger>
							<DropdownMenuSubContent
								alignOffset={-5}
								className="w-max max-w-[calc(100vw-2rem)] rounded-xl border border-gray-200 bg-white p-0 text-sm text-gray-700 shadow-xl"
							>
								<DocumentDateFilterContent
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
					className="border-gray-200 bg-white text-sm text-gray-600 hover:bg-gray-50"
				>
					<RiShare2Line aria-hidden className="size-5 text-gray-600" />
					Export
				</Button>
				<Button
					type="button"
					className="bg-gray-800 text-sm"
					onClick={() => setIsCreateDrawerOpen(true)}
				>
					Add document
				</Button>
			</div>
			<DocumentActiveFilterPills
				createdFrom={createdFrom}
				createdTo={createdTo}
				documentTypeFilters={documentTypeFilters}
				onCreatedAtRangeApply={onCreatedAtRangeApply}
				onDocumentTypeFiltersChange={onDocumentTypeFiltersChange}
			/>
			<div className="mx-auto max-w-7xl overflow-x-auto rounded-xl border border-gray-200 text-sm">
				<Table className="min-w-[58rem] border-separate border-spacing-0 bg-gray-50 text-left">
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
											if (header.column.getCanSort() && (event.key === "Enter" || event.key === " ")) {
												event.preventDefault();
												header.column.getToggleSortingHandler()?.(event);
											}
										}}
										className={cn(
											"z-10 h-10 bg-gray-50 px-3 py-0 text-gray-600 whitespace-nowrap",
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
															header.column.getIsSorted() === "desc" && "opacity-30",
														)}
														aria-hidden
													/>
													<RiArrowDownSLine
														className={cn(
															"size-4 text-gray-800",
															header.column.getIsSorted() === "asc" && "opacity-30",
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
								onClick={() => handleViewDocumentDetails(row.original.documentId)}
								onKeyDown={(event) => {
									if (event.key === "Enter" || event.key === " ") {
										event.preventDefault();
										handleViewDocumentDetails(row.original.documentId);
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
						))}
						{table.getRowModel().rows.length === 0 ? (
							<TableRow>
								<TableCell
									colSpan={columns.length}
									className="h-32 bg-white px-3 py-0 text-center text-sm text-gray-500"
								>
									No matching documents found.
								</TableCell>
							</TableRow>
						) : null}
					</TableBody>
				</Table>
				<div className="flex gap-3 border-t border-gray-200 bg-white p-3 text-sm text-gray-500 items-center justify-between">
					<div className="flex items-center gap-3">
						<span>Rows per page</span>
						<Select
							value={String(limit)}
							onValueChange={(value) => {
								onLimitChange(Number(value));
							}}
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
								disabled={page <= 1 || isPending}
								onClick={onPreviousPage}
								className="border-gray-200 px-3 text-gray-700 shadow-none transition"
							>
								Previous
							</Button>
							<Button
								type="button"
								variant="outline"
								size="sm"
								disabled={page >= totalPages || isPending}
								onClick={onNextPage}
								className="border-gray-200 px-3 text-gray-700 shadow-none transition"
							>
								Next
							</Button>
						</div>
					</div>
				</div>
			</div>
			<DocumentsBulkActionBar
				selectedDocuments={selectedDocuments}
				onClearSelection={() => table.resetRowSelection()}
				onViewDocumentDetails={handleViewDocumentDetails}
			/>
			<DocumentDetailsDrawerComponent
				open={isDetailsDrawerOpen}
				onOpenChange={setIsDetailsDrawerOpen}
				document={documentDetailsQuery.data ?? null}
				isLoading={documentDetailsQuery.isLoading}
				onChanged={() => {
					void documentDetailsQuery.mutate();
					onDocumentsChanged();
				}}
			/>
			<CreateDocumentDrawerComponent
				open={isCreateDrawerOpen}
				onOpenChange={setIsCreateDrawerOpen}
				patientId={patientId}
				onCreated={onDocumentsChanged}
			/>
		</div>
	);
}

function DocumentsBulkActionBar({
	selectedDocuments,
	onClearSelection,
	onViewDocumentDetails,
}: {
	selectedDocuments: DocumentType[];
	onClearSelection: () => void;
	onViewDocumentDetails: (documentId: string) => void;
}) {
	const selectedDocumentCount = selectedDocuments.length;
	const singleSelectedDocument = selectedDocumentCount === 1 ? selectedDocuments[0] : undefined;

	if (selectedDocumentCount === 0) return null;

	return (
		<div className="no-scrollbar fixed right-4 bottom-6 left-4 z-50 flex h-12 items-center gap-4 overflow-x-auto rounded-xl border border-white/20 bg-gray-800 pl-4 pr-2 text-white shadow-[0_1rem_2.5rem_rgba(15,23,42,0.35)] ring ring-gray-800 sm:right-auto sm:left-1/2 sm:w-max sm:max-w-[calc(100vw-2rem)] sm:-translate-x-1/2">
			<span className="shrink-0 whitespace-nowrap text-sm font-medium">
				{selectedDocumentCount} {selectedDocumentCount === 1 ? "item" : "items"} selected
			</span>
			<TableBulkActionSeparator />
			<div className="flex items-center">
				{singleSelectedDocument ? (
					<button
						type="button"
						onClick={() => onViewDocumentDetails(singleSelectedDocument.documentId)}
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
					<span>Export {selectedDocumentCount > 1 ? "all" : null}</span>
				</button>
				<button
					type="button"
					className="inline-flex h-8 shrink-0 items-center gap-2 rounded-md px-2.5 text-sm font-medium text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
				>
					<RiArchiveLine className="size-5" aria-hidden />
					<span>Archive {selectedDocumentCount > 1 ? "all" : null}</span>
				</button>
			</div>
			<button
				type="button"
				onClick={onClearSelection}
				className="inline-flex size-8 shrink-0 items-center justify-center rounded-md text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
				aria-label="Clear selected documents"
			>
				<RiCloseLine className="size-5" aria-hidden />
			</button>
		</div>
	);
}

function DocumentActiveFilterPills({
	createdFrom,
	createdTo,
	documentTypeFilters,
	onCreatedAtRangeApply,
	onDocumentTypeFiltersChange,
}: {
	createdFrom: string;
	createdTo: string;
	documentTypeFilters: string[];
	onCreatedAtRangeApply: (from: string, to: string) => void;
	onDocumentTypeFiltersChange: (documentTypes: string[]) => void;
}) {
	const hasCreatedAtFilter = Boolean(createdFrom || createdTo);
	const hasDocumentTypeFilters = documentTypeFilters.length > 0;

	if (!hasCreatedAtFilter && !hasDocumentTypeFilters) return null;

	return (
		<div className="mx-auto mb-4 flex max-w-7xl flex-wrap gap-2">
			{documentTypeFilters.map((documentType) => (
				<DocumentFilterPill
					key={documentType}
					label={`Document type: ${documentType}`}
					onRemove={() => {
						onDocumentTypeFiltersChange(
							documentTypeFilters.filter((currentDocumentType) => currentDocumentType !== documentType),
						);
					}}
				/>
			))}
			{hasCreatedAtFilter ? (
				<DocumentFilterPill
					label={`Created: ${formatDocumentDateRangeFilterLabel(createdFrom, createdTo)}`}
					onRemove={() => onCreatedAtRangeApply("", "")}
				/>
			) : null}
		</div>
	);
}

function DocumentFilterPill({ label, onRemove }: { label: string; onRemove: () => void }) {
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

function DocumentDateFilterContent({
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
				<DocumentDatePresetList from={from} to={to} onDateRangeApply={onDateRangeApply} />
			</div>
			<div className="w-88 shrink-0 border-l border-gray-100 p-3">
				<DocumentCustomRangeCalendarPanel
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

function DocumentDatePresetList({
	from,
	to,
	onDateRangeApply,
}: {
	from: string;
	to: string;
	onDateRangeApply: (from: string, to: string) => void;
}) {
	const selectedDocumentDateRange = getDocumentDateRangeFromParams(from, to);
	const today = new Date();

	return documentDateFilterPresets.map((preset) => {
		const presetRange = preset.getRange(today);
		const isSelected = isSameDocumentDateRange(selectedDocumentDateRange, presetRange);

		return (
			<DropdownMenuItem
				key={preset.label}
				onSelect={(event) => {
					event.preventDefault();
					onDateRangeApply(formatDocumentUrlDate(presetRange.from), formatDocumentUrlDate(presetRange.to));
				}}
				className="flex h-9 w-full items-center justify-between rounded-lg px-3 text-left font-medium text-gray-700 focus:bg-gray-50"
			>
				<span>{preset.label}</span>
				{isSelected ? <RiCheckLine className="size-5 text-gray-700" aria-hidden="true" /> : null}
			</DropdownMenuItem>
		);
	});
}

function DocumentCustomRangeCalendarPanel({
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
	const selectedDocumentDateRange = getDocumentDateRangeFromParams(from, to);
	const [draftDocumentDateRange, setDraftDocumentDateRange] = useState<DateRange | undefined>(
		selectedDocumentDateRange,
	);

	return (
		<div className="flex min-w-0 flex-col">
			<div className="flex items-center gap-3">
				<DocumentDateFieldPlaceholder value={draftDocumentDateRange?.from} label="Start date" />
				<RiArrowRightLine className="size-5 shrink-0 text-gray-400" aria-hidden="true" />
				<DocumentDateFieldPlaceholder value={draftDocumentDateRange?.to} label="End date" />
			</div>
			<Calendar
				mode="range"
				selected={draftDocumentDateRange}
				onSelect={setDraftDocumentDateRange}
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
						setDraftDocumentDateRange(undefined);
						onDateRangeApply("", "");
					}}
				>
					Reset
				</Button>
				<Button
					type="button"
					className="min-w-40 flex-1 text-sm"
					disabled={!draftDocumentDateRange?.from || !draftDocumentDateRange?.to || isPending}
					onClick={() => {
						if (!draftDocumentDateRange?.from || !draftDocumentDateRange?.to) return;

						onDateRangeApply(
							formatDocumentUrlDate(draftDocumentDateRange.from),
							formatDocumentUrlDate(draftDocumentDateRange.to),
						);
					}}
				>
					Apply
				</Button>
			</div>
		</div>
	);
}

function DocumentDateFieldPlaceholder({ label, value }: { label: string; value?: Date }) {
	return (
		<div className="flex h-9 min-w-0 flex-1 items-center gap-3 rounded-lg border border-gray-200 bg-white px-2 text-left text-sm font-medium text-gray-500">
			<RiCalendarLine className="size-5 shrink-0 text-gray-400" aria-hidden="true" />
			<span className="sr-only">{label}</span>
			<span className="truncate">{value ? format(value, "dd/MM/yyyy") : "DD/MM/YYYY"}</span>
		</div>
	);
}

function formatDocumentDateRangeFilterLabel(from: string, to: string) {
	const parsedFromDate = parseDateParam(from);
	const parsedToDate = parseDateParam(to);

	if (parsedFromDate && parsedToDate) {
		return `${format(parsedFromDate, "MMM d, yyyy")} - ${format(parsedToDate, "MMM d, yyyy")}`;
	}

	if (parsedFromDate) return `From ${format(parsedFromDate, "MMM d, yyyy")}`;
	if (parsedToDate) return `Until ${format(parsedToDate, "MMM d, yyyy")}`;

	return "Any date";
}

function getDocumentDateRangeFromParams(from: string, to: string): DateRange | undefined {
	const parsedFromDate = parseDateParam(from);
	const parsedToDate = parseDateParam(to);

	if (!parsedFromDate && !parsedToDate) return undefined;

	return { from: parsedFromDate, to: parsedToDate };
}

function isSameDocumentDateRange(
	range: DateRange | undefined,
	presetRange: DocumentDateCompleteRange,
) {
	if (!range?.from || !range.to) return false;

	return isSameDay(range.from, presetRange.from) && isSameDay(range.to, presetRange.to);
}

function formatDocumentUrlDate(date: Date) {
	return format(date, "yyyy-MM-dd");
}

function getDocumentColumns({
	onViewDocumentDetails,
}: {
	onViewDocumentDetails: (documentId: string) => void;
}): ColumnDef<DocumentType>[] {
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
						onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
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
						onCheckedChange={(value) => row.toggleSelected(!!value)}
					/>
				</div>
			),
			enableSorting: false,
		},
		{
			header: "Document",
			accessorKey: "title",
			enableSorting: true,
			cell: ({ row }) => (
				<div className="w-max" onClick={(event) => event.stopPropagation()}>
					<span className="font-medium text-gray-800">{row.original.title}</span>
				</div>
			),
		},
		{
			header: "Document ID",
			accessorKey: "documentId",
			enableSorting: false,
			cell: ({ row }) => (
				<div onKeyDown={(event) => event.stopPropagation()}>
					<CopyIdButton id={row.original.documentId} />
				</div>
			),
		},
		{
			header: "Document Type",
			accessorKey: "documentType",
			enableSorting: true,
			cell: ({ row }) => (
				<div className="w-max" onClick={(event) => event.stopPropagation()}>
					{row.original.documentType}
				</div>
			),
		},
		{
			id: "createdAt",
			header: "Created At",
			accessorFn: (row) => row.createdAtSortValue,
			enableSorting: true,
			cell: ({ row }) => (
				<div className="w-max" onClick={(event) => event.stopPropagation()}>
					{row.original.createdAtLabel}
				</div>
			),
		},
		{
			id: "actions",
			header: "",
			enableSorting: false,
			cell: ({ row }) => (
				<div
					className="flex justify-end"
					onClick={(event) => event.stopPropagation()}
					onKeyDown={(event) => event.stopPropagation()}
				>
					<DropdownMenu>
						<DropdownMenuTrigger
							type="button"
							className="inline-flex size-9 items-center justify-center rounded-md border border-transparent text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
							aria-label={`Open actions for ${row.original.title}`}
						>
							<RiMore2Fill className="size-5" aria-hidden />
						</DropdownMenuTrigger>
						<DropdownMenuContent
							align="end"
							className="w-[13.75rem] rounded-xl border-white/20 bg-gray-800 text-sm text-white ring ring-gray-800"
						>
							<DropdownMenuItem
								className="gap-3 rounded-lg py-2 text-white focus:bg-white/10 focus:text-white"
								onSelect={() => onViewDocumentDetails(row.original.documentId)}
							>
								<RiEyeLine className="text-white" />
								<span>View details</span>
							</DropdownMenuItem>
							<DropdownMenuItem
								className="gap-3 rounded-lg py-2 text-white focus:bg-white/10 focus:text-white"
								onSelect={() => onViewDocumentDetails(row.original.documentId)}
							>
								<RiFileTextLine className="text-white" />
								<span>Open</span>
							</DropdownMenuItem>
							<DropdownMenuItem className="gap-3 rounded-lg py-2 text-white focus:bg-white/10 focus:text-white">
								<RiShare2Line className="text-white" />
								<span>Export</span>
							</DropdownMenuItem>
							<DropdownMenuSeparator className="bg-white/20" />
							<DropdownMenuItem className="gap-3 rounded-lg py-2 text-white focus:bg-white/10 focus:text-white">
								<RiCloseLine className="text-white" />
								<span>Remove</span>
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			),
		},
	];
}

function LegacyDocumentDetailsDrawer({
	open,
	onOpenChange,
	document,
	isLoading,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	document: DocumentType | null;
	isLoading: boolean;
}) {
	const [mode, setMode] = useState<"view" | "edit">("view");
	const [actionError, setActionError] = useState("");
	const [isDocumentActionPending, startDocumentActionTransition] = useTransition();
	const isEditing = mode === "edit" && Boolean(document);

	function handleOpenChange(nextOpen: boolean) {
		if (!nextOpen) setMode("view");
		onOpenChange(nextOpen);
	}

	function handleUpdateDocument(formData: FormData) {
		if (!document) return;
		setActionError("");
		startDocumentActionTransition(async () => {
			const result = await updatePatientDocumentAction(document.documentId, formData);
			if (!result.ok) {
				setActionError(result.message ?? "");
				return;
			}
			setMode("view");
		});
	}

	function handleRemoveDocument() {
		if (!document) return;
		setActionError("");
		startDocumentActionTransition(async () => {
			const result = await removePatientDocumentAction(document.documentId);
			if (!result.ok) {
				setActionError(result.message ?? "");
				return;
			}
			onOpenChange(false);
		});
	}

	return (
		<Drawer open={open} onOpenChange={handleOpenChange} direction="right">
			<DrawerContent className="overflow-hidden rounded-3xl text-sm data-[vaul-drawer-direction=right]:top-4 data-[vaul-drawer-direction=right]:right-4 data-[vaul-drawer-direction=right]:bottom-4 data-[vaul-drawer-direction=right]:h-auto data-[vaul-drawer-direction=right]:w-[50rem]">
				<DrawerHeader className="flex-row items-center justify-between border-b border-gray-200 px-6 py-5 text-left">
					<DrawerTitle className="text-lg text-gray-800">
						{isEditing ? "Edit document details" : "View document details"}
					</DrawerTitle>
					<DrawerClose aria-label="Close document details">
						<RiCloseLine className="size-6" />
					</DrawerClose>
					<DrawerDescription className="sr-only">
						Details for the selected patient document.
					</DrawerDescription>
				</DrawerHeader>
				<div className="min-h-0 overflow-y-auto px-6 py-8">
					{isLoading ? (
						<div className="space-y-4" aria-busy="true">
							<div className="h-6 w-48 animate-pulse rounded bg-gray-100" />
							<div className="h-40 animate-pulse rounded-xl bg-gray-100" />
						</div>
					) : document ? (
						isEditing ? (
							<DocumentEditForm document={document} onSubmit={handleUpdateDocument} />
						) : (
							<DocumentOverview document={document} onEdit={() => setMode("edit")} />
						)
					) : (
						<p className="text-gray-500">Document details could not be found.</p>
					)}
					{actionError ? <p className="px-6 pb-2 text-sm text-red-600">{actionError}</p> : null}
				</div>
				<DrawerFooter className="border-t border-gray-200 px-6 py-5">
					{isEditing ? (
						<div className="ml-auto flex gap-4">
							<Button type="button" variant="outline" onClick={() => setMode("view")}>
								Cancel
							</Button>
							<Button
								type="submit"
								form="document-details-edit-form"
								disabled={isDocumentActionPending}
							>
								Save changes
							</Button>
						</div>
					) : (
						<div className="ml-auto flex gap-4">
							<DrawerClose asChild>
								<Button type="button" variant="outline">
									Cancel
								</Button>
							</DrawerClose>
							<Button
								type="button"
								className="bg-gray-800"
								disabled={isDocumentActionPending}
								onClick={handleRemoveDocument}
							>
								Remove document
							</Button>
						</div>
					)}
				</DrawerFooter>
			</DrawerContent>
		</Drawer>
	);
}

function DocumentOverview({ document, onEdit }: { document: DocumentType; onEdit: () => void }) {
	return (
		<div className="flex flex-col gap-10">
			<div className="flex flex-wrap gap-x-8 gap-y-3">
				<div className="flex items-center gap-2">
					<span className="text-gray-400">Document ID:</span>
					<CopyIdButton id={document.documentId} />
				</div>
				{document.encounterId ? (
					<div className="flex items-center gap-2">
						<span className="text-gray-400">Encounter ID:</span>
						<CopyIdButton id={document.encounterId} />
					</div>
				) : null}
			</div>
			<div className="flex items-center justify-between gap-4">
				<h2 className="text-xl font-semibold text-gray-800">{document.title}</h2>
				<Button type="button" variant="ghost" onClick={onEdit} className="text-gray-500">
					<RiEditLine className="size-4" />
					Edit
				</Button>
			</div>
			<div className="grid grid-cols-1 gap-x-16 gap-y-6 sm:grid-cols-2">
				<DocumentDetail label="Document type" value={document.documentType} />
				<DocumentDetail label="Clinical notes" value={document.clinicalNotes} />
				<DocumentDetail label="Created by" value={document.createdBy} />
				<DocumentDetail label="Created at" value={document.createdAtLabel} />
				<DocumentDetail label="Updated by" value={document.updatedBy} />
				<DocumentDetail label="Updated at" value={document.updatedAtLabel} />
			</div>
			<div>
				<h3 className="mb-4 text-lg font-semibold text-gray-800">Files</h3>
				<div className="flex flex-col gap-3">
					{document.files.map((file) => (
						<div
							key={file.url}
							className="flex items-center gap-4 rounded-2xl border border-gray-200 p-4"
						>
							<div className="min-w-0 flex-1">
								<p className="truncate font-semibold text-gray-800">{file.name}</p>
								<p className="mt-1 text-gray-400">
									{file.size} - Uploaded on {file.uploadedAt.slice(0, 10)}
								</p>
							</div>
							<Button asChild type="button">
								<a href={file.url}>Open</a>
							</Button>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}

function DocumentDetail({ label, value }: { label: string; value: string }) {
	return (
		<div className="flex flex-col gap-2">
			<span className="text-gray-400">{label}</span>
			<span className="font-semibold text-gray-600">{value || "-"}</span>
		</div>
	);
}

function DocumentEditForm({
	document,
	onSubmit,
}: {
	document: DocumentType;
	onSubmit: (formData: FormData) => void;
}) {
	return (
		<form
			id="document-details-edit-form"
			action={onSubmit}
			className="grid grid-cols-1 gap-6 sm:grid-cols-2"
		>
			<div className="flex flex-col gap-2">
				<Label htmlFor="document-title">Document title</Label>
				<Input id="document-title" name="title" defaultValue={document.title} required />
			</div>
			<div className="flex flex-col gap-2">
				<Label>Document type</Label>
				<Select name="documentType" defaultValue={document.documentType}>
					<SelectTrigger>
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value={document.documentType}>{document.documentType}</SelectItem>
					</SelectContent>
				</Select>
			</div>

			<div className="flex flex-col gap-2 sm:col-span-2">
				<Label htmlFor="document-notes">Clinical notes</Label>
				<Textarea
					id="document-notes"
					name="clinicalNotes"
					defaultValue={document.clinicalNotes === "-" ? "" : document.clinicalNotes}
					className="min-h-32"
				/>
			</div>
		</form>
	);
}

function LegacyCreateDocumentDrawer({
	open,
	onOpenChange,
	patientId,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	patientId: string;
}) {
	const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
	const [formError, setFormError] = useState("");
	const [isCreatingDocument, startCreateDocumentTransition] = useTransition();

	function handleCreateDocument(formData: FormData) {
		setFormError("");
		startCreateDocumentTransition(async () => {
			const result = await createPatientDocumentAction(patientId, formData);
			if (!result.ok) {
				setFormError(result.message ?? "");
				return;
			}
			setSelectedFiles([]);
			onOpenChange(false);
		});
	}

	return (
		<Drawer open={open} onOpenChange={onOpenChange} direction="right">
			<DrawerContent className="overflow-hidden rounded-3xl text-sm data-[vaul-drawer-direction=right]:top-4 data-[vaul-drawer-direction=right]:right-4 data-[vaul-drawer-direction=right]:bottom-4 data-[vaul-drawer-direction=right]:h-auto data-[vaul-drawer-direction=right]:w-[50rem]">
				<DrawerHeader className="flex-row items-center justify-between border-b border-gray-200 px-6 py-5 text-left">
					<DrawerTitle className="text-lg text-gray-800">Add document</DrawerTitle>
					<DrawerClose aria-label="Close add document">
						<RiCloseLine className="size-5" />
					</DrawerClose>
					<DrawerDescription className="sr-only">
						Add document metadata and choose mock local files.
					</DrawerDescription>
				</DrawerHeader>
				<form
					id="create-document-form"
					action={handleCreateDocument}
					className="min-h-0 flex-1 space-y-6 overflow-y-auto px-6 py-8"
				>
					<div className="grid gap-6 sm:grid-cols-2">
						<div className="flex flex-col gap-2">
							<Label htmlFor="new-document-title">
								Document title <span className="text-gray-400">(required)</span>
							</Label>
							<Input
								id="new-document-title"
								name="title"
								placeholder="e.g. Complete Blood Count Report"
								required
							/>
						</div>

						<div className="flex flex-col gap-2">
							<Label>
								Document Type <span className="text-gray-400">(required)</span>
							</Label>
							<Select name="document type" required>
								<SelectTrigger className="w-full">
									<SelectValue placeholder="Select document type" />
								</SelectTrigger>
								<SelectContent>
									{DOCUMENT_TYPE.map((documentType) => (
										<SelectItem
											value={documentType}
											key={documentType}
											className="rounded-md px-3 h-9"
										>
											{documentType}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-2 sm:col-span-2">
							<Label htmlFor="new-document-notes">
								Clinical notes <span className="text-gray-400">(optional)</span>
							</Label>
							<Textarea
								id="new-document-notes"
								name="clinicalNotes"
								className="min-h-32"
								placeholder="Add notes or context about this document"
							/>
						</div>
					</div>
					<div className="space-y-3">
						<Label htmlFor="mock-document-files">
							Files <span className="text-gray-400">(mock only)</span>
						</Label>
						<label
							htmlFor="mock-document-files"
							className="flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 p-6 text-center transition hover:bg-gray-50"
						>
							<RiUploadCloud2Line className="mb-3  text-gray-500" />
							<span className="font-medium text-gray-800">
								Choose one or more files or drag and drop them here.
							</span>
							<span className="mt-1 text-gray-500">
								Supports JPEG, PNG, and PDF, up to 50 MB. Files are not uploaded.
							</span>
							<span className="mt-4 rounded-md border border-gray-200 bg-white px-4 py-2 font-medium text-gray-600 shadow-xs">
								Browse files
							</span>
						</label>
						<input
							id="mock-document-files"
							type="file"
							accept="image/jpeg,image/png,application/pdf"
							multiple
							className="sr-only"
							onChange={(event) => setSelectedFiles(Array.from(event.target.files ?? []))}
						/>
						{selectedFiles.map((file) => (
							<div
								key={`${file.name}-${file.lastModified}`}
								className="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3"
							>
								<span className="min-w-0 truncate font-medium text-gray-700">{file.name}</span>
								<button
									type="button"
									className="text-gray-500 hover:text-gray-800"
									onClick={() =>
										setSelectedFiles((prev) => prev.filter((selectedFile) => selectedFile !== file))
									}
								>
									Remove
								</button>
							</div>
						))}
					</div>
					{formError ? <p className="text-red-600">{formError}</p> : null}
				</form>
				<DrawerFooter className="border-t border-gray-200 px-6 py-5">
					<div className="ml-auto flex gap-4">
						<DrawerClose asChild>
							<Button variant="outline">Cancel</Button>
						</DrawerClose>
						<Button
							type="submit"
							form="create-document-form"
							className="bg-gray-800"
							disabled={isCreatingDocument}
						>
							Add document
						</Button>
					</div>
				</DrawerFooter>
			</DrawerContent>
		</Drawer>
	);
}

async function fetchPatientDocumentDetails(documentId: string) {
	const response = await fetch(`/api/patient-document-details/${encodeURIComponent(documentId)}`);
	if (!response.ok) throw new Error("Unable to load document details.");
	const result = (await response.json()) as { document: DocumentType | null };
	return result.document;
}
