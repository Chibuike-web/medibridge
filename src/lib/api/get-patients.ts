import { unstable_cache } from "next/cache";
import { db } from "@/lib/better-auth/auth";
import { patient, patientPersonalInformation } from "@/db/schemas";
import { and, count, desc, eq, gte, ilike, lte, or } from "drizzle-orm";
import { getOrganizationId } from "./get-organization-id";

export type PatientCreatedAtFilter = {
	from?: Date;
	to?: Date;
};

export async function getPatients(
	page: number,
	limit: number,
	query = "",
	createdAtFilter: PatientCreatedAtFilter = {},
) {
	const organizationId = await getOrganizationId();
	const offset = (page - 1) * limit;
	const normalizedQuery = query.trim();
	const searchPattern = `%${normalizedQuery}%`;
	const createdAtConditions = [
		createdAtFilter.from ? gte(patient.createdAt, createdAtFilter.from) : undefined,
		createdAtFilter.to ? lte(patient.createdAt, createdAtFilter.to) : undefined,
	].filter((condition) => condition !== undefined);

	if (!organizationId) {
		return { totalPatients: 0, patientCreatedAt: [], patients: [], hasPatients: false };
	}

	return unstable_cache(
		async () => {
			const patientFilter = and(
				eq(patient.organizationId, organizationId),
				...createdAtConditions,
				or(
					ilike(patient.id, searchPattern),
					ilike(patient.patientId, searchPattern),
					ilike(patientPersonalInformation.firstName, searchPattern),
					ilike(patientPersonalInformation.lastName, searchPattern),
				),
			);

			const [allPatientCountRows, filteredPatientCountRows, rows] = await Promise.all([
				db
					.select({ value: count() })
					.from(patient)
					.where(eq(patient.organizationId, organizationId)),
				db
					.select({ value: count() })
					.from(patient)
					.leftJoin(
						patientPersonalInformation,
						eq(patient.id, patientPersonalInformation.patientId),
					)
					.where(patientFilter),
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
					.where(patientFilter)
					.orderBy(desc(patient.createdAt))
					.limit(limit)
					.offset(offset),
			]);

			const totalPatients = filteredPatientCountRows[0]?.value ?? 0;
			const allPatientCount = allPatientCountRows[0]?.value ?? 0;

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
				hasPatients: allPatientCount > 0,
			};
		},
		[
			`patients-v2-${organizationId}-${page}-${limit}-${normalizedQuery}-${createdAtFilter.from?.toISOString() ?? ""}-${createdAtFilter.to?.toISOString() ?? ""}`,
		],
		{ tags: [`patients-list-${organizationId}`] },
	)();
}
