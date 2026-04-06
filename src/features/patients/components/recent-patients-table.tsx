"use client";

import { useMemo, useState } from "react";
import { RiArrowDownSLine, RiArrowUpSLine } from "@remixicon/react";
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
import { recentPatients } from "../data";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils/cn";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { RecentPatientType } from "../types";
import { getInitials } from "@/lib/utils/get-initials";
import { formatDate } from "@/lib/utils/format-date";

export function RecentPatientsTable() {
	const data = useMemo(() => recentPatients, []);
	const cols = useMemo(() => recentPatientColumns, []);
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
			<h1 className="font-semibold text-[18px] mb-4">Recent Patients</h1>
			<div className="overflow-x-auto rounded-[12px] border border-gray-200">
				<Table className="w-full min-w-[800px] text-left border-separate border-spacing-0">
					<TableHeader className="bg-gray-100 text-gray-500 text-xs font-semibold h-12">
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
											"h-12 px-3 py-0 whitespace-nowrap z-10 text-gray-600 bg-gray-100",
											header.column.id === "name" &&
												"left-0 sticky max-[800px]:border-r border-gray-200",
											header.column.getCanSort() ? "cursor-pointer select-none" : "",
										)}
									>
										<div className="flex items-center justify-between">
											{header.isPlaceholder
												? null
												: flexRender(header.column.columnDef.header, header.getContext())}{" "}
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
						{table.getRowModel().rows.map((row, rowPosition) => (
							<TableRow key={row.id} className="h-14">
								{row.getVisibleCells().map((cell) => (
									<TableCell
										key={cell.id}
										className={cn(
											"h-14 border-b border-gray-200 bg-white px-3 py-0 text-sm text-gray-600",
											rowPosition === table.getRowModel().rows.length - 1 && "border-b-0",
											cell.column.id === "name" &&
												"sticky left-0 z-10 bg-white max-[800px]:border-r border-gray-200",
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
							<SelectTrigger className="h-8 w-[64px] border-gray-200 bg-white text-gray-700 shadow-none px-2">
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

const recentPatientColumns: ColumnDef<RecentPatientType>[] = [
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
		header: "Gender",
		accessorKey: "gender",
		enableSorting: false,
	},
	{
		header: "Age",
		accessorKey: "age",
		enableSorting: false,
	},
	{
		header: "Created At",
		accessorKey: "createdAt",
		enableSorting: true,
		cell: ({ row }) => formatDate(row.original.createdAt),
	},
];
