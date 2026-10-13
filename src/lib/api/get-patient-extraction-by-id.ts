import "server-only";

import { cache } from "react";
import { cacheLife, cacheTag } from "next/cache";
import { and, eq } from "drizzle-orm";
import { patientExtraction } from "@/db/schemas/patient";
import { db } from "@/lib/better-auth/auth";
import { getOrganizationId } from "./get-organization-id";

export const getPatientExtractionById = cache(async (extractionId: string) => {
	const organizationId = await getOrganizationId();

	if (!organizationId) {
		return null;
	}

	return getPatientExtractionForOrganization(extractionId, organizationId);
});

export async function getPatientExtractionForOrganization(
	extractionId: string,
	organizationId: string,
) {
	"use cache";
	cacheLife("max");
	cacheTag(`patient-extraction-${organizationId}-${extractionId}`);

	const [extraction] = await db
		.select({
			id: patientExtraction.id,
			createdBy: patientExtraction.createdBy,
			extractedData: patientExtraction.extractedData,
			createdAt: patientExtraction.createdAt,
		})
		.from(patientExtraction)
		.where(
			and(
				eq(patientExtraction.id, extractionId),
				eq(patientExtraction.organizationId, organizationId),
			),
		)
		.limit(1);

	return extraction ?? null;
}
