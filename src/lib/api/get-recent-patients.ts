import { unstable_cache } from "next/cache";
import { patient, patientPersonalInformation } from "@/db/schemas/patient";
import { db } from "@/lib/better-auth/auth";
import { desc, eq } from "drizzle-orm";
import { RecentPatientType } from "@/features/patients/types";
import { getActiveOrganizationId } from "./get-active-organization-id";

export async function getRecentPatients(): Promise<RecentPatientType[]> {
	const organizationId = await getActiveOrganizationId();

	if (!organizationId) return [];

	const patients = await unstable_cache(
		async () => {
			const rows = await db
				.select({
					name: patientPersonalInformation.firstName,
					lastName: patientPersonalInformation.lastName,
					createdAt: patient.createdAt,
					patientId: patient.patientId,
					gender: patientPersonalInformation.sex,
					age: patientPersonalInformation.age,
				})
				.from(patient)
				.leftJoin(
					patientPersonalInformation,
					eq(patient.id, patientPersonalInformation.patientId),
				)
				.where(eq(patient.organizationId, organizationId))
				.orderBy(desc(patient.createdAt))
				.limit(10);

			return rows.map((row) => ({
				name: `${row.name} ${row.lastName}`.trim(),
				createdAt: row.createdAt.toISOString(),
				patientId: row.patientId,
				gender: row.gender === "female" ? ("Female" as const) : ("Male" as const),
				age: row.age ?? 0,
			}));
		},
		[`patients-${organizationId}`],
		{ tags: [`patients-${organizationId}`] },
	)();
	return patients;
}
