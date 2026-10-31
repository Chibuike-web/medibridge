"use client";

import { Button } from "@/components/ui/button";
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
import {
	AttachmentFormFields,
	type AttachmentFormRow,
} from "@/features/patients/components/attachment-form-fields";
import { createPatientLabTestAction } from "@/features/patients/server/create-patient-lab-test-action";
import { labTestFlags, labTestStatuses } from "@/features/patients/server/schemas";
import { authClient } from "@/lib/better-auth/auth.client";
import { RiAddLine, RiCalendarLine, RiCloseLine, RiErrorWarningFill } from "@remixicon/react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { uploadReportFiles, type UploadedReports } from "@/lib/storage/upload-report-files";
import { patientLabTestSchema } from "@/features/patients/server/schemas";
import { useId, useRef, useState, useTransition, type FormEvent } from "react";
import { ChooseFileCard } from "@/components/choose-file-card";
import { CreateSelectedFiles } from "@/components/create-selected-files";

type CreateLabTestDrawerProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	patientId: string;
	encounterId?: string;
};

const fieldLabelClassName = "inline-flex items-baseline gap-0.5 text-sm font-medium text-gray-700";
const optionalLabelClassName = "font-normal text-gray-400";
const fieldControlClassName =
	"border-gray-200 bg-white text-gray-700 placeholder:text-gray-400 text-sm h-9";

