import { db } from "@/lib/better-auth/auth";
import { patientContactInformation, patientPersonalInformation } from "@/db/schemas";
import { getOrganizationId } from "./get-organization-id";
import { eq } from "drizzle-orm";

export async function getPatientById(patientId: string) {
	const organizationId = await getOrganizationId();

	if (!organizationId) {
		return null;
	}

	const rows = await db
		.select({
			patientId: patientPersonalInformation.patientId,
			firstName: patientPersonalInformation.firstName,
			lastName: patientPersonalInformation.lastName,
			email: patientContactInformation.emailAddress,
			phoneNumber: patientContactInformation.phoneNumber,
			address: patientContactInformation.residentialAddress,
		})
		.from(patientPersonalInformation)
		.leftJoin(
			patientContactInformation,
			eq(patientPersonalInformation.patientId, patientContactInformation.patientId),
		)
		.where(eq(patientPersonalInformation.patientId, patientId));

	return rows[0] || null;
}
