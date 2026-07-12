"use client";

import { useMemo, useState, useTransition } from "react";
import useSWR from "swr";
import { CreateDocumentDrawer as CreateDocumentDrawerComponent } from "@/features/patients/components/create-document-drawer";
import { DocumentDetailsDrawer as DocumentDetailsDrawerComponent } from "@/features/patients/components/document-details-drawer";
import { IndeterminateCheckbox } from "@/components/indeterminate-checkbox";
import { Button } from "@/components/ui/button";
import {
	Drawer,
	DrawerClose,
	DrawerContent,
	DrawerDescription,
	DrawerFooter,
	DrawerHeader,
	DrawerTitle,
} from "@/components/ui/drawer";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Textarea } from "@/components/ui/textarea";
import type { DocumentType } from "@/features/patients/types";
import {
	createPatientDocumentAction,
	removePatientDocumentAction,
	updatePatientDocumentAction,
} from "@/features/patients/server/actions";
import { cn } from "@/lib/utils/cn";
import {
	type ColumnDef,
	flexRender,
	getCoreRowModel,
	getSortedRowModel,
	type SortingState,
	useReactTable,
} from "@tanstack/react-table";
import {
	RiArrowDownSLine,
	RiArrowUpSLine,
	RiCloseLine,
	RiEditLine,
	RiEyeLine,
	RiFileTextLine,
	RiFilter3Line,
	RiMore2Fill,
	RiSearchLine,
	RiShare2Line,
	RiUploadCloud2Line,
} from "@remixicon/react";
import pdfFileFormat from "@/assets/file-formats/pdf.svg";
import pngFileFormat from "@/assets/file-formats/png.svg";
import jpgFileFormat from "@/assets/file-formats/jpg.svg";
import docFileFormat from "@/assets/file-formats/doc.svg";
import { CopyIdButton } from "@/components/copy-id-button";

const ROWS_PER_PAGE_OPTIONS = [14, 28, 42];
const fileFormat: Record<string, string> = {
	pdf: pdfFileFormat,
	jpg: jpgFileFormat,
	png: pngFileFormat,
	doc: docFileFormat,
	docx: docFileFormat,
};

type DocumentsTableProps = {
	patientId: string;
	documents: DocumentType[];
	page: number;
	limit: number;
	totalPages: number;
	query: string;
	createdFrom: string;
	createdTo: string;
	documentTypeFilters: string[];
	isPending: boolean;
	onQueryChange: (query: string) => void;
	onDocumentTypeFiltersChange: (categories: string[]) => void;
	onCreatedAtRangeApply: (from: string, to: string) => void;
	onPreviousPage: () => void;
	onNextPage: () => void;
	onLimitChange: (limit: number) => void;
	onDocumentsChanged: () => void;
};

const DOCUMENT_TYPE = [
	"Lab Report",
	"Imaging",
	"Cardiology",
	"Clinical Summary",
	"Referral",
	"Pathology",
];

