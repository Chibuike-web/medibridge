"use client";

import { useId, useRef, useState } from "react";
import { format } from "date-fns";
import {
	RiAddLine,
	RiArrowLeftLine,
	RiArrowRightSLine,
	RiCalendarLine,
	RiCloseLine,
} from "@remixicon/react";
import { AttachmentFormFields, type AttachmentFormRow } from "./attachment-form-fields";
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

type CreateEncounterDrawerProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

type EncounterDrawerView = "records" | "medication";

const encounterRecordOptions = [
	{
		id: "vitals",
		title: "Vitals",
		description: "Record measurements such as blood pressure, temperature, pulse, and weight.",
	},
	{
		id: "medication",
		title: "Medications",
		description: "Document medications prescribed, administered, or reviewed during this encounter.",
	},
	{
		id: "allergies",
		title: "Allergies",
		description: "Record known allergies and any newly identified reactions.",
	},
	{
		id: "diagnoses",
		title: "Diagnoses",
		description: "Capture clinical assessments, conditions, or diagnoses made during the encounter.",
	},
	{
		id: "immunizations",
		title: "Immunizations",
		description: "Record vaccines administered or reviewed.",
	},
	{
		id: "imaging",
		title: "Imaging",
		description: "Attach or document imaging studies and reports.",
	},
	{
		id: "lab-tests",
		title: "Lab tests",
		description: "Add laboratory findings relevant to this visit.",
	},
	{
		id: "document",
		title: "Document",
		description: "Attach supporting clinical and administrative documents for this encounter.",
	},
] as const;

const fieldLabelClassName = "inline-flex items-baseline gap-0.5 text-sm font-medium text-gray-700";
const optionalLabelClassName = "font-normal text-gray-400";
const fieldControlClassName =
	"h-9 border-gray-200 bg-white text-sm text-gray-700 placeholder:text-gray-400";

