"use client";

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
import {
	AttachmentFormFields,
	type AttachmentFormRow,
} from "@/features/patients/components/attachment-form-fields";
import { RiAddLine, RiCloseLine } from "@remixicon/react";
import { useId, useRef, useState } from "react";

type CreateAllergyDrawerProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

const fieldLabelClassName = "inline-flex items-baseline gap-0.5 text-sm font-medium text-gray-700";
const optionalLabelClassName = "font-normal text-gray-400";
const fieldControlClassName =
	"border-gray-200 bg-white text-gray-700 placeholder:text-gray-400 text-sm h-9";

export function CreateAllergyDrawer({ open, onOpenChange }: CreateAllergyDrawerProps) {
	const generatedFormId = useId();
	const nextAttachmentRowNumberRef = useRef(0);
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
		setAttachmentRows((prev) => prev.filter((attachmentRow) => attachmentRow.id !== attachmentRowId));
	}

	return (
		<Drawer open={open} onOpenChange={onOpenChange} direction="right">
			<DrawerContent className="overflow-hidden rounded-3xl text-sm data-[vaul-drawer-direction=right]:top-4 data-[vaul-drawer-direction=right]:right-4 data-[vaul-drawer-direction=right]:bottom-4 data-[vaul-drawer-direction=right]:h-auto data-[vaul-drawer-direction=right]:w-[50rem]">
				<DrawerHeader className="flex-row items-center justify-between border-b border-gray-200 px-6 py-5 text-left">
					<DrawerTitle className="text-base leading-[1.2] text-gray-800">Add allergy</DrawerTitle>
					<DrawerClose aria-label="Close add allergy drawer">
						<RiCloseLine className="size-6" aria-hidden="true" />
					</DrawerClose>
					<DrawerDescription className="sr-only">
						Create a new allergy record for this patient.
					</DrawerDescription>
				</DrawerHeader>

				<form className="flex min-h-0 flex-1 flex-col gap-12 overflow-y-auto px-6 py-8 text-sm">
					<div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2">
						<div className="flex flex-col gap-2 sm:col-span-2">
							<Label htmlFor={`${generatedFormId}-allergen`} className={fieldLabelClassName}>
								Allergen<span className={optionalLabelClassName}>(required)</span>
							</Label>
							<Input
								id={`${generatedFormId}-allergen`}
								placeholder="e.g. Penicillin, Peanuts, Shellfish"
								className={fieldControlClassName}
							/>
						</div>

						<div className="flex flex-col gap-2">
							<Label htmlFor={`${generatedFormId}-severity`} className={fieldLabelClassName}>
								Severity<span className={optionalLabelClassName}>(required)</span>
							</Label>
							<Select>
								<SelectTrigger
									id={`${generatedFormId}-severity`}
									className={`${fieldControlClassName} w-full data-[placeholder]:text-gray-400`}
								>
									<SelectValue placeholder="Select severity" />
								</SelectTrigger>
								<SelectContent>
									<SelectGroup>
										<SelectItem value="mild">
											Mild
										</SelectItem>
										<SelectItem value="moderate">
											Moderate
										</SelectItem>
										<SelectItem value="severe">
											Severe
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
								<SelectTrigger
									id={`${generatedFormId}-status`}
									className={`${fieldControlClassName} w-full data-[placeholder]:text-gray-400`}
								>
									<SelectValue placeholder="Select status" />
								</SelectTrigger>
								<SelectContent>
									<SelectGroup>
										<SelectItem value="active">
											Active
										</SelectItem>
										<SelectItem value="inactive">
											Inactive
										</SelectItem>
									</SelectGroup>
								</SelectContent>
							</Select>
						</div>

						<div className="flex flex-col gap-2 sm:col-span-2">
							<Label htmlFor={`${generatedFormId}-reaction`} className={fieldLabelClassName}>
								Reaction<span className={optionalLabelClassName}>(required)</span>
							</Label>
							<Textarea
								id={`${generatedFormId}-reaction`}
								placeholder="e.g. Skin rash, Swelling, Difficulty breathing"
								className="min-h-28 bg-white text-sm text-gray-700 placeholder:text-gray-400"
							/>
						</div>

						<div className="flex flex-col gap-2 sm:col-span-2">
							<Label htmlFor={`${generatedFormId}-clinical-notes`} className={fieldLabelClassName}>
								Clinical notes<span className={optionalLabelClassName}>(optional)</span>
							</Label>
							<Textarea
								id={`${generatedFormId}-clinical-notes`}
								placeholder="Add additional allergy history, observations, or treatment notes"
								className="min-h-28 bg-white text-sm text-gray-700 placeholder:text-gray-400"
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
								className="border-gray-200 bg-white text-sm text-gray-600 "
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
							Add allergy
						</Button>
					</div>
				</DrawerFooter>
			</DrawerContent>
		</Drawer>
	);
}
