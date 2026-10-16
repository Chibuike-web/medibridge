"use client";

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils/cn";
import { Fragment, use, useEffect, useMemo, useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { DialogClose } from "@radix-ui/react-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useRouter } from "next/navigation";
import { RiCheckLine, RiCloseLine } from "@remixicon/react";
import { AttachClinicalRecords } from "@/features/transfers/components/attach-clinical-records";
import { AnimatedPill } from "@/features/transfers/components/animated-pill";
import { AnimatePresence } from "motion/react";
import {
	EMPTY_PATIENT_TRANSFER_DATA,
	type AttachedClinicalRecordsType,
	type ClinicalRecordItem,
	type PatientTransferData,
	type PatientTransferDataByPatientId,
	type SelectedTransferPatient,
} from "@/features/transfers/types";
import { SelectPatient } from "@/features/transfers/components/select-patient";
import { useShowSuccess } from "@/hooks/use-show-success";
import { SuccessModal } from "@/components/success-modal";
import { getPatientByIdAction } from "@/features/patients/server/get-patient-by-id-action";
import { truncateId } from "@/lib/utils/truncate-id";
import { createTransferRequestsAction } from "@/features/transfers/server/actions";
import { clinicalRecords } from "@/features/transfers/data";

type NewTransferRequestClientProps = Pick<
	PageProps<"/dashboard/new-transfer-request">,
	"searchParams"
> & {
	patients: SelectedTransferPatient[];
	patientOptionsLimit: number;
	totalPatientPages: number;
};

export function NewTransferRequestClient({
	searchParams,
	patients,
	patientOptionsLimit,
	totalPatientPages,
}: NewTransferRequestClientProps) {
	const [selectedTransferPatients, setSelectedTransferPatients] = useState<
		SelectedTransferPatient[]
	>([]);
	const [patientTransferDataByPatientId, setPatientTransferDataByPatientId] =
		useState<PatientTransferDataByPatientId>({});
	const [attachedClinicalRecordsByPatientId, setAttachedClinicalRecordsByPatientId] =
		useState<AttachedClinicalRecordsType>({});
	const { isSuccessModalOpen, setIsSuccessModalOpen } = useShowSuccess();
	const [activeTransferPatientId, setActiveTransferPatientId] = useState<string | null>(null);
	const router = useRouter();
	const [currentTransferRequestStep, setCurrentTransferRequestStep] = useState(1);
	const [isTransferConfirmationOpen, setIsTransferConfirmationOpen] = useState(false);
	const [isTransferConfirmationChecked, setIsTransferConfirmationChecked] = useState(false);
	const [transferSubmissionError, setTransferSubmissionError] = useState<string | null>(null);
	const [transferSubmissionMessage, setTransferSubmissionMessage] = useState("");
	const [isSubmittingTransferRequests, startTransferRequestSubmission] = useTransition();
	const [isRestoringPatients, startRestoringPatients] = useTransition();
	const params = use(searchParams);
	const patientIds = useMemo(() => normalizePatientIds(params.patientId), [params.patientId]);

	const isComplete = selectedTransferPatients.every((p) => {
		const transferData = patientTransferDataByPatientId[p.patientId] ?? EMPTY_PATIENT_TRANSFER_DATA;
		const records = attachedClinicalRecordsByPatientId[p.patientId] ?? [];

		return transferData.hospitalEmail && transferData.hospitalName && records.length > 0;
	});
	const activePatient =
		selectedTransferPatients.find((p) => p.patientId === activeTransferPatientId)?.patientId ??
		selectedTransferPatients[0]?.patientId ??
		"";

	const currentPatientTransferData: PatientTransferData = {
		...EMPTY_PATIENT_TRANSFER_DATA,
		...(patientTransferDataByPatientId[activePatient] ?? {}),
	};

	function handleRemovePatient(patient: SelectedTransferPatient) {
		setSelectedTransferPatients((prev) =>
			prev.filter((selectedPatient) => selectedPatient.patientId !== patient.patientId),
		);
		setPatientTransferDataByPatientId((prev) =>
			Object.fromEntries(
				Object.entries(prev).filter(([patientId]) => patientId !== patient.patientId),
			),
		);
		setAttachedClinicalRecordsByPatientId((prev) =>
			Object.fromEntries(
				Object.entries(prev).filter(([patientId]) => patientId !== patient.patientId),
			),
		);

		replacePatientIdsInUrl(
			selectedTransferPatients
				.filter((selectedPatient) => selectedPatient.patientId !== patient.patientId)
				.map((selectedPatient) => selectedPatient.patientId),
		);

		if (selectedTransferPatients.length === 1) {
			setCurrentTransferRequestStep(1);
			setActiveTransferPatientId(null);
		}
	}

	const attachedRecordsForActivePatient = attachedClinicalRecordsByPatientId[activePatient] ?? [];
	const recordCounts = attachedRecordsForActivePatient.reduce(
		(acc, record) => {
			const type = record.type;
			if (!type) return acc;
			acc[type] = (acc[type] || 0) + 1;

			return acc;
		},
		{} as Record<string, number>,
	);
	const recordCountsArray = Object.entries(recordCounts);
	const clinicalRecordLabelByType: Record<string, string> = Object.fromEntries(
		clinicalRecords.map((clinicalRecord) => [clinicalRecord.id, clinicalRecord.label]),
	);
	function handleTogglePatient(patient: SelectedTransferPatient) {
		if (
			selectedTransferPatients.some(
				(selectedPatient) => selectedPatient.patientId === patient.patientId,
			)
		) {
			handleRemovePatient(patient);
			return;
		}

		setSelectedTransferPatients((prev) => [...prev, patient]);
		replacePatientIdsInUrl([
			...selectedTransferPatients.map((selectedPatient) => selectedPatient.patientId),
			patient.patientId,
		]);
	}

	function handleToggleAttachedRecord(record: ClinicalRecordItem) {
		setAttachedClinicalRecordsByPatientId((prev) => {
			const records = prev[activePatient] ?? [];

			return {
				...prev,
				[activePatient]: records.some((attachedRecord) => attachedRecord.id === record.id)
					? records.filter((attachedRecord) => attachedRecord.id !== record.id)
					: [...records, record],
			};
		});
	}

	useEffect(
		function initializePatientsFromParams() {
			if (patientIds.length === 0) return;

			startRestoringPatients(async () => {
				const patientsToAdd = await Promise.all(
					patientIds.map((patientIdToAdd) => getPatientByIdAction(patientIdToAdd)),
				);

				setSelectedTransferPatients((prev) => [
					...prev,
					...patientsToAdd.flatMap((patient) =>
						patient &&
						!prev.some((selectedPatient) => selectedPatient.patientId === patient.patientId)
							? [{ name: `${patient.firstName} ${patient.lastName}`, patientId: patient.patientId }]
							: [],
					),
				]);
			});
		},
		[patientIds],
	);

	function handleSubmitTransferRequests() {
		setTransferSubmissionError(null);

		if (!isTransferConfirmationChecked) {
			setTransferSubmissionError("Confirm that the transfer details are accurate before sending.");
			return;
		}

		const transferRequests = selectedTransferPatients.map((selectedPatient) => {
			const transferData =
				patientTransferDataByPatientId[selectedPatient.patientId] ?? EMPTY_PATIENT_TRANSFER_DATA;
			const records = attachedClinicalRecordsByPatientId[selectedPatient.patientId] ?? [];

			return {
				patientId: selectedPatient.patientId,
				targetHospitalName: transferData.hospitalName,
				targetHospitalEmail: transferData.hospitalEmail,
				notes: transferData.notes,
				records: records.map((record) => ({
					id: record.id,
					type: record.type,
				})),
			};
		});

		startTransferRequestSubmission(async () => {
			const result = await createTransferRequestsAction(transferRequests);

			if (result.status === "failed") {
				setTransferSubmissionError(result.error);
				return;
			}

			setSelectedTransferPatients([]);
			replacePatientIdsInUrl([]);
			setPatientTransferDataByPatientId({});
			setAttachedClinicalRecordsByPatientId({});
			setTransferSubmissionMessage(result.message);
			setIsTransferConfirmationOpen(false);
			setIsTransferConfirmationChecked(false);
			setIsSuccessModalOpen(true);
			router.refresh();
		});
	}

	return (
		<>
			<form method="post" className="w-full">
				<p className="mb-10 w-full text-center font-medium text-gray-600">
					Step {currentTransferRequestStep}/2
				</p>

				{currentTransferRequestStep === 1 ? (
					<>
						<SelectPatient
							selectedTransferPatients={selectedTransferPatients}
							isRestoringPatients={isRestoringPatients}
							onPatientToggle={handleTogglePatient}
							onPatientRemove={handleRemovePatient}
							patients={patients}
							page={1}
							limit={patientOptionsLimit}
							totalPages={totalPatientPages}
						/>
						<Button
							className="mt-16 w-full"
							type="button"
							onClick={() => {
								if (selectedTransferPatients.length > 0) {
									setCurrentTransferRequestStep(2);
								}
							}}
							disabled={selectedTransferPatients.length === 0}
						>
							Continue
						</Button>
					</>
				) : (
					<div>
						<div className="relative flex flex-wrap gap-2">
							<AnimatePresence mode="popLayout" initial={false}>
								{selectedTransferPatients.map((s) => (
									<AnimatedPill
										key={s.patientId}
										className={cn(
											"inline-flex items-center gap-2 rounded-full py-1.5 pr-1.5 pl-3 text-sm",
											{
												"bg-gray-800 text-white": activePatient === s.patientId,
												"bg-gray-200 text-gray-600": activePatient !== s.patientId,
											},
										)}
									>
										<button
											type="button"
											aria-pressed={activePatient === s.patientId}
											onClick={() => setActiveTransferPatientId(s.patientId)}
											className="rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-400"
										>
											{s.name.split(" ")[0]} - {truncateId(s.patientId)}
										</button>
										<Button
											type="button"
											size="icon"
											aria-label={`Remove ${s.name}`}
											onClick={() => handleRemovePatient(s)}
											className={cn("size-5 rounded-full", {
												"bg-white text-gray-800 hover:bg-white": activePatient === s.patientId,
												"bg-gray-800 text-white hover:bg-gray-800": activePatient !== s.patientId,
											})}
										>
											<RiCloseLine className="size-4" aria-hidden="true" />
										</Button>
									</AnimatedPill>
								))}
							</AnimatePresence>
						</div>
						<Fragment key={activePatient}>
							<AttachClinicalRecords
								activePatient={activePatient}
								attachedRecords={attachedRecordsForActivePatient}
								onRecordToggle={handleToggleAttachedRecord}
							/>

							<div className="mt-3 flex flex-col gap-2.5 text-sm text-foreground/70">
								{attachedRecordsForActivePatient.length > 0 && (
									<p className="font-semibold">
										{attachedRecordsForActivePatient.length} record
										{attachedRecordsForActivePatient.length > 1 ? "s" : null} selected
									</p>
								)}
								<div className="flex flex-col gap-2">
									{recordCountsArray.map((recordCount) => (
										<div key={recordCount[0]} className="flex items-center gap-2.5 font-medium">
											<RiCheckLine className="size-5 shrink-0" />
											<div>
												<span>{clinicalRecordLabelByType[recordCount[0]] ?? recordCount[0]}: </span>
												<span>{recordCount[1]}</span>
											</div>
										</div>
									))}
								</div>
							</div>

							<div className="mt-8">
								<Label
									htmlFor="target-hospital-name"
									className="mb-2 block text-sm text-foreground/70"
								>
									Target Hospital Name{" "}
									<span className="font-normal text-muted-foreground">(required)</span>
								</Label>
								<Input
									id="target-hospital-name"
									placeholder="e.g., Enugu State Teaching Hospital"
									defaultValue={currentPatientTransferData.hospitalName ?? ""}
									onChange={(e) => {
										const nextPatientTransferData = {
											...patientTransferDataByPatientId,
											[activePatient]: {
												...(patientTransferDataByPatientId[activePatient] ??
													EMPTY_PATIENT_TRANSFER_DATA),
												hospitalName: e.target.value,
											},
										};

										setPatientTransferDataByPatientId(nextPatientTransferData);
									}}
								/>
							</div>
							<div className="mt-8">
								<div>
									<Label
										htmlFor="target-hospital-email"
										className="mb-2 block text-sm text-foreground/70"
									>
										Target Hospital Email{" "}
										<span className="font-normal text-muted-foreground">(required)</span>
									</Label>
									<Input
										id="target-hospital-email"
										placeholder="e.g., admin@enuguhospital.gov.ng"
										defaultValue={currentPatientTransferData.hospitalEmail ?? ""}
										onChange={(e) => {
											const nextPatientTransferData = {
												...patientTransferDataByPatientId,
												[activePatient]: {
													...(patientTransferDataByPatientId[activePatient] ??
														EMPTY_PATIENT_TRANSFER_DATA),
													hospitalEmail: e.target.value,
												},
											};

											setPatientTransferDataByPatientId(nextPatientTransferData);
										}}
									/>
								</div>
							</div>
							<div className="mt-8">
								<Label htmlFor="transfer-notes" className="mb-2 block text-sm text-foreground/70">
									Notes <span className="font-normal text-muted-foreground">(optional)</span>
								</Label>
								<Textarea
									id="transfer-notes"
									placeholder="Add context or special instructions"
									defaultValue={currentPatientTransferData.notes ?? ""}
									onChange={(e) => {
										const nextPatientTransferData = {
											...patientTransferDataByPatientId,
											[activePatient]: {
												...(patientTransferDataByPatientId[activePatient] ??
													EMPTY_PATIENT_TRANSFER_DATA),
												notes: e.target.value,
											},
										};

										setPatientTransferDataByPatientId(nextPatientTransferData);
									}}
								/>
							</div>
						</Fragment>

						<div className="flex items-center mt-16 justify-between">
							<Button
								variant="outline"
								type="button"
								onClick={() => setCurrentTransferRequestStep(1)}
							>
								Back
							</Button>
							<Dialog
								open={isTransferConfirmationOpen}
								onOpenChange={(isOpen) => {
									setIsTransferConfirmationOpen(isOpen);
									if (!isOpen) {
										setIsTransferConfirmationChecked(false);
										setTransferSubmissionError(null);
									}
								}}
							>
								<DialogTrigger asChild>
									<Button type="button" disabled={!isComplete}>
										Continue
									</Button>
								</DialogTrigger>
								<DialogContent>
									<DialogHeader className="py-4">
										<DialogTitle>Confirm Transfer Request</DialogTitle>
										<DialogDescription className="sr-only">
											Review the selected patients and attached clinical records before submitting
											this transfer request.
										</DialogDescription>
										<DialogClose asChild>
											<Button
												variant="ghost"
												size="icon"
												aria-label="Close transfer request confirmation"
											>
												<RiCloseLine aria-hidden="true" />
											</Button>
										</DialogClose>
									</DialogHeader>
									<div className="px-4 py-5 text-sm">
										<p className="text-gray-600 font-normal">
											Before this transfer request is sent, please review and confirm the following
										</p>
										<ul className="mt-6 mb-8 text-gray-600 flex flex-col gap-1">
											<li className="flex items-center gap-2">
												<span aria-hidden>
													<RiCheckLine className="size-5" />
												</span>
												<span>Selected patients are correct</span>
											</li>
											<li className="flex items-center gap-2">
												<span aria-hidden>
													<RiCheckLine className="size-5" />
												</span>
												<span>The appropriate clinical records are attached for each patient</span>
											</li>
											<li className="flex items-center gap-2">
												<span aria-hidden>
													<RiCheckLine className="size-5" />
												</span>
												<span>Target hospital details are accurate for every patient</span>
											</li>
										</ul>
										<Label className="gap-4 px-5 py-3.5 rounded-lg bg-gray-50">
											<Checkbox
												checked={isTransferConfirmationChecked}
												onCheckedChange={(checked) => {
													setIsTransferConfirmationChecked(checked === true);
													setTransferSubmissionError(null);
												}}
											/>
											<div className="leading-[1.4em] font-normal">
												I have reviewed the patient details, selected records, and target hospital
												information. Everything is accurate and ready to proceed.
											</div>
										</Label>
									</div>
									{transferSubmissionError ? (
										<p className="mt-4 text-sm font-medium text-red-600" role="alert">
											{transferSubmissionError}
										</p>
									) : null}
									<DialogFooter className="mt-16 text-sm">
										<div className="flex gap-2 ml-auto">
											<DialogClose asChild>
												<Button variant="outline" type="button">
													Cancel
												</Button>
											</DialogClose>
											<Button
												type="button"
												disabled={isSubmittingTransferRequests || !isTransferConfirmationChecked}
												onClick={handleSubmitTransferRequests}
											>
												{isSubmittingTransferRequests ? "Sending..." : "Send for Approval"}
											</Button>
										</div>
									</DialogFooter>
								</DialogContent>
							</Dialog>
						</div>
					</div>
				)}
			</form>
			{isSuccessModalOpen && (
				<SuccessModal
					isOpen={isSuccessModalOpen}
					setIsOpen={setIsSuccessModalOpen}
					heading="Transfer Request Sent"
					description={transferSubmissionMessage}
				>
					<DialogFooter className="text-sm">
						<Button variant="outline" onClick={() => router.push("/dashboard/overview")}>
							Return to Dashboard
						</Button>
						<Button
							onClick={() => {
								setIsSuccessModalOpen(false);
								setCurrentTransferRequestStep(1);
							}}
						>
							Create another request
						</Button>
					</DialogFooter>
				</SuccessModal>
			)}
		</>
	);
}

function normalizePatientIds(value: string | string[] | undefined) {
	if (!value) return [];

	const patientIds = Array.isArray(value) ? value : [value];

	return [...new Set(patientIds.map((patientId) => patientId.trim()).filter(Boolean))];
}

function replacePatientIdsInUrl(patientIds: string[]) {
	const url = new URL(window.location.href);
	url.searchParams.delete("patientId");
	patientIds.forEach((patientId) => url.searchParams.append("patientId", patientId));
	window.history.replaceState(null, "", url);
}
