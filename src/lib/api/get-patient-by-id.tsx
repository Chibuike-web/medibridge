import { db } from "@/lib/better-auth/auth";
import { patientPersonalInformation } from "@/db/schemas";
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
		})
		.from(patientPersonalInformation)
		.where(eq(patientPersonalInformation.patientId, patientId));

	return rows[0] || null;
}
