"use server";

import { getOrganizationId } from "@/lib/api/get-organization-id";
import { getPatientByIdForOrganization } from "@/lib/api/get-patient-by-id";

export async function getPatientByIdAction(patientId: string) {
	const organizationId = await getOrganizationId();

	if (!organizationId) return null;

	const patient = await getPatientByIdForOrganization(patientId, organizationId);

	if (!patient) return null;

	return {
		...patient,
		patientId,
	};
}
