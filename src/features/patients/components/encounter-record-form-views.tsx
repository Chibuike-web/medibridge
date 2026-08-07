"use client";

import { type ChangeEvent, useId, useRef, useState } from "react";
import { format } from "date-fns";
import { RiAddLine, RiCalendarLine } from "@remixicon/react";
import { ChooseFileCard } from "@/components/choose-file-card";
import { CreateSelectedFiles } from "@/components/create-selected-files";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { DrawerClose, DrawerFooter } from "@/components/ui/drawer";
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
import { AttachmentFormFields, type AttachmentFormRow } from "./attachment-form-fields";

export type EncounterRecordType =
	| "vitals"
	| "medication"
	| "allergies"
	| "diagnoses"
	| "immunizations"
	| "imaging"
	| "lab-tests"
	| "document";

type EncounterRecordFormViewProps = {
	recordType: EncounterRecordType;
};

const fieldLabelClassName = "inline-flex items-baseline gap-0.5 text-sm font-medium text-gray-700";
const optionalLabelClassName = "font-normal text-gray-400";
const fieldControlClassName =
	"h-9 border-gray-200 bg-white text-sm text-gray-700 placeholder:text-gray-400";
const textareaClassName =
	"min-h-28 bg-white text-sm text-gray-700 placeholder:text-gray-400";

const documentTypes = [
	"Lab Report",
	"Imaging",
	"Cardiology",
	"Clinical Summary",
	"Referral",
	"Pathology",
] as const;

const submitLabels: Record<EncounterRecordType, string> = {
	vitals: "Add vitals",
	medication: "Add medication",
	allergies: "Add allergy",
	diagnoses: "Add diagnosis",
	immunizations: "Add immunization",
	imaging: "Add imaging",
	"lab-tests": "Add lab test",
	document: "Add document",
};

