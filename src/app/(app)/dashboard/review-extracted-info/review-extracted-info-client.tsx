"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useState, useTransition } from "react";
import sectionSeparator from "@/assets/review/section-separator.svg";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, isMatch, parseISO } from "date-fns";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import type { PatientRecord } from "@/features/patients/schemas/patient-schema";
import { savePatientsAction } from "@/features/patients/server/save-patients-action";
import { formatPatientLabel } from "@/features/patients/utils/format-patient-label";
import { cn } from "@/lib/utils/cn";
import { getDocumentFileIcon } from "@/lib/utils/document-file-icon";
import {
	RiArrowDownSLine,
	RiCalendarLine,
	RiCheckboxCircleFill,
	RiCheckboxCircleLine,
	RiDownloadLine,
	RiErrorWarningFill,
	RiExternalLinkLine,
	RiLoader2Fill,
} from "@remixicon/react";

export type ReviewDocument = {
	id: string;
	label: string;
	fileUrl: string;
	status: "saved" | "ready" | "extracting" | "failed";
	patient: PatientRecord | null;
};

type ReviewSection = {
	[Section in keyof PatientRecord]: {
		key: Section;
		title: string;
		fields: {
			key: keyof PatientRecord[Section];
			label: string;
			type?: string;
			options?: string[];
		}[];
	};
}[keyof PatientRecord];

const reviewSections: ReviewSection[] = [
	{
		key: "personalInfo",
		title: "Personal Information",
		fields: [
			{ key: "firstName", label: "First name" },
			{ key: "middleName", label: "Middle name" },
			{ key: "lastName", label: "Last name" },
			{ key: "patientId", label: "Patient ID" },
			{ key: "dateOfBirth", label: "Date of birth", type: "date" },
			{ key: "sex", label: "Sex", options: ["Female", "Male", "Other"] },
			{ key: "age", label: "Age", type: "number" },
			{
				key: "maritalStatus",
				label: "Marital status",
				options: ["Single", "Married", "Divorced", "Widowed", "Separated"],
			},
			{ key: "nationalId", label: "National ID" },
		],
	},
	{
		key: "contactInfo",
		title: "Contact Information",
		fields: [
			{ key: "phoneNumber", label: "Phone number", type: "tel" },
			{ key: "emailAddress", label: "Email address", type: "email" },
			{ key: "residentialAddress", label: "Residential address" },
			{ key: "stateOfOrigin", label: "State of origin" },
			{ key: "countryOfOrigin", label: "Country of origin" },
		],
	},
	{
		key: "emergencyInfo",
		title: "Emergency Contact",
		fields: [
			{ key: "firstName", label: "First name" },
			{ key: "middleName", label: "Middle name" },
			{ key: "lastName", label: "Last name" },
			{ key: "relationship", label: "Relationship" },
			{ key: "phone", label: "Phone number", type: "tel" },
		],
	},
	{
		key: "physicalInfo",
		title: "Physical Information",
		fields: [
			{ key: "height", label: "Height" },
			{ key: "weight", label: "Weight" },
			{ key: "bloodGroup", label: "Blood group" },
			{ key: "genotype", label: "Genotype" },
		],
	},
];

const documentStatuses = {
	saved: {
		label: "Saved",
		icon: <RiCheckboxCircleFill className="size-4 text-green-500" aria-hidden="true" />,
	},
	ready: {
		label: "Ready to review",
		icon: <RiCheckboxCircleLine className="size-4 text-gray-500" aria-hidden="true" />,
	},
	extracting: {
		label: "Extracting…",
		icon: (
			<RiLoader2Fill
				className="size-4 animate-spin text-blue-500 motion-reduce:animate-none"
				aria-hidden="true"
			/>
		),
	},
	failed: {
		label: "Extraction failed",
		icon: <RiErrorWarningFill className="size-4" aria-hidden="true" />,
	},
};

type ReviewExtractedInfoClientProps = {
	initialDocuments: ReviewDocument[];
};

