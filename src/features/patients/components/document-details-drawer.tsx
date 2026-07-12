"use client";

import { CopyIdButton } from "@/components/copy-id-button";
import { getDocumentFileIcon } from "@/lib/utils/document-file-icon";
import Image from "next/image";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
	removePatientDocumentAction,
	updatePatientDocumentAction,
} from "@/features/patients/server/actions";
import type { DocumentType } from "@/features/patients/types";
import { RiAddLine, RiCloseLine, RiEditLine } from "@remixicon/react";
import { useRef, useState, useTransition } from "react";
import { ChooseFileCard } from "@/components/choose-file-card";

const documentTypes = [
	"Lab Report",
	"Imaging",
	"Cardiology",
	"Clinical Summary",
	"Referral",
	"Pathology",
	"Radiology Report",
];

export function DocumentDetailsDrawer({
	open,
	onOpenChange,
	document,
	isLoading,
	onChanged,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	document: DocumentType | null;
	isLoading: boolean;
	onChanged: () => void;
}) {
	const [documentDetailsmode, setDocumentDetailsMode] = useState<"view" | "edit">("view");
	const [actionError, setActionError] = useState("");
	const [isPending, startTransition] = useTransition();

	function handleOpenChange(nextOpen: boolean) {
		if (!nextOpen) setDocumentDetailsMode("view");
		onOpenChange(nextOpen);
	}
	function handleUpdate(formData: FormData) {
		if (!document) return;
		startTransition(async () => {
			const result = await updatePatientDocumentAction(document.documentId, formData);
			if (!result.ok) {
				setActionError(result.message ?? "Unable to update document.");
				return;
			}
			setDocumentDetailsMode("view");
			onChanged();
		});
	}
	function handleRemove() {
		if (!document) return;
		startTransition(async () => {
			const result = await removePatientDocumentAction(document.documentId);
			if (!result.ok) {
				setActionError(result.message ?? "Unable to remove document.");
				return;
			}
			onOpenChange(false);
			onChanged();
		});
	}

	const isEditingDocumentDetails = documentDetailsmode === "edit" && Boolean(document);

	return (
		<Drawer open={open} onOpenChange={handleOpenChange} direction="right">
			<DrawerContent className="overflow-hidden rounded-3xl text-sm data-[vaul-drawer-direction=right]:top-4 data-[vaul-drawer-direction=right]:right-4 data-[vaul-drawer-direction=right]:bottom-4 data-[vaul-drawer-direction=right]:h-auto data-[vaul-drawer-direction=right]:w-[50rem]">
				<DrawerHeader className="flex-row items-center justify-between border-b border-gray-200 px-6 py-5 text-left">
					<DrawerTitle className="text-lg text-gray-800">
						{isEditingDocumentDetails ? "Edit document details" : "View document details"}
					</DrawerTitle>
					<DrawerClose aria-label="Close document details">
						<RiCloseLine className="size-5" />
					</DrawerClose>
					<DrawerDescription className="sr-only">
						Selected patient document details.
					</DrawerDescription>
				</DrawerHeader>
				<div className="min-h-0 overflow-y-auto px-6 py-8">
					{isLoading ? (
						<DcoumentDetailsFallback />
					) : document ? (
						isEditingDocumentDetails && document ? (
							<DocumentDetailsEditForm
								key={document.documentId}
								document={document}
								handleUpdate={handleUpdate}
							/>
						) : (
							<DocumentDetailsOverview
								document={document}
								onEditDocumentDetails={() => setDocumentDetailsMode("edit")}
							/>
						)
					) : (
						<p className="text-gray-500">Document details could not be found.</p>
					)}
					{actionError ? <p className="mt-4 text-red-600">{actionError}</p> : null}
				</div>
				<DrawerFooter className="border-t border-gray-200 px-6 py-5">
					{isEditingDocumentDetails ? (
						<div className="ml-auto flex gap-4">
							<Button variant="outline" onClick={() => setDocumentDetailsMode("view")}>
								Cancel
							</Button>
							<Button
								type="submit"
								form="document-details-form"
								className="bg-gray-800"
								disabled={isPending}
							>
								Save changes
							</Button>
						</div>
					) : (
						<div className="ml-auto flex gap-4">
							<DrawerClose asChild>
								<Button variant="outline">Cancel</Button>
							</DrawerClose>
							<Button
								className="bg-gray-800"
								disabled={isPending || !document}
								onClick={handleRemove}
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

function DocumentDetailsOverview({
	document,
	onEditDocumentDetails,
}: {
	document: DocumentType;
	onEditDocumentDetails: () => void;
}) {
	const [areDocumentFilesExpanded, setAreDocumentFilesExpanded] = useState(false);
	const visibleDocumentFiles = areDocumentFilesExpanded
		? document.files
		: document.files.slice(0, 3);

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
				<button
					type="button"
					onClick={onEditDocumentDetails}
					className="inline-flex items-center gap-2 text-sm font-medium text-gray-400 transition hover:text-gray-700"
				>
					<RiEditLine className="size-4" />
					Edit
				</button>
			</div>
			<div className="grid grid-cols-1 gap-x-16 gap-y-6 sm:grid-cols-2">
				<DocumentDetailItem label="Document type" value={document.documentType} />
				<DocumentDetailItem label="Clinical notes" value={document.clinicalNotes} />
				<DocumentDetailItem label="Created by" value={document.createdBy} />
				<DocumentDetailItem label="Created at" value={document.createdAtLabel} />
				<DocumentDetailItem label="Updated by" value={document.updatedBy} />
				<DocumentDetailItem label="Updated at" value={document.updatedAtLabel} />
			</div>
			<div>
				<div className="mb-4 flex items-center justify-between">
					<h3 className="text-lg font-semibold text-gray-800">Files</h3>
					{document.files.length > 3 ? (
						<button
							type="button"
							className="text-gray-400"
							onClick={() => setAreDocumentFilesExpanded((previousValue) => !previousValue)}
						>
							{areDocumentFilesExpanded ? "View less" : "View more"}
						</button>
					) : null}
				</div>
				{document.files.length ? (
					<div className="space-y-3">
						{visibleDocumentFiles.map((file) => (
							<div
								key={file.url}
								className="flex items-center gap-4 rounded-2xl border border-gray-200 p-4"
							>
								<Image
									src={getDocumentFileIcon(file.name, file.type)}
									alt=""
									width={44}
									height={44}
									className="size-11 shrink-0"
								/>
								<div className="min-w-0 flex-1">
									<p className="truncate font-semibold text-gray-800">{file.name}</p>
									<p className="text-gray-400">
										{file.size} • Uploaded on {file.uploadedAt.slice(0, 10)}
									</p>
								</div>
								<Button variant="outline">Download</Button>
								<Button asChild>
									<a href={file.url}>Open</a>
								</Button>
							</div>
						))}
					</div>
				) : (
					<p className="text-gray-500">No uploaded files.</p>
				)}
			</div>
		</div>
	);
}

function DocumentDetailsEditForm({
	document,
	handleUpdate,
}: {
	document: DocumentType;
	handleUpdate: (formData: FormData) => void;
}) {
	const documentFileInputRef = useRef<HTMLInputElement>(null);
	const [editableFiles, setEditableFiles] = useState(document.files);

	const hasFiles = editableFiles.length > 0;

	function handleDocumentFilesChange(event: React.ChangeEvent<HTMLInputElement>) {
		const selectedFiles = Array.from(event.target.files ?? []);

		const nextFiles = selectedFiles.map((file) => ({
			name: file.name,
			type: file.type,
			url: URL.createObjectURL(file),
			size: `${Math.round(file.size / 1024)}KB`,
			uploadedAt: new Date().toISOString(),
		}));

		setEditableFiles((previousFiles) => [...previousFiles, ...nextFiles]);

		event.target.value = "";
	}

	function handleRemoveDocumentFile(fileUrl: string) {
		setEditableFiles((previousFiles) => previousFiles.filter((file) => file.url !== fileUrl));
	}
	const defaultDocumentType = documentTypes.includes(document.documentType)
		? document.documentType
		: undefined;
	return (
		<form id="document-details-form" action={handleUpdate} className="grid gap-6 sm:grid-cols-2">
			<div className="space-y-2">
				<Label htmlFor="document-title">
					Document title <span className="text-gray-400">(required)</span>
				</Label>
				<Input id="document-title" name="title" defaultValue={document.title} required />
			</div>
			<div className="space-y-2">
				<Label>
					Document type <span className="text-gray-400">(required)</span>
				</Label>
				<Select key={document.documentId} defaultValue={defaultDocumentType}>
					<SelectTrigger className="w-full">
						<SelectValue placeholder="Select document type" />
					</SelectTrigger>
					<SelectContent className="rounded-xl border-gray-200 p-1 text-sm text-gray-700 shadow-xl">
						{documentTypes.map((type) => (
							<SelectItem key={type} value={type} className="rounded-md px-3 h-9">
								{type}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>
			<div className="space-y-2 sm:col-span-2">
				<Label htmlFor="document-notes">
					Clinical notes <span className="text-gray-400">(optional)</span>
				</Label>
				<Textarea
					id="document-notes"
					name="clinicalNotes"
					defaultValue={document.clinicalNotes === "-" ? "" : document.clinicalNotes}
					className="min-h-32"
				/>
			</div>
			<div className="space-y-3 sm:col-span-2">
				<Label>
					Files <span className="text-gray-400">(required)</span>
				</Label>

				{hasFiles ? (
					<>
						<div className="space-y-3">
							{editableFiles.map((file) => (
								<div
									key={file.url}
									className="flex items-center gap-4 rounded-2xl border border-gray-200 p-4"
								>
									<Image
										src={getDocumentFileIcon(file.name, file.type)}
										alt=""
										width={44}
										height={44}
										className="size-11 shrink-0"
									/>

									<div className="min-w-0 flex-1">
										<p className="truncate font-semibold text-gray-800">{file.name}</p>

										<p className="text-gray-400">
											{file.size} · Uploaded on {file.uploadedAt.slice(0, 10)}
										</p>
									</div>

									<Button
										type="button"
										variant="outline"
										onClick={() => handleRemoveDocumentFile(file.url)}
									>
										Remove
									</Button>

									<Button asChild type="button">
										<a href={file.url} target="_blank" rel="noreferrer">
											Open
										</a>
									</Button>
								</div>
							))}
						</div>

						<input
							ref={documentFileInputRef}
							type="file"
							accept="image/jpeg,image/png,application/pdf"
							multiple
							className="sr-only"
							onChange={handleDocumentFilesChange}
						/>

						<Button
							type="button"
							variant="outline"
							onClick={() => documentFileInputRef.current?.click()}
						>
							<RiAddLine className="size-5" aria-hidden="true" />
							Add files
						</Button>
					</>
				) : (
					<ChooseFileCard
						onFilesSelected={handleDocumentFilesChange}
						fileInputRef={documentFileInputRef}
						title="Choose one or more files or drag and drop them here."
						description="Supports JPEG, PNG, and PDF, up to 50 MB. Files are not uploaded."
						browseLabel="Browse files"
						accept="image/jpeg,image/png,application/pdf"
						multiple
						inputId="document-files"
					/>
				)}
			</div>
		</form>
	);
}

function DocumentDetailItem({ label, value }: { label: string; value: string }) {
	return (
		<div className="flex flex-col gap-2">
			<span className="text-gray-400">{label}</span>
			<span className="font-semibold text-gray-600">{value || "-"}</span>
		</div>
	);
}
function DcoumentDetailsFallback() {
	return (
		<div className="flex flex-col gap-8" aria-busy="true" aria-live="polite">
			<div className="flex flex-wrap gap-6">
				<div className="h-6 w-36 animate-pulse rounded-md bg-gray-100" />
				<div className="h-6 w-40 animate-pulse rounded-md bg-gray-100" />
			</div>
			<div className="flex flex-col gap-6">
				<div className="h-7 w-56 animate-pulse rounded-md bg-gray-100" />
				<div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
					{Array.from({ length: 8 }).map((_, index) => (
						<div key={index} className="flex flex-col gap-2">
							<div className="h-4 w-28 animate-pulse rounded bg-gray-100" />
							<div className="h-5 w-44 animate-pulse rounded bg-gray-100" />
						</div>
					))}
				</div>
			</div>
			{Array.from({ length: 2 }).map((_, index) => (
				<div key={index} className="flex flex-col gap-4 rounded-2xl border border-gray-200 p-5">
					<div className="h-5 w-48 animate-pulse rounded bg-gray-100" />
					<div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
						<div className="h-5 w-40 animate-pulse rounded bg-gray-100" />
						<div className="h-5 w-36 animate-pulse rounded bg-gray-100" />
					</div>
				</div>
			))}
		</div>
	);
}
