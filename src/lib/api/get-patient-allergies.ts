import { unstable_cache } from "next/cache";
import { patient, patientAllergy } from "@/db/schemas";
import type { AllergyType } from "@/features/patients/types";
import { db } from "@/lib/better-auth/auth";
import { formatDateTime } from "@/lib/utils/format-date-time";
import { toSortValue } from "@/lib/utils/to-sort-value";
import { and, count, desc, eq, ilike, or } from "drizzle-orm";
import { getOrganizationId } from "./get-organization-id";

function normalizeSeverity(value: string): AllergyType["severity"] {
	if (value === "Mild" || value === "Moderate" || value === "Severe") {
		return value;
	}

	return "Mild";
}

function normalizeStatus(value: string): AllergyType["status"] {
	return value === "Inactive" ? "Inactive" : "Active";
}

export async function getPatientAllergies(
	patientId: string,
	page = 1,
	limit = 14,
	query = "",
): Promise<{ allergies: AllergyType[]; totalAllergies: number }> {
	const organizationId = await getOrganizationId();
	const offset = (page - 1) * limit;
	const normalizedQuery = query.trim();
	const searchPattern = `%${normalizedQuery}%`;

	if (!organizationId) return { allergies: [], totalAllergies: 0 };

	return unstable_cache(
		async () => {
			const [countRows, rows] = await Promise.all([
				db
					.select({ value: count() })
					.from(patientAllergy)
					.innerJoin(patient, eq(patientAllergy.patientId, patient.id))
					.where(
						and(
							eq(patientAllergy.patientId, patientId),
							eq(patient.organizationId, organizationId),
							or(
								ilike(patientAllergy.allergen, searchPattern),
								ilike(patientAllergy.id, searchPattern),
								ilike(patientAllergy.reaction, searchPattern),
								ilike(patientAllergy.severity, searchPattern),
								ilike(patientAllergy.status, searchPattern),
							),
						),
					),
				db
					.select({
						allergen: patientAllergy.allergen,
						allergyId: patientAllergy.id,
						reaction: patientAllergy.reaction,
						createdAt: patientAllergy.createdAt,
						severity: patientAllergy.severity,
						status: patientAllergy.status,
					})
					.from(patientAllergy)
					.innerJoin(patient, eq(patientAllergy.patientId, patient.id))
					.where(
						and(
							eq(patientAllergy.patientId, patientId),
							eq(patient.organizationId, organizationId),
							or(
								ilike(patientAllergy.allergen, searchPattern),
								ilike(patientAllergy.id, searchPattern),
								ilike(patientAllergy.reaction, searchPattern),
								ilike(patientAllergy.severity, searchPattern),
								ilike(patientAllergy.status, searchPattern),
							),
						),
					)
					.orderBy(desc(patientAllergy.createdAt))
					.limit(limit)
					.offset(offset),
			]);

			return {
				totalAllergies: countRows[0]?.value ?? 0,
				allergies: rows.map((allergy) => ({
					allergen: allergy.allergen,
					allergyId: allergy.allergyId,
					reaction: allergy.reaction,
					createdAtLabel: formatDateTime(allergy.createdAt),
					createdAtSortValue: toSortValue(allergy.createdAt),
					severity: normalizeSeverity(allergy.severity),
					status: normalizeStatus(allergy.status),
				})),
			};
		},
		[`patient-allergies-record-primary-ids-${organizationId}-${patientId}-${page}-${limit}-${normalizedQuery}`],
		{ tags: [`patient-allergies-${organizationId}-${patientId}`] },
	)();
}
