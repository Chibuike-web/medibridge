"use client";

import { useState, type ComponentProps } from "react";
import { Button } from "@/components/ui/button";
import { CreateAllergyDrawer } from "@/features/patients/components/create-allergy-drawer";
import { CreateEncounterDrawer } from "@/features/patients/components/create-encounter-drawer";
import { CreateDiagnosisDrawer } from "@/features/patients/components/create-diagnosis-drawer";
import { CreateImmunizationDrawer } from "@/features/patients/components/create-immunization-drawer";
import { CreateImagingDrawer } from "@/features/patients/components/create-imaging-drawer";
import { CreateLabTestDrawer } from "@/features/patients/components/create-lab-test-drawer";
import { CreateMedicationDrawer } from "@/features/patients/components/create-medication-drawer";
import { CreateProcedureDrawer } from "@/features/patients/components/create-procedure-drawer";
import { CreateVitalsDrawer } from "@/features/patients/components/create-vitals-drawer";
import type { VitalEncounterOption } from "@/features/patients/types";

type ButtonVariant = ComponentProps<typeof Button>["variant"];

export function CreateDiagnosisEmptyStateAction({
	patientId,
	encounterId,
	variant,
}: {
	patientId: string;
	encounterId?: string;
	variant?: ButtonVariant;
}) {
	const [isCreateDiagnosisDrawerOpen, setIsCreateDiagnosisDrawerOpen] = useState(false);

	return (
		<>
			<Button type="button" variant={variant} onClick={() => setIsCreateDiagnosisDrawerOpen(true)}>
				Add diagnosis
			</Button>
			<CreateDiagnosisDrawer
				open={isCreateDiagnosisDrawerOpen}
				onOpenChange={setIsCreateDiagnosisDrawerOpen}
				patientId={patientId}
				encounterId={encounterId}
			/>
		</>
	);
}

export function CreateVitalsEmptyStateAction({
	patientId,
	encounterId,
	encounterOptions,
	variant,
}: {
	patientId: string;
	encounterId?: string;
	encounterOptions: VitalEncounterOption[];
	variant?: ButtonVariant;
}) {
	const [isCreateVitalsDrawerOpen, setIsCreateVitalsDrawerOpen] = useState(false);

	return (
		<>
			<Button type="button" variant={variant} onClick={() => setIsCreateVitalsDrawerOpen(true)}>
				Add vitals
			</Button>
			<CreateVitalsDrawer
				open={isCreateVitalsDrawerOpen}
				onOpenChange={setIsCreateVitalsDrawerOpen}
				patientId={patientId}
				encounterId={encounterId}
				encounterOptions={encounterOptions}
			/>
		</>
	);
}

export function CreateAllergyEmptyStateAction({
	patientId,
	encounterId,
	variant,
}: {
	patientId: string;
	encounterId?: string;
	variant?: ButtonVariant;
}) {
	const [isCreateAllergyDrawerOpen, setIsCreateAllergyDrawerOpen] = useState(false);

	return (
		<>
			<Button type="button" variant={variant} onClick={() => setIsCreateAllergyDrawerOpen(true)}>
				Add allergy
			</Button>
			<CreateAllergyDrawer
				open={isCreateAllergyDrawerOpen}
				onOpenChange={setIsCreateAllergyDrawerOpen}
				patientId={patientId}
				encounterId={encounterId}
			/>
		</>
	);
}

export function CreateImmunizationEmptyStateAction({
	patientId,
	encounterId,
	variant,
}: {
	patientId: string;
	encounterId?: string;
	variant?: ButtonVariant;
}) {
	const [isCreateImmunizationDrawerOpen, setIsCreateImmunizationDrawerOpen] = useState(false);

	return (
		<>
			<Button
				type="button"
				variant={variant}
				onClick={() => setIsCreateImmunizationDrawerOpen(true)}
			>
				Add immunization
			</Button>
			<CreateImmunizationDrawer
				open={isCreateImmunizationDrawerOpen}
				onOpenChange={setIsCreateImmunizationDrawerOpen}
				patientId={patientId}
				encounterId={encounterId}
			/>
		</>
	);
}

export function CreateProcedureEmptyStateAction({
	patientId,
	encounterId,
	variant,
}: {
	patientId: string;
	encounterId?: string;
	variant?: ButtonVariant;
}) {
	const [isCreateProcedureDrawerOpen, setIsCreateProcedureDrawerOpen] = useState(false);

	return (
		<>
			<Button type="button" variant={variant} onClick={() => setIsCreateProcedureDrawerOpen(true)}>
				Add procedure
			</Button>
			<CreateProcedureDrawer
				open={isCreateProcedureDrawerOpen}
				onOpenChange={setIsCreateProcedureDrawerOpen}
				patientId={patientId}
				encounterId={encounterId}
			/>
		</>
	);
}

export function CreateMedicationEmptyStateAction({
	patientId,
	encounterId,
	variant,
}: {
	patientId: string;
	encounterId?: string;
	variant?: ButtonVariant;
}) {
	const [isCreateMedicationDrawerOpen, setIsCreateMedicationDrawerOpen] = useState(false);

	return (
		<>
			<Button type="button" variant={variant} onClick={() => setIsCreateMedicationDrawerOpen(true)}>
				Add medication
			</Button>
			<CreateMedicationDrawer
				open={isCreateMedicationDrawerOpen}
				onOpenChange={setIsCreateMedicationDrawerOpen}
				patientId={patientId}
				encounterId={encounterId}
			/>
		</>
	);
}

export function CreateEncounterEmptyStateAction({ patientId }: { patientId: string }) {
	const [isCreateEncounterDrawerOpen, setIsCreateEncounterDrawerOpen] = useState(false);

	return (
		<>
			<Button type="button" onClick={() => setIsCreateEncounterDrawerOpen(true)}>
				Create encounter
			</Button>
			<CreateEncounterDrawer
				open={isCreateEncounterDrawerOpen}
				onOpenChange={setIsCreateEncounterDrawerOpen}
				patientId={patientId}
			/>
		</>
	);
}

export function CreateLabTestEmptyStateAction({
	patientId,
	encounterId,
	variant,
}: {
	patientId: string;
	encounterId?: string;
	variant?: ButtonVariant;
}) {
	const [isCreateLabTestDrawerOpen, setIsCreateLabTestDrawerOpen] = useState(false);

	return (
		<>
			<Button type="button" variant={variant} onClick={() => setIsCreateLabTestDrawerOpen(true)}>
				Add lab test
			</Button>
			<CreateLabTestDrawer
				open={isCreateLabTestDrawerOpen}
				onOpenChange={setIsCreateLabTestDrawerOpen}
				patientId={patientId}
				encounterId={encounterId}
			/>
		</>
	);
}

export function CreateImagingEmptyStateAction({
	patientId,
	encounterId,
	variant,
}: {
	patientId: string;
	encounterId?: string;
	variant?: ButtonVariant;
}) {
	const [isCreateImagingDrawerOpen, setIsCreateImagingDrawerOpen] = useState(false);

	return (
		<>
			<Button type="button" variant={variant} onClick={() => setIsCreateImagingDrawerOpen(true)}>
				Add imaging
			</Button>
			<CreateImagingDrawer
				open={isCreateImagingDrawerOpen}
				onOpenChange={setIsCreateImagingDrawerOpen}
				patientId={patientId}
				encounterId={encounterId}
			/>
		</>
	);
}
