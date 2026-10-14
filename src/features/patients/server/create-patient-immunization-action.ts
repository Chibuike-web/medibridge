"use server";

import { and, eq } from "drizzle-orm";
import { updateTag } from "next/cache";
import { patient, patientEncounter, patientImmunization } from "@/db/schemas";
import { getOrganizationId } from "@/lib/api/get-organization-id";
import { getSessionData } from "@/lib/api/get-session-data";
import { db } from "@/lib/better-auth/auth";
import { createPatientImmunizationSchema } from "./schemas";

type CreatePatientImmunizationResult =
	| { status: "success"; immunizationId: string }
	| { status: "failed" | "unauthorized"; error: string };

export async function createPatientImmunizationAction(
	patientId: string,
	formData: FormData,
): Promise<CreatePatientImmunizationResult> {
	const session = await getSessionData();

	if (!session?.user?.id) {
		return { status: "unauthorized", error: "You must be signed in to add immunizations." };
	}

	if (!session.user.emailVerified) {
		return { status: "failed", error: "Verify your email before adding immunizations." };
	}

	const organizationId = await getOrganizationId();

	if (!organizationId) {
		return {
			status: "failed",
			error: "Your hospital must be verified before you can add immunizations.",
		};
	}

	const parsedImmunization = createPatientImmunizationSchema.safeParse({
		vaccineName: formData.get("vaccineName") ?? "",
		seriesType: formData.get("seriesType") || undefined,
		currentDose: formData.get("currentDose") ?? "",
		totalDoses: formData.get("totalDoses") ?? "",
		status: formData.get("status"),
		dateAdministered: formData.get("dateAdministered") ?? "",
		administeredBy: formData.get("administeredBy") ?? "",
		clinicalNote: formData.get("clinicalNote") ?? "",
	});

	if (!parsedImmunization.success) {
		return { status: "failed", error: parsedImmunization.error.issues[0].message };
	}

	const [patientRow] = await db
		.select({ id: patient.id })
		.from(patient)
		.where(and(eq(patient.id, patientId), eq(patient.organizationId, organizationId)))
		.limit(1);

	if (!patientRow) {
		return { status: "failed", error: "Patient could not be found." };
	}

	const encounterId = String(formData.get("encounterId") ?? "").trim();

	if (encounterId) {
		const [encounter] = await db
			.select({ id: patientEncounter.id })
			.from(patientEncounter)
			.where(and(eq(patientEncounter.id, encounterId), eq(patientEncounter.patientId, patientId)))
			.limit(1);

		if (!encounter) {
			return { status: "failed", error: "This encounter could not be found for the patient." };
		}
	}

	const createdBy = session.user.name || session.user.email;
	const immunizationId = `IMM-${crypto.randomUUID()}`;
	const { seriesType, currentDose, totalDoses, dateAdministered, clinicalNote, ...immunization } =
		parsedImmunization.data;

	try {
		await db.insert(patientImmunization).values({
			id: immunizationId,
			patientId,
			encounterId: encounterId || null,
			...immunization,
			seriesType: seriesType ?? null,
			currentDose: String(currentDose),
			totalDoses: String(totalDoses),
			dateAdministered: new Date(dateAdministered),
			clinicalNote: clinicalNote || null,
			createdBy,
			updatedBy: createdBy,
		});
	} catch (error) {
		console.error("Creating patient immunization failed:", error);
		return { status: "failed", error: "We couldn’t add this immunization. Please try again." };
	}

	updateTag(`patient-immunizations-${organizationId}-${patientId}`);

	return { status: "success", immunizationId };
}
