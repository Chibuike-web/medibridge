"use client";

import { ChooseFileCard } from "@/components/choose-file-card";
import { CreateSelectedFiles } from "@/components/create-selected-files";
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
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createPatientDocumentAction } from "@/features/patients/server/actions";
import { RiCloseLine } from "@remixicon/react";
import { useRef, useState, useTransition } from "react";

const documentTypes = [
	"Lab Report",
	"Imaging",
	"Cardiology",
	"Clinical Summary",
	"Referral",
	"Pathology",
];

const documentFieldLabelClassName =
	"inline-flex items-baseline gap-0.5 text-sm font-medium text-gray-700";
const documentRequiredLabelClassName = "font-normal text-gray-400";

export function CreateDocumentDrawer({
	open,
	onOpenChange,
	patientId,
	onCreated,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	patientId: string;
	onCreated: () => void;
}) {
	const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
	const [formError, setFormError] = useState("");
	const documentFileInputRef = useRef<HTMLInputElement>(null);
	const [isPending, startTransition] = useTransition();
	function handleCreate(formData: FormData) {
		setFormError("");
		startTransition(async () => {
			const result = await createPatientDocumentAction(patientId, formData);
			if (!result.ok) {
				setFormError(result.message ?? "Unable to add document.");
				return;
			}
			setSelectedFiles([]);
			onOpenChange(false);
			onCreated();
		});
	}

	function handleFilesSelected(event: React.ChangeEvent<HTMLInputElement>) {
		const nextFiles = Array.from(event.target.files ?? []);

		setSelectedFiles((previousFiles) => [...previousFiles, ...nextFiles]);

		event.target.value = "";
	}

	function handleRemoveFile(file: File) {
		setSelectedFiles((previousFiles) =>
			previousFiles.filter((previousFile) => previousFile !== file),
		);
	}

	return (
		<Drawer open={open} onOpenChange={onOpenChange} direction="right">
			<DrawerContent className="overflow-hidden rounded-3xl text-sm data-[vaul-drawer-direction=right]:top-4 data-[vaul-drawer-direction=right]:right-4 data-[vaul-drawer-direction=right]:bottom-4 data-[vaul-drawer-direction=right]:h-auto data-[vaul-drawer-direction=right]:w-[50rem]">
				<DrawerHeader className="flex-row items-center justify-between border-b border-gray-200 px-6 py-5 text-left">
					<DrawerTitle className="text-base text-gray-800">Add document</DrawerTitle>
					<DrawerClose aria-label="Close add document">
						<RiCloseLine className="size-5" />
					</DrawerClose>
					<DrawerDescription className="sr-only">
						Add a patient document. File selection is local and mocked.
					</DrawerDescription>
				</DrawerHeader>
				<form
					id="create-document-form"
					action={handleCreate}
					className="min-h-0 space-y-6 overflow-y-auto px-6 py-8"
				>
					<div className="grid gap-6 sm:grid-cols-2">
						<div className="space-y-2">
							<Label htmlFor="new-document-title" className={documentFieldLabelClassName}>
								Document title <span className={documentRequiredLabelClassName}>(required)</span>
							</Label>
							<Input
								id="new-document-title"
								name="title"
								placeholder="e.g. Complete Blood Count Report"
								required
							/>
						</div>
						<div className="space-y-2">
							<Label className={documentFieldLabelClassName}>
								Document type <span className={documentRequiredLabelClassName}>(required)</span>
							</Label>
							<Select name="documentType" required>
								<SelectTrigger className="w-full">
									<SelectValue placeholder="Select document type" />
								</SelectTrigger>
								<SelectContent className="rounded-xl border-gray-200 p-1 text-sm text-gray-700 shadow-xl">
									<SelectGroup>
										{documentTypes.map((type) => (
											<SelectItem key={type} value={type} className="rounded-md px-3 h-9">
												{type}
											</SelectItem>
										))}
									</SelectGroup>
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-2 sm:col-span-2">
							<Label htmlFor="new-document-notes" className={documentFieldLabelClassName}>
								Clinical notes <span className={documentRequiredLabelClassName}>(optional)</span>
							</Label>
							<Textarea
								id="new-document-notes"
								name="clinicalNotes"
								className="min-h-32"
								placeholder="Add notes or context about this document"
							/>
						</div>
					</div>
					<div className="flex flex-col gap-3 sm:col-span-2">
						<Label className={documentFieldLabelClassName}>
							Files<span className={documentRequiredLabelClassName}>(optional)</span>
						</Label>
						{selectedFiles.length > 0 ? (
							<CreateSelectedFiles
								files={selectedFiles}
								fileInputRef={documentFileInputRef}
								onFilesSelected={handleFilesSelected}
								onRemoveFile={handleRemoveFile}
							/>
						) : (
							<ChooseFileCard
								onFilesSelected={handleFilesSelected}
								fileInputRef={documentFileInputRef}
								title="Choose one or more files or drag and drop them here."
								description="JPEG, PNG, and PDF, up to 50 MB."
								browseLabel="Browse files"
								accept="image/jpeg,image/png,application/pdf"
								inputId="files"
								multiple
							/>
						)}
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
							disabled={isPending}
						>
							Add document
						</Button>
					</div>
				</DrawerFooter>
			</DrawerContent>
		</Drawer>
	);
}
