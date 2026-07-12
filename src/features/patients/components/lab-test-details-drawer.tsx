"use client";

import { CopyIdButton } from "@/components/copy-id-button";
import { StatusBadge } from "@/components/status-badge";
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
import type { LabTestDetailsHistoryEvent, LabTestType } from "@/features/patients/types";
import { cn } from "@/lib/utils/cn";
import docFileIcon from "@/assets/file-formats/doc.svg";
import jpgFileIcon from "@/assets/file-formats/jpg.svg";
import pdfFileIcon from "@/assets/file-formats/pdf.svg";
import pngFileIcon from "@/assets/file-formats/png.svg";
import {
	RiAddLine,
	RiArrowDownSLine,
	RiCalendarLine,
	RiCloseLine,
	RiEditLine,
} from "@remixicon/react";
import { format } from "date-fns";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import { useId, useRef, useState } from "react";
import { ChooseFileCard } from "@/components/choose-file-card";

type LabTestDetailsDrawerProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	labTest: LabTestType | null;
};

const fieldLabelClassName = "inline-flex items-baseline gap-0.5 text-sm font-medium text-gray-700";
const optionalLabelClassName = "font-normal text-gray-400";
const fieldControlClassName =
	"border-gray-200 bg-white text-gray-700 shadow-xs placeholder:text-gray-400 text-sm h-9";

export function LabTestDetailsDrawer({ open, onOpenChange, labTest }: LabTestDetailsDrawerProps) {
	const [labTestDetailsMode, setLabTestDetailsMode] = useState<"view" | "edit">("view");

	function handleLabTestDetailsOpenChange(nextOpen: boolean) {
		if (!nextOpen) {
			setLabTestDetailsMode("view");
		}

		onOpenChange(nextOpen);
	}

	const isEditingLabTestDetails = labTestDetailsMode === "edit" && Boolean(labTest);

	return (
		<Drawer open={open} onOpenChange={handleLabTestDetailsOpenChange} direction="right">
			<DrawerContent className="overflow-hidden rounded-3xl text-sm data-[vaul-drawer-direction=right]:top-4 data-[vaul-drawer-direction=right]:right-4 data-[vaul-drawer-direction=right]:bottom-4 data-[vaul-drawer-direction=right]:h-auto data-[vaul-drawer-direction=right]:w-[50rem]">
				<DrawerHeader className="flex-row items-center justify-between border-b border-gray-200 px-6 py-5 text-left">
					<DrawerTitle className="text-lg leading-[1.2] text-gray-800">
						{isEditingLabTestDetails ? "Edit lab test details" : "View details"}
					</DrawerTitle>
					<DrawerClose aria-label="Close lab test details drawer">
						<RiCloseLine className="size-6" aria-hidden="true" />
					</DrawerClose>
					<DrawerDescription className="sr-only">
						{isEditingLabTestDetails
							? "Edit the selected laboratory test details."
							: "Showing details for the laboratory test you selected."}
					</DrawerDescription>
				</DrawerHeader>

				<div className="min-h-0 overflow-y-auto px-6 py-8 text-sm">
					{isEditingLabTestDetails && labTest ? (
						<LabTestDetailsEditForm labTest={labTest} />
					) : labTest ? (
						<div className="flex flex-col gap-10">
							<LabTestDetailsOverview
								labTest={labTest}
								onEditLabTestDetails={() => setLabTestDetailsMode("edit")}
							/>
							<LabTestFilesSection files={labTest.files} />
							<LabTestHistorySection history={labTest.history} />
						</div>
					) : (
						<div className="rounded-2xl border border-gray-200 p-5 text-gray-500">
							Lab test details could not be found.
						</div>
					)}
				</div>

				<DrawerFooter className="border-t border-gray-200 px-6 py-5 text-sm">
					{isEditingLabTestDetails ? (
						<div className="flex flex-col gap-x-4 gap-y-2 lg:flex-row lg:self-end">
							<Button
								type="button"
								variant="outline"
								className="text-sm"
								onClick={() => setLabTestDetailsMode("view")}
							>
								Cancel
							</Button>
							<Button
								type="button"
								className="bg-gray-800 text-sm"
								onClick={() => setLabTestDetailsMode("view")}
							>
								Save changes
							</Button>
						</div>
					) : (
						<div className="flex flex-col gap-x-4 gap-y-2 lg:flex-row lg:self-end">
							<DrawerClose asChild>
								<Button type="button" variant="outline" className="text-sm">
									Cancel
								</Button>
							</DrawerClose>
							<Button type="button" className="bg-gray-800 text-sm">
								Archive Lab result
							</Button>
						</div>
					)}
				</DrawerFooter>
			</DrawerContent>
		</Drawer>
	);
}