export function CreateEncounterDrawer({ open, onOpenChange }: CreateEncounterDrawerProps) {
	const [activeEncounterDrawerView, setActiveEncounterDrawerView] =
		useState<EncounterDrawerView>("records");
	const generatedFormId = useId();
	const nextAttachmentRowNumberRef = useRef(0);
	const [startedAt, setStartedAt] = useState<Date | undefined>();
	const [attachmentRows, setAttachmentRows] = useState<AttachmentFormRow[]>([]);

	function handleOpenChange(isCreateEncounterDrawerOpen: boolean) {
		if (!isCreateEncounterDrawerOpen) {
			setActiveEncounterDrawerView("records");
		}

		onOpenChange(isCreateEncounterDrawerOpen);
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
			<DrawerContent className="overflow-hidden rounded-3xl text-sm data-[vaul-drawer-direction=right]:top-4 data-[vaul-drawer-direction=right]:right-4 data-[vaul-drawer-direction=right]:bottom-4 data-[vaul-drawer-direction=right]:h-auto data-[vaul-drawer-direction=right]:w-[50rem]">
				{activeEncounterDrawerView === "records" ? (
					<>
						<DrawerHeader className="flex-row items-center justify-between border-b border-gray-200 px-6 py-5 text-left">
							<DrawerTitle className="text-base leading-[1.2] text-gray-800">
								Create encounter
							</DrawerTitle>
							<DrawerClose aria-label="Close create encounter drawer">
								<RiCloseLine className="size-6" aria-hidden="true" />
							</DrawerClose>
							<DrawerDescription className="sr-only">
								Choose a clinical record to add to this encounter.
							</DrawerDescription>
						</DrawerHeader>

						<div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-6 py-8">
							{encounterRecordOptions.map((recordOption) => {
								const isMedicationOption = recordOption.id === "medication";

								return (
									<button
										key={recordOption.id}
										type="button"
										disabled={!isMedicationOption}
										className="flex w-full items-center justify-between gap-4 rounded-xl border border-gray-200 bg-white px-5 py-4 text-left transition-colors enabled:hover:bg-gray-50 enabled:focus-visible:outline-2 enabled:focus-visible:outline-offset-2 enabled:focus-visible:outline-gray-400 disabled:cursor-default disabled:opacity-100"
										onClick={() => setActiveEncounterDrawerView("medication")}
									>
										<span className="min-w-0">
											<span className="block text-sm font-semibold text-gray-600">
												{recordOption.title}
											</span>
											<span className="mt-1 block text-sm font-normal text-gray-400">
												{recordOption.description}
											</span>
										</span>
										<RiArrowRightSLine
											className="size-5 shrink-0 text-gray-400"
											aria-hidden="true"
										/>
									</button>
								);
							})}
						</div>
					</>
				) : (
					<>
						<DrawerHeader className="flex-row items-center gap-4 border-b border-gray-200 px-6 py-5 text-left">
							<button
								type="button"
								aria-label="Back to encounter records"
								className="rounded-md text-gray-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-400"
								onClick={() => setActiveEncounterDrawerView("records")}
							>
								<RiArrowLeftLine className="size-5" aria-hidden="true" />
							</button>
							<DrawerTitle className="text-base leading-[1.2] text-gray-800">
								Add medication
							</DrawerTitle>
							<DrawerDescription className="sr-only">
								Add a medication record to this encounter.
							</DrawerDescription>
						</DrawerHeader>

						<form className="flex min-h-0 flex-1 flex-col gap-12 overflow-y-auto px-6 py-8 text-sm">
							<div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
								<div className="flex flex-col gap-2 sm:col-span-2">
									<Label htmlFor={`${generatedFormId}-medication`} className={fieldLabelClassName}>
										Medication<span className={optionalLabelClassName}>(required)</span>
									</Label>
									<Input
										id={`${generatedFormId}-medication`}
										placeholder="e.g. Amoxicillin"
										className={fieldControlClassName}
									/>
								</div>

								<div className="flex flex-col gap-2">
									<Label htmlFor={`${generatedFormId}-indication`} className={fieldLabelClassName}>
										Indication<span className={optionalLabelClassName}>(required)</span>
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
									<SelectTrigger
										id={`${generatedFormId}-status`}
										className="w-full data-[placeholder]:text-gray-400"
									>
											<SelectValue placeholder="Select status" />
										</SelectTrigger>
										<SelectContent>
											<SelectGroup>
												<SelectItem value="active">Active</SelectItem>
												<SelectItem value="completed">Completed</SelectItem>
												<SelectItem value="discontinued">Discontinued</SelectItem>
											</SelectGroup>
										</SelectContent>
									</Select>
								</div>

								<div className="flex flex-col gap-2">
									<Label htmlFor={`${generatedFormId}-dose`} className={fieldLabelClassName}>
										Dose<span className={optionalLabelClassName}>(required)</span>
									</Label>
									<Input id={`${generatedFormId}-dose`} placeholder="e.g. 500 mg" className={fieldControlClassName} />
								</div>

								<div className="flex flex-col gap-2">
									<Label htmlFor={`${generatedFormId}-route`} className={fieldLabelClassName}>
										Route<span className={optionalLabelClassName}>(required)</span>
									</Label>
									<Select>
									<SelectTrigger
										id={`${generatedFormId}-route`}
										className="w-full data-[placeholder]:text-gray-400"
									>
											<SelectValue placeholder="Select route" />
										</SelectTrigger>
										<SelectContent>
											<SelectGroup>
												<SelectItem value="oral">Oral</SelectItem>
												<SelectItem value="iv">IV</SelectItem>
												<SelectItem value="inhalation">Inhalation</SelectItem>
											</SelectGroup>
										</SelectContent>
									</Select>
								</div>

								<div className="flex flex-col gap-2">
									<Label htmlFor={`${generatedFormId}-prescribed-by`} className={fieldLabelClassName}>
										Prescribed by<span className={optionalLabelClassName}>(required)</span>
									</Label>
									<Input
										id={`${generatedFormId}-prescribed-by`}
										placeholder="e.g. Dr. Ekene Okafor"
										className={fieldControlClassName}
									/>
								</div>

								<div className="flex flex-col gap-2">
									<Label htmlFor={`${generatedFormId}-frequency`} className={fieldLabelClassName}>
										Frequency<span className={optionalLabelClassName}>(required)</span>
									</Label>
									<Input
										id={`${generatedFormId}-frequency`}
										placeholder="e.g. Three times daily"
										className={fieldControlClassName}
									/>
								</div>

								<div className="flex flex-col gap-2">
									<Label htmlFor={`${generatedFormId}-duration`} className={fieldLabelClassName}>
										Duration<span className={optionalLabelClassName}>(required)</span>
									</Label>
									<Input id={`${generatedFormId}-duration`} placeholder="e.g. 7 days" className={fieldControlClassName} />
								</div>

								<div className="flex flex-col gap-2">
									<Label className={fieldLabelClassName}>
										Started at<span className={optionalLabelClassName}>(required)</span>
									</Label>
									<input
										type="hidden"
										name="startedAt"
										value={startedAt ? format(startedAt, "yyyy-MM-dd") : ""}
									/>
									<Popover>
										<PopoverTrigger asChild>
											<Button
												id={`${generatedFormId}-started-at`}
												type="button"
												variant="outline"
												data-empty={!startedAt}
												className={`${fieldControlClassName} flex w-full justify-between font-normal data-[empty=true]:text-gray-400 hover:bg-white active:scale-100`}
											>
												{startedAt ? format(startedAt, "PPP") : "Select start date"}
												<RiCalendarLine className="size-4 text-gray-600" aria-hidden="true" />
											</Button>
										</PopoverTrigger>
										<PopoverContent className="p-0">
											<Calendar mode="single" selected={startedAt} onSelect={setStartedAt} autoFocus />
										</PopoverContent>
									</Popover>
								</div>

								<div className="flex flex-col gap-2 sm:col-span-2">
									<Label htmlFor={`${generatedFormId}-clinical-notes`} className={fieldLabelClassName}>
										Clinical notes<span className={optionalLabelClassName}>(optional)</span>
									</Label>
									<Textarea
										id={`${generatedFormId}-clinical-notes`}
										placeholder="Add additional instructions, patient response, or prescribing notes"
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
										className="border-gray-200 bg-white text-sm text-gray-600"
										onClick={handleAddAttachmentRow}
									>
										<RiAddLine className="size-5" aria-hidden="true" />
										Add related record
									</Button>
								</div>
							</div>
						</form>

						<DrawerFooter className="border-t border-gray-200 px-6 py-5 text-sm">
							<div className="flex flex-col gap-2 lg:flex-row lg:self-end lg:gap-x-4">
								<DrawerClose asChild>
									<Button type="button" variant="outline" className="text-sm">
										Cancel
									</Button>
								</DrawerClose>
								<Button type="button" className="text-sm">
									Add medication
								</Button>
							</div>
						</DrawerFooter>
					</>
				)}
			</DrawerContent>
		</Drawer>
	);
}
