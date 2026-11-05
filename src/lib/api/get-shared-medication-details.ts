import "server-only";

import { getPatientMedicationDetailsForOrganization } from "./get-patient-medication-details";
import { getSharedRecord } from "./get-shared-record";

export async function getSharedMedicationDetails(accessId: string, medicationId: string) {
	const sharedRecord = await getSharedRecord(accessId);
	if (!sharedRecord) return null;

	const isSharedMedication = sharedRecord.selectedRecordIds.some(
		(record) => record.section === "medications" && record.recordId === medicationId,
	);
	if (!isSharedMedication) return null;

	return getPatientMedicationDetailsForOrganization(medicationId, sharedRecord.organizationId);
}
