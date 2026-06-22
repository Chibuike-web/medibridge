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
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { RiAddLine, RiCalendarLine, RiCloseLine } from "@remixicon/react";
import { format } from "date-fns";
import { useId, useState } from "react";

type CreateDiagnosisDrawerProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

type AttachmentRow = {
	id: string;
};

const fieldLabelClassName = "text-sm font-medium text-gray-700";
const optionalLabelClassName = "font-normal text-gray-400";
const fieldControlClassName =
	"border-gray-200 bg-white text-gray-700 shadow-xs placeholder:text-gray-400";

export function CreateDiagnosisDrawer({
	open,
	onOpenChange,
}: CreateDiagnosisDrawerProps) {
	const generatedFormId = useId();
	const [diagnosedAt, setDiagnosedAt] = useState<Date | undefined>();
	const [attachmentRows, setAttachmentRows] = useState<AttachmentRow[]>([
		{ id: `${generatedFormId}-attachment-1` },
	]);

	function handleAddAttachmentRow() {
		setAttachmentRows((previousAttachmentRows) => [
			...previousAttachmentRows,
			{
				id: `${generatedFormId}-attachment-${previousAttachmentRows.length + 1}`,
			},
		]);
	}

	return (
		<Drawer open={open} onOpenChange={onOpenChange} direction="right">
			<DrawerContent className="overflow-hidden rounded-3xl text-sm data-[vaul-drawer-direction=right]:top-4 data-[vaul-drawer-direction=right]:right-4 data-[vaul-drawer-direction=right]:bottom-4 data-[vaul-drawer-direction=right]:h-auto data-[vaul-drawer-direction=right]:w-[50rem]">
				<DrawerHeader className="flex flex-row items-center justify-between border-b border-gray-200 px-6 py-5 text-left">
					<DrawerTitle className="text-lg leading-[1.2] text-gray-800">
						Add diagnosis
					</DrawerTitle>
					<DrawerClose aria-label="Close add diagnosis drawer">
						<RiCloseLine className="size-6" aria-hidden="true" />
					</DrawerClose>
					<DrawerDescription className="sr-only">
						Create a new diagnosis record for this patient.
					</DrawerDescription>
				</DrawerHeader>

				<form className="min-h-0 flex-1 overflow-y-auto px-6 py-8 text-sm">
					<div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2">
						<div className="flex flex-col gap-2 sm:col-span-2">
							<Label
								htmlFor={`${generatedFormId}-diagnosis-name`}
								className={fieldLabelClassName}
							>
								Diagnosis name{" "}
								<span className={optionalLabelClassName}>(required)</span>
							</Label>
							<Input
								id={`${generatedFormId}-diagnosis-name`}
								placeholder="e.g. Type 2 Diabetes Mellitus"
								className={fieldControlClassName}
							/>
						</div>

						<div className="flex flex-col gap-2">
							<Label
								htmlFor={`${generatedFormId}-severity`}
								className={fieldLabelClassName}
							>
								Severity/Stage{" "}
								<span className={optionalLabelClassName}>(optional)</span>
							</Label>
							<Select>
								<SelectTrigger
									id={`${generatedFormId}-severity`}
									className={`${fieldControlClassName} w-full`}
								>
									<SelectValue placeholder="Select severity or stage" />
								</SelectTrigger>
								<SelectContent className="rounded-xl border-gray-200 p-1 text-sm text-gray-700 shadow-xl">
									<SelectGroup>
										<SelectItem value="mild">Mild</SelectItem>
										<SelectItem value="moderate">Moderate</SelectItem>
										<SelectItem value="severe">Severe</SelectItem>
										<SelectItem value="stage-1">Stage 1</SelectItem>
										<SelectItem value="stage-2">Stage 2</SelectItem>
										<SelectItem value="stage-3">Stage 3</SelectItem>
									</SelectGroup>
								</SelectContent>
							</Select>
						</div>

						<div className="flex flex-col gap-2">
							<Label
								htmlFor={`${generatedFormId}-status`}
								className={fieldLabelClassName}
							>
								Status{" "}
								<span className={optionalLabelClassName}>(required)</span>
							</Label>
							<Select>
								<SelectTrigger
									id={`${generatedFormId}-status`}
									className={`${fieldControlClassName} w-full`}
								>
									<SelectValue placeholder="Select status" />
								</SelectTrigger>
								<SelectContent className="rounded-xl border-gray-200 p-1 text-sm text-gray-700 shadow-xl">
									<SelectGroup>
										<SelectItem value="active">Active</SelectItem>
										<SelectItem value="resolved">Resolved</SelectItem>
									</SelectGroup>
								</SelectContent>
							</Select>
						</div>

						<div className="flex flex-col gap-2">
							<Label className={fieldLabelClassName}>
								Diagnosed at{" "}
								<span className={optionalLabelClassName}>(required)</span>
							</Label>
							<Popover>
								<PopoverTrigger asChild>
									<Button
										type="button"
										variant="outline"
										data-empty={!diagnosedAt}
										className={`${fieldControlClassName} flex w-full justify-between font-normal data-[empty=true]:text-gray-400 hover:bg-white active:scale-100`}
									>
										{diagnosedAt
											? format(diagnosedAt, "PPP")
											: "Select diagnosis date"}
										<RiCalendarLine
											className="size-5 text-gray-600"
											aria-hidden="true"
										/>
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
							<Label
								htmlFor={`${generatedFormId}-diagnosed-by`}
								className={fieldLabelClassName}
							>
								Diagnosed by{" "}
								<span className={optionalLabelClassName}>(required)</span>
							</Label>
							<Input
								id={`${generatedFormId}-diagnosed-by`}
								placeholder="e.g. Dr. Chinenye Okafor"
								className={fieldControlClassName}
							/>
						</div>

						<div className="flex flex-col gap-2 sm:col-span-2">
							<Label
								htmlFor={`${generatedFormId}-clinical-notes`}
								className={fieldLabelClassName}
							>
								Clinical notes{" "}
								<span className={optionalLabelClassName}>(optional)</span>
							</Label>
							<Textarea
								id={`${generatedFormId}-clinical-notes`}
								placeholder="Add supporting clinical observations, symptoms, or treatment notes"
								className="min-h-36 resize-none border-gray-200 bg-white text-gray-700 shadow-xs placeholder:text-gray-400"
							/>
						</div>

						{attachmentRows.map((attachmentRow, attachmentIndex) => (
							<div
								key={attachmentRow.id}
								className="grid grid-cols-1 gap-x-6 gap-y-6 sm:col-span-2 sm:grid-cols-2"
							>
								<div className="flex flex-col gap-2">
									<Label
										htmlFor={`${attachmentRow.id}-name`}
										className={fieldLabelClassName}
									>
										Attachment name
									</Label>
									<Input
										id={`${attachmentRow.id}-name`}
										placeholder="e.g. Lab test, Imaging report, Prescription"
										className={fieldControlClassName}
									/>
								</div>
								<div className="flex flex-col gap-2">
									<Label
										htmlFor={`${attachmentRow.id}-id`}
										className={fieldLabelClassName}
									>
										Attachment ID
									</Label>
									<Input
										id={`${attachmentRow.id}-id`}
										placeholder="e.g. LAB-2048, IMG-1032, MED-4821"
										className={fieldControlClassName}
									/>
								</div>
								{attachmentIndex === attachmentRows.length - 1 ? (
									<div className="sm:col-span-2">
										<Button
											type="button"
											variant="outline"
											className="gap-2 border-gray-200 bg-white px-4 text-gray-600 shadow-xs"
											onClick={handleAddAttachmentRow}
										>
											<RiAddLine className="size-5" aria-hidden="true" />
											Add attachment
										</Button>
									</div>
								) : null}
							</div>
						))}
					</div>
				</form>

				<DrawerFooter className="border-t border-gray-200 px-6 py-5 text-sm">
					<div className="ml-auto flex gap-4">
						<DrawerClose asChild>
							<Button type="button" variant="outline" className="min-w-32 text-sm">
								Cancel
							</Button>
						</DrawerClose>
						<Button type="button" className="min-w-44 text-sm">
							Add diagnosis
						</Button>
					</div>
				</DrawerFooter>
			</DrawerContent>
		</Drawer>
	);
}
