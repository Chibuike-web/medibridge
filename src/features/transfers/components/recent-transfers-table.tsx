"use client";

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
import { statusStyles } from "@/lib/utils/status-styles";
import { CopyIdButton } from "@/components/copy-id-button";
import { RiArrowDownSLine, RiArrowUpSLine } from "@remixicon/react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

import {
	ColumnDef,
	flexRender,
	getCoreRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	type PaginationState,
	type SortingState,
	useReactTable,
} from "@tanstack/react-table";
import { TransferType } from "../types";
import { useMemo, useState } from "react";
import { recentTransfers } from "../data";
import { getInitials } from "@/lib/utils/get-initials";

export function RecentTransfersTable() {
	const data = useMemo(() => recentTransfers, []);
	const cols = useMemo(() => recentTransfersColumns, []);
	const [sorting, setSorting] = useState<SortingState>([]);
	const [pagination, setPagination] = useState<PaginationState>({
		pageIndex: 0,
		pageSize: 4,
	});

	const table = useReactTable({
		data,
		columns: cols,
		onSortingChange: setSorting,
		onPaginationChange: setPagination,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		state: {
			sorting,
			pagination,
		},
	});

	return (
		<div className="mt-12 max-w-7xl">
			<h1 className="mb-4 text-[18px] font-semibold">Recent Transfers</h1>
			<div className="overflow-x-auto rounded-[12px] border border-gray-200">
				<Table className="w-full min-w-[800px] text-left border-separate border-spacing-0 bg-gray-50">
					<TableHeader className="h-12 text-sm font-semibold text-gray-500">
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
											"z-10 h-12  px-3 py-0 whitespace-nowrap text-gray-600",
											// header.column.id === "name" &&
											// 	"sticky left-0 max-[980px]:border-r border-gray-200",
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
					<TableBody>
						{table.getRowModel().rows.map((row, rowPosition) => (
							<TableRow key={row.id} className="h-14">
								{row.getVisibleCells().map((cell) => (
									<TableCell
										key={cell.id}
										className={cn(
											"h-14 border-b border-gray-200 bg-white px-3 py-0 text-sm text-gray-600",
											rowPosition === table.getRowModel().rows.length - 1 && "border-b-0",
											rowPosition === table.getRowModel().rows.length - 1 && "border-b-0",
											rowPosition === 0 && cell.column.getIsFirstColumn() && "rounded-tl-lg",
											rowPosition === 0 && cell.column.getIsLastColumn() && "rounded-tr-lg",
											// cell.column.id === "name" &&
											// 	"sticky left-0 z-10 bg-white max-[800px]:border-r border-gray-200",
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
							value={String(table.getState().pagination.pageSize)}
							onValueChange={(value) => table.setPageSize(Number(value))}
						>
							<SelectTrigger className="h-8 w-[64px] px-2 border-gray-200 bg-white text-gray-700 shadow-none">
								<SelectValue aria-label="Rows per page" placeholder="Rows" />
							</SelectTrigger>
							<SelectContent>
								<SelectGroup>
									{[4, 8, 12].map((pageSize) => (
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
							Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
						</span>
						<div className="flex items-center gap-2">
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={() => table.previousPage()}
								disabled={!table.getCanPreviousPage()}
								className="border-gray-200 px-3 text-gray-700 shadow-none transition"
							>
								Previous
							</Button>
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={() => table.nextPage()}
								disabled={!table.getCanNextPage()}
								className="border-gray-200 px-3 text-gray-700 shadow-none transition"
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

const recentTransfersColumns: ColumnDef<TransferType>[] = [
	{
		header: "Patient Name",
		accessorKey: "name",
		enableSorting: true,
		cell: ({ row }) => (
			<div className="flex items-center gap-3">
				<Avatar className="size-9 border border-gray-200 bg-gray-100 text-gray-700">
					<AvatarFallback className="bg-gray-100 text-xs font-semibold text-gray-700">
						{getInitials(row.original.name)}
					</AvatarFallback>
				</Avatar>
				<span className="font-medium text-gray-800">{row.original.name}</span>
			</div>
		),
	},
	{
		header: "Patient ID",
		accessorKey: "patientId",
		enableSorting: false,
		cell: ({ row }) => <CopyIdButton id={row.original.patientId} />,
	},
	{
		header: "Target Hospital",
		accessorKey: "targetHospital",
		enableSorting: false,
		cell: ({ row }) => (
			<span className="block max-w-[280px] whitespace-normal text-pretty">
				{row.original.targetHospital}
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
		cell: ({ row }) => {
			const status = row.original.status;
			const statusClassName = statusStyles[status.toLowerCase() as keyof typeof statusStyles];

			return (
				<span
					className={cn(
						"inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold",
						statusClassName,
					)}
				>
					<span className="size-1 shrink-0 rounded-full bg-current" aria-hidden="true" />
					{status}
				</span>
			);
		},
	},
];
