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
import { CopyIdButton } from "@/components/copy-id-button";
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

export function RecentPatientsTable({ data }: { data: RecentPatientType[] }) {
	const columns = useMemo(() => recentPatientColumns, []);

	const [sorting, setSorting] = useState<SortingState>([{ id: "name", desc: false }]);

	const [pagination, setPagination] = useState<PaginationState>({
		pageIndex: 0,
		pageSize: 4,
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
	const pageCount = Math.max(table.getPageCount(), 1);

	return (
		<div className="mt-12 max-w-7xl">
			<h1 className="mb-4 text-base font-semibold">Recent Patients</h1>
			<div className="overflow-x-auto rounded-xl border border-gray-200">
				<Table className="min-w-[50rem] border-separate border-spacing-0 bg-gray-50 text-left">
					<TableHeader className="text-gray-500 text-sm font-semibold">
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
											"h-10 px-3 py-0 whitespace-nowrap z-10 text-gray-600 bg-gray-50",
											header.column.getCanSort()
												? "cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gray-400"
												: "",
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
					<TableBody className="overflow-hidden rounded-t-xl outline outline-gray-200">
						{table.getRowModel().rows.length > 0 ? (
							table.getRowModel().rows.map((row, rowPosition) => (
								<TableRow key={row.id} className="h-14">
									{row.getVisibleCells().map((cell) => (
										<TableCell
											key={cell.id}
											className={cn(
												"h-14 border-b border-gray-200 bg-white px-3 py-0 text-sm text-gray-600",
												rowPosition === table.getRowModel().rows.length - 1 && "border-b-0",
												rowPosition === 0 && cell.column.getIsFirstColumn() && "rounded-tl-lg",
												rowPosition === 0 && cell.column.getIsLastColumn() && "rounded-tr-lg",
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
									No recent patients found.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
				<div className="flex gap-3 border-t border-gray-200 bg-white p-3 text-sm text-gray-500 items-center justify-between">
					<div className="flex items-center gap-3">
						<span>Rows per page</span>
						<Select
							value={String(table.getState().pagination.pageSize)}
							onValueChange={(value) => table.setPageSize(Number(value))}
						>
							<SelectTrigger className="h-8 w-16 border-gray-200 bg-white px-2 text-gray-700 shadow-none">
								<SelectValue aria-label="Rows per page" placeholder="Rows" />
							</SelectTrigger>
							<SelectContent>
								<SelectGroup className="p-1">
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
							Page {table.getState().pagination.pageIndex + 1} of {pageCount}
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
				<span className="font-medium text-gray-800">{row.original.name}</span>
			</div>
		),
	},

	{
		header: "Patient ID",
		accessorKey: "patientId",
		enableSorting: false,
		cell: ({ row }) => <CopyIdButton id={row.original.patientId} className="min-w-0" />,
	},
	{
		header: "Gender",
		accessorKey: "gender",
		enableSorting: false,
	},
	{
		header: "Age",
		accessorKey: "age",
		enableSorting: true,
	},
	{
		header: "Created At",
		accessorKey: "createdAt",
		enableSorting: true,
		cell: ({ row }) => formatDate(row.original.createdAt),
	},
];
