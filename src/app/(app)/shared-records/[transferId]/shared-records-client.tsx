"use client";

import {
	DetailItem,
	DetailsSection,
} from "@/features/patients/components/patient-details-section/detail-fields";
import type { SharedPatientDetailSection, SharedSection } from "./shared-record-sections";
import {
	SharedAllergiesTable,
	type SharedAllergyRow,
} from "./shared-record-tables/allergies-table";
import {
	SharedDiagnosesTable,
	type SharedDiagnosisRow,
} from "./shared-record-tables/diagnoses-table";
import { SharedImagingTable, type SharedImagingRow } from "./shared-record-tables/imaging-table";
import {
	SharedImmunizationsTable,
	type SharedImmunizationRow,
} from "./shared-record-tables/immunizations-table";
import { SharedLabTestsTable, type SharedLabTestRow } from "./shared-record-tables/lab-tests-table";
import {
	SharedMedicationsTable,
	type SharedMedicationRow,
} from "./shared-record-tables/medications-table";
import {
	SharedProceduresTable,
	type SharedProcedureRow,
} from "./shared-record-tables/procedures-table";

type SharedRecordsClientProps = {
	patientDetailsSections: SharedPatientDetailSection[];
	activeSection: SharedSection;
};

const diagnoses: SharedDiagnosisRow[] = [
	{
		name: "Hypertension",
		diagnosedAt: "March 2019",
		lastReviewed: "December 2025",
		diagnosisId: "DIA-91a2e4",
		createdAt: "17th Apr 2025, 12:30PM",
		status: "Active",
	},
	{
		name: "Type 2 Diabetes Mellitus",
		diagnosedAt: "January 2020",
		lastReviewed: "November 2025",
		diagnosisId: "DIA-7f3c91",
		createdAt: "18th Apr 2025, 9:15AM",
		status: "Resolved",
	},
	{
		name: "Chronic Kidney Disease",
		diagnosedAt: "June 2022",
		lastReviewed: "October 2025",
		diagnosisId: "DIA-a82de7",
		createdAt: "18th Apr 2025, 10:40AM",
		status: "Active",
	},
	{
		name: "Asthma",
		diagnosedAt: "April 2015",
		lastReviewed: "January 2026",
		diagnosisId: "DIA-5c91ab",
		createdAt: "19th Apr 2025, 8:20AM",
		status: "Active",
	},
];

const allergies: SharedAllergyRow[] = [
	{
		allergen: "Penicillin Allergy",
		allergyId: "ALG-4e91c2",
		reaction: "Hives and swelling",
		createdAt: "12th Mar 2025, 10:15AM",
		severity: "Severe",
		status: "Active",
	},
	{
		allergen: "Peanut Allergy",
		allergyId: "ALG-7bd21f",
		reaction: "Shortness of breath",
		createdAt: "16th Mar 2025, 8:45AM",
		severity: "Moderate",
		status: "Active",
	},
];

const immunizations: SharedImmunizationRow[] = [
	{
		vaccineName: "Influenza Vaccine",
		dose: "Dose 1",
		immunizationId: "IMM-9ad71c",
		createdAt: "6th Feb 2025, 9:25AM",
		status: "Completed",
	},
	{
		vaccineName: "COVID-19 Booster",
		dose: "Dose 3",
		immunizationId: "IMM-21a77e",
		createdAt: "8th Feb 2025, 12:00PM",
		status: "Completed",
	},
];

const procedures: SharedProcedureRow[] = [
	{
		procedure: "Colonoscopy",
		indication: "Screening",
		facility: "MediBridge Specialist Centre",
		procedureId: "PRC-7fa912",
		createdAt: "3rd May 2025, 4:30PM",
		status: "Completed",
	},
	{
		procedure: "Dialysis Catheter Placement",
		indication: "Renal access",
		facility: "Renal Unit",
		procedureId: "PRC-8ce41b",
		createdAt: "9th May 2025, 10:20AM",
		status: "Completed",
	},
];

const medications: SharedMedicationRow[] = [
	{
		medication: "Metformin 500 mg",
		dose: "500 mg",
		route: "Oral",
		indication: "Type 2 Diabetes Mellitus",
		medicationId: "MED-a712dc",
		createdAt: "15th Apr 2025, 1:40PM",
		status: "Active",
	},
	{
		medication: "Lisinopril 10 mg",
		dose: "10 mg",
		route: "Oral",
		indication: "Hypertension",
		medicationId: "MED-c912fa",
		createdAt: "15th Apr 2025, 1:45PM",
		status: "Active",
	},
];

const labTests: SharedLabTestRow[] = [
	{
		test: "Complete Blood Count",
		labId: "LAB-5ea823",
		referenceRange: "4.5 - 11.0",
		interpretation: "Normal",
		createdAt: "2nd Jun 2025, 8:10AM",
		status: "Completed",
	},
	{
		test: "HbA1c",
		labId: "LAB-23f9ac",
		referenceRange: "< 5.7%",
		interpretation: "High",
		createdAt: "2nd Jun 2025, 8:35AM",
		status: "Completed",
	},
];

const imaging: SharedImagingRow[] = [
	{
		study: "Chest X-ray",
		modality: "X-ray",
		region: "Chest",
		impression: "No acute cardiopulmonary abnormality",
		orderedAt: "7th Jun 2025, 11:25AM",
		imagingId: "IMG-18d7ac",
		status: "Completed",
	},
	{
		study: "Abdominal Ultrasound",
		modality: "Ultrasound",
		region: "Abdomen",
		impression: "Mild renal cortical changes",
		orderedAt: "9th Jun 2025, 2:50PM",
		imagingId: "IMG-91bf2d",
		status: "Completed",
	},
];

export function SharedRecordsClient({
	patientDetailsSections,
	activeSection,
}: SharedRecordsClientProps) {
	return (
		<main className="mx-auto w-full max-w-7xl px-6 py-9">
			{activeSection === "patient-details" && <PatientDetails sections={patientDetailsSections} />}
			{activeSection === "diagnoses" && <SharedDiagnosesTable rows={diagnoses} />}
			{activeSection === "allergies" && <SharedAllergiesTable rows={allergies} />}
			{activeSection === "immunization" && <SharedImmunizationsTable rows={immunizations} />}
			{activeSection === "procedures" && <SharedProceduresTable rows={procedures} />}
			{activeSection === "medications" && <SharedMedicationsTable rows={medications} />}
			{activeSection === "lab-tests" && <SharedLabTestsTable rows={labTests} />}
			{activeSection === "imaging" && <SharedImagingTable rows={imaging} />}
		</main>
	);
}

function PatientDetails({ sections }: { sections: SharedPatientDetailSection[] }) {
	return (
		<div>
			<h2 className="mb-6 text-xl font-semibold text-gray-900">Patient Details</h2>
			<div className="flex flex-col gap-8">
				{sections.map((section) => (
					<DetailsSection key={section.title} title={section.title}>
						{section.items.map((item) => (
							<DetailItem key={item.label} label={item.label} value={item.value} />
						))}
					</DetailsSection>
				))}
			</div>
		</div>
	);
}
