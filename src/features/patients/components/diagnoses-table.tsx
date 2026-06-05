"use client";

import { useMemo, useState } from "react";
import { diagnoses } from "@/features/patients/diagnoses-data";
import { IndeterminateCheckbox } from "@/components/indeterminate-checkbox";
import { StatusBadge } from "@/components/status-badge";
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
import { DiagnosisType } from "@/features/patients/types";
import {
	type ColumnDef,
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
	RiCalendarLine,
	RiCheckboxCircleLine,
	RiEyeLine,
	RiFilter3Line,
	RiHistoryLine,
	RiMore2Fill,
	RiPulseLine,
	RiSearchLine,
	RiShare2Line,
} from "@remixicon/react";
import { CopyIdButton } from "@/components/copy-id-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

const ROWS_PER_PAGE_OPTIONS = [6, 12, 24];

export function DiagnosesTable({ patientId }: { patientId: string }) {
	void patientId;

	const data = useMemo(() => diagnoses, []);
	const columns = useMemo(() => getDiagnosesColumns(), []);
	const [sorting, setSorting] = useState<SortingState>([{ id: "name", desc: false }]);
	const [pagination, setPagination] = useState<PaginationState>({
		pageIndex: 0,
		pageSize: 6,
	});

	const table = useReactTable({
		data,
		columns,
		enableRowSelection: true,
		onSortingChange: setSorting,
		onPaginationChange: setPagination,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		state: {
			pagination,
			sorting,
		},
	});

	return (
		<div className="p-8">
			<h1 className="mx-auto max-w-7xl text-xl font-semibold">Diagnoses</h1>
			<div className="mx-auto mt-7 mb-4 flex max-w-7xl items-center gap-2">
				<div className="relative w-full">
					<RiSearchLine className="size-5 pointer-events-none absolute bottom-0 left-2 flex h-full items-center justify-center text-gray-400" />
					<Input
						type="search"
						className="h-10 w-full pl-8"
						placeholder="Search by patient name or ID"
					/>
				</div>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button
							size="lg"
							variant="outline"
							className="gap-2 border-gray-200 bg-white text-gray-600 hover:bg-gray-50 data-[state=open]:border-gray-400 data-[state=open]:ring-4 data-[state=open]:ring-gray-200"
						>
							<RiFilter3Line aria-hidden className="size-5 text-gray-600" />
							Filter
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent
						align="end"
						sideOffset={8}
						className="w-[13.75rem] rounded-xl border border-gray-200 bg-white p-1 text-sm text-gray-700 shadow-xl"
					>
						<DropdownMenuSub>
							<DropdownMenuSubTrigger className="rounded-lg focus:bg-gray-100 focus:text-gray-900 data-[state=open]:bg-gray-100 py-2">
								<RiCheckboxCircleLine className="size-[18px]" />{" "}
								<span className="block">Status</span>
							</DropdownMenuSubTrigger>
							<DropdownMenuSubContent
								sideOffset={12}
								alignOffset={-5}
								className="w-48 rounded-xl border border-gray-200 bg-white p-1 text-sm text-gray-700 shadow-xl"
							>
								<DropdownMenuItem
									className="rounded-lg focus:bg-gray-100 focus:text-gray-900 py-2"
									onSelect={(e) => {
										e.preventDefault();
									}}
								>
									<Label
										htmlFor="requested-pending"
										className="flex w-full cursor-pointer items-center gap-2 leading-normal font-normal"
									>
										<Checkbox id="requested-pending" className="[&_svg]:!text-current" />
										<span>Pending</span>
									</Label>
								</DropdownMenuItem>

								<DropdownMenuItem
									className="rounded-lg focus:bg-gray-100 focus:text-gray-900 py-2"
									onSelect={(e) => {
										e.preventDefault();
									}}
								>
									<Label
										htmlFor="requested-rejected"
										className="flex w-full cursor-pointer items-center gap-2 leading-normal font-normal"
									>
										<Checkbox id="requested-rejected" className="[&_svg]:!text-current" />
										<span>Rejected</span>
									</Label>
								</DropdownMenuItem>

								<DropdownMenuItem
									className="rounded-lg focus:bg-gray-100 focus:text-gray-900 py-2"
									onSelect={(e) => {
										e.preventDefault();
									}}
								>
									<Label
										htmlFor="requested-completed"
										className="flex w-full cursor-pointer items-center gap-2 leading-normal font-normal"
									>
										<Checkbox id="requested-completed" className="[&_svg]:!text-current" />
										<span>Completed</span>
									</Label>
								</DropdownMenuItem>

								<DropdownMenuItem
									className="rounded-lg focus:bg-gray-100 focus:text-gray-900 py-2"
									onSelect={(e) => {
										e.preventDefault();
									}}
								>
									<Label
										htmlFor="requested-failed"
										className="flex w-full cursor-pointer items-center gap-2 leading-normal font-normal"
									>
										<Checkbox id="requested-failed" className="[&_svg]:!text-current" />
										<span>Failed</span>
									</Label>
								</DropdownMenuItem>

								<DropdownMenuItem
									className="rounded-lg focus:bg-gray-100 focus:text-gray-900 py-2"
									onSelect={(e) => {
										e.preventDefault();
									}}
								>
									<Label
										htmlFor="requested-cancelled"
										className="flex w-full cursor-pointer items-center gap-2 leading-normal font-normal"
									>
										<Checkbox id="requested-cancelled" className="[&_svg]:!text-current" />
										<span>Cancelled</span>
									</Label>
								</DropdownMenuItem>
							</DropdownMenuSubContent>
						</DropdownMenuSub>

						<DropdownMenuSub>
							<DropdownMenuSubTrigger className="rounded-lg focus:bg-gray-100 focus:text-gray-900 data-[state=open]:bg-gray-100 py-2">
								<RiHistoryLine className="text-[18px]" />{" "}
								<span className="block">Last updated</span>
							</DropdownMenuSubTrigger>
							<DropdownMenuSubContent
								sideOffset={8}
								alignOffset={-5}
								className="w-48 rounded-xl border border-gray-200 bg-white p-1 text-sm text-gray-700 shadow-xl"
							>
								<DropdownMenuItem className="rounded-lg focus:bg-gray-100 focus:text-gray-900 py-2">
									Mild
								</DropdownMenuItem>
								<DropdownMenuItem className="rounded-lg focus:bg-gray-100 focus:text-gray-900 py-2">
									Moderate
								</DropdownMenuItem>
								<DropdownMenuItem className="rounded-lg focus:bg-gray-100 focus:text-gray-900 py-2">
									Severe
								</DropdownMenuItem>
							</DropdownMenuSubContent>
						</DropdownMenuSub>

						<DropdownMenuSub>
							<DropdownMenuSubTrigger className="rounded-lg focus:bg-gray-100 focus:text-gray-900 data-[state=open]:bg-gray-100 py-2">
								<RiPulseLine className="size-[18px]" /> <span className="block">Onset</span>
							</DropdownMenuSubTrigger>
							<DropdownMenuSubContent
								sideOffset={8}
								className="w-48 rounded-xl border border-gray-200 bg-white p-1 text-sm text-gray-700 shadow-xl"
							>
								<DropdownMenuItem className="rounded-lg focus:bg-gray-100 focus:text-gray-900 py-2">
									Today
								</DropdownMenuItem>
								<DropdownMenuItem className="rounded-lg focus:bg-gray-100 focus:text-gray-900 py-2">
									This week
								</DropdownMenuItem>
								<DropdownMenuItem className="rounded-lg focus:bg-gray-100 focus:text-gray-900 py-2">
									This month
								</DropdownMenuItem>
							</DropdownMenuSubContent>
						</DropdownMenuSub>
						<DropdownMenuSub>
							<DropdownMenuSubTrigger className="rounded-lg focus:bg-gray-100 focus:text-gray-900 data-[state=open]:bg-gray-100 py-2">
								<RiCalendarLine className="size-[18px]" /> <span className="block">Created at</span>
							</DropdownMenuSubTrigger>
							<DropdownMenuSubContent
								sideOffset={8}
								className="w-48 rounded-xl border border-gray-200 bg-white p-1 text-sm text-gray-700 shadow-xl"
							>
								<DropdownMenuItem className="rounded-lg focus:bg-gray-100 focus:text-gray-900 py-2">
									Today
								</DropdownMenuItem>
								<DropdownMenuItem className="rounded-lg focus:bg-gray-100 focus:text-gray-900 py-2">
									This week
								</DropdownMenuItem>
								<DropdownMenuItem className="rounded-lg focus:bg-gray-100 focus:text-gray-900 py-2">
									This month
								</DropdownMenuItem>
							</DropdownMenuSubContent>
						</DropdownMenuSub>
					</DropdownMenuContent>
				</DropdownMenu>
				<Button size="lg" variant="outline">
					<RiShare2Line aria-hidden className="size-5 text-gray-600" />
					Export
				</Button>
				<Button size="lg">Add diagnosis</Button>
			</div>
			<div className="mx-auto max-w-7xl overflow-x-auto rounded-xl border border-gray-200 text-sm">
				<Table className="w-full min-w-[78rem] border-separate border-spacing-0 bg-gray-50 text-left">
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
							<TableRow key={row.id} className="group min-h-14">
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
							value={String(table.getState().pagination.pageSize)}
							onValueChange={(value) => table.setPageSize(Number(value))}
						>
							<SelectTrigger className="h-8 w-[4.25rem] border-gray-200 bg-white px-2 text-gray-700 shadow-none">
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
		</div>
	);
}

