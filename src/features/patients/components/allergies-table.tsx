"use client";

import { useMemo, useState } from "react";
import { allergies } from "@/features/patients/allergies-data";
import { AllergyType } from "@/features/patients/types";
import { CopyIdButton } from "@/components/copy-id-button";
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
import { Input } from "@/components/ui/input";
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
	RiBarChartBoxLine,
	RiCalendarLine,
	RiCheckboxCircleLine,
	RiEyeLine,
	RiFilter3Line,
	RiMore2Fill,
	RiSearchLine,
	RiShare2Line,
} from "@remixicon/react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";

const ROWS_PER_PAGE_OPTIONS = [6, 12, 24];

export function AllergiesTable({ patientId }: { patientId: string }) {
	void patientId;

	const data = useMemo(() => allergies, []);
	const columns = useMemo(() => getAllergiesColumns(), []);
	const [sorting, setSorting] = useState<SortingState>([]);
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
			<h1 className="mx-auto max-w-7xl text-xl font-semibold">Allergies</h1>
			<div className="mx-auto mt-7 mb-4 flex max-w-7xl items-center gap-2">
				<div className="relative w-full">
					<RiSearchLine className="size-5 pointer-events-none absolute bottom-0 left-2 flex h-full items-center justify-center text-gray-400" />
					<Input
						type="search"
						className="h-10 w-full pl-8"
						placeholder="Search by name and allergy id"
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
								<RadioGroup defaultValue="all" className="flex flex-col gap-0">
									<div className="flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-gray-100">
										<RadioGroupItem value="all" id="all" />
										<Label
											htmlFor="all"
											className="cursor-pointer w-full leading-normal font-normal"
										>
											All
										</Label>
									</div>

									<div className="flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-gray-100">
										<RadioGroupItem value="male" id="male" />
										<Label
											htmlFor="male"
											className="cursor-pointer w-full leading-normal font-normal"
										>
											Active
										</Label>
									</div>

									<div className="flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-gray-100">
										<RadioGroupItem value="female" id="female" />
										<Label
											htmlFor="female"
											className="cursor-pointer w-full leading-normal font-normal"
										>
											Inactive
										</Label>
									</div>
								</RadioGroup>
							</DropdownMenuSubContent>
						</DropdownMenuSub>

						<DropdownMenuSub>
							<DropdownMenuSubTrigger className="rounded-lg focus:bg-gray-100 focus:text-gray-900 data-[state=open]:bg-gray-100 py-2">
								<RiBarChartBoxLine className="text-[18px]" />{" "}
								<span className="block">Severity</span>
							</DropdownMenuSubTrigger>
							<DropdownMenuSubContent
								sideOffset={8}
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
										htmlFor="requested-mild"
										className="flex w-full cursor-pointer items-center gap-2 leading-normal font-normal"
									>
										<Checkbox id="requested-mild" className="[&_svg]:!text-current" />
										<span>Mild</span>
									</Label>
								</DropdownMenuItem>
								<DropdownMenuItem
									className="rounded-lg focus:bg-gray-100 focus:text-gray-900 py-2"
									onSelect={(e) => {
										e.preventDefault();
									}}
								>
									<Label
										htmlFor="requested-moderate"
										className="flex w-full cursor-pointer items-center gap-2 leading-normal font-normal"
									>
										<Checkbox id="requested-moderate" className="[&_svg]:!text-current" />
										<span>Moderate</span>
									</Label>
								</DropdownMenuItem>
								<DropdownMenuItem
									className="rounded-lg focus:bg-gray-100 focus:text-gray-900 py-2"
									onSelect={(e) => {
										e.preventDefault();
									}}
								>
									<Label
										htmlFor="requested-severe"
										className="flex w-full cursor-pointer items-center gap-2 leading-normal font-normal"
									>
										<Checkbox id="requested-severe" className="[&_svg]:!text-current" />
										<span>Severe</span>
									</Label>
								</DropdownMenuItem>
							</DropdownMenuSubContent>
						</DropdownMenuSub>

						<DropdownMenuSub>
							<DropdownMenuSubTrigger className="rounded-lg focus:bg-gray-100 focus:text-gray-900 data-[state=open]:bg-gray-100 py-2">
								<RiCalendarLine className="size-[18px]" />{" "}
								<span className="block">Date recorded</span>
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
				<Button size="lg">Add allergy</Button>
			</div>
			<div className="mx-auto max-w-7xl overflow-x-auto rounded-xl border border-gray-200 text-sm">
				<Table className="w-full min-w-[72rem] border-separate border-spacing-0 bg-gray-50 text-left">
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

function getAllergiesColumns(): ColumnDef<AllergyType>[] {
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
			header: "Allergen",
			accessorKey: "allergen",
			enableSorting: true,
			cell: ({ row }) => <span className="font-medium text-gray-800">{row.original.allergen}</span>,
		},
		{
			header: "Allergy ID",
			accessorKey: "allergyId",
			enableSorting: false,
			cell: ({ row }) => <CopyIdButton id={row.original.allergyId} />,
		},
		{
			header: "Reaction",
			accessorKey: "reaction",
			enableSorting: false,
		},
		{
			id: "createdAt",
			header: "Created at",
			accessorFn: (row) => row.createdAtSortValue,
			enableSorting: true,
			cell: ({ row }) => row.original.createdAtLabel,
		},
		{
			header: "Severity",
			accessorKey: "severity",
			enableSorting: true,
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
							aria-label={`Open actions for ${row.original.allergen}`}
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