function LabTestDetailsOverview({
	labTest,
	onEditLabTestDetails,
}: {
	labTest: LabTestType;
	onEditLabTestDetails: () => void;
}) {
	return (
		<div className="flex flex-col gap-10">
			<div className="flex flex-wrap items-center gap-x-8 gap-y-3 text-nowrap">
				<div className="flex items-center gap-2">
					<span className="text-gray-400">Lab ID</span>
					<CopyIdButton id={labTest.labId} className="text-sm" />
				</div>
			</div>

			<div className="flex flex-col gap-6">
				<div className="flex flex-wrap items-center justify-between gap-4">
					<div className="flex items-center gap-3">
						<h2 className="text-xl font-semibold text-gray-800">{labTest.test}</h2>
						<StatusBadge status={labTest.status} />
					</div>
					<button
						type="button"
						onClick={onEditLabTestDetails}
						className="inline-flex items-center gap-2 text-sm font-medium text-gray-400 transition hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-300"
					>
						<RiEditLine className="size-4" aria-hidden="true" />
						Edit
					</button>
				</div>

				<div className="grid grid-cols-1 gap-x-16 gap-y-6 sm:grid-cols-2">
					<LabTestDetailItem label="Flag" value={labTest.flag || labTest.interpretation} />
					<LabTestDetailItem label="Interpretation" value={labTest.interpretation} />
					<LabTestDetailItem label="Result" value={labTest.result} />
					<LabTestDetailItem label="Specimen" value={labTest.specimen} />
					<LabTestDetailItem label="Reference Range" value={labTest.referenceRange} />
					<LabTestDetailItem label="Ordered by" value={labTest.orderedBy} />
					<LabTestDetailItem label="Ordered at" value={labTest.orderedAtLabel} />
					<LabTestDetailItem label="Created at" value={labTest.createdAtLabel} />
					<LabTestDetailItem
						label="Created by"
						value={labTest.createdBy || labTest.createdAtLabel}
					/>
					<LabTestDetailItem label="Updated at" value={labTest.updatedAtLabel} />
				</div>
			</div>
		</div>
	);
}

function LabTestDetailItem({ label, value }: { label: string; value: string }) {
	return (
		<div className="flex flex-col gap-2">
			<span className="text-gray-400">{label}</span>
			{label === "Status" ? (
				<StatusBadge status={value || "Pending"} className="w-max" />
			) : (
				<span className="font-semibold text-gray-600">{value || "-"}</span>
			)}
		</div>
	);
}

