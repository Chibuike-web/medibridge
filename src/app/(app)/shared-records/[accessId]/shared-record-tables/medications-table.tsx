"use client";

import { useMemo, useState } from "react";
import { RiArrowDownSLine, RiArrowUpSLine, RiShare2Line, RiEyeLine, RiFilter3Line, RiMore2Fill, RiSearchLine } from "@remixicon/react";
import { type ColumnDef, flexRender, getCoreRowModel, getSortedRowModel, type SortingState, useReactTable } from "@tanstack/react-table";
import { CopyIdButton } from "@/components/copy-id-button";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils/cn";

export type SharedMedicationRow = { medication: string; dose: string; route: string; indication: string; medicationId: string; createdAt: string; status: "Active" | "Completed" };

export function SharedMedicationsTable({ rows }: { rows: SharedMedicationRow[] }) {
	const [recordSearchQuery, setRecordSearchQuery] = useState("");
	const [sorting, setSorting] = useState<SortingState>([{ id: "medication", desc: false }]);
	const filteredRows = useMemo(() => {
		const normalizedRecordSearchQuery = recordSearchQuery.trim().toLowerCase();
		if (!normalizedRecordSearchQuery) return rows;
		return rows.filter((row) => row.medication.toLowerCase().includes(normalizedRecordSearchQuery) || row.medicationId.toLowerCase().includes(normalizedRecordSearchQuery));
	}, [recordSearchQuery, rows]);
	const columns = useMemo<ColumnDef<SharedMedicationRow>[]>(() => [
		{ id: "select", header: () => <Checkbox aria-label="Select all medications" disabled />, cell: ({ row }) => <Checkbox aria-label={`Select ${row.original.medication}`} disabled />, enableSorting: false, size: 40 },
		{ header: "Medication", accessorKey: "medication", enableSorting: true, cell: ({ row }) => <span className="font-medium">{row.original.medication}</span> },
		{ header: "Dose", accessorKey: "dose", enableSorting: true },
		{ header: "Route", accessorKey: "route", enableSorting: true },
		{ header: "Indication", accessorKey: "indication", enableSorting: true },
		{ header: "Medication ID", accessorKey: "medicationId", enableSorting: false, cell: ({ row }) => <CopyIdButton id={row.original.medicationId} /> },
		{ header: "Created At", accessorKey: "createdAt", enableSorting: true },
		{ header: "Status", accessorKey: "status", enableSorting: true, cell: ({ row }) => <StatusBadge status={row.original.status} /> },
		{ id: "actions", header: "", cell: () => <RowMenu />, enableSorting: false, size: 40 },
	], []);
	const table = useReactTable({ data: filteredRows, columns, onSortingChange: setSorting, getCoreRowModel: getCoreRowModel(), getSortedRowModel: getSortedRowModel(), state: { sorting } });

	return (
		<div>
			<h2 className="text-xl font-semibold text-gray-900">Medications</h2>
			<div className="mt-7 mb-4 flex items-center gap-2">
				<div className="relative min-w-0 flex-1">
					<RiSearchLine className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-gray-400" />
					<Input type="search" value={recordSearchQuery} onChange={(event) => setRecordSearchQuery(event.target.value)} placeholder="Search by medication and medication id" className="pl-10" />
				</div>
				<Button type="button" variant="outline" className="gap-2 border-gray-200 bg-white text-sm text-gray-600 hover:bg-gray-50 data-[state=open]:border-gray-400 data-[state=open]:ring-4 data-[state=open]:ring-gray-200"><RiFilter3Line aria-hidden="true" />Filter</Button>
				<Button type="button" variant="outline" className="gap-2 border-gray-200 bg-white text-sm text-gray-600 hover:bg-gray-50 data-[state=open]:border-gray-400 data-[state=open]:ring-4 data-[state=open]:ring-gray-200"><RiShare2Line aria-hidden="true" />Export</Button>
			</div>
			<div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
				<Table>
					<TableHeader>{table.getHeaderGroups().map((headerGroup) => <TableRow key={headerGroup.id} className="bg-gray-50 hover:bg-gray-50">{headerGroup.headers.map((header) => <TableHead key={header.id} style={{ width: header.getSize() }} onClick={header.column.getToggleSortingHandler()} onKeyDown={(event) => { if (event.key === "Enter") header.column.getToggleSortingHandler()?.(event); }} className={cn("h-12 whitespace-nowrap bg-gray-50 px-3 py-0 text-gray-600", header.column.getCanSort() && "cursor-pointer select-none")}><div className="flex items-center justify-between gap-3">{header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}{header.column.getCanSort() ? <div className="-space-y-2"><RiArrowUpSLine className={cn("size-4 text-gray-800", header.column.getIsSorted() === "desc" ? "opacity-30" : "")} aria-hidden="true" /><RiArrowDownSLine className={cn("size-4 text-gray-800", header.column.getIsSorted() === "asc" ? "opacity-30" : "")} aria-hidden="true" /></div> : null}</div></TableHead>)}</TableRow>)}</TableHeader>
					<TableBody>{table.getRowModel().rows.map((row) => <TableRow key={row.id}>{row.getVisibleCells().map((cell) => <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>)}</TableRow>)}</TableBody>
				</Table>
			</div>
		</div>
	);
}

function RowMenu() {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				type="button"
				className="inline-flex size-9 items-center justify-center rounded-md border border-transparent text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
				aria-label="Open medication actions"
			>
				<RiMore2Fill className="size-5" aria-hidden="true" />
			</DropdownMenuTrigger>
			<DropdownMenuContent
				align="end"
				className="w-[13.75rem] rounded-xl border border-white/20 bg-gray-800 text-sm text-white ring ring-gray-800"
			>
				<DropdownMenuItem className="flex items-center gap-3 rounded-lg text-white focus:bg-white/10 focus:text-white py-2">
					<RiEyeLine className="text-white" aria-hidden="true" />
					<span>View details</span>
				</DropdownMenuItem>
				<DropdownMenuItem className="flex items-center gap-3 rounded-lg text-white focus:bg-white/10 focus:text-white py-2">
					<RiShare2Line className="text-white" aria-hidden="true" />
					<span>Export</span>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}