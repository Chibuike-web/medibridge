"use client";

import { PatientRecord, PatientType } from "@/features/patients/schemas/patient-schema";
import { savePatientRecordsAction } from "@/features/patients/server/actions";
import { SuccessModal } from "@/components/success-modal";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
	DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { formatKey } from "@/lib/utils/format-key";
import { useExtractedPatient } from "@/features/patients/store/use-extracted-patient-store";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { formatPatientLabel } from "../../../../features/patients/utils/format-patient-label";
import { cn } from "@/lib/utils/cn";
import { RiArrowRightSLine, RiCloseLine, RiEditLine } from "@remixicon/react";

const EXTRACTED_PATIENT_DATA_KEY = "extracted-patient-data";

type SectionData = Record<string, string | number | null>;

type EditableInfoSectionProps = {
	title: string;
	sectionKey: keyof PatientRecord;
	info: SectionData;
	index: number;
	records: PatientType;
};

export function ReviewExtractedInfoClient() {
	const { patientData, setPatientData } = useExtractedPatient();
	const router = useRouter();
	const [isOpen, setIsOpen] = useState(false);
	const [saveError, setSaveError] = useState("");
	const [isPending, startTransition] = useTransition();

	const closeModal = () => {
		router.replace("/dashboard");
		setIsOpen(false);
	};

	const handleSave = () => {
		if (!patientData || patientData.length === 0 || isPending) return;

		setSaveError("");
		startTransition(async () => {
			const result = await savePatientRecordsAction(patientData);

			if (result.status === "failed") {
				setSaveError(result.error);
				return;
			}

			setPatientData([]);
			localStorage.removeItem(EXTRACTED_PATIENT_DATA_KEY);
			setIsOpen(true);
		});
	};

	if (patientData === null) {
		return (
			<main className="mx-auto my-10 grid min-h-dvh max-w-[37.5rem] place-items-center">
				<div className="w-full px-4 md:px-0">
					<div className="mx-auto h-9 w-72 animate-pulse rounded-md bg-gray-200" />
					<div className="mt-4 mx-auto h-5 w-full max-w-md animate-pulse rounded-md bg-gray-100" />
					<div className="mt-10 flex flex-col gap-4">
						{Array.from({ length: 5 }).map((_, i) => (
							<div
								key={i}
								className="h-[3.5rem] w-full animate-pulse rounded-xl border border-gray-200 bg-white"
							/>
						))}
					</div>
					<div className="mt-8 h-11 w-full animate-pulse rounded-md bg-gray-200" />
				</div>
			</main>
		);
	}

	if (patientData.length === 0) {
		return (
			<h1 className="grid min-h-dvh place-items-center text-3xl font-semibold text-gray-800">
				No patient data extracted
			</h1>
		);
	}

	return (
		<main className="mx-auto my-10 grid min-h-dvh max-w-[37.5rem] place-items-center">
			<div className="w-full">
				<h1 className="mt-10 mb-5 text-center text-[1.8rem] font-semibold leading-[1.2] tracking-[-0.02em] text-gray-800">
					Review Patient Information
				</h1>
				<div className="mb-10 text-center text-gray-600">
					<p className="text-balance">
						The documents have been processed. Please review the extracted details before saving.
					</p>
				</div>
				<div className="flex w-full flex-col gap-4 px-4 md:px-0">
					{patientData.map((record, index) => (
						<Dialog key={index}>
							<DialogTrigger asChild>
								<button
									type="button"
									className="flex w-full cursor-pointer items-center justify-between rounded-xl border border-gray-200 bg-white p-4 text-left transition-colors hover:border-gray-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-300"
								>
									<h2 className="text-lg font-semibold text-gray-800">
										{formatPatientLabel(record.personalInfo)}
									</h2>
									<RiArrowRightSLine className="size-6" aria-hidden="true" />
								</button>
							</DialogTrigger>
							<DialogContent className="flex max-h-[53.125rem] flex-col overflow-hidden p-0">
								<div className="flex flex-col overflow-y-auto">
									<DialogHeader className="sticky top-0 z-10 border-b border-gray-200 bg-white px-4 py-3">
										<div className="flex w-full items-center justify-between gap-4">
											<DialogTitle className="text-xl font-semibold text-gray-800">
												{formatPatientLabel(record.personalInfo)}
											</DialogTitle>
											<DialogClose asChild>
												<Button
													variant="ghost"
													size="icon"
													className="size-10 rounded-full"
													aria-label="Close patient details"
												>
													<RiCloseLine className="size-5" aria-hidden="true" />
												</Button>
											</DialogClose>
										</div>
										<DialogDescription className="sr-only">
											Review and edit extracted patient information
										</DialogDescription>
									</DialogHeader>
									<div className="flex flex-col gap-6 p-4">
										<PersonalInfo
											index={index}
											personalInfo={record.personalInfo}
											records={patientData}
										/>
										<ContactInfo
											index={index}
											contactInfo={record.contactInfo}
											records={patientData}
										/>
										<EmergencyInfo
											index={index}
											emergencyInfo={record.emergencyInfo}
											records={patientData}
										/>
										<PhysicalInfo
											index={index}
											physicalInfo={record.physicalInfo}
											records={patientData}
										/>
									</div>
								</div>
							</DialogContent>
						</Dialog>
					))}

					{saveError ? (
						<p className="text-sm font-medium text-red-600 text-pretty">{saveError}</p>
					) : null}

					<Button className="mt-8 h-11 w-full" onClick={handleSave} disabled={isPending}>
						{isPending ? "Saving..." : "Save Patient Record"}
					</Button>

					{isOpen ? (
						<SuccessModal
							isOpen={isOpen}
							setIsOpen={setIsOpen}
							heading="Patient Record Saved Successfully"
							description="The patient's information has been securely saved. You may now proceed with additional documentation or return to the dashboard."
						>
							<DialogFooter className="w-full border-t border-gray-200">
								<Button className="h-11" variant="outline" onClick={closeModal}>
									Return to Dashboard
								</Button>
								<Button className="h-11" asChild>
									<Link href="/dashboard/add-new-patient">Add Another Record</Link>
								</Button>
							</DialogFooter>
						</SuccessModal>
					) : null}
				</div>
			</div>
		</main>
	);
}

