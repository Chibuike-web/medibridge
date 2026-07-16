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
import { RiAddLine, RiCalendarLine, RiCloseLine } from "@remixicon/react";
import { format } from "date-fns";
import { useId, useRef, useState } from "react";
import { ChooseFileCard } from "@/components/choose-file-card";
import { CreateSelectedFiles } from "@/components/create-selected-files";

type CreateLabTestDrawerProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

const fieldLabelClassName = "inline-flex items-baseline gap-0.5 text-sm font-medium text-gray-700";
const optionalLabelClassName = "font-normal text-gray-400";
const fieldControlClassName =
	"border-gray-200 bg-white text-gray-700 shadow-xs placeholder:text-gray-400 text-sm h-9";

export function CreateLabTestDrawer({ open, onOpenChange }: CreateLabTestDrawerProps) {
	const generatedFormId = useId();
	const nextAttachmentRowNumberRef = useRef(0);
	const [orderedAt, setOrderedAt] = useState<Date | undefined>();
	const [attachmentRows, setAttachmentRows] = useState<AttachmentFormRow[]>([]);
	const labTestFileInputRef = useRef<HTMLInputElement>(null);
	const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

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
		<Drawer open={open} onOpenChange={onOpenChange} direction="right">
			<DrawerContent className="overflow-hidden rounded-3xl text-sm data-[vaul-drawer-direction=right]:top-4 data-[vaul-drawer-direction=right]:right-4 data-[vaul-drawer-direction=right]:bottom-4 data-[vaul-drawer-direction=right]:h-auto data-[vaul-drawer-direction=right]:w-[50rem]">
				<DrawerHeader className="flex-row items-center justify-between border-b border-gray-200 px-6 py-5 text-left">
					<DrawerTitle className="text-base leading-[1.2] text-gray-800">Add lab test</DrawerTitle>
					<DrawerClose aria-label="Close add lab test drawer">
						<RiCloseLine className="size-6" aria-hidden="true" />
					</DrawerClose>
					<DrawerDescription className="sr-only">
						Create a new laboratory test record for this patient.
					</DrawerDescription>
				</DrawerHeader>

				<form className="flex min-h-0 flex-1 flex-col gap-12 overflow-y-auto px-6 py-8 text-sm">
					<div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2">
						<div className="flex flex-col gap-2 sm:col-span-2">
							<Label htmlFor={`${generatedFormId}-test`} className={fieldLabelClassName}>
								Test<span className={optionalLabelClassName}>(required)</span>
							</Label>
							<Input
								id={`${generatedFormId}-test`}
								placeholder="e.g. Full Blood Count"
								className={fieldControlClassName}
							/>
						</div>

						<div className="flex flex-col gap-2">
							<Label htmlFor={`${generatedFormId}-flag`} className={fieldLabelClassName}>
								Flag<span className={optionalLabelClassName}>(required)</span>
							</Label>
							<Select>
								<SelectTrigger id={`${generatedFormId}-flag`} className="w-full">
									<SelectValue placeholder="Select flag" />
								</SelectTrigger>
								<SelectContent className="rounded-xl border-gray-200 p-1 text-sm text-gray-700 shadow-xl">
									<LabTestFlagOptions />
								</SelectContent>
							</Select>
						</div>

						<div className="flex flex-col gap-2">
							<Label htmlFor={`${generatedFormId}-status`} className={fieldLabelClassName}>
								Status<span className={optionalLabelClassName}>(required)</span>
							</Label>
							<Select>
								<SelectTrigger id={`${generatedFormId}-status`} className="w-full">
									<SelectValue placeholder="Select status" />
								</SelectTrigger>
								<SelectContent className="rounded-xl border-gray-200 p-1 text-sm text-gray-700 shadow-xl">
									<LabTestStatusOptions />
								</SelectContent>
							</Select>
						</div>

						<div className="flex flex-col gap-2">
							<Label htmlFor={`${generatedFormId}-reference-range`} className={fieldLabelClassName}>
								Reference Range<span className={optionalLabelClassName}>(required)</span>
							</Label>
							<Input
								id={`${generatedFormId}-reference-range`}
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
								placeholder="e.g. Dr. Adebayo Johnson"
								className={fieldControlClassName}
							/>
						</div>

						<div className="flex flex-col gap-2">
							<Label className={fieldLabelClassName}>
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
										className={`${fieldControlClassName} flex w-full items-center justify-between gap-3 font-normal data-[empty=true]:text-gray-400 hover:bg-white active:scale-100`}
									>
										<span className="min-w-0 truncate">
											{orderedAt ? format(orderedAt, "PPP") : "Select date"}
										</span>
										<RiCalendarLine className="size-4 shrink-0 text-gray-600" aria-hidden="true" />
									</Button>
								</PopoverTrigger>
								<PopoverContent className="p-0">
									<Calendar mode="single" selected={orderedAt} onSelect={setOrderedAt} autoFocus />
								</PopoverContent>
							</Popover>
						</div>

						<div className="flex flex-col gap-2">
							<Label htmlFor={`${generatedFormId}-specimen`} className={fieldLabelClassName}>
								Specimen<span className={optionalLabelClassName}>(required)</span>
							</Label>
							<Input
								id={`${generatedFormId}-specimen`}
								placeholder="e.g. Whole blood"
								className={fieldControlClassName}
							/>
						</div>

						<div className="flex flex-col gap-2 sm:col-span-2">
							<Label htmlFor={`${generatedFormId}-result`} className={fieldLabelClassName}>
								Result<span className={optionalLabelClassName}>(required)</span>
							</Label>
							<Input
								id={`${generatedFormId}-result`}
								placeholder="e.g. 14.8 x10^9/L"
								className={fieldControlClassName}
							/>
						</div>

						<div className="flex flex-col gap-2 sm:col-span-2">
							<Label htmlFor={`${generatedFormId}-interpretation`} className={fieldLabelClassName}>
								Interpretation<span className={optionalLabelClassName}>(required)</span>
							</Label>
							<Textarea
								id={`${generatedFormId}-interpretation`}
								placeholder="e.g. Elevated white blood cell count suggesting possible infection"
								className="min-h-20 border-gray-200 bg-white text-sm text-gray-700 shadow-xs placeholder:text-gray-400"
							/>
						</div>

						<div className="flex flex-col gap-2 sm:col-span-2">
							<Label htmlFor={`${generatedFormId}-clinical-notes`} className={fieldLabelClassName}>
								Clinical notes<span className={optionalLabelClassName}>(optional)</span>
							</Label>
							<Textarea
								id={`${generatedFormId}-clinical-notes`}
								placeholder="Add additional laboratory observations or recommendations"
								className="min-h-20 border-gray-200 bg-white text-sm text-gray-700 shadow-xs placeholder:text-gray-400"
							/>
						</div>
						<div className="flex flex-col gap-3 sm:col-span-2">
							<Label className={fieldLabelClassName}>
								Files<span className={optionalLabelClassName}>(required)</span>
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
								className="border-gray-200 bg-white text-sm text-gray-600 shadow-xs"
								onClick={handleAddAttachmentRow}
							>
								<RiAddLine className="size-5" aria-hidden="true" />
								Add related record
							</Button>
						</div>
					</div>
				</form>

				<DrawerFooter className="border-t border-gray-200 px-6 py-5 text-sm">
					<div className="flex flex-col gap-x-4 gap-y-2 lg:flex-row lg:self-end">
						<DrawerClose asChild>
							<Button type="button" variant="outline" className="text-sm">
								Cancel
							</Button>
						</DrawerClose>
						<Button type="button" className="text-sm">
							Add lab test
						</Button>
					</div>
				</DrawerFooter>
			</DrawerContent>
		</Drawer>
	);
}

function LabTestFlagOptions() {
	return (
		<SelectGroup>
			<SelectItem value="within-range" className="rounded-md px-3 h-9">
				Within range
			</SelectItem>
			<SelectItem value="low" className="rounded-md px-3 h-9">
				Low
			</SelectItem>
			<SelectItem value="high" className="rounded-md px-3 h-9">
				High
			</SelectItem>
			<SelectItem value="critical" className="rounded-md px-3 h-9">
				Critical
			</SelectItem>
			<SelectItem value="abnormal" className="rounded-md px-3 h-9">
				Abnormal
			</SelectItem>
			<SelectItem value="inconclusive" className="rounded-md px-3 h-9">
				Inconclusive
			</SelectItem>
		</SelectGroup>
	);
}

function LabTestStatusOptions() {
	return (
		<SelectGroup>
			<SelectItem value="pending" className="rounded-md px-3 h-9">
				Pending
			</SelectItem>
			<SelectItem value="completed" className="rounded-md px-3 h-9">
				Completed
			</SelectItem>
			<SelectItem value="cancelled" className="rounded-md px-3 h-9">
				Cancelled
			</SelectItem>
		</SelectGroup>
	);
}
