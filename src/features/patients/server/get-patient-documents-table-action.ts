"use server";

import { getPatientDocuments } from "@/lib/api/get-patient-documents";

export async function getPatientDocumentsTableAction({
	patientId,
	encounterId,
	page,
	limit,
	query = "",
	createdFrom = "",
	createdTo = "",
	documentTypeFilters = [],
}: {
	patientId: string;
	encounterId?: string;
	page: number | string;
	limit: number | string;
	query?: string;
	createdFrom?: string;
	createdTo?: string;
	documentTypeFilters?: string[];
}) {
	const currentPage = typeof page === "string" ? parseInt(page, 10) : page;
	const currentLimit = typeof limit === "string" ? parseInt(limit, 10) : limit;
	const { documents, totalDocuments } = await getPatientDocuments(
		patientId,
		currentPage,
		currentLimit,
		query,
		{ createdFrom, createdTo },
		documentTypeFilters,
		encounterId,
	);

	return {
		documents,
		page: currentPage,
		limit: currentLimit,
		totalPages: Math.ceil(totalDocuments / currentLimit) || 1,
	};
}
