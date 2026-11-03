import "server-only";

import { getPatientAllergyDetailsForOrganization } from "./get-patient-allergy-details";
import { getSharedRecord } from "./get-shared-record";

export async function getSharedAllergyDetails(accessId: string, allergyId: string) {
	const sharedRecord = await getSharedRecord(accessId);
	if (!sharedRecord) return null;

	const isSharedAllergy = sharedRecord.selectedRecordIds.some(
		(record) => record.section === "allergies" && record.recordId === allergyId,
	);
	if (!isSharedAllergy) return null;

	return getPatientAllergyDetailsForOrganization(allergyId, sharedRecord.organizationId);
}
