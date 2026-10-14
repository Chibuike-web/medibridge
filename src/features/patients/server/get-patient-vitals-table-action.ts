"use server";

import { getPatientVitals } from "@/lib/api/get-patient-vitals";

export async function getPatientVitalsTableAction({
	patientId,
	page,
	limit,
	query = "",
	recordedFrom = "",
	recordedTo = "",
	createdFrom = "",
	createdTo = "",
	encounterId,
}: {
	patientId: string;
	page: number | string;
	limit: number | string;
	query?: string;
	recordedFrom?: string;
	recordedTo?: string;
	createdFrom?: string;
	createdTo?: string;
	encounterId?: string;
}) {
	const currentPage = typeof page === "string" ? parseInt(page, 10) : page;
	const currentLimit = typeof limit === "string" ? parseInt(limit, 10) : limit;
	const { vitals, totalVitals } = await getPatientVitals(
		patientId,
		currentPage,
		currentLimit,
		query,
		{ recordedFrom, recordedTo, createdFrom, createdTo },
		encounterId,
	);

	return {
		vitals,
		page: currentPage,
		limit: currentLimit,
		totalPages: Math.ceil(totalVitals / currentLimit) || 1,
	};
}
