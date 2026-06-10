import { unstable_cache } from "next/cache";
import { db } from "@/lib/better-auth/auth";
import { patient, patientPersonalInformation } from "@/db/schemas";
import { and, count, desc, eq, ilike, or } from "drizzle-orm";
import { getOrganizationId } from "./get-organization-id";

export async function getPatients(page: number, limit: number, query = "") {
	const organizationId = await getOrganizationId();
	const offset = (page - 1) * limit;
	const normalizedQuery = query.trim();
	const searchPattern = `%${normalizedQuery}%`;

	if (!organizationId) {
		return { totalPatients: 0, patientCreatedAt: [], patients: [], hasPatients: false };
	}

	return unstable_cache(
		async () => {
			const [countRows, rows] = await Promise.all([
				db
					.select({ value: count() })
					.from(patient)
					.leftJoin(
						patientPersonalInformation,
						eq(patient.id, patientPersonalInformation.patientId),
					)
					.where(
						and(
							eq(patient.organizationId, organizationId),
							or(
								ilike(patient.id, searchPattern),
								ilike(patient.patientId, searchPattern),
								ilike(patientPersonalInformation.firstName, searchPattern),
								ilike(patientPersonalInformation.lastName, searchPattern),
							),
						),
					),
				db
					.select({
						name: patientPersonalInformation.firstName,
						lastName: patientPersonalInformation.lastName,
						createdAt: patient.createdAt,
						patientId: patient.id,
						gender: patientPersonalInformation.sex,
						age: patientPersonalInformation.age,
					})
					.from(patient)
					.leftJoin(
						patientPersonalInformation,
						eq(patient.id, patientPersonalInformation.patientId),
					)
					.where(
						and(
							eq(patient.organizationId, organizationId),
							or(
								ilike(patient.id, searchPattern),
								ilike(patient.patientId, searchPattern),
								ilike(patientPersonalInformation.firstName, searchPattern),
								ilike(patientPersonalInformation.lastName, searchPattern),
							),
						),
					)
					.orderBy(desc(patient.createdAt))
					.limit(limit)
					.offset(offset),
			]);

			const totalPatients = countRows[0]?.value ?? 0;

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
		[`patients-${organizationId}-${page}-${limit}-${normalizedQuery}`],
		{ tags: [`patients-list-${organizationId}`] },
	)();
}
