"use client";

import {
	DetailItem,
	DetailsSection,
} from "@/features/patients/components/patient-details-section/detail-fields";
import type { SharedRecordData } from "@/lib/api/get-shared-record";
import type {
	SharedPatientDetailSection,
	SharedSection,
} from "./shared-record-sections";
import { SharedAllergiesTable } from "./shared-record-tables/allergies-table";
import { SharedDiagnosesTable } from "./shared-record-tables/diagnoses-table";
import { SharedImagingTable } from "./shared-record-tables/imaging-table";
import { SharedImmunizationsTable } from "./shared-record-tables/immunizations-table";
import { SharedLabTestsTable } from "./shared-record-tables/lab-tests-table";
import { SharedMedicationsTable } from "./shared-record-tables/medications-table";
import { SharedProceduresTable } from "./shared-record-tables/procedures-table";

type SharedRecordsClientProps = {
	accessId: string;
	patientDetailsSections: SharedPatientDetailSection[];
	records: SharedRecordData["records"];
	activeSection: SharedSection;
};

export function SharedRecordsClient({
	accessId,
	patientDetailsSections,
	records,
	activeSection,
}: SharedRecordsClientProps) {
	return (
		<main className="mx-auto w-full max-w-7xl px-6 py-9">
			{activeSection === "patient-details" ? (
				<PatientDetails sections={patientDetailsSections} />
			) : null}
			{activeSection === "diagnoses" ? (
				<SharedDiagnosesTable accessId={accessId} rows={records.diagnoses} />
			) : null}
			{activeSection === "allergies" ? (
				<SharedAllergiesTable accessId={accessId} rows={records.allergies} />
			) : null}
			{activeSection === "immunization" ? (
				<SharedImmunizationsTable
					accessId={accessId}
					rows={records.immunizations}
				/>
			) : null}
			{activeSection === "procedures" ? (
				<SharedProceduresTable accessId={accessId} rows={records.procedures} />
			) : null}
			{activeSection === "medications" ? (
				<SharedMedicationsTable
					accessId={accessId}
					rows={records.medications}
				/>
			) : null}
			{activeSection === "lab-tests" ? (
				<SharedLabTestsTable accessId={accessId} rows={records.labTests} />
			) : null}
			{activeSection === "imaging" ? (
				<SharedImagingTable accessId={accessId} rows={records.imaging} />
			) : null}
		</main>
	);
}

function PatientDetails({
	sections,
}: {
	sections: SharedPatientDetailSection[];
}) {
	return (
		<div>
			<h2 className="mb-6 text-xl font-semibold text-gray-900">
				Patient Details
			</h2>
			<div className="flex flex-col gap-8">
				{sections.map((section) => (
					<DetailsSection key={section.title} title={section.title}>
						{section.items.map((item) => (
							<DetailItem
								key={item.label}
								label={item.label}
								value={item.value}
							/>
						))}
					</DetailsSection>
				))}
			</div>
		</div>
	);
}
