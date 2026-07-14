import { patient, patientDocument, patientDocumentFile } from "@/db/schemas";
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
	const files = await db
		.select()
		.from(patientDocumentFile)
		.where(eq(patientDocumentFile.parentRecordId, document.documentId));

	return {
		documentId: document.documentId,
		encounterId: document.encounterId ?? "",
		title: document.title,
		documentType: document.documentType,
		clinicalNotes: document.clinicalNotes ?? "-",
		files: files.map((file) => ({
			name: file.name,
			type: file.type ?? "",
			url: file.url ?? "",
			size: file.size ?? "",
			uploadedAt: file.uploadedAt.toISOString(),
		})),
		createdBy: document.createdBy ?? "-",
		updatedBy: document.updatedBy ?? document.createdBy ?? "-",
		createdAtLabel: formatDate(document.createdAt.toISOString()),
		updatedAtLabel: formatDate(document.updatedAt.toISOString()),
		createdAtSortValue: document.createdAt.toISOString(),
	};
}
