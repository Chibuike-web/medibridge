import { patient, patientDocument } from "@/db/schemas";
import type { DocumentType } from "@/features/patients/types";
import { db } from "@/lib/better-auth/auth";
import { formatDate } from "@/lib/utils/format-date";
import { and, eq } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { cache } from "react";
import { getOrganizationId } from "./get-organization-id";

export const getPatientDocumentDetails = cache(async (documentId: string) => {
	const organizationId = await getOrganizationId();
	if (!organizationId) return null;
	return getPatientDocumentDetailsForOrganization(documentId, organizationId);
});

async function getPatientDocumentDetailsForOrganization(
	documentId: string,
	organizationId: string,
): Promise<DocumentType | null> {
	"use cache";
	cacheLife("max");
	cacheTag(`patient-document-details-${organizationId}-${documentId}`);

	const [document] = await db
		.select({
			documentId: patientDocument.id,
			encounterId: patientDocument.encounterId,
			title: patientDocument.title,
			documentType: patientDocument.documentType,
			clinicalNotes: patientDocument.clinicalNotes,
			files: patientDocument.files,
			createdBy: patientDocument.createdBy,
			updatedBy: patientDocument.updatedBy,
			createdAt: patientDocument.createdAt,
			updatedAt: patientDocument.updatedAt,
		})
		.from(patientDocument)
		.innerJoin(patient, eq(patientDocument.patientId, patient.id))
		.where(and(eq(patientDocument.id, documentId), eq(patient.organizationId, organizationId)))
		.limit(1);

	if (!document) return null;

	return {
		documentId: document.documentId,
		encounterId: document.encounterId ?? "",
		title: document.title,
		documentType: document.documentType,
		clinicalNotes: document.clinicalNotes ?? "-",
		files: document.files,
		createdBy: document.createdBy ?? "-",
		updatedBy: document.updatedBy ?? document.createdBy ?? "-",
		createdAtLabel: formatDate(document.createdAt.toISOString()),
		updatedAtLabel: formatDate(document.updatedAt.toISOString()),
		createdAtSortValue: document.createdAt.toISOString(),
	};
}
