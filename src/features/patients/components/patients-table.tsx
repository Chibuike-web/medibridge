"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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
	getSortedRowModel,
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
import { PatientListItemType } from "../types";
import { IndeterminateCheckbox } from "@/components/indeterminate-checkbox";

const ROWS_PER_PAGE_OPTIONS = [14, 28, 42];

export function PatientsTable({
	patients,
	page,
	limit,
	totalPages,
	isPending,
	onPreviousPage,
	onNextPage,
	onLimitChange,
}: {
	patients: PatientListItemType[];
	page: number;
	limit: number;
	totalPages: number;
	isPending: boolean;
	onPreviousPage: () => void;
	onNextPage: () => void;
	onLimitChange: (value: string) => void;
}) {
	const router = useRouter();
	const columns = useMemo(() => getPatientsColumns(router), [router]);
	const [sorting, setSorting] = useState<SortingState>([{ id: "name", desc: false }]);

	const table = useReactTable({
		data: patients,
		columns,
		onSortingChange: setSorting,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		state: { sorting },
	});

	return (
		<div className="overflow-x-auto rounded-xl border border-gray-200 text-sm">
			<Table className="w-full min-w-[62.5rem] border-separate border-spacing-0 bg-gray-50 text-left">
				<TableHeader className="h-12 text-sm text-gray-600">
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
				<TableBody className="overflow-hidden rounded-t-xl outline outline-gray-200">
					{table.getRowModel().rows.map((row, rowPosition) => (
						<TableRow
							key={row.id}
							className="h-14 group"
							role="link"
							tabIndex={0}
							onClick={(e) => {
								e.stopPropagation();
								router.push(
									`/dashboard/patients/${row.original.patientId}?section=patient-overview`,
								);
							}}
							onMouseEnter={() => {
								router.prefetch(
									`/dashboard/patients/${row.original.patientId}?section=patient-overview`,
								);
							}}
						>
							{row.getVisibleCells().map((cell) => (
								<TableCell
									key={cell.id}
									className={cn(
										"h-14 border-b border-gray-200 bg-white px-3 py-0 text-sm text-gray-600 transition-colors group-hover:bg-gray-100",
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
						value={limit.toString()}
						onValueChange={onLimitChange}
						disabled={isPending}
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
	);
}

function getPatientsColumns(
	router: ReturnType<typeof useRouter>,
): ColumnDef<PatientListItemType>[] {
	return [
		{
			id: "select",
			header: ({ table }) => (
				<div onClick={(e) => e.stopPropagation()}>
					<IndeterminateCheckbox
						checked={table.getIsAllRowsSelected()}
						indeterminate={table.getIsSomeRowsSelected()}
						onCheckedChange={(value) => {
							table.toggleAllRowsSelected(!!value);
						}}
					/>
				</div>
			),
			cell: ({ row }) => (
				<div
					className="w-max"
					onClick={(e) => e.stopPropagation()}
					onKeyDown={(e) => e.stopPropagation()}
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
		},
		{
			header: "Patient name",
			accessorKey: "name",
			enableSorting: true,
			cell: ({ row }) => (
				<div className="flex items-center gap-3 w-max" onClick={(e) => e.stopPropagation()}>
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
			cell: ({ row }) => (
				<div onClick={(e) => e.stopPropagation()} className="w-max">
					{row.original.gender}
				</div>
			),
		},
		{
			header: "Age",
			accessorKey: "age",
			enableSorting: true,
			cell: ({ row }) => (
				<div
					onClick={(e) => {
						e.stopPropagation();
					}}
					className="w-max"
				>
					{row.original.age}
				</div>
			),
		},
		{
			header: "Created at",
			accessorKey: "createdAt",
			enableSorting: true,
			cell: ({ row }) => (
				<div
					onClick={(e) => {
						e.stopPropagation();
					}}
					className="w-max"
				>
					{formatDate(row.original.createdAt)}
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
					onClick={(e) => {
						e.stopPropagation();
					}}
				>
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
							<DropdownMenuItem
								onSelect={() =>
									router.push(
										`/dashboard/patients/${row.original.patientId}?section=patient-overview`,
									)
								}
								className="flex items-center gap-3 rounded-lg text-white focus:bg-white/10 focus:text-white py-2"
							>
								<RiErrorWarningLine className="text-white" />
								<span> View patient</span>
							</DropdownMenuItem>
							<DropdownMenuItem className="flex items-center gap-3 rounded-lg text-white focus:bg-white/10 focus:text-white py-2">
								<RiShareBoxLine className="text-white" /> <span> Transfer patient</span>
							</DropdownMenuItem>
							<DropdownMenuItem className="flex items-center gap-3 rounded-lg text-white focus:bg-white/10 focus:text-white py-2">
								<RiShare2Line className="text-white" /> <span> Export record</span>
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
