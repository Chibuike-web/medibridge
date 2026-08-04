"use server";

import { getPatientImaging } from "@/lib/api/get-patient-imaging";
import type { ImagingModalityFilter, ImagingStatusFilter } from "../types";

export async function getPatientImagingTableAction({
	patientId,
	encounterId,
	page,
	limit,
	query = "",
	orderedFrom = "",
	orderedTo = "",
	createdFrom = "",
	createdTo = "",
	statusFilters = [],
	modalityFilters = [],
}: {
	patientId: string;
	encounterId?: string;
	page: number | string;
	limit: number | string;
	query?: string;
	orderedFrom?: string;
	orderedTo?: string;
	createdFrom?: string;
	createdTo?: string;
	statusFilters?: ImagingStatusFilter[];
	modalityFilters?: ImagingModalityFilter[];
}) {
	const currentPage = typeof page === "string" ? parseInt(page, 10) : page;
	const currentLimit = typeof limit === "string" ? parseInt(limit, 10) : limit;
	const { imagingStudies, totalImagingStudies } = await getPatientImaging(
		patientId,
		currentPage,
		currentLimit,
		query,
		{ orderedFrom, orderedTo, createdFrom, createdTo },
		statusFilters,
		modalityFilters,
		encounterId,
	);

	return {
		imagingStudies,
		page: currentPage,
		limit: currentLimit,
		totalPages: Math.ceil(totalImagingStudies / currentLimit) || 1,
	};
}
