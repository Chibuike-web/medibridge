"use server";

import { and, eq } from "drizzle-orm";
import { updateTag } from "next/cache";
import { patient, patientDiagnosis, patientEncounter } from "@/db/schemas";
import { getOrganizationId } from "@/lib/api/get-organization-id";
import { getSessionData } from "@/lib/api/get-session-data";
import { db } from "@/lib/better-auth/auth";
import { createPatientDiagnosisSchema } from "./schemas";

type CreatePatientDiagnosisResult =
	| { status: "success"; diagnosisId: string }
	| { status: "failed" | "unauthorized"; error: string };

export async function createPatientDiagnosisAction(
	patientId: string,
	formData: FormData,
): Promise<CreatePatientDiagnosisResult> {
	const session = await getSessionData();

	if (!session?.user?.id) {
		return { status: "unauthorized", error: "You must be signed in to add diagnoses." };
	}

	if (!session.user.emailVerified) {
		return { status: "failed", error: "Verify your email before adding diagnoses." };
	}

	const organizationId = await getOrganizationId();

	if (!organizationId) {
		return {
			status: "failed",
			error: "Your hospital must be verified before you can add diagnoses.",
		};
	}

	const parsedDiagnosis = createPatientDiagnosisSchema.safeParse({
		diagnosisName: formData.get("diagnosisName") ?? "",
		severityStage: formData.get("severityStage") || undefined,
		status: formData.get("status"),
		diagnosedAt: formData.get("diagnosedAt") ?? "",
		diagnosedBy: formData.get("diagnosedBy") ?? "",
		clinicalNote: formData.get("clinicalNote") ?? "",
	});

	if (!parsedDiagnosis.success) {
		return { status: "failed", error: parsedDiagnosis.error.issues[0].message };
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
	const diagnosisId = `DX-${crypto.randomUUID()}`;
	const { severityStage, clinicalNote, ...diagnosis } = parsedDiagnosis.data;

	try {
		await db.insert(patientDiagnosis).values({
			id: diagnosisId,
			patientId,
			encounterId: encounterId || null,
			...diagnosis,
			severityStage: severityStage ?? null,
			clinicalNote: clinicalNote || null,
			createdBy,
			updatedBy: createdBy,
		});
	} catch (error) {
		console.error("Creating patient diagnosis failed:", error);
		return { status: "failed", error: "We couldn’t add this diagnosis. Please try again." };
	}

	updateTag(`patient-diagnoses-${organizationId}-${patientId}`);

	return { status: "success", diagnosisId };
}
