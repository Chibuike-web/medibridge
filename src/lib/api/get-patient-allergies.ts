import { patientAllergy } from "@/db/schemas";
import type { AllergyType } from "@/features/patients/types";
import { db } from "@/lib/better-auth/auth";
import { formatDateTime } from "@/lib/utils/format-date-time";
import { toSortValue } from "@/lib/utils/to-sort-value";
import { desc, eq } from "drizzle-orm";

function normalizeSeverity(value: string): AllergyType["severity"] {
	if (value === "Mild" || value === "Moderate" || value === "Severe") {
		return value;
	}

	return "Mild";
}

function normalizeStatus(value: string): AllergyType["status"] {
	return value === "Inactive" ? "Inactive" : "Active";
}

export async function getPatientAllergies(patientId: string): Promise<AllergyType[]> {
	const rows = await db
		.select({
			allergen: patientAllergy.allergen,
			allergyId: patientAllergy.allergyId,
			reaction: patientAllergy.reaction,
			createdAt: patientAllergy.createdAt,
			severity: patientAllergy.severity,
			status: patientAllergy.status,
		})
		.from(patientAllergy)
		.where(eq(patientAllergy.patientId, patientId))
		.orderBy(desc(patientAllergy.createdAt));

	return rows.map((allergy) => ({
		allergen: allergy.allergen,
		allergyId: allergy.allergyId,
		reaction: allergy.reaction,
		createdAtLabel: formatDateTime(allergy.createdAt),
		createdAtSortValue: toSortValue(allergy.createdAt),
		severity: normalizeSeverity(allergy.severity),
		status: normalizeStatus(allergy.status),
	}));
}
