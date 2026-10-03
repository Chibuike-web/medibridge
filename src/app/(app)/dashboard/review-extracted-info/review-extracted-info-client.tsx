"use client";

import { SuccessModal } from "@/components/success-modal";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogClose,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogOverlay,
	DialogPortal,
	DialogTitle,
} from "@/components/ui/dialog";
import type { PatientRecord } from "@/features/patients/schemas/patient-schema";
import { savePatientsAction } from "@/features/patients/server/save-patients-action";
import { useExtractedPatient } from "@/features/patients/store/use-extracted-patient-store";
import { formatPatientLabel } from "@/features/patients/utils/format-patient-label";
import { RiArrowRightSLine, RiCloseLine } from "@remixicon/react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useRef, useState, useTransition } from "react";
import type { MouseEvent } from "react";
import { cn } from "@/lib/utils/cn";
import { PersonalInfo } from "./personal-info";
import { ContactInfo } from "./contact-info";
import { EmergencyInfo } from "./emergency-info";
import { PhysicalInfo } from "./physical-info";

export function ReviewExtractedInfoClient() {
	const { patientData, setPatientData, isHydrated } = useExtractedPatient();
	const router = useRouter();
	const reviewLayoutId = useId();
	const prefersReducedMotion = useReducedMotion();
	const [shouldAnimatePatientDialog, setShouldAnimatePatientDialog] = useState(true);
	const shouldMatchPatientLayout = shouldAnimatePatientDialog && !prefersReducedMotion;
	const [selectedPatientIndex, setSelectedPatientIndex] = useState<number | null>(null);
	const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false);
	const patientDialogTriggerRef = useRef<HTMLButtonElement | null>(null);
	const selectedPatient =
		selectedPatientIndex === null ? null : patientData?.[selectedPatientIndex];
	const [saveError, setSaveError] = useState("");
	const [isPending, startTransition] = useTransition();
	const [shouldAnimateSaveFeedback, setShouldAnimateSaveFeedback] = useState(false);

	function savePersonalInfo(personalInfo: PatientRecord["personalInfo"]) {
		if (!patientData || selectedPatientIndex === null) return;

		setPatientData(
			patientData.map((record, index) =>
				index === selectedPatientIndex ? { ...record, personalInfo } : record,
			),
		);
		setSaveError("");
	}

	function saveContactInfo(contactInfo: PatientRecord["contactInfo"]) {
		if (!patientData || selectedPatientIndex === null) return;

		setPatientData(
			patientData.map((record, index) =>
				index === selectedPatientIndex ? { ...record, contactInfo } : record,
			),
		);
		setSaveError("");
	}

	function saveEmergencyInfo(emergencyInfo: PatientRecord["emergencyInfo"]) {
		if (!patientData || selectedPatientIndex === null) return;

		setPatientData(
			patientData.map((record, index) =>
				index === selectedPatientIndex ? { ...record, emergencyInfo } : record,
			),
		);
		setSaveError("");
	}

	function savePhysicalInfo(physicalInfo: PatientRecord["physicalInfo"]) {
		if (!patientData || selectedPatientIndex === null) return;

		setPatientData(
			patientData.map((record, index) =>
				index === selectedPatientIndex ? { ...record, physicalInfo } : record,
			),
		);
		setSaveError("");
	}

	const closeModal = () => {
		router.replace("/dashboard");
		setIsSuccessDialogOpen(false);
	};

	const handleSave = (event: MouseEvent<HTMLButtonElement>) => {
		if (!patientData || patientData.length === 0 || isPending) return;

		setShouldAnimateSaveFeedback(event.detail > 0);
		setSaveError("");
		startTransition(async () => {
			const result = await savePatientsAction(patientData);

			if (result.status === "failed") {
				setSaveError(result.error);
				return;
			}

			setPatientData([]);
			setSelectedPatientIndex(null);
			setIsSuccessDialogOpen(true);
		});
	};

	if (!isHydrated) {
		return (
			<main className="mx-auto my-30 max-w-[37.5rem]">
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

	if (isSuccessDialogOpen) {
		return (
			<main>
				<SuccessModal
					isOpen={isSuccessDialogOpen}
					setIsOpen={setIsSuccessDialogOpen}
					heading="Patient Saved Successfully"
					description="The patient's information has been securely saved. You may now proceed with additional documentation or return to the dashboard."
				>
					<DialogFooter className="w-full text-sm">
						<Button variant="outline" onClick={closeModal}>
							Return to Dashboard
						</Button>
						<Button asChild>
							<Link href="/dashboard/add-new-patient">Add Another Record</Link>
						</Button>
					</DialogFooter>
				</SuccessModal>
			</main>
		);
	}

	if (!patientData || patientData.length === 0) {
		return (
			<h1 className="grid min-h-dvh place-items-center text-xl font-semibold text-gray-800">
				No patient data extracted
			</h1>
		);
	}
	return (
		<main className="mx-auto my-30 max-w-[36rem]">
			<div className="w-full">
				<h1 className="mt-10 mb-4 text-center text-xl font-semibold leading-[1.2] tracking-[-0.02em] text-gray-800">
					Review Patient Information
				</h1>
				<div className="mb-10 text-center text-gray-600">
					<p className="text-balance">
						The documents have been processed. Please review the extracted details before saving.
					</p>
				</div>
				<div className="flex w-full flex-col gap-4 px-4 md:px-0">
					{patientData.map((record, index) => (
						<Button
							key={index}
							variant="ghost"
							type="button"
							aria-haspopup="dialog"
							asChild
							onClick={(event) => {
								patientDialogTriggerRef.current = event.currentTarget;
								setShouldAnimatePatientDialog(event.detail > 0);
								setSelectedPatientIndex(index);
							}}
							className="group/patient-card active:scale-[0.99] flex w-full justify-between rounded-xl border-gray-200 bg-white p-4 text-left hover:border-gray-300 focus-visible:ring-2 focus-visible:ring-gray-300 h-auto gap-0 whitespace-normal hover:bg-white hover:text-inherit focus-visible:border-gray-200"
						>
							<motion.button
								layoutId={
									shouldMatchPatientLayout ? `${reviewLayoutId}-patient-${index}` : undefined
								}
								style={{ borderRadius: 12 }}
								transition={{ layout: { type: "spring", duration: 0.3, bounce: 0 } }}
							>
								<motion.span
									layout={shouldMatchPatientLayout ? "position" : false}
									layoutId={
										shouldMatchPatientLayout ? `${reviewLayoutId}-patient-${index}-name` : undefined
									}
									className="text-sm font-semibold text-gray-800"
									transition={{ layout: { type: "spring", duration: 0.3, bounce: 0 } }}
								>
									{formatPatientLabel(record.personalInfo)}
								</motion.span>
								<motion.span
									className="flex shrink-0"
									initial={false}
									animate={{
										opacity: shouldMatchPatientLayout && selectedPatientIndex === index ? 0 : 1,
									}}
									transition={
										shouldMatchPatientLayout && selectedPatientIndex === index
											? { duration: 0.05 }
											: { duration: 0.15, delay: 0.15 }
									}
								>
									<RiArrowRightSLine
										className="size-5 transition-transform duration-150 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] motion-safe:group-hover/patient-card:translate-x-0.5 motion-reduce:transition-none"
										aria-hidden="true"
									/>
								</motion.span>
							</motion.button>
						</Button>
					))}

					{saveError ? (
						<p role="alert" className="text-sm font-medium text-red-600 text-pretty">
							{saveError}
						</p>
					) : null}

					<Button
						className="mt-8 w-full"
						onClick={handleSave}
						disabled={isPending}
						aria-busy={isPending}
					>
						<span className="grid">
							<span
								aria-hidden={isPending}
								className={cn(
									"col-start-1 row-start-1",
									shouldAnimateSaveFeedback &&
										"transition-opacity duration-150 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]",
									isPending ? "opacity-0" : "opacity-100",
								)}
							>
								Save Patient
							</span>
							<span
								aria-hidden={!isPending}
								className={cn(
									"col-start-1 row-start-1",
									shouldAnimateSaveFeedback &&
										"transition-opacity duration-150 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]",
									isPending ? "opacity-100" : "opacity-0",
								)}
							>
								Saving...
							</span>
						</span>
					</Button>
				</div>
			</div>

			<ReviewPatientDialog
				patient={selectedPatient ?? null}
				shellLayoutId={
					shouldMatchPatientLayout ? `${reviewLayoutId}-patient-${selectedPatientIndex}` : undefined
				}
				titleLayoutId={
					shouldMatchPatientLayout
						? `${reviewLayoutId}-patient-${selectedPatientIndex}-name`
						: undefined
				}
				onOpenChange={setSelectedPatientIndex}
				onCloseAutoFocus={() => patientDialogTriggerRef.current?.focus()}
				onSavePersonalInfo={savePersonalInfo}
				onSaveContactInfo={saveContactInfo}
				onSaveEmergencyInfo={saveEmergencyInfo}
				onSavePhysicalInfo={savePhysicalInfo}
			/>
		</main>
	);
}

function ReviewPatientDialog({
	patient,
	shellLayoutId,
	titleLayoutId,
	onOpenChange,
	onCloseAutoFocus,
	onSavePersonalInfo,
	onSaveContactInfo,
	onSaveEmergencyInfo,
	onSavePhysicalInfo,
}: {
	patient: PatientRecord | null;
	shellLayoutId: string | undefined;
	titleLayoutId: string | undefined;
	onOpenChange: (value: number | null) => void;
	onCloseAutoFocus: () => void;
	onSavePersonalInfo: (personalInfo: PatientRecord["personalInfo"]) => void;
	onSaveContactInfo: (contactInfo: PatientRecord["contactInfo"]) => void;
	onSaveEmergencyInfo: (emergencyInfo: PatientRecord["emergencyInfo"]) => void;
	onSavePhysicalInfo: (physicalInfo: PatientRecord["physicalInfo"]) => void;
}) {
	return (
		<Dialog open={patient !== null} onOpenChange={() => onOpenChange(null)}>
			<AnimatePresence>
				{patient ? (
					<DialogPortal key="review-patient-dialog-overlay" forceMount>
						<DialogOverlay asChild forceMount>
							<motion.div
								style={{ animation: "none" }}
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								exit={{ opacity: 0, transition: { duration: 0.05 } }}
								transition={{ duration: 0.15, ease: "easeOut" }}
							/>
						</DialogOverlay>
					</DialogPortal>
				) : null}
			</AnimatePresence>
			<AnimatePresence>
				{patient ? (
					<DialogPortal key="review-patient-dialog-content" forceMount>
						<div className="pointer-events-none fixed inset-0 z-50 grid place-items-center p-4 md:p-6">
							<DialogPrimitive.Content
								asChild
								forceMount
								onCloseAutoFocus={(event) => {
									event.preventDefault();
									onCloseAutoFocus();
								}}
							>
								<motion.div
									data-slot="dialog-content"
									layoutId={shellLayoutId}
									style={{ borderRadius: 24 }}
									className="pointer-events-auto flex max-h-[calc(100dvh-2rem)] md:max-h-[calc(100dvh-3rem)] w-full max-w-[37.5rem] flex-col overflow-hidden border bg-background shadow-[0_2rem_2rem_-1.25rem_rgba(0,0,0,0.25)]"
									initial={shellLayoutId ? false : { opacity: 0 }}
									animate={{ opacity: 1 }}
									exit={{ opacity: shellLayoutId ? 1 : 0 }}
									transition={{
										duration: 0.15,
										layout: { type: "spring", duration: 0.3, bounce: 0 },
									}}
								>
									<DialogHeader>
										<div className="flex w-full items-center justify-between gap-4">
											<DialogTitle asChild>
												<motion.h2
													layout={shellLayoutId ? "position" : false}
													layoutId={titleLayoutId}
													transition={{ layout: { type: "spring", duration: 0.3, bounce: 0 } }}
												>
													{formatPatientLabel(patient.personalInfo)}
												</motion.h2>
											</DialogTitle>
											<DialogClose asChild>
												<Button
													asChild
													variant="ghost"
													size="icon"
													className="size-8 rounded-full"
													aria-label="Close patient details"
												>
													<motion.button
														layout={shellLayoutId ? "position" : false}
														initial={{ opacity: 0 }}
														animate={{ opacity: 1 }}
														exit={{ opacity: 0, transition: { duration: 0.05 } }}
														transition={{
															duration: 0.15,
															layout: { type: "spring", duration: 0.3, bounce: 0 },
														}}
													>
														<RiCloseLine className="size-5" aria-hidden="true" />
													</motion.button>
												</Button>
											</DialogClose>
										</div>
										<DialogDescription className="sr-only">
											Review and edit extracted patient information
										</DialogDescription>
									</DialogHeader>
									<motion.div
										layout={shellLayoutId ? "position" : false}
										className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto overscroll-contain p-4"
										initial={{ opacity: 0 }}
										animate={{ opacity: 1 }}
										exit={{ opacity: 0, transition: { duration: 0.05 } }}
										transition={{
											duration: 0.15,
											layout: { type: "spring", duration: 0.3, bounce: 0 },
										}}
									>
										<PersonalInfo personalInfo={patient.personalInfo} onSave={onSavePersonalInfo} />
										<ContactInfo contactInfo={patient.contactInfo} onSave={onSaveContactInfo} />
										<EmergencyInfo
											emergencyInfo={patient.emergencyInfo}
											onSave={onSaveEmergencyInfo}
										/>
										<PhysicalInfo physicalInfo={patient.physicalInfo} onSave={onSavePhysicalInfo} />
									</motion.div>
								</motion.div>
							</DialogPrimitive.Content>
						</div>
					</DialogPortal>
				) : null}
			</AnimatePresence>
		</Dialog>
	);
}
