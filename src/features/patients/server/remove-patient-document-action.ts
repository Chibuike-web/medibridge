"use server";

import { and, eq } from "drizzle-orm";
import { updateTag } from "next/cache";
import { patient, patientDocument } from "@/db/schemas";
import { getOrganizationId } from "@/lib/api/get-organization-id";
import { db } from "@/lib/better-auth/auth";

export async function removePatientDocumentAction(documentId: string) {
	const organizationId = await getOrganizationId();
	if (!organizationId) return { ok: false, message: "Unable to verify your hospital." };

	const [documentRow] = await db
		.select({ patientId: patientDocument.patientId })
		.from(patientDocument)
		.innerJoin(patient, eq(patientDocument.patientId, patient.id))
		.where(and(eq(patientDocument.id, documentId), eq(patient.organizationId, organizationId)))
		.limit(1);
	if (!documentRow) return { ok: false, message: "Document could not be found." };

	await db.delete(patientDocument).where(eq(patientDocument.id, documentId));
	updateTag(`patient-documents-${organizationId}-${documentRow.patientId}`);
	updateTag(`patient-document-details-${organizationId}-${documentId}`);
	return { ok: true };
}
