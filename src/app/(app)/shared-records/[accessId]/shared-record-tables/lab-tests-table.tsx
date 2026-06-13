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

export type SharedLabTestRow = { test: string; labId: string; referenceRange: string; interpretation: string; createdAt: string; status: "Completed" | "Pending" };

export function SharedLabTestsTable({ rows }: { rows: SharedLabTestRow[] }) {
	const [query, setQuery] = useState("");
	const [sorting, setSorting] = useState<SortingState>([{ id: "test", desc: false }]);
	const filteredRows = useMemo(() => {
		const normalizedQuery = query.trim().toLowerCase();
		if (!normalizedQuery) return rows;
		return rows.filter((row) => row.test.toLowerCase().includes(normalizedQuery) || row.labId.toLowerCase().includes(normalizedQuery));
	}, [query, rows]);
	const columns = useMemo<ColumnDef<SharedLabTestRow>[]>(() => [
		{ id: "select", header: () => <Checkbox aria-label="Select all lab tests" disabled />, cell: ({ row }) => <Checkbox aria-label={`Select ${row.original.test}`} disabled />, enableSorting: false, size: 40 },
		{ header: "Test", accessorKey: "test", enableSorting: true, cell: ({ row }) => <span className="font-medium">{row.original.test}</span> },
		{ header: "Lab ID", accessorKey: "labId", enableSorting: false, cell: ({ row }) => <CopyIdButton id={row.original.labId} /> },
		{ header: "Reference Range", accessorKey: "referenceRange", enableSorting: true },
		{ header: "Interpretation", accessorKey: "interpretation", enableSorting: true },
		{ header: "Created At", accessorKey: "createdAt", enableSorting: true },
		{ header: "Status", accessorKey: "status", enableSorting: true, cell: ({ row }) => <StatusBadge status={row.original.status} /> },
		{ id: "actions", header: "", cell: () => <RowMenu />, enableSorting: false, size: 40 },
	], []);
	const table = useReactTable({ data: filteredRows, columns, onSortingChange: setSorting, getCoreRowModel: getCoreRowModel(), getSortedRowModel: getSortedRowModel(), state: { sorting } });
	return (
		<div>
			<h2 className="text-xl font-semibold text-gray-900">Lab Tests</h2>
			<div className="mt-7 mb-4 flex items-center gap-2"><div className="relative min-w-0 flex-1"><RiSearchLine className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-gray-400" /><Input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by test and lab id" className="h-10 pl-10" /></div><Button type="button" size="lg" variant="outline" className="gap-2 border-gray-200 bg-white text-gray-600"><RiFilter3Line aria-hidden="true" />Filter</Button><Button type="button" size="lg" variant="outline" className="gap-2 border-gray-200 bg-white text-gray-600"><RiShare2Line aria-hidden="true" />Export</Button></div>
			<div className="overflow-hidden rounded-xl border border-gray-200 bg-white"><Table><TableHeader>{table.getHeaderGroups().map((headerGroup) => <TableRow key={headerGroup.id} className="bg-gray-50 hover:bg-gray-50">{headerGroup.headers.map((header) => <TableHead key={header.id} style={{ width: header.getSize() }} onClick={header.column.getToggleSortingHandler()} onKeyDown={(event) => { if (event.key === "Enter") header.column.getToggleSortingHandler()?.(event); }} className={cn("h-12 whitespace-nowrap bg-gray-50 px-3 py-0 text-gray-600", header.column.getCanSort() && "cursor-pointer select-none")}><div className="flex items-center justify-between gap-3">{header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}{header.column.getCanSort() ? <div className="-space-y-2"><RiArrowUpSLine className={cn("size-4 text-gray-800", header.column.getIsSorted() === "desc" ? "opacity-30" : "")} aria-hidden="true" /><RiArrowDownSLine className={cn("size-4 text-gray-800", header.column.getIsSorted() === "asc" ? "opacity-30" : "")} aria-hidden="true" /></div> : null}</div></TableHead>)}</TableRow>)}</TableHeader><TableBody>{table.getRowModel().rows.map((row) => <TableRow key={row.id}>{row.getVisibleCells().map((cell) => <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>)}</TableRow>)}</TableBody></Table></div>
		</div>
	);
}

function RowMenu() {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				type="button"
				className="inline-flex size-9 items-center justify-center rounded-md border border-transparent text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
				aria-label="Open lab test actions"
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