"use client";

import { Button } from "@/components/ui/button";
import { PixelLoader } from "@/components/ui/pixel-loader";
import { Calendar } from "@/components/ui/calendar";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ChooseFileCard } from "@/components/choose-file-card";
import {
	AttachmentFormFields,
	type AttachmentFormRow,
} from "@/features/patients/components/attachment-form-fields";
import { createPatientImagingAction } from "@/features/patients/server/create-patient-imaging-action";
import { imagingModalities, imagingStatuses } from "@/features/patients/server/schemas";
import { authClient } from "@/lib/better-auth/auth.client";
import { RiAddLine, RiCalendarLine, RiCloseLine, RiErrorWarningFill } from "@remixicon/react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { uploadReportFiles, type UploadedReports } from "@/lib/storage/upload-report-files";
import { patientImagingSchema } from "@/features/patients/server/schemas";
import { useId, useRef, useState, useTransition, type FormEvent } from "react";
import { CreateSelectedFiles } from "@/components/create-selected-files";

type CreateImagingDrawerProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	patientId: string;
	encounterId?: string;
};

const imagingFieldLabelClassName =
	"inline-flex items-baseline gap-0.5 text-sm font-medium text-gray-700";
const imagingRequiredLabelClassName = "font-normal text-gray-400";
const imagingFieldControlClassName =
	"border-gray-200 bg-white text-gray-700 placeholder:text-gray-400 text-sm h-9";

