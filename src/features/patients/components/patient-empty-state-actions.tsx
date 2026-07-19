"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CreateAllergyDrawer } from "@/features/patients/components/create-allergy-drawer";
import { CreateDiagnosisDrawer } from "@/features/patients/components/create-diagnosis-drawer";
import { CreateDocumentDrawer } from "@/features/patients/components/create-document-drawer";
import { CreateImmunizationDrawer } from "@/features/patients/components/create-immunization-drawer";
import { CreateImagingDrawer } from "@/features/patients/components/create-imaging-drawer";
import { CreateLabTestDrawer } from "@/features/patients/components/create-lab-test-drawer";
import { CreateMedicationDrawer } from "@/features/patients/components/create-medication-drawer";
import { CreateProcedureDrawer } from "@/features/patients/components/create-procedure-drawer";
import { useRouter } from "next/navigation";

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

export function CreateVitalsEmptyStateAction() {
	const [isCreateVitalsDrawerOpen, setIsCreateVitalsDrawerOpen] = useState(false);

	return (
		<>
			<Button
				className="text-sm"
				type="button"
				onClick={() => setIsCreateVitalsDrawerOpen(true)}
			>
				Add vitals
			</Button>
			<PendingCreateDrawer open={isCreateVitalsDrawerOpen} />
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
				<CreateProcedureDrawer
					open={isCreateProcedureDrawerOpen}
					onOpenChange={setIsCreateProcedureDrawerOpen}
				/>
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
				<CreateMedicationDrawer
					open={isCreateMedicationDrawerOpen}
					onOpenChange={setIsCreateMedicationDrawerOpen}
				/>
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
				<CreateLabTestDrawer
					open={isCreateLabTestDrawerOpen}
					onOpenChange={setIsCreateLabTestDrawerOpen}
				/>
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
			<CreateImagingDrawer
				open={isCreateImagingDrawerOpen}
				onOpenChange={setIsCreateImagingDrawerOpen}
			/>
		</>
	);
}

export function CreateDocumentEmptyStateAction({ patientId }: { patientId: string }) {
	const router = useRouter();
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
			<CreateDocumentDrawer
				open={isCreateDocumentDrawerOpen}
				onOpenChange={setIsCreateDocumentDrawerOpen}
				patientId={patientId}
				onCreated={() => router.refresh()}
			/>
		</>
	);
}

function PendingCreateDrawer({ open }: { open: boolean }) {
	if (!open) return null;

	return null;
}