export function ReviewExtractedInfoClient({ initialDocuments }: ReviewExtractedInfoClientProps) {
	const router = useRouter();
	const [documents, setDocuments] = useState(initialDocuments);
	const [selectedDocumentId, setSelectedDocumentId] = useState(initialDocuments[0]?.id ?? "");
	const [collapsedSections, setCollapsedSections] = useState<
		Partial<Record<keyof PatientRecord, boolean>>
	>({});
	const [saveError, setSaveError] = useState("");
	const [birthDateError, setBirthDateError] = useState("");
	const [reviewAnnouncement, setReviewAnnouncement] = useState("");
	const [isPending, startTransition] = useTransition();
	const formId = useId();
	const selectedDocument = documents.find((document) => document.id === selectedDocumentId);
	const selectedPatient = selectedDocument?.patient;
	const isSaved = selectedDocument?.status === "saved";
	const isExtracting = selectedDocument?.status === "extracting";
	const isWordDocument = selectedDocument?.id.endsWith(".docx");
	const canSave = selectedDocument?.status === "ready" && !isPending;
	const birthDate = selectedPatient?.personalInfo.dateOfBirth;
	const parsedBirthDate =
		birthDate && isMatch(birthDate, "yyyy-MM-dd") ? parseISO(birthDate) : undefined;

	function changeField(section: keyof PatientRecord, field: string, value: string) {
		if (isSaved || isPending) return;
		if (field === "dateOfBirth") setBirthDateError("");
		const fieldValue = field === "age" && value !== "" ? Number(value) : value || null;

		setDocuments((prev) =>
			prev.map((document) => {
				if (document.id !== selectedDocumentId || !document.patient) {
					return document;
				}

				const updatedSection = {
					...document.patient[section],
					[field]: fieldValue,
				};

				const updatedPatient = {
					...document.patient,
					[section]: updatedSection,
				};

				return { ...document, patient: updatedPatient };
			}),
		);
	}

	function selectDocument(documentId: string) {
		if (isPending) return;
		setSelectedDocumentId(documentId);
		setSaveError("");
		setBirthDateError("");
	}

	function removeDocument(removedDocument: ReviewDocument) {
		if (isPending || removedDocument.status === "saved") return;
		const remainingDocuments = documents.filter((document) => document.id !== removedDocument.id);
		if (remainingDocuments.length === 0) {
			router.replace("/dashboard/add-new-patient");
			return;
		}
		setDocuments(remainingDocuments);
		if (removedDocument.id === selectedDocumentId) {
			selectDocument(
				(
					remainingDocuments.find((document) => document.status === "ready") ??
					remainingDocuments[0]
				).id,
			);
		}
		setReviewAnnouncement(`${removedDocument.label} removed.`);
	}

	function saveSelectedDocument() {
		if (!canSave || !selectedDocument || !selectedPatient) return;
		if (!parsedBirthDate) {
			setBirthDateError(
				birthDate?.trim() ? "Choose a valid date of birth." : "Date of birth is required.",
			);
			setCollapsedSections((prev) => ({ ...prev, personalInfo: false }));
			return;
		}
		setSaveError("");
		startTransition(async () => {
			const result = await savePatientsAction([selectedPatient]);

			if (result.status === "failed") {
				setSaveError(result.error);
				return;
			}

			setDocuments((prev) =>
				prev.map((document) =>
					document.id === selectedDocument.id ? { ...document, status: "saved" } : document,
				),
			);
			const nextDocument = documents.find(
				(document) => document.id !== selectedDocument.id && document.status === "ready",
			);
			if (nextDocument) setSelectedDocumentId(nextDocument.id);
			setReviewAnnouncement(`${formatPatientLabel(selectedPatient.personalInfo)} saved.`);
		});
	}

	return (
		<main className="min-h-dvh px-6 pt-20 pb-40 text-gray-800">
			<header className="flex flex-col items-center gap-3 text-center">
				<h1 className="text-lg leading-[1.2] font-semibold tracking-[-0.015em]">
					Review Patient Information
				</h1>
				<p className="text-sm leading-[1.2] font-normal tracking-[-0.02em] text-gray-600">
					Check the extracted details before saving patient records.
				</p>
			</header>
			<p className="sr-only" role="status" aria-live="polite">
				{reviewAnnouncement}
			</p>
			<div className="relative mx-auto mt-12 grid w-full max-w-[31.25rem] gap-10 lg:mt-16 lg:max-w-[56.125rem] lg:grid-cols-[31.25rem_21.875rem] lg:gap-12 2xl:max-w-[31.25rem] 2xl:grid-cols-1">
				<div className="min-w-0">
					{selectedDocument && selectedPatient ? (
						<>
							<div className="mb-8 flex items-end justify-between gap-2.5">
								<div className="flex min-w-0 flex-col gap-2">
									<h2 className="text-base leading-[1.2] font-semibold tracking-[-0.015em]">
										{formatPatientLabel(selectedPatient.personalInfo)}
									</h2>
									<p className="truncate text-sm leading-[1.2] text-gray-600">
										{selectedDocument.label}
									</p>
								</div>
								<Button variant="outline" className="rounded-lg" asChild>
									<a href={selectedDocument.fileUrl} target="_blank" rel="noopener noreferrer">
										{isWordDocument ? (
											<>
												Download document
												<RiDownloadLine aria-hidden="true" />
											</>
										) : (
											<>
												View document
												<RiExternalLinkLine aria-hidden="true" />
											</>
										)}
									</a>
								</Button>
							</div>
							<form
								id={formId}
								onSubmit={(event) => {
									event.preventDefault();
									saveSelectedDocument();
								}}
								className="flex flex-col gap-6"
							>
								{reviewSections.map((section) => {
									const sectionId = `${formId}-${section.key}`;
									const isRequired = section.key !== "physicalInfo";
									const isSectionCollapsed = Boolean(collapsedSections[section.key]);
									const sectionValues: Record<string, string | number | null> =
										selectedPatient[section.key];
									return (
										<section key={section.key} aria-labelledby={`${sectionId}-heading`}>
											<h3 id={`${sectionId}-heading`}>
												<Button
													type="button"
													variant="ghost"
													className="h-8 w-full justify-between border-0 px-0 font-semibold hover:bg-transparent active:scale-100"
													aria-expanded={!isSectionCollapsed}
													aria-controls={sectionId}
													onClick={() =>
														setCollapsedSections((prev) => ({
															...prev,
															[section.key]: !prev[section.key],
														}))
													}
												>
													<span className="flex min-w-0 items-center gap-2 text-base tracking-[-0.02em]">
														{section.title}{" "}
														<Image
															src={sectionSeparator}
															alt=""
															width={4}
															height={4}
															className="shrink-0"
														/>{" "}
														<span className="text-xs font-normal text-gray-400 sm:text-base">
															{section.fields.length} fields
														</span>
													</span>
													<RiArrowDownSLine
														className={cn(
															"shrink-0 transition-transform duration-200 ease-[cubic-bezier(0.25,1,0.5,1)] motion-reduce:transition-none",
															!isSectionCollapsed && "rotate-180",
														)}
														aria-hidden="true"
													/>
												</Button>
											</h3>
											<div
												id={sectionId}
												aria-hidden={isSectionCollapsed}
												inert={isSectionCollapsed}
												className={cn(
													"grid transition-[grid-template-rows] duration-200 ease-[cubic-bezier(0.25,1,0.5,1)] motion-reduce:transition-none",
													isSectionCollapsed ? "grid-rows-[0fr]" : "grid-rows-[1fr]",
												)}
											>
												<div className="min-h-0 overflow-hidden">
													<div className="grid grid-cols-1 gap-4 pt-2.5 sm:grid-cols-2">
														{section.fields.map((field) => {
															const fieldId = `${sectionId}-${field.key}`;
															const value = sectionValues[field.key] ?? "";
															return (
																<div key={field.key} className="flex min-w-0 flex-col gap-3.5">
																	<Label
																		id={`${fieldId}-label`}
																		htmlFor={fieldId}
																		className="flex-wrap gap-1 text-sm leading-[1.2] text-gray-600"
																	>
																		{field.label}
																		{isRequired && (
																			<>
																				{" "}
																				<span className="font-normal text-gray-400">
																					(required)
																				</span>
																			</>
																		)}
																	</Label>
																	{field.type === "date" ? (
																		<>
																			<Popover>
																				<PopoverTrigger asChild>
																					<Button
																						type="button"
																						variant="outline"
																						id={fieldId}
																						aria-labelledby={`${fieldId}-label`}
																						disabled={isSaved || isPending}
																						aria-invalid={Boolean(birthDateError)}
																						aria-describedby={
																							birthDateError ? `${fieldId}-error` : undefined
																						}
																						className="w-full justify-between rounded-lg px-4 font-normal text-gray-600 hover:bg-white disabled:opacity-100 active:scale-100"
																					>
																						{parsedBirthDate
																							? format(parsedBirthDate, "PPP")
																							: value || "Select date"}
																						<RiCalendarLine aria-hidden="true" />
																					</Button>
																				</PopoverTrigger>
																				<PopoverContent
																					align="start"
																					collisionPadding={16}
																					className="w-auto overflow-hidden rounded-xl p-0"
																				>
																					<Calendar
																						mode="single"
																						required
																						selected={parsedBirthDate}
																						defaultMonth={parsedBirthDate}
																						disabled={{ after: new Date() }}
																						className="[--cell-size:2.25rem] sm:[--cell-size:2.5rem]"
																						onSelect={(date) => {
																							changeField(
																								section.key,
																								field.key,
																								format(date, "yyyy-MM-dd"),
																							);
																						}}
																						autoFocus
																					/>
																				</PopoverContent>
																			</Popover>
																			{birthDateError && (
																				<p
																					id={`${fieldId}-error`}
																					role="alert"
																					className="text-sm text-red-700"
																				>
																					{birthDateError}
																				</p>
																			)}
																		</>
																	) : field.options ? (
																		<Select
																			value={String(value).toLowerCase()}
																			required={isRequired}
																			disabled={isSaved || isPending}
																			onValueChange={(selectedValue) =>
																				changeField(section.key, field.key, selectedValue)
																			}
																		>
																			<SelectTrigger
																				id={fieldId}
																				className="w-full rounded-lg px-4 text-gray-600 disabled:opacity-100"
																			>
																				<SelectValue placeholder="Select" />
																			</SelectTrigger>
																			<SelectContent>
																				<SelectGroup>
																					{field.options.map((option) => (
																						<SelectItem key={option} value={option.toLowerCase()}>
																							{option}
																						</SelectItem>
																					))}
																				</SelectGroup>
																			</SelectContent>
																		</Select>
																	) : (
																		<Input
																			id={fieldId}
																			type={field.type ?? "text"}
																			value={value}
																			readOnly={isSaved || isPending}
																			required={isRequired}
																			min={field.type === "number" ? 0 : undefined}
																			className="rounded-lg px-4 text-gray-600"
																			onChange={(event) =>
																				changeField(section.key, field.key, event.target.value)
																			}
																		/>
																	)}
																</div>
															);
														})}
													</div>
												</div>
											</div>
										</section>
									);
								})}
							</form>
						</>
					) : (
						<div className="flex min-h-60 flex-col items-center justify-center gap-3 text-center">
							{isExtracting ? (
								<RiLoader2Fill
									className="size-5 animate-spin text-blue-500 motion-reduce:animate-none"
									aria-hidden="true"
								/>
							) : (
								<RiErrorWarningFill className="size-5 text-red-700" aria-hidden="true" />
							)}
							<h2 className="text-base font-semibold">
								{isExtracting
									? "Extracting patient information…"
									: "We couldn’t extract this record"}
							</h2>
							<p className="text-sm text-gray-600">
								{isExtracting
									? "You can review another document while this one is processing."
									: "Remove the document from the list and upload it again."}
							</p>
							{selectedDocument?.status === "failed" && (
								<Button variant="outline" className="rounded-lg" asChild>
									<a href={selectedDocument.fileUrl} target="_blank" rel="noopener noreferrer">
										{isWordDocument ? (
											<>
												Download document
												<RiDownloadLine aria-hidden="true" />
											</>
										) : (
											<>
												View document
												<RiExternalLinkLine aria-hidden="true" />
											</>
										)}
									</a>
								</Button>
							)}
						</div>
					)}
				</div>
				<aside
					aria-labelledby={`${formId}-documents`}
					className="order-first min-w-0 lg:order-last 2xl:absolute 2xl:inset-y-0 2xl:left-[calc(100%+3rem)] 2xl:w-[21.875rem]"
				>
					<div className="lg:sticky lg:top-6">
						<h2
							id={`${formId}-documents`}
							className="mb-4 text-base leading-[1.2] font-semibold tracking-[-0.015em]"
						>
							Documents
						</h2>
						<div className="flex flex-col gap-4">
							{documents.map((document) => (
								<article
									key={document.id}
									aria-label={document.label}
									className={cn(
										"relative flex flex-col gap-3.5 rounded-xl border border-gray-200 p-3",
										selectedDocumentId === document.id && "border-gray-800",
									)}
								>
									<Button
										type="button"
										variant="ghost"
										aria-label={`Review ${document.label}`}
										aria-pressed={selectedDocumentId === document.id}
										disabled={isPending}
										onClick={() => selectDocument(document.id)}
										className="absolute inset-0 h-full w-full rounded-xl border-0 hover:bg-transparent active:scale-100"
									/>
									<div className="pointer-events-none relative flex min-w-0 items-center gap-1">
										<Image
											src={getDocumentFileIcon(document.id, "")}
											alt=""
											width={16}
											height={16}
											className="size-4 shrink-0"
										/>
										<p className="min-w-0 flex-1 truncate text-sm leading-[1.2] text-gray-600">
											{document.label}
										</p>
										<span
											className={cn(
												"flex shrink-0 items-center gap-1 text-xs leading-[1.2] text-gray-600",
												document.status === "failed" && "text-red-700",
											)}
										>
											{documentStatuses[document.status].icon}
											{documentStatuses[document.status].label}
										</span>
									</div>
									{document.patient ? (
										<div className="pointer-events-none relative flex min-w-0 items-center justify-between gap-2">
											<p className="truncate text-sm leading-[1.2] text-gray-600">
												{formatPatientLabel(document.patient.personalInfo)}
											</p>
											{document.status === "ready" && (
												<Button
													type="button"
													disabled={isPending}
													variant="ghost"
													className="pointer-events-auto h-6 px-2 py-0 text-xs text-red-700 hover:bg-red-50 hover:text-red-700"
													aria-label={`Remove ${document.label}`}
													onClick={() => removeDocument(document)}
												>
													Remove
												</Button>
											)}
										</div>
									) : document.status === "extracting" ? (
										<p className="pointer-events-none relative text-sm leading-[1.2] text-gray-400">
											This usually takes a few seconds
										</p>
									) : (
										<div className="relative flex items-center self-start">
											<Button
												type="button"
												disabled={isPending}
												variant="ghost"
												className="h-6 px-2 py-0 text-xs text-red-700 hover:bg-red-50 hover:text-red-700"
												aria-label={`Remove ${document.label}`}
												onClick={() => removeDocument(document)}
											>
												Remove
											</Button>
										</div>
									)}
								</article>
							))}
						</div>
					</div>
				</aside>
			</div>
			<footer className="fixed inset-x-0 bottom-0 z-50 border-t border-gray-100 bg-white px-6 py-4">
				<div className="mx-auto flex w-full max-w-[31.25rem] flex-wrap items-center justify-between gap-3">
					{saveError && (
						<p role="alert" className="w-full text-sm font-medium text-pretty text-red-600">
							{saveError}
						</p>
					)}
					<Button variant="outline" className="rounded-lg max-sm:w-full" asChild>
						<Link href="/dashboard/overview">Continue to dashboard</Link>
					</Button>
					<Button
						type="submit"
						form={formId}
						disabled={!canSave}
						aria-busy={isPending}
						className="rounded-lg bg-[#222530] bg-[url('/assets/review-save-button.png')] bg-cover bg-center hover:bg-[#222530]/90 max-sm:w-full"
					>
						{isPending ? "Saving…" : "Save patient & review next"}
					</Button>
				</div>
			</footer>
		</main>
	);
}