export function CreateImagingDrawer({
	open,
	onOpenChange,
	patientId,
	encounterId,
}: CreateImagingDrawerProps) {
	const router = useRouter();
	const generatedFormId = useId();
	const nextAttachmentRowNumberRef = useRef(0);
	const { data: session } = authClient.useSession();
	const [formError, setFormError] = useState("");
	const [orderedAt, setOrderedAt] = useState<Date | undefined>();
	const [imagingAttachmentRows, setImagingAttachmentRows] = useState<AttachmentFormRow[]>([]);
	const imagingFileInputRef = useRef<HTMLInputElement>(null);
	const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
	const uploadedReportsRef = useRef<UploadedReports>(new Map());
	const [isPending, startTransition] = useTransition();

	function handleOpenChange(isOpen: boolean) {
		if (!isOpen) {
			setFormError("");
			setOrderedAt(undefined);
			setImagingAttachmentRows([]);
			setSelectedFiles([]);
			uploadedReportsRef.current.clear();
		}
		onOpenChange(isOpen);
	}

	function handleCreate(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setFormError("");

		if (selectedFiles.reduce((totalSize, file) => totalSize + file.size, 0) > 100 * 1024 * 1024) {
			setFormError("Files can add up to 100 MB per save.");
			return;
		}

		const formData = new FormData(event.currentTarget);
		if (encounterId) formData.set("encounterId", encounterId);

		const parsedImaging = patientImagingSchema.safeParse({
			study: formData.get("study") ?? "",
			region: formData.get("region") ?? "",
			modality: formData.get("modality"),
			orderedAt: formData.get("orderedAt") ?? "",
			orderedBy: formData.get("orderedBy") ?? "",
			status: formData.get("status"),
			impression: formData.get("impression") ?? "",
			clinicalNote: formData.get("clinicalNote") ?? "",
		});

		if (!parsedImaging.success) {
			setFormError(parsedImaging.error.issues[0].message);
			return;
		}

		startTransition(async () => {
			try {
				const uploadedReports = await uploadReportFiles(
					selectedFiles,
					patientId,
					"imaging",
					uploadedReportsRef.current,
				);

				if (uploadedReports.status === "unauthorized") {
					router.refresh();
					return;
				}

				if (uploadedReports.status === "failed") {
					setFormError(uploadedReports.error);
					return;
				}

				for (const receipt of uploadedReports.receipts) formData.append("files", receipt);

				const result = await createPatientImagingAction(patientId, formData);

				if (result.status === "unauthorized") {
					router.refresh();
					return;
				}

				if (result.status !== "success") {
					setFormError(result.error);
					return;
				}

				handleOpenChange(false);
			} catch (error) {
				console.error("Saving report files failed:", error);
				uploadedReportsRef.current.clear();
				setFormError("We couldn’t save these changes. Please try again.");
			}
		});
	}

	function handleFilesSelected(event: React.ChangeEvent<HTMLInputElement>) {
		const nextFiles = Array.from(event.target.files ?? []);

		setSelectedFiles((prev) => [...prev, ...nextFiles]);

		event.target.value = "";
	}

	function handleRemoveFile(file: File) {
		setSelectedFiles((prev) => prev.filter((previousFile) => previousFile !== file));
	}

	function handleAddImagingAttachmentRow() {
		nextAttachmentRowNumberRef.current += 1;

		setImagingAttachmentRows((prev) => [
			...prev,
			{
				id: `${generatedFormId}-attachment-${nextAttachmentRowNumberRef.current}`,
				name: "",
				recordId: "",
			},
		]);
	}

	function handleRemoveImagingAttachmentRow(attachmentRowId: string) {
		setImagingAttachmentRows((prev) =>
			prev.filter((attachmentRow) => attachmentRow.id !== attachmentRowId),
		);
	}

	return (
		<Drawer open={open} onOpenChange={handleOpenChange} direction="right">
			<DrawerContent className="overflow-hidden rounded-3xl text-sm data-[vaul-drawer-direction=right]:top-4 data-[vaul-drawer-direction=right]:right-4 data-[vaul-drawer-direction=right]:bottom-4 data-[vaul-drawer-direction=right]:h-auto data-[vaul-drawer-direction=right]:w-[37.5rem]">
				<DrawerHeader className="flex-row items-center justify-between border-b border-gray-200 text-left">
					<DrawerTitle className="leading-[1.2] text-gray-800">Add imaging</DrawerTitle>
					<DrawerClose asChild>
						<Button variant="ghost" size="icon" aria-label="Close add imaging drawer">
							<RiCloseLine aria-hidden="true" />
						</Button>
					</DrawerClose>
					<DrawerDescription className="sr-only">
						Create a new imaging record for this patient.
					</DrawerDescription>
				</DrawerHeader>

				<form
					id={generatedFormId}
					onSubmit={handleCreate}
					className="flex min-h-0 flex-1 flex-col gap-12 overflow-y-auto px-4 py-5 text-sm"
				>
					<div className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
						{formError && (
							<div
								key={formError}
								ref={(banner) => banner?.scrollIntoView({ behavior: "smooth", block: "center" })}
								role="alert"
								className="flex items-start gap-2 rounded-xl bg-red-50 px-3 py-3 text-left text-sm font-medium text-red-700 sm:col-span-2"
							>
								<RiErrorWarningFill className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
								<p className="min-w-0 flex-1 text-pretty">{formError}</p>
								<Button
									type="button"
									variant="ghost"
									size="icon"
									className="ml-auto -my-1 size-6 rounded-full text-red-700 hover:bg-red-100 hover:text-red-700"
									aria-label="Dismiss error"
									onClick={() => setFormError("")}
								>
									<RiCloseLine aria-hidden="true" />
								</Button>
							</div>
						)}
						<div className="flex flex-col gap-2 sm:col-span-2">
							<Label htmlFor={`${generatedFormId}-study`} className={imagingFieldLabelClassName}>
								Study<span className={imagingRequiredLabelClassName}>(required)</span>
							</Label>
							<Input
								id={`${generatedFormId}-study`}
								name="study"
								placeholder="e.g. CT Abdomen with Contrast"
								className={imagingFieldControlClassName}
								required
							/>
						</div>

						<div className="flex flex-col gap-2 sm:col-span-2">
							<Label htmlFor={`${generatedFormId}-region`} className={imagingFieldLabelClassName}>
								Region<span className={imagingRequiredLabelClassName}>(required)</span>
							</Label>
							<Input
								id={`${generatedFormId}-region`}
								name="region"
								placeholder="e.g. Abdomen"
								className={imagingFieldControlClassName}
								required
							/>
						</div>

						<div className="flex flex-col gap-2">
							<Label htmlFor={`${generatedFormId}-modality`} className={imagingFieldLabelClassName}>
								Modality<span className={imagingRequiredLabelClassName}>(required)</span>
							</Label>
							<Select name="modality" required>
								<SelectTrigger id={`${generatedFormId}-modality`} className="w-full">
									<SelectValue placeholder="Select modality" />
								</SelectTrigger>
								<SelectContent>
									<SelectGroup>
										{imagingModalities.map((modality) => (
											<SelectItem key={modality} value={modality}>
												{modality}
											</SelectItem>
										))}
									</SelectGroup>
								</SelectContent>
							</Select>
						</div>

						<div className="flex flex-col gap-2">
							<Label
								htmlFor={`${generatedFormId}-ordered-at`}
								className={imagingFieldLabelClassName}
							>
								Ordered at<span className={imagingRequiredLabelClassName}>(required)</span>
							</Label>
							<input
								type="hidden"
								name="orderedAt"
								value={orderedAt ? format(orderedAt, "yyyy-MM-dd") : ""}
							/>
							<Popover>
								<PopoverTrigger asChild>
									<Button
										id={`${generatedFormId}-ordered-at`}
										type="button"
										variant="outline"
										data-empty={!orderedAt}
										className={`${imagingFieldControlClassName} flex w-full justify-between gap-3 font-normal data-[empty=true]:text-gray-400 hover:bg-white active:scale-100`}
									>
										<span className="min-w-0 truncate">
											{orderedAt ? format(orderedAt, "PPP") : "Select date"}
										</span>
										<RiCalendarLine className="size-4 shrink-0 text-gray-600" aria-hidden="true" />
									</Button>
								</PopoverTrigger>
								<PopoverContent align="end" className="p-0">
									<Calendar
										mode="single"
										selected={orderedAt}
										onSelect={setOrderedAt}
										disabled={{ after: new Date() }}
										autoFocus
									/>
								</PopoverContent>
							</Popover>
						</div>

						<div className="flex flex-col gap-2">
							<Label
								htmlFor={`${generatedFormId}-ordered-by`}
								className={imagingFieldLabelClassName}
							>
								Ordered by<span className={imagingRequiredLabelClassName}>(required)</span>
							</Label>
							<Input
								id={`${generatedFormId}-ordered-by`}
								name="orderedBy"
								defaultValue={session?.user.name}
								placeholder="e.g. Dr. Adebayo Johnson"
								className={imagingFieldControlClassName}
								required
							/>
						</div>

						<div className="flex flex-col gap-2">
							<Label htmlFor={`${generatedFormId}-status`} className={imagingFieldLabelClassName}>
								Status<span className={imagingRequiredLabelClassName}>(required)</span>
							</Label>
							<Select name="status" required>
								<SelectTrigger id={`${generatedFormId}-status`} className="w-full">
									<SelectValue placeholder="Select status" />
								</SelectTrigger>
								<SelectContent>
									<SelectGroup>
										{imagingStatuses.map((status) => (
											<SelectItem key={status} value={status}>
												{status}
											</SelectItem>
										))}
									</SelectGroup>
								</SelectContent>
							</Select>
						</div>

						<div className="flex flex-col gap-2 sm:col-span-2">
							<Label
								htmlFor={`${generatedFormId}-impression`}
								className={imagingFieldLabelClassName}
							>
								Impression
								<span className={imagingRequiredLabelClassName}>(required if completed)</span>
							</Label>
							<Textarea
								id={`${generatedFormId}-impression`}
								name="impression"
								placeholder="e.g. Suspicious liver lesion identified in the right hepatic lobe"
								className="min-h-20 bg-white text-sm text-gray-700 placeholder:text-gray-400"
							/>
						</div>

						<div className="flex flex-col gap-2 sm:col-span-2">
							<Label
								htmlFor={`${generatedFormId}-clinical-notes`}
								className={imagingFieldLabelClassName}
							>
								Clinical notes<span className={imagingRequiredLabelClassName}>(optional)</span>
							</Label>
							<Textarea
								id={`${generatedFormId}-clinical-notes`}
								name="clinicalNote"
								placeholder="Add additional findings, preparation instructions, or radiology notes"
								className="min-h-20 bg-white text-sm text-gray-700 placeholder:text-gray-400"
							/>
						</div>
					</div>

					<div className="flex flex-col gap-3 sm:col-span-2">
						<Label className={imagingFieldLabelClassName}>
							Files<span className={imagingRequiredLabelClassName}>(optional)</span>
						</Label>
						{selectedFiles.length > 0 ? (
							<CreateSelectedFiles
								files={selectedFiles}
								fileInputRef={imagingFileInputRef}
								onFilesSelected={handleFilesSelected}
								onRemoveFile={handleRemoveFile}
							/>
						) : (
							<ChooseFileCard
								onFilesSelected={handleFilesSelected}
								fileInputRef={imagingFileInputRef}
								title="Choose one or more files or drag and drop them here."
								description="JPEG, PNG, and PDF, up to 50 MB."
								browseLabel="Browse files"
								accept="image/jpeg,image/png,application/pdf"
								inputId="files"
								multiple
							/>
						)}
					</div>

					<div className="flex flex-col gap-6">
						{imagingAttachmentRows.map((attachmentRow, attachmentIndex) => (
							<AttachmentFormFields
								key={attachmentRow.id}
								attachmentRow={attachmentRow}
								attachmentIndex={attachmentIndex}
								fieldLabelClassName={imagingFieldLabelClassName}
								requiredLabelClassName={imagingRequiredLabelClassName}
								fieldControlClassName={imagingFieldControlClassName}
								onRemoveAttachmentRow={handleRemoveImagingAttachmentRow}
							/>
						))}

						<div>
							<Button
								type="button"
								variant="outline"
								className="bg-white text-gray-600"
								onClick={handleAddImagingAttachmentRow}
							>
								<RiAddLine className="size-5" aria-hidden="true" />
								Add related record
							</Button>
						</div>
					</div>
				</form>

				<DrawerFooter className="border-t border-gray-200 text-sm">
					<div className="flex flex-col gap-2 lg:flex-row lg:self-end">
						<DrawerClose asChild>
							<Button type="button" variant="outline">
								Cancel
							</Button>
						</DrawerClose>
						<Button type="submit" form={generatedFormId} disabled={isPending}>
							{isPending ? <PixelLoader label="Adding…" /> : "Add imaging"}
						</Button>
					</div>
				</DrawerFooter>
			</DrawerContent>
		</Drawer>
	);
}
