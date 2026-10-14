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
import { useRouter } from "next/navigation";

type ButtonVariant = ComponentProps<typeof Button>["variant"];

export function CreateDiagnosisEmptyStateAction({ variant }: { variant?: ButtonVariant }) {
	const [isCreateDiagnosisDrawerOpen, setIsCreateDiagnosisDrawerOpen] = useState(false);

	return (
		<>
			<Button type="button" variant={variant} onClick={() => setIsCreateDiagnosisDrawerOpen(true)}>
				Add diagnosis
			</Button>
			<CreateDiagnosisDrawer
				open={isCreateDiagnosisDrawerOpen}
				onOpenChange={setIsCreateDiagnosisDrawerOpen}
			/>
		</>
	);
}

export function CreateVitalsEmptyStateAction({
	patientId,
	encounterOptions,
	variant,
}: {
	patientId: string;
	encounterOptions: VitalEncounterOption[];
	variant?: ButtonVariant;
}) {
	const router = useRouter();
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
				encounterOptions={encounterOptions}
				onCreated={() => router.refresh()}
			/>
		</>
	);
}

export function CreateAllergyEmptyStateAction({ variant }: { variant?: ButtonVariant }) {
	const [isCreateAllergyDrawerOpen, setIsCreateAllergyDrawerOpen] = useState(false);

	return (
		<>
			<Button type="button" variant={variant} onClick={() => setIsCreateAllergyDrawerOpen(true)}>
				Add allergy
			</Button>
			<CreateAllergyDrawer
				open={isCreateAllergyDrawerOpen}
				onOpenChange={setIsCreateAllergyDrawerOpen}
			/>
		</>
	);
}

export function CreateImmunizationEmptyStateAction({ variant }: { variant?: ButtonVariant }) {
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
			/>
		</>
	);
}

export function CreateProcedureEmptyStateAction({ variant }: { variant?: ButtonVariant }) {
	const [isCreateProcedureDrawerOpen, setIsCreateProcedureDrawerOpen] = useState(false);

	return (
		<>
			<Button type="button" variant={variant} onClick={() => setIsCreateProcedureDrawerOpen(true)}>
				Add procedure
			</Button>
			<CreateProcedureDrawer
				open={isCreateProcedureDrawerOpen}
				onOpenChange={setIsCreateProcedureDrawerOpen}
			/>
		</>
	);
}

export function CreateMedicationEmptyStateAction({ variant }: { variant?: ButtonVariant }) {
	const [isCreateMedicationDrawerOpen, setIsCreateMedicationDrawerOpen] = useState(false);

	return (
		<>
			<Button type="button" variant={variant} onClick={() => setIsCreateMedicationDrawerOpen(true)}>
				Add medication
			</Button>
			<CreateMedicationDrawer
				open={isCreateMedicationDrawerOpen}
				onOpenChange={setIsCreateMedicationDrawerOpen}
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

export function CreateLabTestEmptyStateAction({ variant }: { variant?: ButtonVariant }) {
	const [isCreateLabTestDrawerOpen, setIsCreateLabTestDrawerOpen] = useState(false);

	return (
		<>
			<Button type="button" variant={variant} onClick={() => setIsCreateLabTestDrawerOpen(true)}>
				Add lab test
			</Button>
			<CreateLabTestDrawer
				open={isCreateLabTestDrawerOpen}
				onOpenChange={setIsCreateLabTestDrawerOpen}
			/>
		</>
	);
}

export function CreateImagingEmptyStateAction({ variant }: { variant?: ButtonVariant }) {
	const [isCreateImagingDrawerOpen, setIsCreateImagingDrawerOpen] = useState(false);

	return (
		<>
			<Button type="button" variant={variant} onClick={() => setIsCreateImagingDrawerOpen(true)}>
				Add imaging
			</Button>
			<CreateImagingDrawer
				open={isCreateImagingDrawerOpen}
				onOpenChange={setIsCreateImagingDrawerOpen}
			/>
		</>
	);
}
