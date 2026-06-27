import { cache } from "react";
import { cacheLife, cacheTag } from "next/cache";
import { patient, patientImmunization } from "@/db/schemas";
import type { ImmunizationType } from "@/features/patients/types";
import { db } from "@/lib/better-auth/auth";
import { formatDateTime } from "@/lib/utils/format-date-time";
import { toSortValue } from "@/lib/utils/to-sort-value";
import { and, count, desc, eq, ilike, or } from "drizzle-orm";
import { getOrganizationId } from "./get-organization-id";

function normalizeStatus(value: string): ImmunizationType["status"] {
	const normalizedValue = value.toLowerCase();

	if (normalizedValue === "completed") {
		return "Completed";
	}

	if (normalizedValue === "discontinued") {
		return "Discontinued";
	}

	return "Active";
}

export const getPatientImmunizations = cache(async (
	patientId: string,
	page = 1,
	limit = 14,
	query = "",
): Promise<{ immunizations: ImmunizationType[]; totalImmunizations: number }> => {
	const organizationId = await getOrganizationId();

	if (!organizationId) return { immunizations: [], totalImmunizations: 0 };

	return getPatientImmunizationsForOrganization(
		patientId,
		organizationId,
		page,
		limit,
		query.trim(),
	);
});

export async function getPatientImmunizationsForOrganization(
	patientId: string,
	organizationId: string,
	page: number,
	limit: number,
	normalizedQuery: string,
): Promise<{ immunizations: ImmunizationType[]; totalImmunizations: number }> {
	"use cache";
	cacheLife("max");
	cacheTag(`patient-immunizations-${organizationId}-${patientId}`);

	const offset = (page - 1) * limit;
	const searchPattern = `%${normalizedQuery}%`;

	const [countRows, rows] = await Promise.all([
		db
			.select({ value: count() })
			.from(patientImmunization)
			.innerJoin(patient, eq(patientImmunization.patientId, patient.id))
			.where(
				and(
					eq(patientImmunization.patientId, patientId),
					eq(patient.organizationId, organizationId),
					or(
						ilike(patientImmunization.vaccineName, searchPattern),
						ilike(patientImmunization.id, searchPattern),
						ilike(patientImmunization.status, searchPattern),
					),
				),
			),
		db
			.select({
				vaccineName: patientImmunization.vaccineName,
				immunizationId: patientImmunization.id,
				currentDose: patientImmunization.currentDose,
				createdAt: patientImmunization.createdAt,
				status: patientImmunization.status,
			})
			.from(patientImmunization)
			.innerJoin(patient, eq(patientImmunization.patientId, patient.id))
			.where(
				and(
					eq(patientImmunization.patientId, patientId),
					eq(patient.organizationId, organizationId),
					or(
						ilike(patientImmunization.vaccineName, searchPattern),
						ilike(patientImmunization.id, searchPattern),
						ilike(patientImmunization.status, searchPattern),
					),
				),
			)
			.orderBy(desc(patientImmunization.createdAt))
			.limit(limit)
			.offset(offset),
	]);

	return {
		totalImmunizations: countRows[0]?.value ?? 0,
		immunizations: rows.map((immunization) => ({
			vaccineName: immunization.vaccineName,
			immunizationId: immunization.immunizationId,
			dose: immunization.currentDose ?? "-",
			createdAtLabel: formatDateTime(immunization.createdAt),
			createdAtSortValue: toSortValue(immunization.createdAt),
			status: normalizeStatus(immunization.status),
		})),
	};
}
