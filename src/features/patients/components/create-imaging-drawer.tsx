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

type CreateImagingDrawerProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

const imagingFieldLabelClassName =
	"inline-flex items-baseline gap-0.5 text-sm font-medium text-gray-700";
const imagingRequiredLabelClassName = "font-normal text-gray-400";
const imagingFieldControlClassName =
	"border-gray-200 bg-white text-gray-700 shadow-xs placeholder:text-gray-400 text-sm h-9";

export function CreateImagingDrawer({ open, onOpenChange }: CreateImagingDrawerProps) {
	const generatedFormId = useId();
	const nextAttachmentRowNumberRef = useRef(0);
	const [orderedAt, setOrderedAt] = useState<Date | undefined>();
	const [imagingAttachmentRows, setImagingAttachmentRows] = useState<AttachmentFormRow[]>([]);

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
		<Drawer open={open} onOpenChange={onOpenChange} direction="right">
			<DrawerContent className="overflow-hidden rounded-3xl text-sm data-[vaul-drawer-direction=right]:top-4 data-[vaul-drawer-direction=right]:right-4 data-[vaul-drawer-direction=right]:bottom-4 data-[vaul-drawer-direction=right]:h-auto data-[vaul-drawer-direction=right]:w-[50rem]">
				<DrawerHeader className="flex-row items-center justify-between border-b border-gray-200 px-6 py-5 text-left">
					<DrawerTitle className="text-lg leading-[1.2] text-gray-800">Add imaging</DrawerTitle>
					<DrawerClose aria-label="Close add imaging drawer">
						<RiCloseLine className="size-6" aria-hidden="true" />
					</DrawerClose>
					<DrawerDescription className="sr-only">
						Create a new imaging record for this patient.
					</DrawerDescription>
				</DrawerHeader>

				<form className="flex min-h-0 flex-1 flex-col gap-12 overflow-y-auto px-6 py-8 text-sm">
					<div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2">
						<div className="flex flex-col gap-2 sm:col-span-2">
							<Label htmlFor={`${generatedFormId}-study`} className={imagingFieldLabelClassName}>
								Study<span className={imagingRequiredLabelClassName}>(required)</span>
							</Label>
							<Input
								id={`${generatedFormId}-study`}
								placeholder="e.g. CT Abdomen with Contrast"
								className={imagingFieldControlClassName}
							/>
						</div>

						<div className="flex flex-col gap-2 sm:col-span-2">
							<Label htmlFor={`${generatedFormId}-region`} className={imagingFieldLabelClassName}>
								Region<span className={imagingRequiredLabelClassName}>(required)</span>
							</Label>
							<Input
								id={`${generatedFormId}-region`}
								placeholder="e.g. Abdomen"
								className={imagingFieldControlClassName}
							/>
						</div>

						<div className="flex flex-col gap-2">
							<Label htmlFor={`${generatedFormId}-modality`} className={imagingFieldLabelClassName}>
								Modality<span className={imagingRequiredLabelClassName}>(required)</span>
							</Label>
							<Select>
								<SelectTrigger
									id={`${generatedFormId}-modality`}
									className={`${imagingFieldControlClassName} w-full`}
								>
									<SelectValue placeholder="Select modality" />
								</SelectTrigger>
								<SelectContent className="rounded-xl border-gray-200 p-1 text-sm text-gray-700 shadow-xl">
									<ImagingModalityOptions />
								</SelectContent>
							</Select>
						</div>

						<div className="flex flex-col gap-2">
							<Label className={imagingFieldLabelClassName}>
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
										className={`${imagingFieldControlClassName} flex w-full items-center justify-between gap-3 font-normal data-[empty=true]:text-gray-400 hover:bg-white active:scale-100`}
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
							<Label htmlFor={`${generatedFormId}-ordered-by`} className={imagingFieldLabelClassName}>
								Ordered by<span className={imagingRequiredLabelClassName}>(required)</span>
							</Label>
							<Input
								id={`${generatedFormId}-ordered-by`}
								placeholder="e.g. Dr. Adebayo Johnson"
								className={imagingFieldControlClassName}
							/>
						</div>

						<div className="flex flex-col gap-2">
							<Label htmlFor={`${generatedFormId}-status`} className={imagingFieldLabelClassName}>
								Status<span className={imagingRequiredLabelClassName}>(required)</span>
							</Label>
							<Select>
								<SelectTrigger
									id={`${generatedFormId}-status`}
									className={`${imagingFieldControlClassName} w-full`}
								>
									<SelectValue placeholder="Select status" />
								</SelectTrigger>
								<SelectContent className="rounded-xl border-gray-200 p-1 text-sm text-gray-700 shadow-xl">
									<ImagingStatusOptions />
								</SelectContent>
							</Select>
						</div>

						<div className="flex flex-col gap-2 sm:col-span-2">
							<Label htmlFor={`${generatedFormId}-impression`} className={imagingFieldLabelClassName}>
								Impression<span className={imagingRequiredLabelClassName}>(required)</span>
							</Label>
							<Textarea
								id={`${generatedFormId}-impression`}
								placeholder="e.g. Suspicious liver lesion identified in the right hepatic lobe"
								className="min-h-20 border-gray-200 bg-white text-sm text-gray-700 shadow-xs placeholder:text-gray-400"
							/>
						</div>

						<div className="flex flex-col gap-2 sm:col-span-2">
							<Label htmlFor={`${generatedFormId}-clinical-notes`} className={imagingFieldLabelClassName}>
								Clinical notes<span className={imagingRequiredLabelClassName}>(optional)</span>
							</Label>
							<Textarea
								id={`${generatedFormId}-clinical-notes`}
								placeholder="Add additional findings, preparation instructions, or radiology notes"
								className="min-h-20 border-gray-200 bg-white text-sm text-gray-700 shadow-xs placeholder:text-gray-400"
							/>
						</div>
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
								className="border-gray-200 bg-white text-sm text-gray-600 shadow-xs"
								onClick={handleAddImagingAttachmentRow}
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
							Add imaging
						</Button>
					</div>
				</DrawerFooter>
			</DrawerContent>
		</Drawer>
	);
}

export function ImagingModalityOptions() {
	return (
		<SelectGroup>
			<SelectItem value="ct" className="rounded-md px-3 h-9">
				CT
			</SelectItem>
			<SelectItem value="mri" className="rounded-md px-3 h-9">
				MRI
			</SelectItem>
			<SelectItem value="ultrasound" className="rounded-md px-3 h-9">
				Ultrasound
			</SelectItem>
			<SelectItem value="x-ray" className="rounded-md px-3 h-9">
				X-ray
			</SelectItem>
		</SelectGroup>
	);
}

export function ImagingStatusOptions() {
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
