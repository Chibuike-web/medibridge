import "server-only";

import { cache } from "react";
import { eq } from "drizzle-orm";
import {
	organization,
	patient,
	patientPersonalInformation,
	patientRecordAccess,
} from "@/db/schemas";
import { db } from "@/lib/better-auth/auth";
import { capitalize } from "@/lib/utils/capitalize";

export const getSharedRecord = cache(async (accessId: string) => {
	const [access] = await db
		.select({
			patientId: patientRecordAccess.patientId,
			status: patientRecordAccess.status,
			expiresAt: patientRecordAccess.expiresAt,
			revokedAt: patientRecordAccess.revokedAt,
			selectedRecordIds: patientRecordAccess.selectedRecordIds,
			sourceOrganizationName: organization.name,
			firstName: patientPersonalInformation.firstName,
			middleName: patientPersonalInformation.middleName,
			lastName: patientPersonalInformation.lastName,
			age: patientPersonalInformation.age,
			sex: patientPersonalInformation.sex,
		})
		.from(patientRecordAccess)
		.innerJoin(patient, eq(patientRecordAccess.patientId, patient.id))
		.innerJoin(patientPersonalInformation, eq(patient.id, patientPersonalInformation.patientId))
		.innerJoin(organization, eq(patientRecordAccess.createdByOrganizationId, organization.id))
		.where(eq(patientRecordAccess.id, accessId));

	if (
		!access ||
		access.status !== "active" ||
		access.revokedAt ||
		access.expiresAt.getTime() <= Date.now()
	) {
		return null;
	}

	return {
		patientId: access.patientId,
		selectedRecordIds: access.selectedRecordIds,
		sourceOrganizationName: access.sourceOrganizationName,
		expiresAt: access.expiresAt.toISOString(),
		patient: {
			name: [access.firstName, access.middleName, access.lastName].filter(Boolean).join(" "),
			sex: capitalize(access.sex || "-"),
			age: String(access.age ?? "-"),
		},
	};
});