export function DocumentsTable({
	patientId,
	documents,
	page,
	limit,
	totalPages,
	query,
	documentTypeFilters,
	isPending,
	onQueryChange,
	onDocumentTypeFiltersChange,
	onPreviousPage,
	onNextPage,
	onLimitChange,
	onDocumentsChanged,
}: DocumentsTableProps) {
	const [sorting, setSorting] = useState<SortingState>([]);
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const [isDetailsDrawerOpen, setIsDetailsDrawerOpen] = useState(false);
	const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false);
	const documentDetailsQuery = useSWR(
		selectedId ? (["patient-document-details", selectedId] as const) : null,
		([, documentId]) => fetchPatientDocumentDetails(documentId),
	);

	function handleViewDocumentDetails(documentId: string) {
		setSelectedId(documentId);
		setIsDetailsDrawerOpen(true);
	}

	const columns = useMemo(
		() => getDocumentColumns({ onViewDocumentDetails: handleViewDocumentDetails }),
		[],
	);
	const table = useReactTable({
		data: documents,
		columns,
		enableRowSelection: true,
		onSortingChange: setSorting,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		state: { sorting },
	});

	return (
		<div className="px-6 py-8 text-sm">
			<h1 className="mx-auto max-w-7xl text-xl font-semibold">Documents</h1>
			<div className="mx-auto mt-7 mb-4 flex max-w-7xl items-center gap-2">
				<div className="relative w-full">
					<RiSearchLine className="pointer-events-none absolute bottom-0 left-2 flex h-full size-4 items-center justify-center text-gray-400" />
					<Input
						type="search"
						className="pl-8"
						placeholder="Search by name, document ID"
						value={query}
						onChange={(event) => onQueryChange(event.target.value)}
					/>
				</div>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button
							variant="outline"
							className="border-gray-200 bg-white text-sm text-gray-600 hover:bg-gray-50 data-[state=open]:border-gray-400 data-[state=open]:ring-4 data-[state=open]:ring-gray-200"
						>
							<RiFilter3Line aria-hidden className="size-5 text-gray-600" />
							Filter
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent
						align="end"
						className="w-[13.75rem] rounded-xl border-gray-200 bg-white text-sm text-gray-700 shadow-xl"
					>
						<DropdownMenuSub>
							<DropdownMenuSubTrigger className="rounded-lg py-2 focus:bg-gray-100 focus:text-gray-900 data-[state=open]:bg-gray-100">
								<RiFileTextLine className="size-4.5" />
								<span>Document Type </span>
							</DropdownMenuSubTrigger>
							<DropdownMenuSubContent
								// alignOffset={-5}
								className="w-[13.75rem] rounded-xl border border-gray-200 bg-white p-1 text-sm text-gray-700 shadow-xl"
							>
								{DOCUMENT_TYPE.map((documentType) => {
									const documentTypeId = `document-type-${documentType.toLowerCase().replaceAll(" ", "-")}`;
									return (
										<DropdownMenuItem
											key={documentType}
											className="rounded-lg p-0 focus:bg-gray-100 focus:text-gray-900"
											onSelect={(event) => event.preventDefault()}
										>
											<Label
												htmlFor={documentTypeId}
												className="flex w-full cursor-pointer items-center gap-3 px-2 py-2 leading-normal font-normal"
											>
												<Checkbox
													id={documentTypeId}
													checked={documentTypeFilters.includes(documentType)}
													onCheckedChange={(checked) =>
														onDocumentTypeFiltersChange(
															checked
																? [...documentTypeFilters, documentType]
																: documentTypeFilters.filter((docType) => docType !== documentType),
														)
													}
													className="[&_svg]:!text-current"
												/>
												<span>{documentType}</span>
											</Label>
										</DropdownMenuItem>
									);
								})}
							</DropdownMenuSubContent>
						</DropdownMenuSub>
					</DropdownMenuContent>
				</DropdownMenu>
				<Button
					variant="outline"
					className="border-gray-200 bg-white text-sm text-gray-600 hover:bg-gray-50"
				>
					<RiShare2Line aria-hidden className="size-5 text-gray-600" />
					Export
				</Button>
				<Button
					type="button"
					className="bg-gray-800 text-sm"
					onClick={() => setIsCreateDrawerOpen(true)}
				>
					Add document
				</Button>
			</div>
			<div className="mx-auto max-w-7xl overflow-x-auto rounded-xl border border-gray-200 text-sm">
				<Table className="min-w-[58rem] border-separate border-spacing-0 bg-gray-50 text-left">
					<TableHeader className="h-12 text-sm font-semibold text-gray-600">
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow key={headerGroup.id} className="h-12">
								{headerGroup.headers.map((header) => (
									<TableHead
										key={header.id}
										onClick={header.column.getToggleSortingHandler()}
										onKeyDown={(event) => {
											if (event.key === "Enter") header.column.getToggleSortingHandler()?.(event);
										}}
										className={cn(
											"z-10 h-12 bg-gray-50 px-3 py-0 text-gray-600 whitespace-nowrap",
											header.column.getCanSort() && "cursor-pointer select-none",
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
															header.column.getIsSorted() === "desc" && "opacity-30",
														)}
														aria-hidden
													/>
													<RiArrowDownSLine
														className={cn(
															"size-4 text-gray-800",
															header.column.getIsSorted() === "asc" && "opacity-30",
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
						{table.getRowModel().rows.length === 0 ? (
							<TableRow>
								<TableCell colSpan={6} className="bg-white px-3 py-12 text-center text-gray-500">
									No documents match the current filters.
								</TableCell>
							</TableRow>
						) : null}
					</TableBody>
				</Table>
				<div className="flex flex-col gap-3 border-t border-gray-200 bg-white p-3 text-sm text-gray-500 sm:flex-row sm:items-center sm:justify-between">
					<div className="flex items-center gap-3">
						<span>Rows per page</span>
						<Select
							value={String(limit)}
							onValueChange={(value) => {
								onLimitChange(Number(value));
							}}
						>
							<SelectTrigger className="h-8 w-[4.25rem] border-gray-200 bg-white px-2 text-gray-700 shadow-none">
								<SelectValue aria-label="Rows per page" placeholder="Rows" />
							</SelectTrigger>
							<SelectContent>
								<SelectGroup className="p-1">
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
								disabled={page <= 1 || isPending}
								onClick={onPreviousPage}
								className="border-gray-200 px-3 text-gray-700 shadow-none transition"
							>
								Previous
							</Button>
							<Button
								type="button"
								variant="outline"
								size="sm"
								disabled={page >= totalPages || isPending}
								onClick={onNextPage}
								className="border-gray-200 px-3 text-gray-700 shadow-none transition"
							>
								Next
							</Button>
						</div>
					</div>
				</div>
			</div>
			<DocumentDetailsDrawerComponent
				open={isDetailsDrawerOpen}
				onOpenChange={setIsDetailsDrawerOpen}
				document={documentDetailsQuery.data ?? null}
				isLoading={documentDetailsQuery.isLoading}
				onChanged={() => {
					void documentDetailsQuery.mutate();
					onDocumentsChanged();
				}}
			/>
			<CreateDocumentDrawerComponent
				open={isCreateDrawerOpen}
				onOpenChange={setIsCreateDrawerOpen}
				patientId={patientId}
				onCreated={onDocumentsChanged}
			/>
		</div>
	);
}

function getDocumentColumns({
	onViewDocumentDetails,
}: {
	onViewDocumentDetails: (documentId: string) => void;
}): ColumnDef<DocumentType>[] {
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
						onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
					/>
				</div>
			),
			cell: ({ row }) => (
				<div className="w-max" onClick={(event) => event.stopPropagation()}>
					<IndeterminateCheckbox
						checked={row.getIsSelected()}
						disabled={!row.getCanSelect()}
						indeterminate={row.getIsSomeSelected()}
						onCheckedChange={(value) => row.toggleSelected(!!value)}
					/>
				</div>
			),
			enableSorting: false,
		},
		{
			header: "Document",
			accessorKey: "title",
			enableSorting: true,
			cell: ({ row }) => <span className="font-medium text-gray-800">{row.original.title}</span>,
		},
		{
			header: "Document ID",
			accessorKey: "documentId",
			enableSorting: false,
			cell: ({ row }) => <CopyIdButton id={row.original.documentId} />,
		},
		{
			header: "Document Type",
			accessorKey: "documentType",
			enableSorting: true,
		},
		{
			id: "createdAt",
			header: "Created At",
			accessorFn: (row) => row.createdAtSortValue,
			enableSorting: true,
			cell: ({ row }) => row.original.createdAtLabel,
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
							aria-label={`Open actions for ${row.original.title}`}
						>
							<RiMore2Fill className="size-5" aria-hidden />
						</DropdownMenuTrigger>
						<DropdownMenuContent
							align="end"
							className="w-[13.75rem] rounded-xl border-white/20 bg-gray-800 text-sm text-white ring ring-gray-800"
						>
							<DropdownMenuItem
								className="gap-3 rounded-lg py-2 text-white focus:bg-white/10 focus:text-white"
								onSelect={() => onViewDocumentDetails(row.original.documentId)}
							>
								<RiEyeLine className="text-white" />
								<span>View details</span>
							</DropdownMenuItem>
							<DropdownMenuItem
								className="gap-3 rounded-lg py-2 text-white focus:bg-white/10 focus:text-white"
								onSelect={() => onViewDocumentDetails(row.original.documentId)}
							>
								<RiFileTextLine className="text-white" />
								<span>Open</span>
							</DropdownMenuItem>
							<DropdownMenuItem className="gap-3 rounded-lg py-2 text-white focus:bg-white/10 focus:text-white">
								<RiShare2Line className="text-white" />
								<span>Export</span>
							</DropdownMenuItem>
							<DropdownMenuSeparator className="bg-white/20" />
							<DropdownMenuItem className="gap-3 rounded-lg py-2 text-white focus:bg-white/10 focus:text-white">
								<RiCloseLine className="text-white" />
								<span>Remove</span>
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			),
		},
	];
}

