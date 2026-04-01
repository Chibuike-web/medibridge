"use client";

import { useMemo, useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
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
import { statusStyles } from "@/lib/utils/status-styles";
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
import { RiArrowDownSLine, RiArrowUpSLine, RiMore2Fill } from "@remixicon/react";
import { transferPreviewRecords } from "../data";
import { RecentTransferType } from "../types";

const ROWS_PER_PAGE_OPTIONS = [14, 28, 42];

export function TransferPreviewTable() {
	const data = useMemo(() => transferPreviewRecords, []);
	const columns = useMemo(() => transferPreviewColumns, []);
	const [sorting, setSorting] = useState<SortingState>([]);
	const [pagination, setPagination] = useState<PaginationState>({
		pageIndex: 0,
		pageSize: 14,
	});

	const table = useReactTable({
		data,
		columns,
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
		<div className="overflow-x-auto rounded-[12px] border border-gray-200 text-sm">
			<Table className="w-full min-w-[1100px] border-separate border-spacing-0 text-left">
				<TableHeader className="h-12 bg-gray-100 text-sm font-semibold text-gray-500">
					{table.getHeaderGroups().map((headerGroup) => (
						<TableRow key={headerGroup.id}>
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
										"z-10 bg-gray-100 px-4 whitespace-nowrap text-gray-600",
										header.column.id === "name" &&
											"sticky left-0 max-[1100px]:border-r border-gray-200",
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
				<TableBody className="bg-white">
					{table.getRowModel().rows.map((row) => (
						<TableRow key={row.id}>
							{row.getVisibleCells().map((cell) => (
								<TableCell
									key={cell.id}
									className={cn(
										"border-b border-gray-100 bg-white px-4 py-4 text-sm text-gray-600",
										row.index === table.getRowModel().rows.length - 1 && "border-b-0",
										cell.column.id === "name" &&
											"sticky left-0 z-10 bg-white max-[1100px]:border-r border-gray-100",
									)}
								>
									{flexRender(cell.column.columnDef.cell, cell.getContext())}
								</TableCell>
							))}
						</TableRow>
					))}
				</TableBody>
			</Table>
			<div className="flex flex-col gap-3 border-t border-gray-200 bg-white px-4 py-3 text-sm text-gray-500 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex items-center gap-3">
					<span>Rows per page</span>
					<Select
						value={String(table.getState().pagination.pageSize)}
						onValueChange={(value) => table.setPageSize(Number(value))}
					>
						<SelectTrigger className="w-[68px] border-gray-200 bg-white px-2 text-gray-700 shadow-none">
							<SelectValue aria-label="Rows per page" placeholder="Rows" />
						</SelectTrigger>
						<SelectContent>
							<SelectGroup>
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
	);
}

const transferPreviewColumns: ColumnDef<RecentTransferType>[] = [
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
				<span className="font-medium text-gray-950">{row.original.name}</span>
			</div>
		),
	},
	{
		header: "Patient ID",
		accessorKey: "patientId",
		enableSorting: false,
	},
	{
		header: "Target Hospital",
		accessorKey: "targetHospital",
		enableSorting: false,
		cell: ({ row }) => (
			<span className="block max-w-[340px] whitespace-normal text-pretty">
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
						"inline-flex rounded-full px-3 py-1 text-xs font-semibold",
						statusClassName,
					)}
				>
					{status}
				</span>
			);
		},
	},
	{
		id: "actions",
		header: "",
		enableSorting: false,
		cell: () => (
			<div className="flex justify-end">
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<button
							type="button"
							className="inline-flex size-9 items-center justify-center rounded-md border border-transparent text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
							aria-label="Open transfer actions"
						>
							<RiMore2Fill className="size-5" aria-hidden />
						</button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end" className="w-44">
						<DropdownMenuItem>View transfer details</DropdownMenuItem>
						<DropdownMenuItem>Start new transfer</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
		),
	},
];
