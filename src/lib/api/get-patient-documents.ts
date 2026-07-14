import { cache } from "react";
import { and, count, desc, eq, gte, ilike, inArray, lte, or } from "drizzle-orm";
import { endOfDay, startOfDay } from "date-fns";
import { cacheLife, cacheTag } from "next/cache";
import { patient, patientDocument, patientDocumentFile } from "@/db/schemas";
import type { DocumentType } from "@/features/patients/types";
import { db } from "@/lib/better-auth/auth";
import { formatDate } from "@/lib/utils/format-date";
import { getOrganizationId } from "./get-organization-id";
import { parseDateParam } from "../utils/parse-date-param";

type DocumentDateFilters = {
	createdFrom?: string;
	createdTo?: string;
};

export const getPatientDocuments = cache(
	async (
		patientId: string,
		page = 1,
		limit = 14,
		query = "",
		dateFilters: DocumentDateFilters = {},
		documentTypeFilters: string[] = [],
	): Promise<{ documents: DocumentType[]; totalDocuments: number }> => {
		const organizationId = await getOrganizationId();
		const currentPage = Number.isFinite(page) && page > 0 ? page : 1;
		const currentLimit = Number.isFinite(limit) && limit > 0 ? limit : 14;
		const normalizedQuery = query.trim();
		if (!organizationId) return { documents: [], totalDocuments: 0 };

		return getPatientDocumentsForOrganization(
			patientId,
			organizationId,
			currentPage,
			currentLimit,
			normalizedQuery,
			dateFilters,
			documentTypeFilters,
		);
	},
);

export async function getPatientDocumentsForOrganization(
	patientId: string,
	organizationId: string,
	page: number,
	limit: number,
	normalizedQuery: string,
	dateFilters: DocumentDateFilters,
	documentTypeFilters: string[],
): Promise<{ documents: DocumentType[]; totalDocuments: number }> {
	"use cache";
	cacheLife("max");
	cacheTag(`patient-documents-${organizationId}-${patientId}`);

	const offset = (page - 1) * limit;
	const searchPattern = `%${normalizedQuery}%`;
	const createdFromDate = parseDateParam(dateFilters.createdFrom ?? "");
	const createdToDate = parseDateParam(dateFilters.createdTo ?? "");

	const documentFilter = and(
		eq(patientDocument.patientId, patientId),
		eq(patient.organizationId, organizationId),
		createdFromDate ? gte(patientDocument.createdAt, startOfDay(createdFromDate)) : undefined,
		createdToDate ? lte(patientDocument.createdAt, endOfDay(createdToDate)) : undefined,
		documentTypeFilters.length > 0
			? inArray(patientDocument.documentType, documentTypeFilters)
			: undefined,
		or(
			ilike(patientDocument.id, searchPattern),
			ilike(patientDocument.title, searchPattern),
			ilike(patientDocument.documentType, searchPattern),
			ilike(patientDocument.documentType, searchPattern),
		),
	);

	const [countRows, rows] = await Promise.all([
		db
			.select({ value: count() })
			.from(patientDocument)
			.innerJoin(patient, eq(patientDocument.patientId, patient.id))
			.where(documentFilter),
		db
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
			.where(documentFilter)
			.orderBy(desc(patientDocument.createdAt))
			.limit(limit)
			.offset(offset),
	]);
	const documentFiles = rows.length
		? await db
				.select()
				.from(patientDocumentFile)
				.where(inArray(patientDocumentFile.parentRecordId, rows.map((row) => row.documentId)))
		: [];
	const filesByDocumentId = new Map<string, typeof documentFiles>();

	for (const file of documentFiles) {
		const filesForDocument = filesByDocumentId.get(file.parentRecordId) ?? [];
		filesForDocument.push(file);
		filesByDocumentId.set(file.parentRecordId, filesForDocument);
	}

	return {
		totalDocuments: countRows[0]?.value ?? 0,
		documents: rows.map((document) => ({
			documentId: document.documentId,
			encounterId: document.encounterId ?? "",
			title: document.title,
			documentType: document.documentType,
			clinicalNotes: document.clinicalNotes ?? "-",
			files: (filesByDocumentId.get(document.documentId) ?? []).map((file) => ({
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
		})),
	};
}
