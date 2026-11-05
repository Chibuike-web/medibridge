import "server-only";

import type { PatientRecordAccessSection } from "@/db/schemas";
import { getPatientDiagnosisDetailsForOrganization } from "./get-patient-diagnosis-details";
import { getSharedRecord } from "./get-shared-record";

export async function getSharedDiagnosisDetails(accessId: string, diagnosisId: string) {
	const sharedRecord = await getSharedRecord(accessId);
	if (!sharedRecord) return null;

	const isShared = (section: PatientRecordAccessSection, recordId: string) =>
		sharedRecord.selectedRecordIds.some(
			(record) => record.section === section && record.recordId === recordId,
		);

	if (!isShared("diagnoses", diagnosisId)) return null;

	const diagnosis = await getPatientDiagnosisDetailsForOrganization(
		diagnosisId,
		sharedRecord.organizationId,
	);
	if (!diagnosis) return null;

	const { medications, labTests, imaging, procedures } = diagnosis.relatedRecords;

	return {
		...diagnosis,
		relatedRecords: {
			medications: medications.filter((medication) => isShared("medications", medication.id)),
			labTests: labTests.filter((labTest) => isShared("lab-tests", labTest.id)),
			imaging: imaging.filter((imagingStudy) => isShared("imaging", imagingStudy.id)),
			procedures: procedures.filter((procedure) => isShared("procedures", procedure.id)),
		},
	};
}
