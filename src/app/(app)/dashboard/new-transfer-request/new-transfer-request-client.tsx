"use client";

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils/cn";
import { Fragment, use, useEffect, useState } from "react";
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
import { useSelectedTransferPatients } from "@/features/transfers/stores/use-selected-transfer-patients";
import { useRouter } from "next/navigation";
import { RiCheckLine, RiCloseLine, RiErrorWarningLine } from "@remixicon/react";
import { AttachClinicalRecords } from "@/features/transfers/components/attach-clinical-records";
import { EMPTY_PATIENT_DATA, PatientData } from "@/features/transfers/types";
import { SelectPatient } from "@/features/transfers/components/select-patient";
import { useTransferPatientData } from "@/features/transfers/stores/use-transfer-patient-data";
import { useShowSuccess } from "@/hooks/use-show-success";
import { SuccessModal } from "@/components/success-modal";
import { patients } from "@/features/transfers/data";
import { useAttachClinicalRecords } from "@/features/transfers/stores/use-attach-clinical-records";

export function NewTransferRequestClient({
	searchParams,
}: {
	searchParams: Promise<{ patientId?: string }>;
}) {
	const { selectedPatients, removeSelectedPatient, addSelectedPatient } =
		useSelectedTransferPatients();
	const { patientData, setPatientData, removePatientData } = useTransferPatientData();
	const { attachedRecords, removeAttachedRecords } = useAttachClinicalRecords();
	const { showSuccess, setShowSuccess } = useShowSuccess();
	const [currentId, setCurrentId] = useState<string | null>(null);
	const router = useRouter();
	const [step, setStep] = useState(1);
	const params = use(searchParams);
	const patientId = params.patientId;

	function handleStep() {
		if (selectedPatients.length > 0) {
			setStep(2);
		}
	}

	const isComplete = selectedPatients.every((p) => {
		const data = patientData[p.patientId] ?? EMPTY_PATIENT_DATA;
		const records = attachedRecords[p.patientId] ?? [];

		return data.hospitalEmail && data.hospitalName && records.length > 0;
	});
	const activePatient =
		selectedPatients.find((p) => p.patientId === currentId)?.patientId ??
		selectedPatients[0]?.patientId ??
		"";

	const currentData: PatientData = {
		...EMPTY_PATIENT_DATA,
		...(patientData[activePatient] ?? {}),
	};

	function handleRemovePatient(patient: { patientId: string; name: string }) {
		removeSelectedPatient(patient);
		removePatientData(patient.patientId);
		removeAttachedRecords(patient.patientId);

		if (patient.patientId === patientId) {
			router.replace("/dashboard/new-transfer-request");
		}

		if (selectedPatients.length === 1) {
			setStep(1);
			setCurrentId(null);
		}
	}

	useEffect(
		function initializePatientFromParams() {
			if (!patientId) return;

			const patient = patients.find((p) => p.patientId === patientId);
			if (!patient) return;

			addSelectedPatient(patient);
		},
		[patientId, patients],
	);

	return (
		<>
			<form className="w-full">
				<p className="mb-10 w-full text-center text-xl font-medium text-gray-600">Step {step}/2</p>

				{step === 1 ? (
					<>
						<SelectPatient patientId={patientId} />
						<Button
							className="h-11 w-full mt-16"
							type="button"
							onClick={handleStep}
							disabled={selectedPatients.length === 0}
						>
							Continue
						</Button>
					</>
				) : (
					<div>
						<div className="flex flex-wrap gap-2">
							{selectedPatients.map((s) => (
								<button
									key={s.patientId}
									type="button"
									onClick={() => setCurrentId(s.patientId)}
									className={cn("text-sm flex items-center gap-2 py-1.5 pl-3 pr-1.5 rounded-full", {
										"bg-gray-800 text-white": activePatient === s.patientId,
										"bg-gray-200 text-gray-600": activePatient !== s.patientId,
									})}
								>
									{s.name} - {s.patientId}
									<span
										role="button"
										className={cn("size-5 flex items-center justify-center rounded-full", {
											"bg-white text-gray-800": activePatient === s.patientId,
											"bg-gray-800 text-white": activePatient !== s.patientId,
										})}
										onClick={(e) => {
											e.stopPropagation();
											handleRemovePatient(s);
										}}
									>
										<RiCloseLine size={16} />
									</span>
								</button>
							))}
						</div>
						<Fragment key={activePatient}>
							<AttachClinicalRecords activePatient={activePatient} />

							<div className="flex flex-col gap-3.5 mt-8">
								<Label className="text-gray-600 font-medium">
									Target Hospital Name <span className="text-gray-400 font-normal">(required)</span>
								</Label>
								<Input
									className="h-11"
									placeholder="e.g., Enugu State Teaching Hospital"
									defaultValue={currentData.hospitalName ?? ""}
									onBlur={(e) => {
										const nextPatientData = {
											...patientData,
											[activePatient]: {
												...(patientData[activePatient] ?? EMPTY_PATIENT_DATA),
												hospitalName: e.target.value,
											},
										};

										setPatientData(nextPatientData);
									}}
								/>
							</div>
							<div className="mt-8">
								<div className="flex flex-col gap-3.5">
									<Label className="text-gray-600 font-medium">
										Target Hospital Email
										<span className="text-gray-400 font-normal">(required)</span>
									</Label>
									<Input
										className="h-11"
										placeholder="e.g., Enugu State Teaching Hospital"
										defaultValue={currentData.hospitalEmail ?? ""}
										onBlur={(e) => {
											const nextPatientData = {
												...patientData,
												[activePatient]: {
													...(patientData[activePatient] ?? EMPTY_PATIENT_DATA),
													hospitalEmail: e.target.value,
												},
											};

											setPatientData(nextPatientData);
										}}
									/>
								</div>
								<div className="text-gray-400 flex items-center gap-1.5 mt-3 text-sm">
									<RiErrorWarningLine className="size-4" />
									<span>Must be official verified hospital</span>
								</div>
							</div>
							<div className="flex flex-col gap-3.5 mt-8">
								<Label className="text-gray-600 font-medium">
									Notes <span className="text-gray-400 font-normal">(optional)</span>
								</Label>
								<Textarea
									placeholder="Add context or special instructions"
									defaultValue={currentData.notes ?? ""}
									onBlur={(e) => {
										const nextPatientData = {
											...patientData,
											[activePatient]: {
												...(patientData[activePatient] ?? EMPTY_PATIENT_DATA),
												notes: e.target.value,
											},
										};

										setPatientData(nextPatientData);
									}}
								/>
							</div>
						</Fragment>

						<div className="flex items-center mt-16 justify-between">
							<Button className="h-11" variant="outline" type="button" onClick={() => setStep(1)}>
								Back
							</Button>
							<Dialog>
								<DialogTrigger asChild>
									<Button className="h-11" type="button" disabled={!isComplete}>
										Continue
									</Button>
								</DialogTrigger>
								<DialogContent>
									<DialogHeader className="h-16 px-6 border-b border-gray-200">
										<DialogTitle className="text-xl font-semibold">
											Confirm Transfer Request
										</DialogTitle>
										<DialogDescription className="sr-only">
											Review the selected patients and attached clinical records before submitting
											this transfer request.
										</DialogDescription>
										<DialogClose>
											<RiCloseLine className="size-6" />
										</DialogClose>
									</DialogHeader>
									<div className="mt-8 px-6">
										<p className="text-gray-600 font-medium">
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
										<Label className="flex items-center gap-4 px-5 py-3.5 rounded-lg bg-gray-50">
											<Checkbox />
											<div className="leading-[1.4em] font-normal">
												I have reviewed the patient details, selected records, and target hospital
												information. Everything is accurate and ready to proceed.
											</div>
										</Label>
									</div>
									<DialogFooter className="mt-16 border-t border-gray-200">
										<div className="flex gap-4 ml-auto">
											<Button
												variant="outline"
												className="h-11"
												type="button"
												onClick={() => router.push("/dashboard/transfers")}
											>
												Cancel
											</Button>
											<Button
												className="h-11"
												type="button"
												onClick={() => router.push("/dashboard/new-transfer-request")}
											>
												Send for Approval
											</Button>
										</div>
									</DialogFooter>
								</DialogContent>
							</Dialog>
						</div>
					</div>
				)}
			</form>
			{showSuccess && (
				<SuccessModal
					isOpen={showSuccess}
					setIsOpen={setShowSuccess}
					heading="Transfer Request Sent"
					description="Your transfer request has been successfully submitted. 
The patient will review and approve this transfer before it is sent to the target hospital. You can track the status of this request in the Transfers section."
				>
					<DialogFooter className="border-t border-gray-200">
						<Button variant="outline" className="h-11">
							Return to Dashboard
						</Button>
						<Button className="h-11">Create another request</Button>
					</DialogFooter>
				</SuccessModal>
			)}
		</>
	);
}