export function EncounterRecordFormView({ recordType }: EncounterRecordFormViewProps) {
	const generatedFormId = useId();
	const nextAttachmentRowNumberRef = useRef(0);
	const documentFileInputRef = useRef<HTMLInputElement>(null);
	const [attachmentRows, setAttachmentRows] = useState<AttachmentFormRow[]>([]);
	const [selectedDocumentFiles, setSelectedDocumentFiles] = useState<File[]>([]);
	const [recordedAt, setRecordedAt] = useState<Date | undefined>();
	const [startedAt, setStartedAt] = useState<Date | undefined>();
	const [diagnosedAt, setDiagnosedAt] = useState<Date | undefined>();
	const [administeredAt, setAdministeredAt] = useState<Date | undefined>();
	const [imagingPerformedAt, setImagingPerformedAt] = useState<Date | undefined>();
	const [labPerformedAt, setLabPerformedAt] = useState<Date | undefined>();

	const showsRelatedRecords = ["medication", "allergies", "diagnoses", "imaging", "lab-tests"].includes(
		recordType,
	);

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

	function handleDocumentFilesSelected(event: ChangeEvent<HTMLInputElement>) {
		const nextFiles = Array.from(event.target.files ?? []);

		setSelectedDocumentFiles((prev) => [...prev, ...nextFiles]);
		event.target.value = "";
	}

	function handleRemoveDocumentFile(file: File) {
		setSelectedDocumentFiles((prev) =>
			prev.filter((selectedDocumentFile) => selectedDocumentFile !== file),
		);
	}

	return (
		<>
			<form className="flex min-h-0 flex-1 flex-col gap-12 overflow-y-auto px-6 py-8 text-sm">
				{recordType === "vitals" ? (
					<div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
						<div className="flex flex-col gap-2">
							<Label htmlFor={`${generatedFormId}-temperature`} className={fieldLabelClassName}>
								Temperature (°C)<span className={optionalLabelClassName}>(required)</span>
							</Label>
							<Input
								id={`${generatedFormId}-temperature`}
								inputMode="decimal"
								placeholder="e.g. 36.8"
								className={fieldControlClassName}
							/>
						</div>
						<div className="flex flex-col gap-2">
							<Label htmlFor={`${generatedFormId}-blood-pressure`} className={fieldLabelClassName}>
								Blood pressure<span className={optionalLabelClassName}>(required)</span>
							</Label>
							<Input
								id={`${generatedFormId}-blood-pressure`}
								placeholder="e.g. 120/80 mmHg"
								className={fieldControlClassName}
							/>
						</div>
						<div className="flex flex-col gap-2">
							<Label htmlFor={`${generatedFormId}-pulse`} className={fieldLabelClassName}>
								Pulse rate<span className={optionalLabelClassName}>(required)</span>
							</Label>
							<Input
								id={`${generatedFormId}-pulse`}
								inputMode="numeric"
								placeholder="e.g. 72 bpm"
								className={fieldControlClassName}
							/>
						</div>
						<div className="flex flex-col gap-2">
							<Label htmlFor={`${generatedFormId}-respiratory-rate`} className={fieldLabelClassName}>
								Respiratory rate<span className={optionalLabelClassName}>(required)</span>
							</Label>
							<Input
								id={`${generatedFormId}-respiratory-rate`}
								inputMode="numeric"
								placeholder="e.g. 16 breaths/min"
								className={fieldControlClassName}
							/>
						</div>
						<div className="flex flex-col gap-2">
							<Label htmlFor={`${generatedFormId}-oxygen-saturation`} className={fieldLabelClassName}>
								Oxygen saturation<span className={optionalLabelClassName}>(required)</span>
							</Label>
							<Input
								id={`${generatedFormId}-oxygen-saturation`}
								inputMode="numeric"
								placeholder="e.g. 98%"
								className={fieldControlClassName}
							/>
						</div>
						<div className="flex flex-col gap-2">
							<Label htmlFor={`${generatedFormId}-weight`} className={fieldLabelClassName}>
								Weight (kg)<span className={optionalLabelClassName}>(optional)</span>
							</Label>
							<Input
								id={`${generatedFormId}-weight`}
								inputMode="decimal"
								placeholder="e.g. 68.5"
								className={fieldControlClassName}
							/>
						</div>
						<div className="flex flex-col gap-2">
							<Label htmlFor={`${generatedFormId}-height`} className={fieldLabelClassName}>
								Height (cm)<span className={optionalLabelClassName}>(optional)</span>
							</Label>
							<Input
								id={`${generatedFormId}-height`}
								inputMode="decimal"
								placeholder="e.g. 170"
								className={fieldControlClassName}
							/>
						</div>
						<div className="flex flex-col gap-2">
							<Label className={fieldLabelClassName}>
								Recorded at<span className={optionalLabelClassName}>(required)</span>
							</Label>
							<Popover>
								<PopoverTrigger asChild>
									<Button
										type="button"
										variant="outline"
										data-empty={!recordedAt}
										className={`${fieldControlClassName} flex w-full justify-between font-normal data-[empty=true]:text-gray-400 hover:bg-white active:scale-100`}
									>
										{recordedAt ? format(recordedAt, "PPP") : "Select recorded date"}
										<RiCalendarLine className="size-4 text-gray-600" aria-hidden="true" />
									</Button>
								</PopoverTrigger>
								<PopoverContent className="p-0">
									<Calendar mode="single" selected={recordedAt} onSelect={setRecordedAt} autoFocus />
								</PopoverContent>
							</Popover>
						</div>
						<div className="flex flex-col gap-2 sm:col-span-2">
							<Label htmlFor={`${generatedFormId}-vitals-notes`} className={fieldLabelClassName}>
								Clinical notes<span className={optionalLabelClassName}>(optional)</span>
							</Label>
							<Textarea
								id={`${generatedFormId}-vitals-notes`}
								placeholder="Add observations or context about these measurements"
								className={textareaClassName}
							/>
						</div>
					</div>
				) : null}

				{recordType === "medication" ? (
					<div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
						<div className="flex flex-col gap-2 sm:col-span-2">
							<Label htmlFor={`${generatedFormId}-medication`} className={fieldLabelClassName}>
								Medication<span className={optionalLabelClassName}>(required)</span>
							</Label>
							<Input id={`${generatedFormId}-medication`} placeholder="e.g. Amoxicillin" className={fieldControlClassName} />
						</div>
						<div className="flex flex-col gap-2">
							<Label htmlFor={`${generatedFormId}-indication`} className={fieldLabelClassName}>
								Indication<span className={optionalLabelClassName}>(required)</span>
							</Label>
							<Input id={`${generatedFormId}-indication`} placeholder="e.g. Bacterial respiratory tract infection" className={fieldControlClassName} />
						</div>
						<div className="flex flex-col gap-2">
							<Label htmlFor={`${generatedFormId}-status`} className={fieldLabelClassName}>
								Status<span className={optionalLabelClassName}>(required)</span>
							</Label>
							<Select>
								<SelectTrigger id={`${generatedFormId}-status`} className="w-full data-[placeholder]:text-gray-400">
									<SelectValue placeholder="Select status" />
								</SelectTrigger>
								<SelectContent><SelectGroup><SelectItem value="active">Active</SelectItem><SelectItem value="completed">Completed</SelectItem><SelectItem value="discontinued">Discontinued</SelectItem></SelectGroup></SelectContent>
							</Select>
						</div>
						<div className="flex flex-col gap-2">
							<Label htmlFor={`${generatedFormId}-dose`} className={fieldLabelClassName}>Dose<span className={optionalLabelClassName}>(required)</span></Label>
							<Input id={`${generatedFormId}-dose`} placeholder="e.g. 500 mg" className={fieldControlClassName} />
						</div>
						<div className="flex flex-col gap-2">
							<Label htmlFor={`${generatedFormId}-route`} className={fieldLabelClassName}>Route<span className={optionalLabelClassName}>(required)</span></Label>
							<Select>
								<SelectTrigger id={`${generatedFormId}-route`} className="w-full data-[placeholder]:text-gray-400"><SelectValue placeholder="Select route" /></SelectTrigger>
								<SelectContent><SelectGroup><SelectItem value="oral">Oral</SelectItem><SelectItem value="iv">IV</SelectItem><SelectItem value="inhalation">Inhalation</SelectItem></SelectGroup></SelectContent>
							</Select>
						</div>
						<div className="flex flex-col gap-2">
							<Label htmlFor={`${generatedFormId}-prescribed-by`} className={fieldLabelClassName}>Prescribed by<span className={optionalLabelClassName}>(required)</span></Label>
							<Input id={`${generatedFormId}-prescribed-by`} placeholder="e.g. Dr. Ekene Okafor" className={fieldControlClassName} />
						</div>
						<div className="flex flex-col gap-2">
							<Label htmlFor={`${generatedFormId}-frequency`} className={fieldLabelClassName}>Frequency<span className={optionalLabelClassName}>(required)</span></Label>
							<Input id={`${generatedFormId}-frequency`} placeholder="e.g. Three times daily" className={fieldControlClassName} />
						</div>
						<div className="flex flex-col gap-2">
							<Label htmlFor={`${generatedFormId}-duration`} className={fieldLabelClassName}>Duration<span className={optionalLabelClassName}>(required)</span></Label>
							<Input id={`${generatedFormId}-duration`} placeholder="e.g. 7 days" className={fieldControlClassName} />
						</div>
						<div className="flex flex-col gap-2">
							<Label className={fieldLabelClassName}>Started at<span className={optionalLabelClassName}>(required)</span></Label>
							<Popover>
								<PopoverTrigger asChild>
									<Button type="button" variant="outline" data-empty={!startedAt} className={`${fieldControlClassName} flex w-full justify-between font-normal data-[empty=true]:text-gray-400 hover:bg-white active:scale-100`}>
										{startedAt ? format(startedAt, "PPP") : "Select start date"}<RiCalendarLine className="size-4 text-gray-600" aria-hidden="true" />
									</Button>
								</PopoverTrigger>
								<PopoverContent className="p-0"><Calendar mode="single" selected={startedAt} onSelect={setStartedAt} autoFocus /></PopoverContent>
							</Popover>
						</div>
						<div className="flex flex-col gap-2 sm:col-span-2">
							<Label htmlFor={`${generatedFormId}-medication-notes`} className={fieldLabelClassName}>Clinical notes<span className={optionalLabelClassName}>(optional)</span></Label>
							<Textarea id={`${generatedFormId}-medication-notes`} placeholder="Add additional instructions, patient response, or prescribing notes" className={textareaClassName} />
						</div>
					</div>
				) : null}

				{recordType === "allergies" ? (
					<div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
						<div className="flex flex-col gap-2 sm:col-span-2">
							<Label htmlFor={`${generatedFormId}-allergen`} className={fieldLabelClassName}>Allergen<span className={optionalLabelClassName}>(required)</span></Label>
							<Input id={`${generatedFormId}-allergen`} placeholder="e.g. Penicillin, Peanuts, Shellfish" className={fieldControlClassName} />
						</div>
						<div className="flex flex-col gap-2">
							<Label htmlFor={`${generatedFormId}-severity`} className={fieldLabelClassName}>Severity<span className={optionalLabelClassName}>(required)</span></Label>
							<Select><SelectTrigger id={`${generatedFormId}-severity`} className="w-full data-[placeholder]:text-gray-400"><SelectValue placeholder="Select severity" /></SelectTrigger><SelectContent><SelectGroup><SelectItem value="mild">Mild</SelectItem><SelectItem value="moderate">Moderate</SelectItem><SelectItem value="severe">Severe</SelectItem></SelectGroup></SelectContent></Select>
						</div>
						<div className="flex flex-col gap-2">
							<Label htmlFor={`${generatedFormId}-allergy-status`} className={fieldLabelClassName}>Status<span className={optionalLabelClassName}>(required)</span></Label>
							<Select><SelectTrigger id={`${generatedFormId}-allergy-status`} className="w-full data-[placeholder]:text-gray-400"><SelectValue placeholder="Select status" /></SelectTrigger><SelectContent><SelectGroup><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem></SelectGroup></SelectContent></Select>
						</div>
						<div className="flex flex-col gap-2 sm:col-span-2">
							<Label htmlFor={`${generatedFormId}-reaction`} className={fieldLabelClassName}>Reaction<span className={optionalLabelClassName}>(required)</span></Label>
							<Textarea id={`${generatedFormId}-reaction`} placeholder="e.g. Skin rash, Swelling, Difficulty breathing" className={textareaClassName} />
						</div>
						<div className="flex flex-col gap-2 sm:col-span-2">
							<Label htmlFor={`${generatedFormId}-allergy-notes`} className={fieldLabelClassName}>Clinical notes<span className={optionalLabelClassName}>(optional)</span></Label>
							<Textarea id={`${generatedFormId}-allergy-notes`} placeholder="Add additional allergy history, observations, or treatment notes" className={textareaClassName} />
						</div>
					</div>
				) : null}

				{recordType === "diagnoses" ? (
					<div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
						<div className="flex flex-col gap-2 sm:col-span-2">
							<Label htmlFor={`${generatedFormId}-diagnosis-name`} className={fieldLabelClassName}>Diagnosis name<span className={optionalLabelClassName}>(required)</span></Label>
							<Input id={`${generatedFormId}-diagnosis-name`} placeholder="e.g. Type 2 Diabetes Mellitus" className={fieldControlClassName} />
						</div>
						<div className="flex flex-col gap-2">
							<Label htmlFor={`${generatedFormId}-diagnosis-severity`} className={fieldLabelClassName}>Severity or stage<span className={optionalLabelClassName}>(required)</span></Label>
							<Select><SelectTrigger id={`${generatedFormId}-diagnosis-severity`} className="w-full data-[placeholder]:text-gray-400"><SelectValue placeholder="Select severity or stage" /></SelectTrigger><SelectContent><SelectGroup><SelectItem value="mild">Mild</SelectItem><SelectItem value="moderate">Moderate</SelectItem><SelectItem value="severe">Severe</SelectItem></SelectGroup></SelectContent></Select>
						</div>
						<div className="flex flex-col gap-2">
							<Label htmlFor={`${generatedFormId}-diagnosis-status`} className={fieldLabelClassName}>Status<span className={optionalLabelClassName}>(required)</span></Label>
							<Select><SelectTrigger id={`${generatedFormId}-diagnosis-status`} className="w-full data-[placeholder]:text-gray-400"><SelectValue placeholder="Select status" /></SelectTrigger><SelectContent><SelectGroup><SelectItem value="active">Active</SelectItem><SelectItem value="resolved">Resolved</SelectItem><SelectItem value="chronic">Chronic</SelectItem></SelectGroup></SelectContent></Select>
						</div>
						<div className="flex flex-col gap-2">
							<Label className={fieldLabelClassName}>Date diagnosed<span className={optionalLabelClassName}>(required)</span></Label>
							<Popover><PopoverTrigger asChild><Button type="button" variant="outline" data-empty={!diagnosedAt} className={`${fieldControlClassName} flex w-full justify-between font-normal data-[empty=true]:text-gray-400 hover:bg-white active:scale-100`}>{diagnosedAt ? format(diagnosedAt, "PPP") : "Select diagnosis date"}<RiCalendarLine className="size-4 text-gray-600" aria-hidden="true" /></Button></PopoverTrigger><PopoverContent className="p-0"><Calendar mode="single" selected={diagnosedAt} onSelect={setDiagnosedAt} autoFocus /></PopoverContent></Popover>
						</div>
						<div className="flex flex-col gap-2">
							<Label htmlFor={`${generatedFormId}-diagnosed-by`} className={fieldLabelClassName}>Diagnosed by<span className={optionalLabelClassName}>(required)</span></Label>
							<Input id={`${generatedFormId}-diagnosed-by`} placeholder="e.g. Dr. Chinenye Okafor" className={fieldControlClassName} />
						</div>
						<div className="flex flex-col gap-2 sm:col-span-2">
							<Label htmlFor={`${generatedFormId}-diagnosis-notes`} className={fieldLabelClassName}>Clinical notes<span className={optionalLabelClassName}>(optional)</span></Label>
							<Textarea id={`${generatedFormId}-diagnosis-notes`} placeholder="Add supporting clinical observations, symptoms, or treatment notes" className={textareaClassName} />
						</div>
					</div>
				) : null}

				{recordType === "immunizations" ? (
					<div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
						<div className="flex flex-col gap-2 sm:col-span-2"><Label htmlFor={`${generatedFormId}-vaccine-name`} className={fieldLabelClassName}>Vaccine name<span className={optionalLabelClassName}>(required)</span></Label><Input id={`${generatedFormId}-vaccine-name`} placeholder="e.g. Hepatitis B, BCG, COVID-19 Vaccine" className={fieldControlClassName} /></div>
						<div className="flex flex-col gap-2"><Label htmlFor={`${generatedFormId}-series-type`} className={fieldLabelClassName}>Series type<span className={optionalLabelClassName}>(optional)</span></Label><Select><SelectTrigger id={`${generatedFormId}-series-type`} className="w-full data-[placeholder]:text-gray-400"><SelectValue placeholder="Select series type" /></SelectTrigger><SelectContent><SelectGroup><SelectItem value="primary">Primary</SelectItem><SelectItem value="booster">Booster</SelectItem></SelectGroup></SelectContent></Select></div>
						<div className="flex flex-col gap-2"><Label htmlFor={`${generatedFormId}-current-dose`} className={fieldLabelClassName}>Current dose<span className={optionalLabelClassName}>(required)</span></Label><Input id={`${generatedFormId}-current-dose`} placeholder="e.g. 1, 2, 3" className={fieldControlClassName} /></div>
						<div className="flex flex-col gap-2"><Label htmlFor={`${generatedFormId}-total-dosage`} className={fieldLabelClassName}>Total dosage<span className={optionalLabelClassName}>(required)</span></Label><Input id={`${generatedFormId}-total-dosage`} placeholder="e.g. 1, 2, 3" className={fieldControlClassName} /></div>
						<div className="flex flex-col gap-2"><Label htmlFor={`${generatedFormId}-immunization-status`} className={fieldLabelClassName}>Status<span className={optionalLabelClassName}>(required)</span></Label><Select><SelectTrigger id={`${generatedFormId}-immunization-status`} className="w-full data-[placeholder]:text-gray-400"><SelectValue placeholder="Select status" /></SelectTrigger><SelectContent><SelectGroup><SelectItem value="active">Active</SelectItem><SelectItem value="completed">Completed</SelectItem><SelectItem value="cancelled">Cancelled</SelectItem><SelectItem value="discontinued">Discontinued</SelectItem></SelectGroup></SelectContent></Select></div>
						<div className="flex flex-col gap-2"><Label className={fieldLabelClassName}>Date administered<span className={optionalLabelClassName}>(required)</span></Label><Popover><PopoverTrigger asChild><Button type="button" variant="outline" data-empty={!administeredAt} className={`${fieldControlClassName} flex w-full justify-between font-normal data-[empty=true]:text-gray-400 hover:bg-white active:scale-100`}>{administeredAt ? format(administeredAt, "PPP") : "Select administration date"}<RiCalendarLine className="size-4 text-gray-600" aria-hidden="true" /></Button></PopoverTrigger><PopoverContent className="p-0"><Calendar mode="single" selected={administeredAt} onSelect={setAdministeredAt} autoFocus /></PopoverContent></Popover></div>
						<div className="flex flex-col gap-2"><Label htmlFor={`${generatedFormId}-administered-by`} className={fieldLabelClassName}>Administered by<span className={optionalLabelClassName}>(required)</span></Label><Input id={`${generatedFormId}-administered-by`} placeholder="e.g. Dr. Adebayo Johnson" className={fieldControlClassName} /></div>
						<div className="flex flex-col gap-2 sm:col-span-2"><Label htmlFor={`${generatedFormId}-immunization-notes`} className={fieldLabelClassName}>Clinical notes<span className={optionalLabelClassName}>(optional)</span></Label><Textarea id={`${generatedFormId}-immunization-notes`} placeholder="Add vaccination notes, patient response, or follow-up instructions" className={textareaClassName} /></div>
					</div>
				) : null}

				{recordType === "imaging" ? (
					<div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
						<div className="flex flex-col gap-2 sm:col-span-2"><Label htmlFor={`${generatedFormId}-study`} className={fieldLabelClassName}>Study<span className={optionalLabelClassName}>(required)</span></Label><Input id={`${generatedFormId}-study`} placeholder="e.g. CT Abdomen with Contrast" className={fieldControlClassName} /></div>
						<div className="flex flex-col gap-2"><Label htmlFor={`${generatedFormId}-region`} className={fieldLabelClassName}>Body region<span className={optionalLabelClassName}>(required)</span></Label><Input id={`${generatedFormId}-region`} placeholder="e.g. Abdomen" className={fieldControlClassName} /></div>
						<div className="flex flex-col gap-2"><Label htmlFor={`${generatedFormId}-modality`} className={fieldLabelClassName}>Modality<span className={optionalLabelClassName}>(required)</span></Label><Select><SelectTrigger id={`${generatedFormId}-modality`} className="w-full data-[placeholder]:text-gray-400"><SelectValue placeholder="Select modality" /></SelectTrigger><SelectContent><SelectGroup><SelectItem value="x-ray">X-ray</SelectItem><SelectItem value="ct">CT</SelectItem><SelectItem value="mri">MRI</SelectItem><SelectItem value="ultrasound">Ultrasound</SelectItem></SelectGroup></SelectContent></Select></div>
						<div className="flex flex-col gap-2"><Label className={fieldLabelClassName}>Date performed<span className={optionalLabelClassName}>(required)</span></Label><Popover><PopoverTrigger asChild><Button type="button" variant="outline" data-empty={!imagingPerformedAt} className={`${fieldControlClassName} flex w-full justify-between font-normal data-[empty=true]:text-gray-400 hover:bg-white active:scale-100`}>{imagingPerformedAt ? format(imagingPerformedAt, "PPP") : "Select performed date"}<RiCalendarLine className="size-4 text-gray-600" aria-hidden="true" /></Button></PopoverTrigger><PopoverContent className="p-0"><Calendar mode="single" selected={imagingPerformedAt} onSelect={setImagingPerformedAt} autoFocus /></PopoverContent></Popover></div>
						<div className="flex flex-col gap-2"><Label htmlFor={`${generatedFormId}-imaging-ordered-by`} className={fieldLabelClassName}>Ordered by<span className={optionalLabelClassName}>(required)</span></Label><Input id={`${generatedFormId}-imaging-ordered-by`} placeholder="e.g. Dr. Adebayo Johnson" className={fieldControlClassName} /></div>
						<div className="flex flex-col gap-2"><Label htmlFor={`${generatedFormId}-imaging-status`} className={fieldLabelClassName}>Status<span className={optionalLabelClassName}>(required)</span></Label><Select><SelectTrigger id={`${generatedFormId}-imaging-status`} className="w-full data-[placeholder]:text-gray-400"><SelectValue placeholder="Select status" /></SelectTrigger><SelectContent><SelectGroup><SelectItem value="ordered">Ordered</SelectItem><SelectItem value="scheduled">Scheduled</SelectItem><SelectItem value="completed">Completed</SelectItem><SelectItem value="cancelled">Cancelled</SelectItem></SelectGroup></SelectContent></Select></div>
						<div className="flex flex-col gap-2 sm:col-span-2"><Label htmlFor={`${generatedFormId}-findings`} className={fieldLabelClassName}>Findings<span className={optionalLabelClassName}>(required)</span></Label><Textarea id={`${generatedFormId}-findings`} placeholder="e.g. Suspicious liver lesion identified in the right hepatic lobe" className={textareaClassName} /></div>
						<div className="flex flex-col gap-2 sm:col-span-2"><Label htmlFor={`${generatedFormId}-imaging-notes`} className={fieldLabelClassName}>Clinical notes<span className={optionalLabelClassName}>(optional)</span></Label><Textarea id={`${generatedFormId}-imaging-notes`} placeholder="Add additional findings, preparation instructions, or radiology notes" className={textareaClassName} /></div>
					</div>
				) : null}

				{recordType === "lab-tests" ? (
					<div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
						<div className="flex flex-col gap-2 sm:col-span-2"><Label htmlFor={`${generatedFormId}-test`} className={fieldLabelClassName}>Test<span className={optionalLabelClassName}>(required)</span></Label><Input id={`${generatedFormId}-test`} placeholder="e.g. Full Blood Count" className={fieldControlClassName} /></div>
						<div className="flex flex-col gap-2"><Label htmlFor={`${generatedFormId}-flag`} className={fieldLabelClassName}>Flag<span className={optionalLabelClassName}>(required)</span></Label><Select><SelectTrigger id={`${generatedFormId}-flag`} className="w-full data-[placeholder]:text-gray-400"><SelectValue placeholder="Select flag" /></SelectTrigger><SelectContent><SelectGroup><SelectItem value="normal">Normal</SelectItem><SelectItem value="high">High</SelectItem><SelectItem value="low">Low</SelectItem><SelectItem value="critical">Critical</SelectItem></SelectGroup></SelectContent></Select></div>
						<div className="flex flex-col gap-2"><Label htmlFor={`${generatedFormId}-lab-status`} className={fieldLabelClassName}>Status<span className={optionalLabelClassName}>(required)</span></Label><Select><SelectTrigger id={`${generatedFormId}-lab-status`} className="w-full data-[placeholder]:text-gray-400"><SelectValue placeholder="Select status" /></SelectTrigger><SelectContent><SelectGroup><SelectItem value="ordered">Ordered</SelectItem><SelectItem value="pending">Pending</SelectItem><SelectItem value="completed">Completed</SelectItem><SelectItem value="cancelled">Cancelled</SelectItem></SelectGroup></SelectContent></Select></div>
						<div className="flex flex-col gap-2"><Label htmlFor={`${generatedFormId}-reference-range`} className={fieldLabelClassName}>Reference range<span className={optionalLabelClassName}>(optional)</span></Label><Input id={`${generatedFormId}-reference-range`} placeholder="e.g. 4.0 - 11.0 x10^9/L" className={fieldControlClassName} /></div>
						<div className="flex flex-col gap-2"><Label htmlFor={`${generatedFormId}-lab-ordered-by`} className={fieldLabelClassName}>Ordered by<span className={optionalLabelClassName}>(required)</span></Label><Input id={`${generatedFormId}-lab-ordered-by`} placeholder="e.g. Dr. Adebayo Johnson" className={fieldControlClassName} /></div>
						<div className="flex flex-col gap-2"><Label className={fieldLabelClassName}>Date performed<span className={optionalLabelClassName}>(required)</span></Label><Popover><PopoverTrigger asChild><Button type="button" variant="outline" data-empty={!labPerformedAt} className={`${fieldControlClassName} flex w-full justify-between font-normal data-[empty=true]:text-gray-400 hover:bg-white active:scale-100`}>{labPerformedAt ? format(labPerformedAt, "PPP") : "Select performed date"}<RiCalendarLine className="size-4 text-gray-600" aria-hidden="true" /></Button></PopoverTrigger><PopoverContent className="p-0"><Calendar mode="single" selected={labPerformedAt} onSelect={setLabPerformedAt} autoFocus /></PopoverContent></Popover></div>
						<div className="flex flex-col gap-2"><Label htmlFor={`${generatedFormId}-specimen`} className={fieldLabelClassName}>Specimen<span className={optionalLabelClassName}>(required)</span></Label><Input id={`${generatedFormId}-specimen`} placeholder="e.g. Whole blood" className={fieldControlClassName} /></div>
						<div className="flex flex-col gap-2"><Label htmlFor={`${generatedFormId}-result`} className={fieldLabelClassName}>Result<span className={optionalLabelClassName}>(required)</span></Label><Input id={`${generatedFormId}-result`} placeholder="e.g. 14.8 x10^9/L" className={fieldControlClassName} /></div>
						<div className="flex flex-col gap-2 sm:col-span-2"><Label htmlFor={`${generatedFormId}-interpretation`} className={fieldLabelClassName}>Interpretation<span className={optionalLabelClassName}>(optional)</span></Label><Textarea id={`${generatedFormId}-interpretation`} placeholder="e.g. Elevated white blood cell count suggesting possible infection" className={textareaClassName} /></div>
						<div className="flex flex-col gap-2 sm:col-span-2"><Label htmlFor={`${generatedFormId}-lab-notes`} className={fieldLabelClassName}>Clinical notes<span className={optionalLabelClassName}>(optional)</span></Label><Textarea id={`${generatedFormId}-lab-notes`} placeholder="Add additional laboratory observations or recommendations" className={textareaClassName} /></div>
					</div>
				) : null}

				{recordType === "document" ? (
					<div className="flex flex-col gap-6">
						<div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
							<div className="flex flex-col gap-2"><Label htmlFor={`${generatedFormId}-document-title`} className={fieldLabelClassName}>Document title<span className={optionalLabelClassName}>(required)</span></Label><Input id={`${generatedFormId}-document-title`} placeholder="e.g. Complete Blood Count Report" className={fieldControlClassName} /></div>
							<div className="flex flex-col gap-2"><Label htmlFor={`${generatedFormId}-document-type`} className={fieldLabelClassName}>Document type<span className={optionalLabelClassName}>(required)</span></Label><Select><SelectTrigger id={`${generatedFormId}-document-type`} className="w-full data-[placeholder]:text-gray-400"><SelectValue placeholder="Select document type" /></SelectTrigger><SelectContent><SelectGroup>{documentTypes.map((documentType) => <SelectItem key={documentType} value={documentType}>{documentType}</SelectItem>)}</SelectGroup></SelectContent></Select></div>
							<div className="flex flex-col gap-2 sm:col-span-2"><Label htmlFor={`${generatedFormId}-document-notes`} className={fieldLabelClassName}>Clinical notes<span className={optionalLabelClassName}>(optional)</span></Label><Textarea id={`${generatedFormId}-document-notes`} placeholder="Add notes or context about this document" className="min-h-32 bg-white text-sm text-gray-700 placeholder:text-gray-400" /></div>
						</div>
						<div className="flex flex-col gap-3">
							<Label className={fieldLabelClassName}>Files<span className={optionalLabelClassName}>(optional)</span></Label>
							{selectedDocumentFiles.length > 0 ? (
								<CreateSelectedFiles files={selectedDocumentFiles} fileInputRef={documentFileInputRef} onFilesSelected={handleDocumentFilesSelected} onRemoveFile={handleRemoveDocumentFile} />
							) : (
								<ChooseFileCard onFilesSelected={handleDocumentFilesSelected} fileInputRef={documentFileInputRef} title="Choose one or more files or drag and drop them here." description="JPEG, PNG, and PDF, up to 50 MB." browseLabel="Browse files" accept="image/jpeg,image/png,application/pdf" inputId={`${generatedFormId}-files`} multiple />
							)}
						</div>
					</div>
				) : null}

				{showsRelatedRecords ? (
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
							<Button type="button" variant="outline" className="border-gray-200 bg-white text-sm text-gray-600" onClick={handleAddAttachmentRow}>
								<RiAddLine className="size-5" aria-hidden="true" />
								Add related record
							</Button>
						</div>
					</div>
				) : null}
			</form>

			<DrawerFooter className="border-t border-gray-200 px-6 py-5 text-sm">
				<div className="flex flex-col gap-2 lg:flex-row lg:self-end lg:gap-x-4">
					<DrawerClose asChild>
						<Button type="button" variant="outline" className="text-sm">Cancel</Button>
					</DrawerClose>
					<Button type="button" className="text-sm">{submitLabels[recordType]}</Button>
				</div>
			</DrawerFooter>
		</>
	);
}
