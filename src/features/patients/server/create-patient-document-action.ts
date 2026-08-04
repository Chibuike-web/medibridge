"use server";

import { and, eq } from "drizzle-orm";
import { updateTag } from "next/cache";
import { patient, patientDocument, patientEncounter } from "@/db/schemas";
import { getOrganizationId } from "@/lib/api/get-organization-id";
import { db } from "@/lib/better-auth/auth";

export async function createPatientDocumentAction(
	patientId: string,
	formData: FormData,
	encounterId?: string,
) {
	const organizationId = await getOrganizationId();
	const title = String(formData.get("title") ?? "").trim();
	const documentType = String(formData.get("documentType") ?? "").trim();
	const clinicalNotes = String(formData.get("clinicalNotes") ?? "").trim();

	if (!organizationId || !title || !documentType) {
		return { ok: false, message: "Complete the required document fields." };
	}

	const [patientRow] = await db
		.select({ id: patient.id })
		.from(patient)
		.where(and(eq(patient.id, patientId), eq(patient.organizationId, organizationId)))
		.limit(1);

	if (!patientRow) return { ok: false, message: "Patient could not be found." };

	if (encounterId) {
		const [encounterRow] = await db
			.select({ id: patientEncounter.id })
			.from(patientEncounter)
			.innerJoin(patient, eq(patientEncounter.patientId, patient.id))
			.where(
				and(
					eq(patientEncounter.id, encounterId),
					eq(patientEncounter.patientId, patientId),
					eq(patient.organizationId, organizationId),
				),
			)
			.limit(1);

		if (!encounterRow) {
			return { ok: false, message: "Encounter could not be found." };
		}
	}

	const documentId = `DOC-${crypto.randomUUID()}`;
	await db.insert(patientDocument).values({
		id: documentId,
		patientId,
		encounterId: encounterId ?? null,
		title,
		documentType,
		clinicalNotes: clinicalNotes || null,
	});
	updateTag(`patient-documents-${organizationId}-${patientId}`);

	return { ok: true, documentId };
}
