"use server";

import { getPatientDiagnoses } from "@/lib/api/get-patient-diagnoses";
import type { DiagnosisStatusFilter } from "../types";

export async function getPatientDiagnosesTableAction({
	patientId,
	encounterId,
	page,
	limit,
	query = "",
	createdFrom = "",
	createdTo = "",
	diagnosedFrom = "",
	diagnosedTo = "",
	lastReviewedFrom = "",
	lastReviewedTo = "",
	statusFilters = [],
}: {
	patientId: string;
	encounterId?: string;
	page: number | string;
	limit: number | string;
	query?: string;
	createdFrom?: string;
	createdTo?: string;
	diagnosedFrom?: string;
	diagnosedTo?: string;
	lastReviewedFrom?: string;
	lastReviewedTo?: string;
	statusFilters?: DiagnosisStatusFilter[];
}) {
	const currentPage = typeof page === "string" ? parseInt(page, 10) : page;
	const currentLimit = typeof limit === "string" ? parseInt(limit, 10) : limit;
	const { diagnoses, totalDiagnoses } = await getPatientDiagnoses(
		patientId,
		currentPage,
		currentLimit,
		query,
		{
			createdFrom,
			createdTo,
			diagnosedFrom,
			diagnosedTo,
			lastReviewedFrom,
			lastReviewedTo,
		},
		statusFilters,
		encounterId,
	);

	return {
		diagnoses,
		page: currentPage,
		limit: currentLimit,
		totalPages: Math.ceil(totalDiagnoses / currentLimit) || 1,
	};
}
