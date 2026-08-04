"use server";

import { getPatientMedications } from "@/lib/api/get-patient-medications";
import type { MedicationStatusFilter } from "../types";

export async function getPatientMedicationsTableAction({
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
	statusFilters?: MedicationStatusFilter[];
}) {
	const currentPage = typeof page === "string" ? parseInt(page, 10) : page;
	const currentLimit = typeof limit === "string" ? parseInt(limit, 10) : limit;
	const { medications, totalMedications } = await getPatientMedications(
		patientId,
		currentPage,
		currentLimit,
		query,
		{ createdFrom, createdTo },
		statusFilters,
		encounterId,
	);

	return {
		medications,
		page: currentPage,
		limit: currentLimit,
		totalPages: Math.ceil(totalMedications / currentLimit) || 1,
	};
}
