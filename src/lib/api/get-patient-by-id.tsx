import { db } from "@/lib/better-auth/auth";
import { patient, patientContactInformation, patientPersonalInformation } from "@/db/schemas";
import { getOrganizationId } from "./get-organization-id";
import { and, eq } from "drizzle-orm";

export async function getPatientById(patientId: string) {
	const organizationId = await getOrganizationId();

	if (!organizationId) {
		return null;
	}

	const rows = await db
		.select({
			patientId: patient.patientId,
			firstName: patientPersonalInformation.firstName,
			lastName: patientPersonalInformation.lastName,
			sex: patientPersonalInformation.sex,
			email: patientContactInformation.emailAddress,
			phoneNumber: patientContactInformation.phoneNumber,
			address: patientContactInformation.residentialAddress,
		})
		.from(patient)
		.innerJoin(patientPersonalInformation, eq(patient.id, patientPersonalInformation.patientId))
		.leftJoin(patientContactInformation, eq(patient.id, patientContactInformation.patientId))
		.where(and(eq(patient.id, patientId), eq(patient.organizationId, organizationId)))
		.limit(1);

	return rows[0] || null;
}