export function CreateLabTestDrawer({
	open,
	onOpenChange,
	patientId,
	encounterId,
}: CreateLabTestDrawerProps) {
	const router = useRouter();
	const generatedFormId = useId();
	const nextAttachmentRowNumberRef = useRef(0);
	const { data: session } = authClient.useSession();
	const [formError, setFormError] = useState("");
	const [orderedAt, setOrderedAt] = useState<Date | undefined>();
	const [attachmentRows, setAttachmentRows] = useState<AttachmentFormRow[]>([]);
	const labTestFileInputRef = useRef<HTMLInputElement>(null);
	const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
	const uploadedReportsRef = useRef<UploadedReports>(new Map());
	const [isPending, startTransition] = useTransition();

	function handleOpenChange(isOpen: boolean) {
		if (!isOpen) {
			setFormError("");
			setOrderedAt(undefined);
			setAttachmentRows([]);
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

		const parsedLabTest = patientLabTestSchema.safeParse({
			testName: formData.get("testName") ?? "",
			status: formData.get("status"),
			flag: formData.get("flag") || undefined,
			referenceRange: formData.get("referenceRange") ?? "",
			orderedBy: formData.get("orderedBy") ?? "",
			orderedAt: formData.get("orderedAt") ?? "",
			specimen: formData.get("specimen") ?? "",
			result: formData.get("result") ?? "",
			interpretation: formData.get("interpretation") ?? "",
			clinicalNote: formData.get("clinicalNote") ?? "",
		});

		if (!parsedLabTest.success) {
			setFormError(parsedLabTest.error.issues[0].message);
			return;
		}

		if (parsedLabTest.data.status === "Completed" && selectedFiles.length === 0) {
			setFormError("Attach the report for a completed lab test.");
			return;
		}

		startTransition(async () => {
			try {
				const uploadedReports = await uploadReportFiles(
					selectedFiles,
					patientId,
					"lab",
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

				const result = await createPatientLabTestAction(patientId, formData);

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

	function handleAddAttachmentRow() {
		nextAttachmentRowNumberRef.current += 1;

		setAttachmentRows((prev) => [
			...prev,
			{
				id: `${generatedFormId}-attachment-${nextAttachmentRowNumberRef.current}`,
				name: "",
				recordId: "",
			},
		]);
	}

	function handleRemoveAttachmentRow(attachmentRowId: string) {
		setAttachmentRows((prev) =>
			prev.filter((attachmentRow) => attachmentRow.id !== attachmentRowId),
		);
	}

	return (
		<Drawer open={open} onOpenChange={handleOpenChange} direction="right">
			<DrawerContent className="overflow-hidden rounded-3xl text-sm data-[vaul-drawer-direction=right]:top-4 data-[vaul-drawer-direction=right]:right-4 data-[vaul-drawer-direction=right]:bottom-4 data-[vaul-drawer-direction=right]:h-auto data-[vaul-drawer-direction=right]:w-[37.5rem]">
				<DrawerHeader className="flex-row items-center justify-between border-b border-gray-200 text-left">
					<DrawerTitle className="leading-[1.2] text-gray-800">Add lab test</DrawerTitle>
					<DrawerClose asChild>
						<Button variant="ghost" size="icon" aria-label="Close add lab test drawer">
							<RiCloseLine aria-hidden="true" />
						</Button>
					</DrawerClose>
					<DrawerDescription className="sr-only">
						Create a new laboratory test record for this patient.
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
							<Label htmlFor={`${generatedFormId}-test`} className={fieldLabelClassName}>
								Test<span className={optionalLabelClassName}>(required)</span>
							</Label>
							<Input
								id={`${generatedFormId}-test`}
								name="testName"
								placeholder="e.g. Full Blood Count"
								className={fieldControlClassName}
								required
							/>
						</div>

						<div className="flex flex-col gap-2">
							<Label htmlFor={`${generatedFormId}-flag`} className={fieldLabelClassName}>
								Flag<span className={optionalLabelClassName}>(required if completed)</span>
							</Label>
							<Select name="flag">
								<SelectTrigger id={`${generatedFormId}-flag`} className="w-full">
									<SelectValue placeholder="Select flag" />
								</SelectTrigger>
								<SelectContent>
									<SelectGroup>
										{labTestFlags.map((flag) => (
											<SelectItem key={flag} value={flag}>
												{flag}
											</SelectItem>
										))}
									</SelectGroup>
								</SelectContent>
							</Select>
						</div>

						<div className="flex flex-col gap-2">
							<Label htmlFor={`${generatedFormId}-status`} className={fieldLabelClassName}>
								Status<span className={optionalLabelClassName}>(required)</span>
							</Label>
							<Select name="status" required>
								<SelectTrigger id={`${generatedFormId}-status`} className="w-full">
									<SelectValue placeholder="Select status" />
								</SelectTrigger>
								<SelectContent>
									<SelectGroup>
										{labTestStatuses.map((status) => (
											<SelectItem key={status} value={status}>
												{status}
											</SelectItem>
										))}
									</SelectGroup>
								</SelectContent>
							</Select>
						</div>

						<div className="flex flex-col gap-2">
							<Label htmlFor={`${generatedFormId}-reference-range`} className={fieldLabelClassName}>
								Reference Range<span className={optionalLabelClassName}>(optional)</span>
							</Label>
							<Input
								id={`${generatedFormId}-reference-range`}
								name="referenceRange"
								placeholder="e.g. 4.0 - 11.0 x10^9/L"
								className={fieldControlClassName}
							/>
						</div>

						<div className="flex flex-col gap-2">
							<Label htmlFor={`${generatedFormId}-ordered-by`} className={fieldLabelClassName}>
								Ordered by<span className={optionalLabelClassName}>(required)</span>
							</Label>
							<Input
								id={`${generatedFormId}-ordered-by`}
								name="orderedBy"
								defaultValue={session?.user.name}
								placeholder="e.g. Dr. Adebayo Johnson"
								className={fieldControlClassName}
								required
							/>
						</div>

						<div className="flex flex-col gap-2">
							<Label htmlFor={`${generatedFormId}-ordered-at`} className={fieldLabelClassName}>
								Ordered at<span className={optionalLabelClassName}>(required)</span>
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
										className={`${fieldControlClassName} flex w-full justify-between gap-3 font-normal data-[empty=true]:text-gray-400 hover:bg-white active:scale-100`}
									>
										<span className="min-w-0 truncate">
											{orderedAt ? format(orderedAt, "PPP") : "Select date"}
										</span>
										<RiCalendarLine className="size-4 shrink-0 text-gray-600" aria-hidden="true" />
									</Button>
								</PopoverTrigger>
								<PopoverContent className="p-0">
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
							<Label htmlFor={`${generatedFormId}-specimen`} className={fieldLabelClassName}>
								Specimen<span className={optionalLabelClassName}>(required)</span>
							</Label>
							<Input
								id={`${generatedFormId}-specimen`}
								name="specimen"
								placeholder="e.g. Whole blood"
								className={fieldControlClassName}
								required
							/>
						</div>

						<div className="flex flex-col gap-2 sm:col-span-2">
							<Label htmlFor={`${generatedFormId}-result`} className={fieldLabelClassName}>
								Result<span className={optionalLabelClassName}>(required if completed)</span>
							</Label>
							<Input
								id={`${generatedFormId}-result`}
								name="result"
								placeholder="e.g. 14.8 x10^9/L"
								className={fieldControlClassName}
							/>
						</div>

						<div className="flex flex-col gap-2 sm:col-span-2">
							<Label htmlFor={`${generatedFormId}-interpretation`} className={fieldLabelClassName}>
								Interpretation<span className={optionalLabelClassName}>(optional)</span>
							</Label>
							<Textarea
								id={`${generatedFormId}-interpretation`}
								name="interpretation"
								placeholder="e.g. Elevated white blood cell count suggesting possible infection"
								className="min-h-20 bg-white text-sm text-gray-700 placeholder:text-gray-400"
							/>
						</div>

						<div className="flex flex-col gap-2 sm:col-span-2">
							<Label htmlFor={`${generatedFormId}-clinical-notes`} className={fieldLabelClassName}>
								Clinical notes<span className={optionalLabelClassName}>(optional)</span>
							</Label>
							<Textarea
								id={`${generatedFormId}-clinical-notes`}
								name="clinicalNote"
								placeholder="Add additional laboratory observations or recommendations"
								className="min-h-20 bg-white text-sm text-gray-700 placeholder:text-gray-400"
							/>
						</div>
						<div className="flex flex-col gap-3 sm:col-span-2">
							<Label className={fieldLabelClassName}>
								Files<span className={optionalLabelClassName}>(required if completed)</span>
							</Label>

							{selectedFiles.length > 0 ? (
								<CreateSelectedFiles
									files={selectedFiles}
									fileInputRef={labTestFileInputRef}
									onFilesSelected={handleFilesSelected}
									onRemoveFile={handleRemoveFile}
								/>
							) : (
								<ChooseFileCard
									onFilesSelected={handleFilesSelected}
									fileInputRef={labTestFileInputRef}
									title="Choose one or more files or drag and drop them here."
									description="JPEG, PNG, and PDF, up to 50 MB."
									browseLabel="Browse files"
									accept="image/jpeg,image/png,application/pdf"
									inputId="files"
									multiple
								/>
							)}
						</div>
					</div>

					<div className="flex flex-col gap-6">
						{attachmentRows.map((attachmentRow, attachmentIndex) => (
							<AttachmentFormFields
								key={attachmentRow.id}
								attachmentRow={attachmentRow}
								attachmentIndex={attachmentIndex}
								fieldLabelClassName={fieldLabelClassName}
								requiredLabelClassName={optionalLabelClassName}
								fieldControlClassName={fieldControlClassName}
								onRemoveAttachmentRow={handleRemoveAttachmentRow}
							/>
						))}

						<div>
							<Button
								type="button"
								variant="outline"
								className="bg-white text-gray-600"
								onClick={handleAddAttachmentRow}
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
							{isPending ? "Adding…" : "Add lab test"}
						</Button>
					</div>
				</DrawerFooter>
			</DrawerContent>
		</Drawer>
	);
}