function LegacyDocumentDetailsDrawer({
	open,
	onOpenChange,
	document,
	isLoading,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	document: DocumentType | null;
	isLoading: boolean;
}) {
	const [mode, setMode] = useState<"view" | "edit">("view");
	const [actionError, setActionError] = useState("");
	const [isDocumentActionPending, startDocumentActionTransition] = useTransition();
	const isEditing = mode === "edit" && Boolean(document);

	function handleOpenChange(nextOpen: boolean) {
		if (!nextOpen) setMode("view");
		onOpenChange(nextOpen);
	}

	function handleUpdateDocument(formData: FormData) {
		if (!document) return;
		setActionError("");
		startDocumentActionTransition(async () => {
			const result = await updatePatientDocumentAction(document.documentId, formData);
			if (!result.ok) {
				setActionError(result.message ?? "");
				return;
			}
			setMode("view");
		});
	}

	function handleRemoveDocument() {
		if (!document) return;
		setActionError("");
		startDocumentActionTransition(async () => {
			const result = await removePatientDocumentAction(document.documentId);
			if (!result.ok) {
				setActionError(result.message ?? "");
				return;
			}
			onOpenChange(false);
		});
	}

	return (
		<Drawer open={open} onOpenChange={handleOpenChange} direction="right">
			<DrawerContent className="overflow-hidden rounded-3xl text-sm data-[vaul-drawer-direction=right]:top-4 data-[vaul-drawer-direction=right]:right-4 data-[vaul-drawer-direction=right]:bottom-4 data-[vaul-drawer-direction=right]:h-auto data-[vaul-drawer-direction=right]:w-[50rem]">
				<DrawerHeader className="flex-row items-center justify-between border-b border-gray-200 px-6 py-5 text-left">
					<DrawerTitle className="text-lg text-gray-800">
						{isEditing ? "Edit document details" : "View document details"}
					</DrawerTitle>
					<DrawerClose aria-label="Close document details">
						<RiCloseLine className="size-6" />
					</DrawerClose>
					<DrawerDescription className="sr-only">
						Details for the selected patient document.
					</DrawerDescription>
				</DrawerHeader>
				<div className="min-h-0 overflow-y-auto px-6 py-8">
					{isLoading ? (
						<div className="space-y-4" aria-busy="true">
							<div className="h-6 w-48 animate-pulse rounded bg-gray-100" />
							<div className="h-40 animate-pulse rounded-xl bg-gray-100" />
						</div>
					) : document ? (
						isEditing ? (
							<DocumentEditForm document={document} onSubmit={handleUpdateDocument} />
						) : (
							<DocumentOverview document={document} onEdit={() => setMode("edit")} />
						)
					) : (
						<p className="text-gray-500">Document details could not be found.</p>
					)}
					{actionError ? <p className="px-6 pb-2 text-sm text-red-600">{actionError}</p> : null}
				</div>
				<DrawerFooter className="border-t border-gray-200 px-6 py-5">
					{isEditing ? (
						<div className="ml-auto flex gap-4">
							<Button type="button" variant="outline" onClick={() => setMode("view")}>
								Cancel
							</Button>
							<Button
								type="submit"
								form="document-details-edit-form"
								disabled={isDocumentActionPending}
							>
								Save changes
							</Button>
						</div>
					) : (
						<div className="ml-auto flex gap-4">
							<DrawerClose asChild>
								<Button type="button" variant="outline">
									Cancel
								</Button>
							</DrawerClose>
							<Button
								type="button"
								className="bg-gray-800"
								disabled={isDocumentActionPending}
								onClick={handleRemoveDocument}
							>
								Remove document
							</Button>
						</div>
					)}
				</DrawerFooter>
			</DrawerContent>
		</Drawer>
	);
}

