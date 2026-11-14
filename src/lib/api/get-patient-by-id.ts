import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/lib/better-auth/auth";
import { patient, patientContactInformation, patientPersonalInformation } from "@/db/schemas";
import { and, eq } from "drizzle-orm";

function formatSex(value: string | null) {
	if (!value) return "-";

	const normalizedValue = value.toLowerCase();

	if (normalizedValue === "female") return "Female";
	if (normalizedValue === "male") return "Male";

	return value;
}

export async function getPatientByIdForOrganization(patientId: string, organizationId: string) {
	"use cache";
	cacheLife("max");
	cacheTag(`patient-by-id-${organizationId}-${patientId}`);

	const rows = await db
		.select({
			patientId: patient.id,
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

	const row = rows[0];

	if (!row) return null;

	return {
		...row,
		sex: formatSex(row.sex),
	};
}