type PersonalInfo = PatientRecord["personalInfo"];
type ContactInfo = PatientRecord["contactInfo"];
type EmergencyInfo = PatientRecord["emergencyInfo"];
type PhysicalInfo = PatientRecord["physicalInfo"];

function EditableInfoSection({
	title,
	sectionKey,
	info,
	index,
	records,
}: EditableInfoSectionProps) {
	const { setPatientData } = useExtractedPatient();
	const [sectionInfo, setSectionInfo] = useState(info);
	const [edit, setEdit] = useState<string | number | null>(null);
	const [editValue, setEditValue] = useState<string | number>("");

	function handleSave() {
		if (edit === null) return;

		const nextInfo = {
			...sectionInfo,
			[edit]: editValue,
		};

		const nextPatientData = records.map((record, recordIndex) =>
			recordIndex === index ? { ...record, [sectionKey]: nextInfo } : record,
		);

		setSectionInfo(nextInfo);
		setPatientData(nextPatientData);
		setEdit(null);
		setEditValue("");
	}

	function handleCancel() {
		setEdit(null);
		setEditValue("");
	}

	return (
		<div className="flex flex-col gap-4">
			<h2 className="text-base font-semibold tracking-[-0.02em]">{title}</h2>
			<div className="flex flex-col gap-6">
				{Object.entries(sectionInfo).map(([key, value]) => {
					const isEditing = edit === key;
					const fieldId = `${sectionKey}-${index}-${key}`;

					return (
						<div
							key={key}
							className={cn(
								"flex justify-between text-sm",
								edit === key && "flex-col md:flex-row md:items-end gap-2",
							)}
						>
							<div className="flex flex-col gap-4">
								<label htmlFor={fieldId} className="text-gray-400 no-line-height">
									{formatKey(key)}
								</label>
								{isEditing ? (
									<Input
										ref={(el) => el?.focus()}
										type={key === "dateOfBirth" ? "date" : "text"}
										id={fieldId}
										value={editValue}
										onChange={(e) => setEditValue(e.target.value)}
									/>
								) : (
									<p id={fieldId} className="no-line-height">
										{value === null || value === "" ? "--" : value}
									</p>
								)}
							</div>
							{isEditing ? (
								<div className="flex gap-2 self-end">
									<Button variant="outline" onClick={handleCancel}>
										Cancel
									</Button>
									<Button onClick={handleSave}>Save</Button>
								</div>
							) : (
								<Button
									variant="ghost"
									className="h-max py-0 hover:bg-transparent has-[>svg]:px-0"
									onClick={() => {
										setEdit(key);
										setEditValue(value ?? "");
									}}
								>
									<RiEditLine className="size-4" aria-hidden="true" /> Edit
								</Button>
							)}
						</div>
					);
				})}
			</div>
		</div>
	);
}

function PersonalInfo({
	index,
	personalInfo,
	records,
}: {
	index: number;
	personalInfo: PersonalInfo;
	records: PatientType;
}) {
	return (
		<EditableInfoSection
			title="Personal Info"
			sectionKey="personalInfo"
			info={personalInfo}
			index={index}
			records={records}
		/>
	);
}

function ContactInfo({
	index,
	contactInfo,
	records,
}: {
	index: number;
	contactInfo: ContactInfo;
	records: PatientType;
}) {
	return (
		<EditableInfoSection
			title="Contact Info"
			sectionKey="contactInfo"
			info={contactInfo}
			index={index}
			records={records}
		/>
	);
}

function EmergencyInfo({
	index,
	emergencyInfo,
	records,
}: {
	index: number;
	emergencyInfo: EmergencyInfo;
	records: PatientType;
}) {
	return (
		<EditableInfoSection
			title="Emergency Info"
			sectionKey="emergencyInfo"
			info={emergencyInfo}
			index={index}
			records={records}
		/>
	);
}

function PhysicalInfo({
	index,
	physicalInfo,
	records,
}: {
	index: number;
	physicalInfo: PhysicalInfo;
	records: PatientType;
}) {
	return (
		<EditableInfoSection
			title="Physical Info"
			sectionKey="physicalInfo"
			info={physicalInfo}
			index={index}
			records={records}
		/>
	);
}
