import "server-only";

import { getPatientImmunizationDetailsForOrganization } from "./get-patient-immunization-details";
import { getSharedRecord } from "./get-shared-record";

export async function getSharedImmunizationDetails(accessId: string, immunizationId: string) {
	const sharedRecord = await getSharedRecord(accessId);
	if (!sharedRecord) return null;

	const isSharedImmunization = sharedRecord.selectedRecordIds.some(
		(record) => record.section === "immunizations" && record.recordId === immunizationId,
	);
	if (!isSharedImmunization) return null;

	return getPatientImmunizationDetailsForOrganization(immunizationId, sharedRecord.organizationId);
}
