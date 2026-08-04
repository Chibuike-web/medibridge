"use server";

import { getPatientImmunizations } from "@/lib/api/get-patient-immunizations";

export async function getPatientImmunizationsTableAction({
	patientId,
	encounterId,
	page,
	limit,
	query = "",
	createdFrom = "",
	createdTo = "",
	statusFilters = [],
}: {
	patientId: string;
	encounterId?: string;
	page: number | string;
	limit: number | string;
	query?: string;
	createdFrom?: string;
	createdTo?: string;
	statusFilters?: ("active" | "completed" | "cancelled" | "discontinued")[];
}) {
	const currentPage = typeof page === "string" ? parseInt(page, 10) : page;
	const currentLimit = typeof limit === "string" ? parseInt(limit, 10) : limit;
	const { immunizations, totalImmunizations } = await getPatientImmunizations(
		patientId,
		currentPage,
		currentLimit,
		query,
		{ createdFrom, createdTo },
		statusFilters,
		encounterId,
	);

	return {
		immunizations,
		page: currentPage,
		limit: currentLimit,
		totalPages: Math.ceil(totalImmunizations / currentLimit) || 1,
	};
}
