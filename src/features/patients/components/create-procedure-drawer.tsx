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

type CreateProcedureDrawerProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

const fieldLabelClassName = "inline-flex items-baseline gap-0.5 text-sm font-medium text-gray-700";
const optionalLabelClassName = "font-normal text-gray-400";
const fieldControlClassName =
	"border-gray-200 bg-white text-gray-700 shadow-xs placeholder:text-gray-400 text-sm h-9";

export function CreateProcedureDrawer({ open, onOpenChange }: CreateProcedureDrawerProps) {
	const generatedFormId = useId();
	const nextAttachmentRowNumberRef = useRef(0);
	const [procedureDate, setProcedureDate] = useState<Date | undefined>();
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
					<DrawerTitle className="text-lg leading-[1.2] text-gray-800">Add procedure</DrawerTitle>
					<DrawerClose aria-label="Close add procedure drawer">
						<RiCloseLine className="size-6" aria-hidden="true" />
					</DrawerClose>
					<DrawerDescription className="sr-only">
						Create a new procedure record for this patient.
					</DrawerDescription>
				</DrawerHeader>

				<form className="flex min-h-0 flex-1 flex-col gap-12 overflow-y-auto px-6 py-8 text-sm">
					<div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2">
						<div className="flex flex-col gap-2 sm:col-span-2">
							<Label htmlFor={`${generatedFormId}-procedure`} className={fieldLabelClassName}>
								Procedure<span className={optionalLabelClassName}>(required)</span>
							</Label>
							<Input
								id={`${generatedFormId}-procedure`}
								placeholder="e.g. Appendectomy"
								className={fieldControlClassName}
							/>
						</div>

						<div className="flex flex-col gap-2">
							<Label htmlFor={`${generatedFormId}-indication`} className={fieldLabelClassName}>
								Indication<span className={optionalLabelClassName}>(optional)</span>
							</Label>
							<Input
								id={`${generatedFormId}-indication`}
								placeholder="e.g. Bacterial respiratory tract infection"
								className={fieldControlClassName}
							/>
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
								</SelectContent>
							</Select>
						</div>

						<div className="flex flex-col gap-2">
							<Label className={fieldLabelClassName}>
								Date<span className={optionalLabelClassName}>(required)</span>
							</Label>
							<input
								type="hidden"
								name="procedureDate"
								value={procedureDate ? format(procedureDate, "yyyy-MM-dd") : ""}
							/>
							<Popover>
								<PopoverTrigger asChild>
									<Button
										id={`${generatedFormId}-date`}
										type="button"
										variant="outline"
										data-empty={!procedureDate}
										className={`${fieldControlClassName} flex w-full justify-between font-normal data-[empty=true]:text-gray-400 hover:bg-white active:scale-100`}
									>
										{procedureDate ? format(procedureDate, "PPP") : "Select date"}
										<RiCalendarLine className="size-4 text-gray-600" aria-hidden="true" />
									</Button>
								</PopoverTrigger>
								<PopoverContent className="p-0">
									<Calendar
										mode="single"
										selected={procedureDate}
										onSelect={setProcedureDate}
										autoFocus
									/>
								</PopoverContent>
							</Popover>
						</div>

						<div className="flex flex-col gap-2">
							<Label htmlFor={`${generatedFormId}-physician`} className={fieldLabelClassName}>
								Physician<span className={optionalLabelClassName}>(required)</span>
							</Label>
							<Input
								id={`${generatedFormId}-physician`}
								placeholder="e.g. Dr. Ekene Okafor"
								className={fieldControlClassName}
							/>
						</div>

						<div className="flex flex-col gap-2">
							<Label htmlFor={`${generatedFormId}-assistants`} className={fieldLabelClassName}>
								Assistants<span className={optionalLabelClassName}>(required)</span>
							</Label>
							<Select>
								<SelectTrigger id={`${generatedFormId}-assistants`} className="w-full">
									<SelectValue placeholder="Enter assistants" />
								</SelectTrigger>
								<SelectContent className="rounded-xl border-gray-200 p-1 text-sm text-gray-700 shadow-xl">
									<SelectGroup>
										<SelectItem value="dr-adebayo" className="rounded-md px-3 h-9">
											Dr. Adebayo
										</SelectItem>
										<SelectItem value="dr-ekene" className="rounded-md px-3 h-9">
											Dr. Ekene
										</SelectItem>
										<SelectItem value="dr-manny" className="rounded-md px-3 h-9">
											Dr. Manny
										</SelectItem>
									</SelectGroup>
								</SelectContent>
							</Select>
						</div>

						<div className="flex flex-col gap-2">
							<Label htmlFor={`${generatedFormId}-facility`} className={fieldLabelClassName}>
								Facility<span className={optionalLabelClassName}>(required)</span>
							</Label>
							<Input
								id={`${generatedFormId}-facility`}
								placeholder="e.g. Enugu State University Teaching Hospital"
								className={fieldControlClassName}
							/>
						</div>

						<div className="flex flex-col gap-2 sm:col-span-2">
							<Label htmlFor={`${generatedFormId}-clinical-notes`} className={fieldLabelClassName}>
								Clinical notes<span className={optionalLabelClassName}>(optional)</span>
							</Label>
							<Textarea
								id={`${generatedFormId}-clinical-notes`}
								placeholder="Add additional instructions or patient response"
								className="min-h-28 border-gray-200 bg-white text-sm text-gray-700 shadow-xs placeholder:text-gray-400"
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
							Add procedure
						</Button>
					</div>
				</DrawerFooter>
			</DrawerContent>
		</Drawer>
	);
}