function LabTestFilesSection({ files }: { files: LabTestType["files"] }) {
	const [areLabTestFilesExpanded, setAreLabTestFilesExpanded] = useState(false);
	const visibleFiles = areLabTestFilesExpanded ? files : files.slice(0, 3);

	if (files.length === 0) return null;

	return (
		<div className="flex flex-col gap-[14px]">
			<div className="flex w-full items-center justify-between">
				<p className="text-[18px] font-semibold text-gray-800">Files</p>
				{files.length > 3 ? (
					<button
						type="button"
						className="text-gray-400"
						onClick={() => setAreLabTestFilesExpanded((previousValue) => !previousValue)}
					>
						{areLabTestFilesExpanded ? "View less" : "View more"}
					</button>
				) : null}
			</div>
			<div className="flex flex-col gap-3">
				{visibleFiles.map((file) => (
					<div
						key={file.id}
						className="flex items-center gap-4 rounded-2xl border border-gray-200 p-4"
					>
						<Image
							src={getLabTestFileIcon(file.name, file.type)}
							alt=""
							className="size-9 shrink-0"
							aria-hidden="true"
						/>
						<div className="min-w-0 flex-1">
							<p className="truncate font-semibold text-gray-800">{file.name}</p>
							<p className="mt-1 truncate text-gray-400">
								{file.size} - Uploaded on {file.uploadedAtLabel}
							</p>
						</div>
						<div className="flex shrink-0 items-center gap-2">
							<Button variant="outline">Download</Button> <Button>Open</Button>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}

function getLabTestFileIcon(fileName: string, fileType: string) {
	const format = (fileType || fileName.split(".").pop() || "").toLowerCase();

	if (format.includes("pdf")) return pdfFileIcon;
	if (format.includes("png")) return pngFileIcon;
	if (format.includes("jpg") || format.includes("jpeg")) return jpgFileIcon;
	return docFileIcon;
}

function LabTestHistorySection({ history }: { history: LabTestDetailsHistoryEvent[] }) {
	return (
		<div className="flex flex-col gap-[14px]">
			<div className="flex items-center justify-between w-full">
				<p className="text-[18px] font-semibold">History</p>
				<button className="text-gray-400">View more</button>
			</div>
			{history.map((historyEvent) => (
				<LabTestHistoryCard key={historyEvent.id} historyEvent={historyEvent} />
			))}
		</div>
	);
}

function LabTestHistoryCard({ historyEvent }: { historyEvent: LabTestDetailsHistoryEvent }) {
	const [isLabTestHistoryExpanded, setIsLabTestHistoryExpanded] = useState(true);
	const shouldReduceMotion = useReducedMotion();
	const sectionId = useId();
	const titleId = `${sectionId}-title`;
	const panelId = `${sectionId}-panel`;

	return (
		<section className="flex flex-col rounded-2xl border border-gray-200 p-5">
			<button
				type="button"
				onClick={() => setIsLabTestHistoryExpanded((prev) => !prev)}
				aria-expanded={isLabTestHistoryExpanded}
				aria-controls={panelId}
				className="flex w-full items-center justify-between gap-4 text-left"
			>
				<p>
					<span id={titleId} className="font-semibold text-gray-800">
						{historyEvent.title}
					</span>{" "}
					<span className="text-sm text-gray-400">on {historyEvent.timestamp}</span>
				</p>
				<RiArrowDownSLine
					className={cn(
						"size-5 shrink-0 transition-transform duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none",
						isLabTestHistoryExpanded ? "rotate-180" : "",
					)}
					aria-hidden="true"
				/>
			</button>
			<AnimatePresence initial={false}>
				{isLabTestHistoryExpanded ? (
					<motion.div
						id={panelId}
						initial={shouldReduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
						animate={shouldReduceMotion ? { opacity: 1 } : { height: "auto", opacity: 1 }}
						exit={shouldReduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
						transition={
							shouldReduceMotion
								? { duration: 0.12 }
								: {
										height: { duration: 0.22, ease: [0.23, 1, 0.32, 1] },
										opacity: { duration: 0.16, ease: "easeOut" },
									}
						}
						className="overflow-hidden"
					>
						<div
							aria-labelledby={titleId}
							className="mt-6 grid grid-cols-1 gap-x-16 gap-y-5 sm:grid-cols-2"
						>
							{historyEvent.items.map((item) => (
								<LabTestDetailItem
									key={`${historyEvent.id}-${item.label}`}
									label={item.label}
									value={item.value}
								/>
							))}
						</div>
					</motion.div>
				) : null}
			</AnimatePresence>
		</section>
	);
}

function LabTestDetailsEditForm({ labTest }: { labTest: LabTestType }) {
	const generatedAttachmentRowId = useId();
	const nextAttachmentRowNumberRef = useRef(0);
	const [orderedAt, setOrderedAt] = useState<Date | undefined>();
	const [labTestAttachmentRows, setLabTestAttachmentRows] = useState<AttachmentFormRow[]>([]);
	const selectedStatusValue = labTest.status.toLowerCase();
	const selectedFlagValue = getLabTestSelectValue(labTest.flag || labTest.interpretation);
	const orderedAtDisplayValue = orderedAt
		? format(orderedAt, "PPP")
		: labTest.orderedAtLabel !== "-"
			? labTest.orderedAtLabel
			: "Select date";

	const labTestFileInputRef = useRef<HTMLInputElement>(null);
	const [editableLabTestFiles, setEditableLabTestFiles] = useState(labTest.files ?? []);
	const [pendingLabTestFileRemovalId, setPendingLabTestFileRemovalId] = useState<string | null>(
		null,
	);
	const shouldReduceMotion = useReducedMotion();

	const hasLabTestFiles = editableLabTestFiles.length > 0;

	function handleRemoveLabTestFile(fileId: string) {
		setEditableLabTestFiles((previousFiles) =>
			previousFiles.filter((previousFile) => previousFile.id !== fileId),
		);
		setPendingLabTestFileRemovalId(null);
	}
	function handleLabTestFilesChange(event: React.ChangeEvent<HTMLInputElement>) {
		const selectedFiles = Array.from(event.target.files ?? []);

		const nextFiles = selectedFiles.map((file) => ({
			id: crypto.randomUUID(),
			name: file.name,
			url: URL.createObjectURL(file),
			type: file.type,
			size: `${Math.round(file.size / 1024)}KB`,
			uploadedAtLabel: "Uploaded just now",
		}));

		setEditableLabTestFiles((previousFiles) => [...previousFiles, ...nextFiles]);

		event.target.value = "";
	}
	function handleAddLabTestAttachmentRow() {
		nextAttachmentRowNumberRef.current += 1;

		setLabTestAttachmentRows((prev) => [
			...prev,
			{
				id: `${generatedAttachmentRowId}-attachment-${nextAttachmentRowNumberRef.current}`,
				name: "",
				recordId: "",
			},
		]);
	}

	function handleRemoveLabTestAttachmentRow(attachmentRowId: string) {
		setLabTestAttachmentRows((prev) =>
			prev.filter((attachmentRow) => attachmentRow.id !== attachmentRowId),
		);
	}

	return (
		<form className="flex flex-col gap-12">
			<div className="flex flex-wrap items-center gap-x-8 gap-y-3 text-nowrap">
				<div className="flex items-center gap-2">
					<span className="text-gray-400">Lab ID:</span>
					<CopyIdButton id={labTest.labId} className="text-sm" />
				</div>
				{labTest.encounterId ? (
					<div className="flex items-center gap-2">
						<span className="text-gray-400">Encounter ID:</span>
						<CopyIdButton id={labTest.encounterId} className="text-sm" />
					</div>
				) : null}
			</div>

			<div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2">
				<div className="flex flex-col gap-2 sm:col-span-2">
					<Label htmlFor="edit-lab-test-name" className={fieldLabelClassName}>
						Test<span className={optionalLabelClassName}>(required)</span>
					</Label>
					<Input
						id="edit-lab-test-name"
						name="testName"
						defaultValue={labTest.testName || labTest.test}
						className={fieldControlClassName}
					/>
				</div>

				<div className="flex flex-col gap-2">
					<Label htmlFor="edit-lab-test-flag" className={fieldLabelClassName}>
						Flag<span className={optionalLabelClassName}>(required)</span>
					</Label>
					<Select defaultValue={selectedFlagValue}>
						<SelectTrigger id="edit-lab-test-flag" className={`${fieldControlClassName} w-full`}>
							<SelectValue placeholder="Select flag" />
						</SelectTrigger>
						<SelectContent className="rounded-xl border-gray-200 p-1 text-sm text-gray-700 shadow-xl">
							<LabTestFlagOptions />
						</SelectContent>
					</Select>
				</div>

				<div className="flex flex-col gap-2">
					<Label htmlFor="edit-lab-test-status" className={fieldLabelClassName}>
						Status<span className={optionalLabelClassName}>(required)</span>
					</Label>
					<Select defaultValue={selectedStatusValue}>
						<SelectTrigger id="edit-lab-test-status" className={`${fieldControlClassName} w-full`}>
							<SelectValue placeholder="Select status" />
						</SelectTrigger>
						<SelectContent className="rounded-xl border-gray-200 p-1 text-sm text-gray-700 shadow-xl">
							<LabTestStatusOptions />
						</SelectContent>
					</Select>
				</div>

				<div className="flex flex-col gap-2">
					<Label htmlFor="edit-lab-test-reference-range" className={fieldLabelClassName}>
						Reference Range<span className={optionalLabelClassName}>(required)</span>
					</Label>
					<Input
						id="edit-lab-test-reference-range"
						name="referenceRange"
						defaultValue={labTest.referenceRange === "-" ? "" : labTest.referenceRange}
						className={fieldControlClassName}
					/>
				</div>

				<div className="flex flex-col gap-2">
					<Label htmlFor="edit-lab-test-ordered-by" className={fieldLabelClassName}>
						Ordered by<span className={optionalLabelClassName}>(required)</span>
					</Label>
					<Input
						id="edit-lab-test-ordered-by"
						name="orderedBy"
						defaultValue={labTest.orderedBy}
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
								type="button"
								variant="outline"
								data-empty={!orderedAt && labTest.orderedAtLabel === "-"}
								className={`${fieldControlClassName} flex w-full items-center justify-between gap-3 font-normal data-[empty=true]:text-gray-400 hover:bg-white active:scale-100`}
							>
								<span className="min-w-0 truncate">{orderedAtDisplayValue}</span>
								<RiCalendarLine className="size-4 shrink-0 text-gray-600" aria-hidden="true" />
							</Button>
						</PopoverTrigger>
						<PopoverContent className="p-0">
							<Calendar mode="single" selected={orderedAt} onSelect={setOrderedAt} autoFocus />
						</PopoverContent>
					</Popover>
				</div>

				<div className="flex flex-col gap-2">
					<Label htmlFor="edit-lab-test-specimen" className={fieldLabelClassName}>
						Specimen<span className={optionalLabelClassName}>(required)</span>
					</Label>
					<Input
						id="edit-lab-test-specimen"
						name="specimen"
						defaultValue={labTest.specimen}
						placeholder="e.g. Whole blood"
						className={fieldControlClassName}
					/>
				</div>

				<div className="flex flex-col gap-2 sm:col-span-2">
					<Label htmlFor="edit-lab-test-result" className={fieldLabelClassName}>
						Result<span className={optionalLabelClassName}>(required)</span>
					</Label>
					<Input
						id="edit-lab-test-result"
						name="result"
						defaultValue={labTest.result}
						placeholder="e.g. 14.8 x10^9/L"
						className={fieldControlClassName}
					/>
				</div>

				<div className="flex flex-col gap-2 sm:col-span-2">
					<Label htmlFor="edit-lab-test-interpretation" className={fieldLabelClassName}>
						Interpretation<span className={optionalLabelClassName}>(required)</span>
					</Label>
					<Textarea
						id="edit-lab-test-interpretation"
						name="interpretation"
						defaultValue={labTest.interpretation === "-" ? "" : labTest.interpretation}
						placeholder="e.g. Elevated white blood cell count suggesting possible infection"
						className="min-h-20 border-gray-200 bg-white text-sm text-gray-700 shadow-xs placeholder:text-gray-400"
					/>
				</div>

				<div className="flex flex-col gap-2 sm:col-span-2">
					<Label htmlFor="edit-lab-test-clinical-notes" className={fieldLabelClassName}>
						Clinical notes<span className={optionalLabelClassName}>(optional)</span>
					</Label>
					<Textarea
						id="edit-lab-test-clinical-notes"
						name="clinicalNote"
						defaultValue={labTest.clinicalNote}
						placeholder="Add additional laboratory observations or recommendations"
						className="min-h-28 border-gray-200 bg-white text-sm text-gray-700 shadow-xs placeholder:text-gray-400"
					/>
				</div>
			</div>
			<div className="space-y-3 sm:col-span-2">
				<Label className={fieldLabelClassName}>
					Files <span className="text-gray-400">(required)</span>
				</Label>
				{hasLabTestFiles ? (
					<>
						<div className="space-y-3">
							{editableLabTestFiles.map((file) => (
								<div
									key={file.id}
									className={cn(
										"rounded-2xl border p-4",
										pendingLabTestFileRemovalId === file.id ? "border-red-500" : "border-gray-200",
									)}
								>
									<div className="flex items-center gap-4">
									<Image
										src={getLabTestFileIcon(file.name, file.type)}
										alt=""
										width={44}
										height={44}
										className={`size-11 shrink-0 transition-opacity duration-200 ${pendingLabTestFileRemovalId === file.id ? "opacity-40" : "opacity-100"}`}
										aria-hidden="true"
									/>

									<div
										className={`min-w-0 flex-1 transition-opacity duration-200 ${pendingLabTestFileRemovalId === file.id ? "opacity-40" : "opacity-100"}`}
									>
										<p className="truncate font-semibold text-gray-800">{file.name}</p>

										<p className="text-gray-400">
											{file.size} · Uploaded on {file.uploadedAtLabel}
										</p>
									</div>

									{pendingLabTestFileRemovalId !== file.id ? (
										<div className="flex shrink-0 items-center gap-2">
											<Button
												type="button"
												variant="outline"
												onClick={() => setPendingLabTestFileRemovalId(file.id)}
											>
												Remove
											</Button>
											<Button asChild type="button">
												<a href={file.url} target="_blank" rel="noreferrer">
													Open
												</a>
											</Button>
										</div>
									) : null}
									</div>
									<AnimatePresence initial={false}>
										{pendingLabTestFileRemovalId === file.id ? (
											<motion.div
												initial={shouldReduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
												animate={shouldReduceMotion ? { opacity: 1 } : { height: "auto", opacity: 1 }}
												exit={shouldReduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
												transition={
													shouldReduceMotion
														? { duration: 0.12 }
														: {
																height: { duration: 0.22, ease: [0.23, 1, 0.32, 1] },
																opacity: { duration: 0.16, ease: "easeOut" },
															}
													}
												className="overflow-hidden"
											>
												<div className="mt-6 flex flex-wrap items-center justify-between gap-4">
													<p className="max-w-md text-sm font-medium text-gray-700">
														Remove {file.name} from this lab test?
													</p>
													<div className="ml-auto flex shrink-0 items-center gap-3">
														<Button type="button" variant="outline" onClick={() => setPendingLabTestFileRemovalId(null)}>
															Cancel
														</Button>
														<Button
															type="button"
															className="bg-red-500 hover:bg-red-600 focus-visible:ring-red-300"
															onClick={() => handleRemoveLabTestFile(file.id)}
														>
															Remove file
														</Button>
													</div>
												</div>
											</motion.div>
										) : null}
									</AnimatePresence>
								</div>
							))}
						</div>

						<input
							ref={labTestFileInputRef}
							type="file"
							multiple
							accept="image/jpeg,image/png,application/pdf"
							className="sr-only"
							onChange={handleLabTestFilesChange}
						/>

						<Button
							type="button"
							variant="outline"
							onClick={() => labTestFileInputRef.current?.click()}
						>
							<RiAddLine className="size-5" aria-hidden="true" />
							Add files
						</Button>
					</>
				) : (
					<ChooseFileCard
						onFilesSelected={handleLabTestFilesChange}
						fileInputRef={labTestFileInputRef}
						title="Choose one or more files or drag and drop them here."
						description="JPEG, PNG, and PDF, up to 50 MB."
						browseLabel="Browse files"
						accept="image/jpeg,image/png,application/pdf"
						inputId="lab-test-files"
						multiple
					/>
				)}
			</div>
			<div className="flex flex-col gap-6">
				{labTestAttachmentRows.map((attachmentRow, attachmentIndex) => (
					<AttachmentFormFields
						key={attachmentRow.id}
						attachmentRow={attachmentRow}
						attachmentIndex={attachmentIndex}
						fieldLabelClassName={fieldLabelClassName}
						requiredLabelClassName={optionalLabelClassName}
						fieldControlClassName={fieldControlClassName}
						onRemoveAttachmentRow={handleRemoveLabTestAttachmentRow}
					/>
				))}

				<div>
					<Button
						type="button"
						variant="outline"
						className="border-gray-200 bg-white text-sm text-gray-600 shadow-xs"
						onClick={handleAddLabTestAttachmentRow}
					>
						<RiAddLine className="size-5" aria-hidden="true" />
						Add related record
					</Button>
				</div>
			</div>
		</form>
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

function getLabTestSelectValue(value: string) {
	return value.trim().toLowerCase().replace(/\s+/g, "-") || undefined;
}
