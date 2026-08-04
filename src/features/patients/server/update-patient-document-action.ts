"use server";

import { and, eq } from "drizzle-orm";
import { updateTag } from "next/cache";
import { patient, patientDocument } from "@/db/schemas";
import { getOrganizationId } from "@/lib/api/get-organization-id";
import { db } from "@/lib/better-auth/auth";

export async function updatePatientDocumentAction(documentId: string, formData: FormData) {
	const organizationId = await getOrganizationId();
	const title = String(formData.get("title") ?? "").trim();
	const documentType = String(formData.get("documentType") ?? "").trim();
	const clinicalNotes = String(formData.get("clinicalNotes") ?? "").trim();

	if (!organizationId || !title || !documentType) {
		return { ok: false, message: "Complete the required document fields." };
	}

	const [documentRow] = await db
		.select({ patientId: patientDocument.patientId })
		.from(patientDocument)
		.innerJoin(patient, eq(patientDocument.patientId, patient.id))
		.where(and(eq(patientDocument.id, documentId), eq(patient.organizationId, organizationId)))
		.limit(1);

	if (!documentRow) return { ok: false, message: "Document could not be found." };

	await db
		.update(patientDocument)
		.set({
			title,
			documentType,
			clinicalNotes: clinicalNotes || null,
			updatedAt: new Date(),
		})
		.where(eq(patientDocument.id, documentId));
	updateTag(`patient-documents-${organizationId}-${documentRow.patientId}`);
	updateTag(`patient-document-details-${organizationId}-${documentId}`);

	return { ok: true };
}
