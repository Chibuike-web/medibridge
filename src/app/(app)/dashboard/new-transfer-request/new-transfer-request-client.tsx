"use client";

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils/cn";
import { Fragment, startTransition, use, useEffect, useMemo, useState } from "react";
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
import { EMPTY_PATIENT_TRANSFER_DATA, PatientTransferData } from "@/features/transfers/types";
import { SelectPatient } from "@/features/transfers/components/select-patient";
import { usePatientTransferData } from "@/features/transfers/stores/use-patient-transfer-data";
import { useShowSuccess } from "@/hooks/use-show-success";
import { SuccessModal } from "@/components/success-modal";
import { useAttachClinicalRecords } from "@/features/transfers/stores/use-attach-clinical-records";
import { getPatientByIdAction } from "@/features/patients/server/actions";
import type { SelectedTransferPatient } from "@/features/transfers/stores/use-selected-transfer-patients";
import { truncateId } from "@/lib/utils/truncate-id";
import type { Route } from "next";

type NewTransferRequestSearchParams = {
	patientId?: string | string[];
	returnTo?: string;
};

export function NewTransferRequestClient({
	searchParams,
	patients,
	patientOptionsLimit,
	totalPatientPages,
}: {
	searchParams: Promise<NewTransferRequestSearchParams>;
	patients: SelectedTransferPatient[];
	patientOptionsLimit: number;
	totalPatientPages: number;
}) {
	const { selectedTransferPatients, removeSelectedTransferPatient, addSelectedTransferPatient } =
		useSelectedTransferPatients();
	const {
		patientTransferDataByPatientId,
		setPatientTransferDataByPatientId,
		removePatientTransferDataByPatientId,
		isPatientTransferDataHydrated,
	} = usePatientTransferData();
	const { attachedClinicalRecordsByPatientId, removeAttachedClinicalRecordsForPatient } =
		useAttachClinicalRecords();
	const { isSuccessModalOpen, setIsSuccessModalOpen } = useShowSuccess();
	const [activeTransferPatientId, setActiveTransferPatientId] = useState<string | null>(null);
	const router = useRouter();
	const [currentTransferRequestStep, setCurrentTransferRequestStep] = useState(1);
	const params = use(searchParams);
	const patientIds = useMemo(() => normalizePatientIds(params.patientId), [params.patientId]);
	const primaryPatientId = patientIds[0];
	const transferRequestHrefWithoutPatientIds = getTransferRequestHrefWithoutPatientIds(
		params.returnTo,
	);

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

	function handleRemovePatient(patient: { patientId: string; name: string }) {
		removeSelectedTransferPatient(patient);
		removePatientTransferDataByPatientId(patient.patientId);
		removeAttachedClinicalRecordsForPatient(patient.patientId);

		if (patientIds.includes(patient.patientId)) {
			router.replace(transferRequestHrefWithoutPatientIds);
		}

		if (selectedTransferPatients.length === 1) {
			setCurrentTransferRequestStep(1);
			setActiveTransferPatientId(null);
		}
	}

	const recordCounts = (attachedClinicalRecordsByPatientId[activePatient] ?? []).reduce(
		(acc, record) => {
			const type = record.type;
			if (!type) return acc;
			acc[type] = (acc[type] || 0) + 1;

			return acc;
		},
		{} as Record<string, number>,
	);
	const recordCountsArray = Object.entries(recordCounts);
	const selectedPatientIds = new Set(selectedTransferPatients.map((patient) => patient.patientId));

	useEffect(
		function initializePatientsFromParams() {
			if (patientIds.length === 0) return;

			const patientIdsToAdd = patientIds.filter((patientId) => !selectedPatientIds.has(patientId));

			if (patientIdsToAdd.length === 0) return;

			startTransition(async () => {
				const patientsToAdd = await Promise.all(
					patientIdsToAdd.map((patientIdToAdd) => getPatientByIdAction(patientIdToAdd)),
				);

				patientsToAdd.forEach((patient) => {
					if (!patient) return;
					addSelectedTransferPatient({
						name: `${patient.firstName} ${patient.lastName}`,
						patientId: patient.patientId,
					});
				});
			});
		},
		[addSelectedTransferPatient, patientIds],
	);

	if (!isPatientTransferDataHydrated) {
		return <div className="w-full" />;
	}

	return (
		<>
			<form className="w-full">
				<p className="mb-10 w-full text-center font-medium text-gray-600">
					Step {currentTransferRequestStep}/2
				</p>

				{currentTransferRequestStep === 1 ? (
					<>
						<SelectPatient
							patientId={primaryPatientId}
							clearPatientIdHref={transferRequestHrefWithoutPatientIds}
							patients={patients}
							page={1}
							limit={patientOptionsLimit}
							totalPages={totalPatientPages}
						/>
						<Button
							className="mt-16 w-full text-sm"
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
						<div className="flex flex-wrap gap-2">
							{selectedTransferPatients.map((s) => (
								<button
									key={s.patientId}
									type="button"
									onClick={() => setActiveTransferPatientId(s.patientId)}
									className={cn("text-sm flex items-center gap-2 py-1.5 pl-3 pr-1.5 rounded-full", {
										"bg-gray-800 text-white": activePatient === s.patientId,
										"bg-gray-200 text-gray-600": activePatient !== s.patientId,
									})}
								>
									{s.name} - {truncateId(s.patientId)}
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

								<div className="mt-3 flex flex-col gap-2.5 text-sm text-gray-600">
									{recordCountsArray.length > 0 && (
										<p className="font-semibold">
											{recordCountsArray.length} record{recordCountsArray.length > 1 ? "s" : null}{" "}
											selected
										</p>
									)}
									<div className="flex flex-col gap-2">
										{recordCountsArray.map((recordCount) => (
											<div
												key={recordCount[0]}
												className="flex items-center gap-2.5 font-medium"
											>
												<RiCheckLine className="size-5 shrink-0" />
												<div>
													<span>{recordCount[0]}: </span>
													<span>{recordCount[1]}</span>
												</div>
											</div>
										))}
									</div>
								</div>

								<div className="mt-8">
									<Label className="mb-2 block text-sm text-gray-600">
										Target Hospital Name <span className="text-gray-400 font-normal">(required)</span>
									</Label>
									<Input
										placeholder="e.g., Enugu State Teaching Hospital"
											defaultValue={currentPatientTransferData.hospitalName ?? ""}
											onBlur={(e) => {
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
										<Label className="mb-2 block text-sm text-gray-600">
											Target Hospital Email{" "}
											<span className="text-gray-400 font-normal">(required)</span>
										</Label>
										<Input
											placeholder="e.g., admin@enuguhospital.gov.ng"
											defaultValue={currentPatientTransferData.hospitalEmail ?? ""}
											onBlur={(e) => {
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
									<div className="mt-3 flex items-center gap-1.5 text-sm text-gray-400">
										<RiErrorWarningLine className="size-4" />
										<span>Must be official verified hospital</span>
									</div>
								</div>
								<div className="mt-8">
									<Label className="mb-2 block text-sm text-gray-600">
										Notes <span className="text-gray-400 font-normal">(optional)</span>
									</Label>
									<Textarea
										placeholder="Add context or special instructions"
										defaultValue={currentPatientTransferData.notes ?? ""}
											onBlur={(e) => {
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
								className="text-sm"
								onClick={() => setCurrentTransferRequestStep(1)}
							>
								Back
							</Button>
							<Dialog>
								<DialogTrigger asChild>
									<Button type="button" className="text-sm" disabled={!isComplete}>
										Continue
									</Button>
								</DialogTrigger>
								<DialogContent>
									<DialogHeader className="h-16 px-6 border-b border-gray-200">
										<DialogTitle className="text-xl">
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
										<Label className="gap-4 px-5 py-3.5 rounded-lg bg-gray-50">
											<Checkbox />
											<div className="leading-[1.4em] font-normal">
												I have reviewed the patient details, selected records, and target hospital
												information. Everything is accurate and ready to proceed.
											</div>
										</Label>
									</div>
									<DialogFooter className="mt-16 border-t border-gray-200 text-sm">
										<div className="flex gap-4 ml-auto">
											<DialogClose asChild>
												<Button variant="outline" className="text-sm" type="button">
													Cancel
												</Button>
											</DialogClose>
											<Button
												className="text-sm"
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
			{isSuccessModalOpen && (
				<SuccessModal
					isOpen={isSuccessModalOpen}
					setIsOpen={setIsSuccessModalOpen}
					heading="Transfer Request Sent"
					description="Your transfer request has been successfully submitted.
The patient will review and approve this transfer before it is sent to the target hospital. You can track the status of this request in the Transfers section."
				>
					<DialogFooter className="border-t border-gray-200 text-sm">
						<Button variant="outline" className="text-sm">
							Return to Dashboard
						</Button>
						<Button className="text-sm">Create another request</Button>
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

function getTransferRequestHrefWithoutPatientIds(returnTo: string | undefined): Route {
	if (!returnTo) return "/dashboard/new-transfer-request";

	const nextParams = new URLSearchParams();
	nextParams.set("returnTo", returnTo);

	return `/dashboard/new-transfer-request?${nextParams.toString()}` as Route;
}
