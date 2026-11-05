import "server-only";

import type { PatientRecordAccessSection } from "@/db/schemas";
import { getPatientProcedureDetailsForOrganization } from "./get-patient-procedure-details";
import { getSharedRecord } from "./get-shared-record";

export async function getSharedProcedureDetails(accessId: string, procedureId: string) {
	const sharedRecord = await getSharedRecord(accessId);
	if (!sharedRecord) return null;

	const isShared = (section: PatientRecordAccessSection, recordId: string) =>
		sharedRecord.selectedRecordIds.some(
			(record) => record.section === section && record.recordId === recordId,
		);

	if (!isShared("procedures", procedureId)) return null;

	const procedure = await getPatientProcedureDetailsForOrganization(
		procedureId,
		sharedRecord.organizationId,
	);
	if (!procedure) return null;

	const { diagnosis, medication } = procedure.relatedRecords;

	return {
		...procedure,
		relatedRecords: {
			diagnosis: diagnosis && isShared("diagnoses", diagnosis.id) ? diagnosis : null,
			medication: medication && isShared("medications", medication.id) ? medication : null,
		},
	};
}