function getDiagnosesColumns(): ColumnDef<DiagnosisType>[] {
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
			header: "Diagnosis name",
			accessorKey: "name",
			enableSorting: true,
			cell: ({ row }) => <span className="font-medium text-gray-800">{row.original.name}</span>,
		},
		{
			id: "onset",
			header: "Onset",
			accessorFn: (row) => row.onsetSortValue,
			enableSorting: true,
			cell: ({ row }) => row.original.onsetLabel,
		},
		{
			id: "lastReviewed",
			header: "Last reviewed",
			accessorFn: (row) => row.lastReviewedSortValue,
			enableSorting: true,
			cell: ({ row }) => row.original.lastReviewedLabel,
		},
		{
			header: "Diagnosis ID",
			accessorKey: "diagnosisId",
			enableSorting: false,
			cell: ({ row }) => <CopyIdButton id={row.original.diagnosisId} />,
		},
		{
			header: "Clinical notes",
			accessorKey: "clinicalNotes",
			enableSorting: false,
			cell: ({ row }) => (
				<p className="max-w-[22rem] whitespace-normal text-sm leading-6 text-gray-600">
					{row.original.clinicalNotes}
				</p>
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
			cell: ({ row }) => (
				<div className="flex justify-end">
					<DropdownMenu>
						<DropdownMenuTrigger
							type="button"
							className="inline-flex size-9 items-center justify-center rounded-md border border-transparent text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
							aria-label={`Open actions for ${row.original.name}`}
						>
							<RiMore2Fill className="size-5" aria-hidden />
						</DropdownMenuTrigger>
						<DropdownMenuContent
							align="end"
							className="w-[13.75rem] rounded-xl border border-white/20 bg-gray-800 text-sm text-white ring ring-gray-800"
						>
							<DropdownMenuItem className="flex items-center gap-3 rounded-lg text-white focus:bg-white/10 focus:text-white py-2">
								<RiEyeLine className="text-white" />
								<span>View details</span>
							</DropdownMenuItem>
							<DropdownMenuSeparator className="bg-white/20" />
							<DropdownMenuItem className="flex items-center gap-3 rounded-lg text-white focus:bg-white/10 focus:text-white py-2">
								<RiArchiveLine className="text-white" />
								<span>Archive</span>
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			),
		},
	];
}
