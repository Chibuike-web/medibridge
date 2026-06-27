import { cache } from "react";
import { cacheLife, cacheTag } from "next/cache";
import { patient, patientPersonalInformation } from "@/db/schemas/patient";
import { db } from "@/lib/better-auth/auth";
import { desc, eq } from "drizzle-orm";
import { RecentPatientType } from "@/features/patients/types";
import { getOrganizationId } from "./get-organization-id";

export const getRecentPatients = cache(async (): Promise<RecentPatientType[]> => {
	const organizationId = await getOrganizationId();

	if (!organizationId) return [];

	return getRecentPatientsForOrganization(organizationId);
});

export async function getRecentPatientsForOrganization(
	organizationId: string,
): Promise<RecentPatientType[]> {
	"use cache";
	cacheLife("max");
	cacheTag(`recent-patients-${organizationId}`);

	const rows = await db
		.select({
			name: patientPersonalInformation.firstName,
			lastName: patientPersonalInformation.lastName,
			createdAt: patient.createdAt,
			patientId: patient.id,
			gender: patientPersonalInformation.sex,
			age: patientPersonalInformation.age,
		})
		.from(patient)
		.leftJoin(patientPersonalInformation, eq(patient.id, patientPersonalInformation.patientId))
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
}
