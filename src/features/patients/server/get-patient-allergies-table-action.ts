"use server";

import { getPatientAllergies } from "@/lib/api/get-patient-allergies";
import type { AllergyStatusFilter } from "../types";

export async function getPatientAllergiesTableAction({
	patientId,
	encounterId,
	page,
	limit,
	query = "",
	createdFrom = "",
	createdTo = "",
	statusFilters = [],
	severityFilters = [],
}: {
	patientId: string;
	encounterId?: string;
	page: number | string;
	limit: number | string;
	query?: string;
	createdFrom?: string;
	createdTo?: string;
	statusFilters?: AllergyStatusFilter[];
	severityFilters?: ("mild" | "moderate" | "severe")[];
}) {
	const currentPage = typeof page === "string" ? parseInt(page, 10) : page;
	const currentLimit = typeof limit === "string" ? parseInt(limit, 10) : limit;
	const { allergies, totalAllergies } = await getPatientAllergies(
		patientId,
		currentPage,
		currentLimit,
		query,
		{ createdFrom, createdTo },
		statusFilters,
		severityFilters,
		encounterId,
	);

	return {
		allergies,
		page: currentPage,
		limit: currentLimit,
		totalPages: Math.ceil(totalAllergies / currentLimit) || 1,
	};
}
