"use server";

import { and, eq } from "drizzle-orm";
import { updateTag } from "next/cache";
import { patient, patientContactInformation } from "@/db/schemas";
import { getOrganizationId } from "@/lib/api/get-organization-id";
import { db } from "@/lib/better-auth/auth";
import { updatePatientContactInformationSchema } from "./schemas";

export async function updatePatientContactInformationAction(
	patientId: string,
	formData: FormData,
) {
	const organizationId = await getOrganizationId();

	if (!organizationId) {
		return { ok: false, message: "Unable to verify your hospital." };
	}

	const parsedContactInformation = updatePatientContactInformationSchema.safeParse({
		phoneNumber: formData.get("phoneNumber"),
		emailAddress: formData.get("emailAddress"),
		residentialAddress: formData.get("residentialAddress"),
		stateOfOrigin: formData.get("stateOfOrigin"),
		countryOfOrigin: formData.get("countryOfOrigin"),
	});

	if (!parsedContactInformation.success) {
		return {
			ok: false,
			message:
				parsedContactInformation.error.issues[0]?.message ??
				"Please check the contact information fields.",
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

	const contactInformation = parsedContactInformation.data;

	await db
		.insert(patientContactInformation)
		.values({
			id: crypto.randomUUID(),
			patientId,
			phoneNumber: contactInformation.phoneNumber || null,
			emailAddress: contactInformation.emailAddress || null,
			residentialAddress: contactInformation.residentialAddress || null,
			stateOfOrigin: contactInformation.stateOfOrigin || null,
			countryOfOrigin: contactInformation.countryOfOrigin || null,
			updatedAt: new Date(),
		})
		.onConflictDoUpdate({
			target: patientContactInformation.patientId,
			set: {
				phoneNumber: contactInformation.phoneNumber || null,
				emailAddress: contactInformation.emailAddress || null,
				residentialAddress: contactInformation.residentialAddress || null,
				stateOfOrigin: contactInformation.stateOfOrigin || null,
				countryOfOrigin: contactInformation.countryOfOrigin || null,
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
