import { unstable_cache } from "next/cache";
import { db } from "@/lib/better-auth/auth";
import { patient, patientPersonalInformation } from "@/db/schemas";
import { count, desc, eq } from "drizzle-orm";
import { getActiveOrganizationId } from "./get-active-organization-id";

export async function getTotalPatient() {
	const organizationId = await getActiveOrganizationId();

	if (!organizationId) {
		return { totalPatients: 0, patientCreatedAt: [], patients: [], hasPatients: false };
	}

	return unstable_cache(
		async () => {
			const [countRows, rows] = await Promise.all([
				db
					.select({ count: count() })
					.from(patient)
					.where(eq(patient.organizationId, organizationId)),
				db
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
					.orderBy(desc(patient.createdAt)),
			]);

			const totalPatients = countRows[0]?.count ?? 0;

			return {
				totalPatients,
				patientCreatedAt: rows.map((row) => row.createdAt.toISOString()),
				patients: rows.map((row) => ({
					name: `${row.name} ${row.lastName}`.trim(),
					createdAt: row.createdAt.toISOString(),
					patientId: row.patientId,
					gender: row.gender === "female" ? ("Female" as const) : ("Male" as const),
					age: row.age ?? 0,
				})),
				hasPatients: totalPatients > 0,
			};
		},
		[`patients-${organizationId}`],
		{ tags: [`patients-${organizationId}`] },
	)();
}
