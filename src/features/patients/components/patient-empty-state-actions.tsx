"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CreateAllergyDrawer } from "@/features/patients/components/create-allergy-drawer";
import { CreateDiagnosisDrawer } from "@/features/patients/components/create-diagnosis-drawer";
import { CreateImmunizationDrawer } from "@/features/patients/components/create-immunization-drawer";

export function CreateDiagnosisEmptyStateAction() {
	const [isCreateDiagnosisDrawerOpen, setIsCreateDiagnosisDrawerOpen] = useState(false);

	return (
		<>
			<Button
				className="text-sm"
				type="button"
				onClick={() => setIsCreateDiagnosisDrawerOpen(true)}
			>
				Add diagnosis
			</Button>
			<CreateDiagnosisDrawer
				open={isCreateDiagnosisDrawerOpen}
				onOpenChange={setIsCreateDiagnosisDrawerOpen}
			/>
		</>
	);
}

export function CreateAllergyEmptyStateAction() {
	const [isCreateAllergyDrawerOpen, setIsCreateAllergyDrawerOpen] = useState(false);

	return (
		<>
			<Button
				className="text-sm"
				type="button"
				onClick={() => setIsCreateAllergyDrawerOpen(true)}
			>
				Add allergy
			</Button>
			<CreateAllergyDrawer
				open={isCreateAllergyDrawerOpen}
				onOpenChange={setIsCreateAllergyDrawerOpen}
			/>
		</>
	);
}

export function CreateImmunizationEmptyStateAction() {
	const [isCreateImmunizationDrawerOpen, setIsCreateImmunizationDrawerOpen] = useState(false);

	return (
		<>
			<Button
				className="text-sm"
				type="button"
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

export function CreateProcedureEmptyStateAction() {
	const [isCreateProcedureDrawerOpen, setIsCreateProcedureDrawerOpen] = useState(false);

	return (
		<>
			<Button
				className="text-sm"
				type="button"
				onClick={() => setIsCreateProcedureDrawerOpen(true)}
			>
				Add procedure
			</Button>
			<PendingCreateDrawer open={isCreateProcedureDrawerOpen} />
		</>
	);
}

export function CreateMedicationEmptyStateAction() {
	const [isCreateMedicationDrawerOpen, setIsCreateMedicationDrawerOpen] = useState(false);

	return (
		<>
			<Button
				className="text-sm"
				type="button"
				onClick={() => setIsCreateMedicationDrawerOpen(true)}
			>
				Add medication
			</Button>
			<PendingCreateDrawer open={isCreateMedicationDrawerOpen} />
		</>
	);
}

export function CreateEncounterEmptyStateAction() {
	const [isCreateEncounterDrawerOpen, setIsCreateEncounterDrawerOpen] = useState(false);

	return (
		<>
			<Button
				className="text-sm"
				type="button"
				onClick={() => setIsCreateEncounterDrawerOpen(true)}
			>
				Add encounter
			</Button>
			<PendingCreateDrawer open={isCreateEncounterDrawerOpen} />
		</>
	);
}

export function CreateLabTestEmptyStateAction() {
	const [isCreateLabTestDrawerOpen, setIsCreateLabTestDrawerOpen] = useState(false);

	return (
		<>
			<Button
				className="text-sm"
				type="button"
				onClick={() => setIsCreateLabTestDrawerOpen(true)}
			>
				Add lab test
			</Button>
			<PendingCreateDrawer open={isCreateLabTestDrawerOpen} />
		</>
	);
}

export function CreateImagingEmptyStateAction() {
	const [isCreateImagingDrawerOpen, setIsCreateImagingDrawerOpen] = useState(false);

	return (
		<>
			<Button
				className="text-sm"
				type="button"
				onClick={() => setIsCreateImagingDrawerOpen(true)}
			>
				Add imaging
			</Button>
			<PendingCreateDrawer open={isCreateImagingDrawerOpen} />
		</>
	);
}

export function CreateDocumentEmptyStateAction() {
	const [isCreateDocumentDrawerOpen, setIsCreateDocumentDrawerOpen] = useState(false);

	return (
		<>
			<Button
				className="text-sm"
				type="button"
				onClick={() => setIsCreateDocumentDrawerOpen(true)}
			>
				Add document
			</Button>
			<PendingCreateDrawer open={isCreateDocumentDrawerOpen} />
		</>
	);
}

function PendingCreateDrawer({ open }: { open: boolean }) {
	if (!open) return null;

	return null;
}
