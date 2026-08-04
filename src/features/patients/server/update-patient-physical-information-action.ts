"use server";

import { and, eq } from "drizzle-orm";
import { updateTag } from "next/cache";
import { patient, patientPhysicalInformation } from "@/db/schemas";
import { getOrganizationId } from "@/lib/api/get-organization-id";
import { db } from "@/lib/better-auth/auth";
import { updatePatientPhysicalInformationSchema } from "./schemas";

export async function updatePatientPhysicalInformationAction(
	patientId: string,
	formData: FormData,
) {
	const organizationId = await getOrganizationId();

	if (!organizationId) {
		return { ok: false, message: "Unable to verify your hospital." };
	}

	const parsedPhysicalInformation = updatePatientPhysicalInformationSchema.safeParse({
		height: formData.get("height"),
		weight: formData.get("weight"),
		bloodGroup: formData.get("bloodGroup"),
		genotype: formData.get("genotype"),
	});

	if (!parsedPhysicalInformation.success) {
		return {
			ok: false,
			message:
				parsedPhysicalInformation.error.issues[0]?.message ??
				"Please check the physical information fields.",
		};
	}

	const [patientRow] = await db
		.select({ id: patient.id })
		.from(patient)
		.where(and(eq(patient.id, patientId), eq(patient.organizationId, organizationId)))
		.limit(1);

	if (!patientRow) {
		return { ok: false, message: "Patient record was not found." };
	}

	const physicalInformation = parsedPhysicalInformation.data;

	await db
		.insert(patientPhysicalInformation)
		.values({
			id: crypto.randomUUID(),
			patientId,
			height: physicalInformation.height || null,
			weight: physicalInformation.weight || null,
			bloodGroup: physicalInformation.bloodGroup || null,
			genotype: physicalInformation.genotype || null,
			updatedAt: new Date(),
		})
		.onConflictDoUpdate({
			target: patientPhysicalInformation.patientId,
			set: {
				height: physicalInformation.height || null,
				weight: physicalInformation.weight || null,
				bloodGroup: physicalInformation.bloodGroup || null,
				genotype: physicalInformation.genotype || null,
				updatedAt: new Date(),
			},
		});

	updateTag(`patient-profile-${organizationId}-${patientId}`);
	updateTag(`patient-by-id-${organizationId}-${patientId}`);
	updateTag(`patients-list-${organizationId}`);
	updateTag(`recent-patients-${organizationId}`);
	updateTag(`recent-transfers-${organizationId}`);

	return { ok: true, message: "" };
}
