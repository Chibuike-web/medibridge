"use client";

import { useMemo, useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CopyIdButton } from "@/components/copy-id-button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
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
	getPaginationRowModel,
	getSortedRowModel,
	type PaginationState,
	type SortingState,
	useReactTable,
} from "@tanstack/react-table";
import {
	RiArchiveLine,
	RiArrowDownSLine,
	RiArrowUpSLine,
	RiErrorWarningLine,
	RiMore2Fill,
	RiShare2Line,
	RiShareBoxLine,
} from "@remixicon/react";
import { patientRecords } from "../data";
import { PatientRecordType } from "../types";

const ROWS_PER_PAGE_OPTIONS = [14, 28, 42];

export function PatientRecordsTable() {
	const data = useMemo(() => patientRecords, []);
	const columns = useMemo(() => patientRecordsColumns, []);
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
			<Table className="w-full min-w-[1000px] border-separate border-spacing-0 text-left bg-gray-50">
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
										"z-10 h-12 px-3 py-0 whitespace-nowrap text-gray-600 bg-gray-50",
										// header.column.id === "name" &&
										// 	"sticky left-0 max-[1000px]:border-r border-gray-200",
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
				<TableBody className="outline outline-gray-200 rounded-t-[12px] overflow-hidden">
					{table.getRowModel().rows.map((row, rowPosition) => (
						<TableRow key={row.id} className="h-14">
							{row.getVisibleCells().map((cell) => (
								<TableCell
									key={cell.id}
									className={cn(
										"h-14 border-b border-gray-200 bg-white px-3 py-0 text-sm text-gray-600",
										rowPosition === table.getRowModel().rows.length - 1 && "border-b-0",
										// cell.column.id === "name" &&
										// 	"sticky left-0 z-10 bg-white max-[1000px]:border-r border-gray-200",
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
						<SelectTrigger className="h-8 w-[68px] border-gray-200 bg-white px-2 text-gray-700 shadow-none">
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

const patientRecordsColumns: ColumnDef<PatientRecordType>[] = [
	{
		header: "Patient name",
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
		header: "Created at",
		accessorKey: "createdAt",
		enableSorting: true,
		cell: ({ row }) => formatDate(row.original.createdAt),
	},
	{
		id: "actions",
		header: "",
		enableSorting: false,
		cell: () => (
			<div className="flex justify-end">
				<DropdownMenu>
					<DropdownMenuTrigger
						type="button"
						className="inline-flex size-9 items-center justify-center rounded-md border border-transparent text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
						aria-label="Open row actions"
					>
						<RiMore2Fill className="size-5" aria-hidden />
					</DropdownMenuTrigger>
					<DropdownMenuContent
						align="end"
						className="w-[13.75rem] rounded-xl border border-white/20 bg-gray-800 text-sm text-white ring ring-gray-800"
					>
						<DropdownMenuItem className="flex items-center gap-3 rounded-lg text-white focus:bg-white/10 focus:text-white">
							<RiErrorWarningLine className="text-white" />
							<span> View patient</span>
						</DropdownMenuItem>
						<DropdownMenuItem className="flex items-center gap-3 rounded-lg text-white focus:bg-white/10 focus:text-white">
							<RiShareBoxLine className="text-white" /> <span> Transfer patient</span>
						</DropdownMenuItem>
						<DropdownMenuItem className="flex items-center gap-3 rounded-lg text-white focus:bg-white/10 focus:text-white">
							<RiShare2Line className="text-white" /> <span> Export record</span>
						</DropdownMenuItem>
						<DropdownMenuSeparator className="bg-white/20" />
						<DropdownMenuItem className="flex items-center gap-3 rounded-lg text-white focus:bg-white/10 focus:text-white">
							<RiArchiveLine className="text-white" />
							<span>Archive</span>
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
		),
	},
];
