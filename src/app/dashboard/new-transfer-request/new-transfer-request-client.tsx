"use client";

import { Label } from "@/components/ui/label";

import { formats } from "./data";
import { cn } from "@/lib/utils/cn";
import { Dispatch, Fragment, SetStateAction, useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { DialogClose } from "@radix-ui/react-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { SuccessModal } from "@/components/success-modal";
import { useShowSuccess } from "@/hooks/use-show-success";
import { useSelectedTransferPatients } from "@/store/use-selected-transfer-patients-store";
import { useRouter } from "next/navigation";
import { RiCheckLine, RiCloseLine } from "@remixicon/react";
import { CheckButton } from "@/components/check-button";
import { AttachClinicalRecords } from "./components/attach-clinical-records";
import { EMPTY_PATIENT_DATA, PatientData, PatientDataType } from "./types";
import { SelectPatient } from "./components/select-patient";

export function NewTransferRequestClient() {
	const { showSuccess, setShowSuccess } = useShowSuccess();
	const { selectedPatients, removeSelectedPatient } = useSelectedTransferPatients();
	const [currentId, setCurrentId] = useState<string | null>(null);

	const [patientData, setPatientData] = useState<PatientDataType>(() => {
		if (typeof window === "undefined") return {};
		const saved = localStorage.getItem("transfer-data");
		return saved ? JSON.parse(saved) : {};
	});
	const router = useRouter();
	const [step, setStep] = useState(1);
	function handleStep() {
		if (selectedPatients.length > 0) {
			setStep(2);
		}
	}

	const activePatient =
		selectedPatients.find((p) => p.patientId === currentId)?.patientId ??
		selectedPatients[0]?.patientId ??
		"";

	useEffect(() => {
		localStorage.setItem("transfer-data", JSON.stringify(patientData));
	}, [patientData]);

	const currentData: PatientData = {
		...EMPTY_PATIENT_DATA,
		...(patientData[activePatient] ?? {}),
	};
	return (
		<>
			<form className="w-full">
				<p className="w-full text-center text-[20px] font-medium text-gray-600 mb-10">
					Step {step}/2
				</p>

				{step === 1 ? (
					<>
						<SelectPatient />
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
											removeSelectedPatient(s);
										}}
									>
										<RiCloseLine size={16} />
									</span>
								</button>
							))}
						</div>
						<Fragment key={activePatient}>
							<AttachClinicalRecords
								activePatient={activePatient}
								currentData={currentData}
								setPatientData={setPatientData}
							/>
							<SendAs
								activePatient={activePatient}
								currentData={currentData}
								setPatientData={setPatientData}
							/>
							<div className="flex flex-col gap-3.5 mt-8">
								<Label>Target Hospital Name</Label>
								<Input
									className="h-11"
									placeholder="e.g., Enugu State Teaching Hospital"
									value={currentData.hospitalName ?? ""}
									onChange={(e) => {
										setPatientData((prev) => ({
											...prev,
											[activePatient]: {
												...(prev[activePatient] || EMPTY_PATIENT_DATA),
												hospitalName: e.target.value,
											},
										}));
									}}
								/>
							</div>
							<div className="flex flex-col gap-3.5 mt-8">
								<Label>Target Hospital Email</Label>
								<Input
									className="h-11"
									placeholder="e.g., Enugu State Teaching Hospital"
									value={currentData.hospitalEmail ?? ""}
									onChange={(e) => {
										setPatientData((prev) => ({
											...prev,
											[activePatient]: {
												...(prev[activePatient] || EMPTY_PATIENT_DATA),
												hospitalEmail: e.target.value,
											},
										}));
									}}
								/>
							</div>
							<div className="flex flex-col gap-3.5 mt-8">
								<Label>
									Notes <span>(Optional)</span>
								</Label>
								<Textarea placeholder="Add context or special instructions" />
							</div>
						</Fragment>

						<div className="flex items-center mt-16 justify-between">
							<Button className="h-11" variant="outline" type="button" onClick={() => setStep(1)}>
								Back
							</Button>
							<Dialog>
								<DialogTrigger asChild>
									<Button className="h-11" type="button">
										Continue
									</Button>
								</DialogTrigger>
								<DialogContent>
									<DialogHeader className="h-16 px-6 border-b border-gray-200">
										<DialogTitle className="text-xl font-semibold">
											Confirm Transfer Request
										</DialogTitle>
										<DialogClose>
											<RiCloseLine className="size-6" />
										</DialogClose>
									</DialogHeader>
									<div className="mt-8 px-6">
										<p className="text-gray-600 font-medium">
											Before this transfer request is sent, please review and confirm the following
										</p>
										<ul className="mt-6 mb-8 text-gray-600 flex flex-col gap-4">
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

function SendAs({
	activePatient,
	currentData,
	setPatientData,
}: {
	activePatient: string;
	currentData: PatientDataType[string];
	setPatientData: Dispatch<SetStateAction<PatientDataType>>;
}) {
	const selectedFormat = currentData.format;

	const selectFileFormat = (index: number) => {
		setPatientData((prev) => ({
			...prev,
			[activePatient]: {
				...(prev[activePatient] || EMPTY_PATIENT_DATA),
				format: index,
			},
		}));
	};
	return (
		<div className="mt-8 flex flex-col gap-3.5 items-start">
			<span className="text-gray-800 text-base block">Send as</span>

			<div className="flex gap-3 flex-wrap">
				{formats.map((format, index) => (
					<CheckButton
						key={index}
						isSelected={selectedFormat === index}
						onClick={() => selectFileFormat(index)}
					>
						{format}
					</CheckButton>
				))}
			</div>
		</div>
	);
}
