"use client";

import { useCallback, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { CopyIdButton } from "@/components/copy-id-button";
import { StatusBadge } from "@/components/status-badge";
import { TransferDetailsDrawer } from "@/features/transfers/components/transfer-details-drawer";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
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
import {
	ColumnDef,
	flexRender,
	getCoreRowModel,
	getSortedRowModel,
	type SortingState,
	useReactTable,
} from "@tanstack/react-table";
import {
	RiAddLine,
	RiArchiveLine,
	RiArrowDownSLine,
	RiArrowUpSLine,
	RiCloseLine,
	RiCornerDownLeftFill,
	RiEdit2Line,
	RiErrorWarningLine,
	RiMore2Fill,
	RiSendPlaneLine,
} from "@remixicon/react";
import { getTransferDetailsAction } from "@/features/transfers/server/actions";
import type { TransferDetailsType, TransferType } from "../types";
import { IndeterminateCheckbox } from "@/components/indeterminate-checkbox";

const ROWS_PER_PAGE_OPTIONS = [14, 28, 42];

export function TransferTable({
	data,
	page,
	limit,
	totalPages,
	isPending,
	onPreviousPage,
	onNextPage,
	onLimitChange,
}: {
	data: TransferType[];
	page: number;
	limit: number;
	totalPages: number;
	isPending: boolean;
	onPreviousPage: () => void;
	onNextPage: () => void;
	onLimitChange: (value: string) => void;
}) {
	const router = useRouter();
	const [sorting, setSorting] = useState<SortingState>([{ id: "patientName", desc: false }]);
	const [selectedTransferId, setSelectedTransferId] = useState<string | null>(null);
	const selectedTransferIdRef = useRef<string | null>(null);
	const [selectedTransfer, setSelectedTransfer] = useState<TransferDetailsType | null>(null);
	const [isDetailsPending, startDetailsTransition] = useTransition();

	const onViewTransferDetails = useCallback((transferId: string) => {
		selectedTransferIdRef.current = transferId;
		setSelectedTransferId(transferId);
		setSelectedTransfer(null);

		startDetailsTransition(async () => {
			const result = await getTransferDetailsAction(transferId);

			if (!result.transfer) return;
			if (selectedTransferIdRef.current !== transferId) return;
			const transfer = result.transfer;

			setSelectedTransfer(transfer);
		});
	}, []);

	const columns = useMemo(() => {
		return getTransferColumns(onViewTransferDetails, router);
	}, [onViewTransferDetails, router]);

	const table = useReactTable({
		data,
		columns,
		onSortingChange: setSorting,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		state: {
			sorting,
		},
	});

	return (
		<>
			<div className="overflow-x-auto rounded-xl border border-gray-200 text-sm">
				<Table className="w-full min-w-[62.5rem] border-separate border-spacing-0 bg-gray-50 text-left">
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
					<TableBody className="rounded-t-xl outline outline-gray-200">
						{table.getRowModel().rows.length > 0 ? (
							table.getRowModel().rows.map((row, rowPosition) => (
								<TableRow key={row.id} className="h-14 hover:bg-gray-100 transition-colors">
									{row.getVisibleCells().map((cell) => (
										<TableCell
											key={cell.id}
											className={cn(
												"h-14 border-b border-gray-200 bg-white px-3 py-0 text-sm text-gray-600",
												rowPosition === table.getRowModel().rows.length - 1 && "border-b-0",
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
									No transfers found.
								</TableCell>
							</TableRow>
						)}
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
			<TransferDetailsDrawer
				open={selectedTransferId !== null}
				onOpenChange={(open) => {
					if (!open) {
						selectedTransferIdRef.current = null;
						setSelectedTransferId(null);
						setSelectedTransfer(null);
					}
				}}
				transfer={selectedTransfer}
				isLoading={isDetailsPending && selectedTransfer === null}
			/>
		</>
	);
}

function getTransferColumns(
	onViewTransferDetails: (transferId: string) => void,
	router: ReturnType<typeof useRouter>,
): ColumnDef<TransferType>[] {
	return [
		{
			id: "select",
			header: ({ table }) => (
				<IndeterminateCheckbox
					checked={table.getIsAllRowsSelected()}
					indeterminate={table.getIsSomeRowsSelected()}
					onCheckedChange={(value) => {
						table.toggleAllRowsSelected(!!value);
					}}
				/>
			),
			cell: ({ row }) => (
				<IndeterminateCheckbox
					checked={row.getIsSelected()}
					disabled={!row.getCanSelect()}
					indeterminate={row.getIsSomeSelected()}
					onCheckedChange={(value) => {
						row.toggleSelected(!!value);
					}}
				/>
			),
		},
		{
			header: "Patient Name",
			accessorKey: "patientName",
			enableSorting: true,
			cell: ({ row }) => (
				<div className="flex items-center gap-3">
					<Avatar className="size-9 border border-gray-200 bg-gray-100 text-gray-700">
						<AvatarFallback className="bg-gray-100 text-xs font-semibold text-gray-700">
							{getInitials(row.original.patientName)}
						</AvatarFallback>
					</Avatar>
					<span className="font-medium text-gray-800">{row.original.patientName}</span>
				</div>
			),
		},
		{
			header: "Transfer ID",
			accessorKey: "id",
			enableSorting: false,
			cell: ({ row }) => <CopyIdButton id={row.original.id} />,
		},
		{
			header: "Target Hospital",
			accessorKey: "targetHospitalName",
			enableSorting: true,
			cell: ({ row }) => (
				<span className="block max-w-[21.25rem] whitespace-normal text-pretty">
					{row.original.targetHospitalName}
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
							aria-label="Open transfer actions"
						>
							<RiMore2Fill className="size-5" aria-hidden />
						</DropdownMenuTrigger>
						<DropdownMenuContent
							align="end"
							className="w-[13.75rem] rounded-xl border border-white/20 bg-gray-800 text-sm text-white ring ring-gray-800"
						>
							{row.original.status.toLowerCase() === "pending" ? (
								<>
									<DropdownMenuItem
										onSelect={() => onViewTransferDetails(row.original.id)}
										className="flex items-center gap-3 rounded-lg text-white focus:bg-white/10 focus:text-white py-2"
									>
										<RiErrorWarningLine className="text-white" />
										<span>View transfer details</span>
									</DropdownMenuItem>
									<DropdownMenuItem className="flex items-center gap-3 rounded-lg text-white focus:bg-white/10 focus:text-white py-2">
										<RiSendPlaneLine className="text-white" /> <span>Resend request</span>
									</DropdownMenuItem>
									<DropdownMenuItem className="flex items-center gap-3 rounded-lg text-white focus:bg-white/10 focus:text-white py-2">
										<RiCloseLine className="text-white" /> <span>Cancel transfer</span>
									</DropdownMenuItem>
								</>
							) : row.original.status.toLowerCase() === "rejected" ? (
								<>
									<DropdownMenuItem
										onSelect={() => onViewTransferDetails(row.original.id)}
										className="flex items-center gap-3 rounded-lg text-white focus:bg-white/10 focus:text-white py-2"
									>
										<RiErrorWarningLine className="text-white" />
										<span>View transfer details</span>
									</DropdownMenuItem>
									<DropdownMenuItem
										onSelect={() =>
											router.push(
												`/dashboard/new-transfer-request?patientId=${row.original.patientId}`,
											)
										}
										className="flex items-center gap-3 rounded-lg text-white focus:bg-white/10 focus:text-white py-2"
									>
										<RiEdit2Line className="text-white" /> <span>Edit and resend request</span>
									</DropdownMenuItem>
									<DropdownMenuSeparator className="bg-white/20" />
									<DropdownMenuItem className="flex items-center gap-3 rounded-lg text-white focus:bg-white/10 focus:text-white py-2">
										<RiArchiveLine className="text-white" />
										<span>Archive</span>
									</DropdownMenuItem>
								</>
							) : row.original.status.toLowerCase() === "completed" ? (
								<>
									<DropdownMenuItem
										onSelect={() => onViewTransferDetails(row.original.id)}
										className="flex items-center gap-3 rounded-lg text-white focus:bg-white/10 focus:text-white py-2"
									>
										<RiErrorWarningLine className="text-white" />
										<span>View transfer details</span>
									</DropdownMenuItem>
									<DropdownMenuSeparator className="bg-white/20" />
									<DropdownMenuItem className="flex items-center gap-3 rounded-lg text-white focus:bg-white/10 focus:text-white py-2">
										<RiArchiveLine className="text-white" />
										<span>Archive</span>
									</DropdownMenuItem>
								</>
							) : row.original.status.toLowerCase() === "failed" ? (
								<>
									<DropdownMenuItem
										onSelect={() => onViewTransferDetails(row.original.id)}
										className="flex items-center gap-3 rounded-lg text-white focus:bg-white/10 focus:text-white py-2"
									>
										<RiErrorWarningLine className="text-white" />
										<span>View transfer details</span>
									</DropdownMenuItem>
									<DropdownMenuItem className="flex items-center gap-3 rounded-lg text-white focus:bg-white/10 focus:text-white py-2">
										<RiCornerDownLeftFill className="text-whte" /> <span>Retry transfer</span>
									</DropdownMenuItem>
									<DropdownMenuSeparator className="bg-white/20" />
									<DropdownMenuItem className="flex items-center gap-3 rounded-lg text-white focus:bg-white/10 focus:text-white py-2">
										<RiArchiveLine className="text-white" />
										<span>Archive</span>
									</DropdownMenuItem>
								</>
							) : row.original.status.toLowerCase() === "cancelled" ? (
								<>
									<DropdownMenuItem
										onSelect={() => onViewTransferDetails(row.original.id)}
										className="flex items-center gap-3 rounded-lg text-white focus:bg-white/10 focus:text-white py-2"
									>
										<RiErrorWarningLine className="text-white" />
										<span>View transfer details</span>
									</DropdownMenuItem>
									<DropdownMenuItem
										className="flex items-center gap-3 rounded-lg text-white focus:bg-white/10 focus:text-white py-2"
										onSelect={() =>
											router.push(
												`/dashboard/new-transfer-request?patientId=${row.original.patientId}`,
											)
										}
									>
										<RiAddLine className="text-whte" /> <span>Start new transfer</span>
									</DropdownMenuItem>
									<DropdownMenuSeparator className="bg-white/20" />
									<DropdownMenuItem className="flex items-center gap-3 rounded-lg text-white focus:bg-white/10 focus:text-white py-2">
										<RiArchiveLine className="text-white" />
										<span>Archive</span>
									</DropdownMenuItem>
								</>
							) : null}
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			),
		},
	];
}
