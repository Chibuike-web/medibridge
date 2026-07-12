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

type CreateDiagnosisDrawerProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

const fieldLabelClassName = "inline-flex items-baseline gap-0.5 text-sm font-medium text-gray-700";
const optionalLabelClassName = "font-normal text-gray-400";
const fieldControlClassName =
	"border-gray-200 bg-white text-gray-700 shadow-xs placeholder:text-gray-400 text-sm h-9";

export function CreateDiagnosisDrawer({ open, onOpenChange }: CreateDiagnosisDrawerProps) {
	const generatedFormId = useId();
	const nextAttachmentRowNumberRef = useRef(0);
	const [diagnosedAt, setDiagnosedAt] = useState<Date | undefined>();
	const [attachmentRows, setAttachmentRows] = useState<AttachmentFormRow[]>([]);

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
					<DrawerTitle className="text-lg leading-[1.2] text-gray-800">Add diagnosis</DrawerTitle>
					<DrawerClose aria-label="Close add diagnosis drawer">
						<RiCloseLine className="size-6" aria-hidden="true" />
					</DrawerClose>
					<DrawerDescription className="sr-only">
						Create a new diagnosis record for this patient.
					</DrawerDescription>
				</DrawerHeader>

				<form className="flex min-h-0 flex-1 flex-col gap-12 overflow-y-auto px-6 py-8 text-sm">
					<div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
						<div className="flex flex-col gap-2 sm:col-span-2">
							<Label htmlFor={`${generatedFormId}-diagnosis-name`} className={fieldLabelClassName}>
								Diagnosis name<span className={optionalLabelClassName}>(required)</span>
							</Label>
							<Input
								id={`${generatedFormId}-diagnosis-name`}
								placeholder="e.g. Type 2 Diabetes Mellitus"
								className={fieldControlClassName}
							/>
						</div>

						<div className="flex flex-col gap-2">
							<Label htmlFor={`${generatedFormId}-severity`} className={fieldLabelClassName}>
								Severity/Stage<span className={optionalLabelClassName}>(optional)</span>
							</Label>
							<Select>
								<SelectTrigger id={`${generatedFormId}-severity`} className="w-full">
									<SelectValue placeholder="Select severity or stage" />
								</SelectTrigger>
								<SelectContent className="rounded-xl border-gray-200 p-1 text-sm text-gray-700 shadow-xl">
									<SelectGroup>
										<SelectItem value="mild" className="rounded-md px-3 h-9">
											Mild
										</SelectItem>
										<SelectItem value="moderate" className="rounded-md px-3 h-9">
											Moderate
										</SelectItem>
										<SelectItem value="severe" className="rounded-md px-3 h-9">
											Severe
										</SelectItem>
										<SelectItem value="stage-1" className="rounded-md px-3 h-9">
											Stage 1
										</SelectItem>
										<SelectItem value="stage-2" className="rounded-md px-3 h-9">
											Stage 2
										</SelectItem>
										<SelectItem value="stage-3" className="rounded-md px-3 h-9">
											Stage 3
										</SelectItem>
									</SelectGroup>
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
									<SelectGroup>
										<SelectItem value="active" className="rounded-md px-3 h-9">
											Active
										</SelectItem>
										<SelectItem value="resolved" className="rounded-md px-3 h-9">
											Resolved
										</SelectItem>
									</SelectGroup>
								</SelectContent>
							</Select>
						</div>

						<div className="flex flex-col gap-2">
							<Label className={fieldLabelClassName}>
								Diagnosed at<span className={optionalLabelClassName}>(required)</span>
							</Label>
							<Popover>
								<PopoverTrigger asChild>
									<Button
										type="button"
										variant="outline"
										data-empty={!diagnosedAt}
										className={`${fieldControlClassName} flex w-full justify-between font-normal data-[empty=true]:text-gray-400 hover:bg-white active:scale-100`}
									>
										{diagnosedAt ? format(diagnosedAt, "PPP") : "Select diagnosis date"}
										<RiCalendarLine className="size-4 text-gray-600" aria-hidden="true" />
									</Button>
								</PopoverTrigger>
								<PopoverContent className="p-0">
									<Calendar
										mode="single"
										selected={diagnosedAt}
										onSelect={setDiagnosedAt}
										autoFocus
									/>
								</PopoverContent>
							</Popover>
						</div>

						<div className="flex flex-col gap-2">
							<Label htmlFor={`${generatedFormId}-diagnosed-by`} className={fieldLabelClassName}>
								Diagnosed by<span className={optionalLabelClassName}>(required)</span>
							</Label>
							<Input
								id={`${generatedFormId}-diagnosed-by`}
								placeholder="e.g. Dr. Chinenye Okafor"
								className={fieldControlClassName}
							/>
						</div>

						<div className="flex flex-col gap-2 sm:col-span-2">
							<Label htmlFor={`${generatedFormId}-clinical-notes`} className={fieldLabelClassName}>
								Clinical notes<span className={optionalLabelClassName}>(optional)</span>
							</Label>
							<Textarea
								id={`${generatedFormId}-clinical-notes`}
								placeholder="Add supporting clinical observations, symptoms, or treatment notes"
								className="border-gray-200 bg-white text-gray-700 placeholder:text-gray-400"
							/>
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
								className="border-gray-200 bg-white text-gray-600 shadow-xs"
								onClick={handleAddAttachmentRow}
							>
								<RiAddLine className="size-5" aria-hidden="true" />
								Add related record
							</Button>
						</div>
					</div>
				</form>

				<DrawerFooter className="border-t border-gray-200 px-6 py-5 text-sm">
					<div className="flex flex-col lg:flex-row gap-x-4 gap-y-2 lg:self-end">
						<DrawerClose asChild>
							<Button type="button" variant="outline" className="text-sm">
								Cancel
							</Button>
						</DrawerClose>
						<Button type="button" className="text-sm">
							Add diagnosis
						</Button>
					</div>
				</DrawerFooter>
			</DrawerContent>
		</Drawer>
	);
}