function DocumentOverview({ document, onEdit }: { document: DocumentType; onEdit: () => void }) {
	return (
		<div className="flex flex-col gap-10">
			<div className="flex flex-wrap gap-x-8 gap-y-3">
				<div className="flex items-center gap-2">
					<span className="text-gray-400">Document ID:</span>
					<CopyIdButton id={document.documentId} />
				</div>
				{document.encounterId ? (
					<div className="flex items-center gap-2">
						<span className="text-gray-400">Encounter ID:</span>
						<CopyIdButton id={document.encounterId} />
					</div>
				) : null}
			</div>
			<div className="flex items-center justify-between gap-4">
				<h2 className="text-xl font-semibold text-gray-800">{document.title}</h2>
				<Button type="button" variant="ghost" onClick={onEdit} className="text-gray-500">
					<RiEditLine className="size-4" />
					Edit
				</Button>
			</div>
			<div className="grid grid-cols-1 gap-x-16 gap-y-6 sm:grid-cols-2">
				<DocumentDetail label="Document type" value={document.documentType} />
				<DocumentDetail label="Clinical notes" value={document.clinicalNotes} />
				<DocumentDetail label="Created by" value={document.createdBy} />
				<DocumentDetail label="Created at" value={document.createdAtLabel} />
				<DocumentDetail label="Updated by" value={document.updatedBy} />
				<DocumentDetail label="Updated at" value={document.updatedAtLabel} />
			</div>
			<div>
				<h3 className="mb-4 text-lg font-semibold text-gray-800">Files</h3>
				<div className="flex flex-col gap-3">
					{document.files.map((file) => (
						<div
							key={file.url}
							className="flex items-center gap-4 rounded-2xl border border-gray-200 p-4"
						>
							<div className="min-w-0 flex-1">
								<p className="truncate font-semibold text-gray-800">{file.name}</p>
								<p className="mt-1 text-gray-400">
									{file.size} - Uploaded on {file.uploadedAt.slice(0, 10)}
								</p>
							</div>
							<Button asChild type="button">
								<a href={file.url}>Open</a>
							</Button>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}

function DocumentDetail({ label, value }: { label: string; value: string }) {
	return (
		<div className="flex flex-col gap-2">
			<span className="text-gray-400">{label}</span>
			<span className="font-semibold text-gray-600">{value || "-"}</span>
		</div>
	);
}

function DocumentEditForm({
	document,
	onSubmit,
}: {
	document: DocumentType;
	onSubmit: (formData: FormData) => void;
}) {
	return (
		<form
			id="document-details-edit-form"
			action={onSubmit}
			className="grid grid-cols-1 gap-6 sm:grid-cols-2"
		>
			<div className="flex flex-col gap-2">
				<Label htmlFor="document-title">Document title</Label>
				<Input id="document-title" name="title" defaultValue={document.title} required />
			</div>
			<div className="flex flex-col gap-2">
				<Label>Document type</Label>
				<Select name="documentType" defaultValue={document.documentType}>
					<SelectTrigger>
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value={document.documentType}>{document.documentType}</SelectItem>
					</SelectContent>
				</Select>
			</div>

			<div className="flex flex-col gap-2 sm:col-span-2">
				<Label htmlFor="document-notes">Clinical notes</Label>
				<Textarea
					id="document-notes"
					name="clinicalNotes"
					defaultValue={document.clinicalNotes === "-" ? "" : document.clinicalNotes}
					className="min-h-32"
				/>
			</div>
		</form>
	);
}

function LegacyCreateDocumentDrawer({
	open,
	onOpenChange,
	patientId,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	patientId: string;
}) {
	const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
	const [formError, setFormError] = useState("");
	const [isCreatingDocument, startCreateDocumentTransition] = useTransition();

	function handleCreateDocument(formData: FormData) {
		setFormError("");
		startCreateDocumentTransition(async () => {
			const result = await createPatientDocumentAction(patientId, formData);
			if (!result.ok) {
				setFormError(result.message ?? "");
				return;
			}
			setSelectedFiles([]);
			onOpenChange(false);
		});
	}

	return (
		<Drawer open={open} onOpenChange={onOpenChange} direction="right">
			<DrawerContent className="overflow-hidden rounded-3xl text-sm data-[vaul-drawer-direction=right]:top-4 data-[vaul-drawer-direction=right]:right-4 data-[vaul-drawer-direction=right]:bottom-4 data-[vaul-drawer-direction=right]:h-auto data-[vaul-drawer-direction=right]:w-[50rem]">
				<DrawerHeader className="flex-row items-center justify-between border-b border-gray-200 px-6 py-5 text-left">
					<DrawerTitle className="text-lg text-gray-800">Add document</DrawerTitle>
					<DrawerClose aria-label="Close add document">
						<RiCloseLine className="size-5" />
					</DrawerClose>
					<DrawerDescription className="sr-only">
						Add document metadata and choose mock local files.
					</DrawerDescription>
				</DrawerHeader>
				<form
					id="create-document-form"
					action={handleCreateDocument}
					className="min-h-0 flex-1 space-y-6 overflow-y-auto px-6 py-8"
				>
					<div className="grid gap-6 sm:grid-cols-2">
						<div className="flex flex-col gap-2">
							<Label htmlFor="new-document-title">
								Document title <span className="text-gray-400">(required)</span>
							</Label>
							<Input
								id="new-document-title"
								name="title"
								placeholder="e.g. Complete Blood Count Report"
								required
							/>
						</div>

						<div className="flex flex-col gap-2">
							<Label>
								Document Type <span className="text-gray-400">(required)</span>
							</Label>
							<Select name="document type" required>
								<SelectTrigger className="w-full">
									<SelectValue placeholder="Select document type" />
								</SelectTrigger>
								<SelectContent className="rounded-xl border-gray-200 p-1 text-sm text-gray-700 shadow-xl">
									{DOCUMENT_TYPE.map((documentType) => (
										<SelectItem
											value={documentType}
											key={documentType}
											className="rounded-md px-3 h-9"
										>
											{documentType}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-2 sm:col-span-2">
							<Label htmlFor="new-document-notes">
								Clinical notes <span className="text-gray-400">(optional)</span>
							</Label>
							<Textarea
								id="new-document-notes"
								name="clinicalNotes"
								className="min-h-32"
								placeholder="Add notes or context about this document"
							/>
						</div>
					</div>
					<div className="space-y-3">
						<Label htmlFor="mock-document-files">
							Files <span className="text-gray-400">(mock only)</span>
						</Label>
						<label
							htmlFor="mock-document-files"
							className="flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 p-6 text-center transition hover:bg-gray-50"
						>
							<RiUploadCloud2Line className="mb-3  text-gray-500" />
							<span className="font-medium text-gray-800">
								Choose one or more files or drag and drop them here.
							</span>
							<span className="mt-1 text-gray-500">
								Supports JPEG, PNG, and PDF, up to 50 MB. Files are not uploaded.
							</span>
							<span className="mt-4 rounded-md border border-gray-200 bg-white px-4 py-2 font-medium text-gray-600 shadow-xs">
								Browse files
							</span>
						</label>
						<input
							id="mock-document-files"
							type="file"
							accept="image/jpeg,image/png,application/pdf"
							multiple
							className="sr-only"
							onChange={(event) => setSelectedFiles(Array.from(event.target.files ?? []))}
						/>
						{selectedFiles.map((file) => (
							<div
								key={`${file.name}-${file.lastModified}`}
								className="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3"
							>
								<span className="min-w-0 truncate font-medium text-gray-700">{file.name}</span>
								<button
									type="button"
									className="text-gray-500 hover:text-gray-800"
									onClick={() =>
										setSelectedFiles((prev) => prev.filter((selectedFile) => selectedFile !== file))
									}
								>
									Remove
								</button>
							</div>
						))}
					</div>
					{formError ? <p className="text-red-600">{formError}</p> : null}
				</form>
				<DrawerFooter className="border-t border-gray-200 px-6 py-5">
					<div className="ml-auto flex gap-4">
						<DrawerClose asChild>
							<Button variant="outline">Cancel</Button>
						</DrawerClose>
						<Button
							type="submit"
							form="create-document-form"
							className="bg-gray-800"
							disabled={isCreatingDocument}
						>
							Add document
						</Button>
					</div>
				</DrawerFooter>
			</DrawerContent>
		</Drawer>
	);
}

async function fetchPatientDocumentDetails(documentId: string) {
	const response = await fetch(`/api/patient-document-details/${encodeURIComponent(documentId)}`);
	if (!response.ok) throw new Error("Unable to load document details.");
	const result = (await response.json()) as { document: DocumentType | null };
	return result.document;
}
