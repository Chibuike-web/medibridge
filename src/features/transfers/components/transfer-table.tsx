"use client";

import { useCallback, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { CopyIdButton } from "@/components/copy-id-button";
import { StatusBadge } from "@/components/status-badge";
import { TableBulkActionSeparator } from "@/components/table-bulk-action-separator";
import { TransferDetailsDrawer } from "@/features/transfers/components/transfer-details-drawer";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
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
import { formatDate } from "@/lib/utils/format-date";
import { getInitials } from "@/lib/utils/get-initials";
import {
	ColumnDef,
	flexRender,
	getCoreRowModel,
	getSortedRowModel,
	type OnChangeFn,
	type RowSelectionState,
	type SortingState,
	useReactTable,
} from "@tanstack/react-table";
import {
	RiAddLine,
	RiArchiveLine,
	RiArrowDownSLine,
	RiArrowUpSLine,
	RiCloseLine,
	RiCornerDownLeftFill,
	RiEdit2Line,
	RiEyeLine,
	RiMore2Fill,
	RiSendPlaneLine,
	RiShare2Line,
} from "@remixicon/react";
import type { TransferDetailsType, TransferType } from "../types";
import { IndeterminateCheckbox } from "@/components/indeterminate-checkbox";
import useSWR from "swr";

const ROWS_PER_PAGE_OPTIONS = [14, 28, 42];

export function TransferTable({
	data,
	page,
	limit,
	totalPages,
	isPending,
	onPreviousPage,
	onNextPage,
	onLimitChange,
}: {
	data: TransferType[];
	page: number;
	limit: number;
	totalPages: number;
	isPending: boolean;
	onPreviousPage: () => void;
	onNextPage: () => void;
	onLimitChange: (value: string) => void;
}) {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const returnTo = getCurrentRoute(pathname, searchParams);
	const visibleTransferRowIds = useMemo(
		() => data.map((transfer) => transfer.id).join(","),
		[data],
	);
	const [sorting, setSorting] = useState<SortingState>([{ id: "patientName", desc: false }]);
	const [selectedTransferId, setSelectedTransferId] = useState<string | null>(null);
	const transferDetailsQuery = useSWR(
		selectedTransferId ? (["transfer-details", selectedTransferId] as const) : null,
		([, selectedTransferId]) => fetchTransferDetails(selectedTransferId),
	);

	const onViewTransferDetails = useCallback((transferId: string) => {
		setSelectedTransferId(transferId);
	}, []);

	const columns = useMemo(() => {
		return getTransferColumns(onViewTransferDetails, router, returnTo);
	}, [onViewTransferDetails, router, returnTo]);

	return (
		<>
			<TransferTableContent
				key={visibleTransferRowIds}
				data={data}
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
				onViewTransferDetails={onViewTransferDetails}
			/>
			<TransferDetailsDrawer
				open={selectedTransferId !== null}
				onOpenChange={(open) => {
					if (!open) {
						setSelectedTransferId(null);
					}
				}}
				transfer={transferDetailsQuery.data ?? null}
				isLoading={transferDetailsQuery.isLoading}
			/>
		</>
	);
}

function TransferTableContent({
	data,
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
	onViewTransferDetails,
}: {
	data: TransferType[];
	columns: ColumnDef<TransferType>[];
	sorting: SortingState;
	onSortingChange: OnChangeFn<SortingState>;
	page: number;
	limit: number;
	totalPages: number;
	isPending: boolean;
	onPreviousPage: () => void;
	onNextPage: () => void;
	onLimitChange: (value: string) => void;
	onViewTransferDetails: (transferId: string) => void;
}) {
	const [selectedTransferRows, setSelectedTransferRows] = useState<RowSelectionState>({});
	const table = useReactTable({
		data,
		columns,
		enableRowSelection: true,
		getRowId: (row) => row.id,
		onSortingChange,
		onRowSelectionChange: setSelectedTransferRows,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		state: {
			sorting,
			rowSelection: selectedTransferRows,
		},
	});

	const selectedTransfers = table.getSelectedRowModel().rows.map((row) => row.original);

	return (
		<>
			<div className="overflow-x-auto rounded-xl border border-gray-200 text-sm">
				<Table className="min-w-[62.5rem] border-separate border-spacing-0 bg-gray-50 text-left">
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
											"z-10 h-10 px-3 py-0 whitespace-nowrap text-gray-600 bg-gray-50",
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
														aria-hidden={true}
													/>
													<RiArrowDownSLine
														className={cn(
															"size-4 text-gray-800",
															header.column.getIsSorted() === "asc" ? "opacity-30" : "",
														)}
														aria-hidden={true}
													/>
												</div>
											) : null}
										</div>
									</TableHead>
								))}
							</TableRow>
						))}
					</TableHeader>
					<TableBody className="rounded-t-xl outline outline-gray-200">
						{table.getRowModel().rows.length > 0 ? (
							table.getRowModel().rows.map((row, rowPosition) => (
								<TableRow
									key={row.id}
									role="button"
									tabIndex={0}
									onClick={() => onViewTransferDetails(row.original.id)}
									onKeyDown={(event) => {
										if (event.key === "Enter" || event.key === " ") {
											event.preventDefault();
											onViewTransferDetails(row.original.id);
										}
									}}
									className="group h-14 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gray-400"
								>
									{row.getVisibleCells().map((cell) => (
										<TableCell
											key={cell.id}
											className={cn(
												"h-14 border-b border-gray-200 px-3 py-0 text-sm text-gray-600 transition-colors group-hover:bg-gray-100",
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
									No transfers found.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
				<div className="flex gap-3 border-t border-gray-200 bg-white p-3 text-sm text-gray-500 items-center justify-between">
					<div className="flex items-center gap-3">
						<span>Rows per page</span>
						<Select value={limit.toString()} onValueChange={onLimitChange} disabled={isPending}>
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
			<TransferBulkActionBar
				selectedTransfers={selectedTransfers}
				onClearSelection={() => table.resetRowSelection()}
				onViewTransferDetails={onViewTransferDetails}
			/>
		</>
	);
}

function TransferBulkActionBar({
	selectedTransfers,
	onClearSelection,
	onViewTransferDetails,
}: {
	selectedTransfers: TransferType[];
	onClearSelection: () => void;
	onViewTransferDetails: (transferId: string) => void;
}) {
	const selectedTransferCount = selectedTransfers.length;
	const singleSelectedTransfer = selectedTransferCount === 1 ? selectedTransfers[0] : undefined;

	if (selectedTransferCount === 0) {
		return null;
	}

	return (
		<div className="no-scrollbar fixed right-4 bottom-6 left-4 z-50 flex items-center gap-4 overflow-x-auto rounded-xl border border-white/20 bg-gray-800 pl-4 pr-2 h-12 text-white shadow-[0_1rem_2.5rem_rgba(15,23,42,0.35)] ring ring-gray-800 sm:right-auto sm:left-1/2 sm:w-max sm:max-w-[calc(100vw-2rem)] sm:-translate-x-1/2">
			<span className="shrink-0 whitespace-nowrap text-sm font-medium">
				{selectedTransferCount} {selectedTransferCount === 1 ? "item" : "items"} selected
			</span>
			<TableBulkActionSeparator />
			<div className="flex items-center">
				{singleSelectedTransfer ? (
					<>
						<button
							type="button"
							onClick={() => onViewTransferDetails(singleSelectedTransfer.id)}
							className="inline-flex h89 shrink-0 items-center gap-2 rounded-lg px-2.5 text-sm font-medium text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
						>
							<RiEyeLine className="size-5" aria-hidden={true} />
							<span>View transfer details</span>
						</button>
					</>
				) : null}
				<button
					type="button"
					className="inline-flex h-8 shrink-0 items-center gap-2 rounded-md px-2.5 text-sm font-medium text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
				>
					<RiShare2Line className="size-5" aria-hidden={true} />
					<span>Export {selectedTransferCount > 1 ? "all" : null}</span>
				</button>
				<button
					type="button"
					className="inline-flex h-8 shrink-0 items-center gap-2 rounded-md px-2.5 text-sm font-medium text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
				>
					<RiArchiveLine className="size-5" aria-hidden={true} />
					<span>Archive {selectedTransferCount > 1 ? "all" : null}</span>
				</button>
			</div>
			<button
				type="button"
				onClick={onClearSelection}
				className="inline-flex size-8 shrink-0 items-center justify-center rounded-md text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
				aria-label="Clear selected transfers"
			>
				<RiCloseLine className="size-5" aria-hidden={true} />
			</button>
		</div>
	);
}

function getTransferColumns(
	onViewTransferDetails: (transferId: string) => void,
	router: ReturnType<typeof useRouter>,
	returnTo: string,
): ColumnDef<TransferType>[] {
	return [
		{
			id: "select",
			header: ({ table }) => (
				<IndeterminateCheckbox
					checked={table.getIsAllRowsSelected()}
					indeterminate={table.getIsSomeRowsSelected()}
					onCheckedChange={(value) => {
						table.toggleAllRowsSelected(!!value);
					}}
				/>
			),
			cell: ({ row }) => (
				<IndeterminateCheckbox
					checked={row.getIsSelected()}
					disabled={!row.getCanSelect()}
					indeterminate={row.getIsSomeSelected()}
					onCheckedChange={(value) => {
						row.toggleSelected(!!value);
					}}
				/>
			),
		},
		{
			header: "Patient Name",
			accessorKey: "patientName",
			enableSorting: true,
			cell: ({ row }) => (
				<div className="flex items-center gap-3">
					<Avatar className="size-9 border border-gray-200 bg-gray-100 text-gray-700">
						<AvatarFallback className="bg-gray-100 text-xs font-semibold text-gray-700">
							{getInitials(row.original.patientName)}
						</AvatarFallback>
					</Avatar>
					<span className="font-medium text-gray-800">{row.original.patientName}</span>
				</div>
			),
		},
		{
			header: "Transfer ID",
			accessorKey: "id",
			enableSorting: false,
			cell: ({ row }) => <CopyIdButton id={row.original.id} />,
		},
		{
			header: "Target Hospital",
			accessorKey: "targetHospitalName",
			enableSorting: true,
			cell: ({ row }) => (
				<span className="block max-w-[21.25rem] whitespace-normal text-pretty">
					{row.original.targetHospitalName}
				</span>
			),
		},
		{
			header: "Requested At",
			accessorKey: "requestedAt",
			enableSorting: true,
			cell: ({ row }) => formatDate(row.original.requestedAt),
		},
		{
			header: "Transfer Status",
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
							aria-label="Open transfer actions"
						>
							<RiMore2Fill className="size-5" aria-hidden />
						</DropdownMenuTrigger>
						<DropdownMenuContent
							align="end"
							className="w-[13.75rem] rounded-xl border-white/20 bg-gray-800 text-sm text-white ring ring-gray-800"
						>
							{row.original.status.toLowerCase() === "pending" ? (
								<>
									<DropdownMenuItem
										onSelect={() => onViewTransferDetails(row.original.id)}
										className="flex items-center gap-3 rounded-lg text-white focus:bg-white/10 focus:text-white py-2"
									>
										<RiEyeLine className="text-white" />
										<span>View transfer details</span>
									</DropdownMenuItem>
									<DropdownMenuItem className="gap-3 rounded-lg text-white focus:bg-white/10 focus:text-white py-2">
										<RiSendPlaneLine className="text-white" /> <span>Resend request</span>
									</DropdownMenuItem>
									<DropdownMenuItem className="gap-3 rounded-lg text-white focus:bg-white/10 focus:text-white py-2">
										<RiCloseLine className="text-white" /> <span>Cancel transfer</span>
									</DropdownMenuItem>
								</>
							) : row.original.status.toLowerCase() === "rejected" ? (
								<>
									<DropdownMenuItem
										onSelect={() => onViewTransferDetails(row.original.id)}
										className="flex items-center gap-3 rounded-lg text-white focus:bg-white/10 focus:text-white py-2"
									>
										<RiEyeLine className="text-white" />
										<span>View transfer details</span>
									</DropdownMenuItem>
									<DropdownMenuItem
										onSelect={() =>
											router.push(
												`/dashboard/new-transfer-request?patientId=${row.original.patientId}&returnTo=${encodeURIComponent(returnTo)}`,
											)
										}
										className="flex items-center gap-3 rounded-lg text-white focus:bg-white/10 focus:text-white py-2"
									>
										<RiEdit2Line className="text-white" /> <span>Edit and resend request</span>
									</DropdownMenuItem>
									<DropdownMenuSeparator className="bg-white/20" />
									<DropdownMenuItem className="gap-3 rounded-lg text-white focus:bg-white/10 focus:text-white py-2">
										<RiArchiveLine className="text-white" />
										<span>Archive</span>
									</DropdownMenuItem>
								</>
							) : row.original.status.toLowerCase() === "completed" ? (
								<>
									<DropdownMenuItem
										onSelect={() => onViewTransferDetails(row.original.id)}
										className="flex items-center gap-3 rounded-lg text-white focus:bg-white/10 focus:text-white py-2"
									>
										<RiEyeLine className="text-white" />
										<span>View transfer details</span>
									</DropdownMenuItem>
									<DropdownMenuSeparator className="bg-white/20" />
									<DropdownMenuItem className="gap-3 rounded-lg text-white focus:bg-white/10 focus:text-white py-2">
										<RiArchiveLine className="text-white" />
										<span>Archive</span>
									</DropdownMenuItem>
								</>
							) : row.original.status.toLowerCase() === "failed" ? (
								<>
									<DropdownMenuItem
										onSelect={() => onViewTransferDetails(row.original.id)}
										className="flex items-center gap-3 rounded-lg text-white focus:bg-white/10 focus:text-white py-2"
									>
										<RiEyeLine className="text-white" />
										<span>View transfer details</span>
									</DropdownMenuItem>
									<DropdownMenuItem className="gap-3 rounded-lg text-white focus:bg-white/10 focus:text-white py-2">
										<RiCornerDownLeftFill className="text-whte" /> <span>Retry transfer</span>
									</DropdownMenuItem>
									<DropdownMenuSeparator className="bg-white/20" />
									<DropdownMenuItem className="gap-3 rounded-lg text-white focus:bg-white/10 focus:text-white py-2">
										<RiArchiveLine className="text-white" />
										<span>Archive</span>
									</DropdownMenuItem>
								</>
							) : row.original.status.toLowerCase() === "cancelled" ? (
								<>
									<DropdownMenuItem
										onSelect={() => onViewTransferDetails(row.original.id)}
										className="flex items-center gap-3 rounded-lg text-white focus:bg-white/10 focus:text-white py-2"
									>
										<RiEyeLine className="text-white" />
										<span>View transfer details</span>
									</DropdownMenuItem>
									<DropdownMenuItem
										className="gap-3 rounded-lg text-white focus:bg-white/10 focus:text-white py-2"
										onSelect={() =>
											router.push(
												`/dashboard/new-transfer-request?patientId=${row.original.patientId}&returnTo=${encodeURIComponent(returnTo)}`,
											)
										}
									>
										<RiAddLine className="text-whte" /> <span>Start new transfer</span>
									</DropdownMenuItem>
									<DropdownMenuSeparator className="bg-white/20" />
									<DropdownMenuItem className="gap-3 rounded-lg text-white focus:bg-white/10 focus:text-white py-2">
										<RiArchiveLine className="text-white" />
										<span>Archive</span>
									</DropdownMenuItem>
								</>
							) : null}
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			),
		},
	];
}

function getCurrentRoute(pathname: string, searchParams: URLSearchParams) {
	const queryString = searchParams.toString();

	return queryString ? `${pathname}?${queryString}` : pathname;
}

async function fetchTransferDetails(selectedTransferId: string) {
	const response = await fetch(`/api/transfer-details/${encodeURIComponent(selectedTransferId)}`);

	if (!response.ok) {
		throw new Error("Unable to load transfer details.");
	}

	const result = (await response.json()) as { transfer: TransferDetailsType | null };

	return result.transfer;
}
