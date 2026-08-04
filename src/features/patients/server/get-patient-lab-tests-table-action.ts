"use server";

import { getPatientLabTests } from "@/lib/api/get-patient-lab-tests";
import type { LabTestFlagFilter, LabTestStatusFilter } from "../types";

export async function getPatientLabTestsTableAction({
	patientId,
	encounterId,
	page,
	limit,
	query = "",
	createdFrom = "",
	createdTo = "",
	statusFilters = [],
	flagFilters = [],
}: {
	patientId: string;
	encounterId?: string;
	page: number | string;
	limit: number | string;
	query?: string;
	createdFrom?: string;
	createdTo?: string;
	statusFilters?: LabTestStatusFilter[];
	flagFilters?: LabTestFlagFilter[];
}) {
	const currentPage = typeof page === "string" ? parseInt(page, 10) : page;
	const currentLimit = typeof limit === "string" ? parseInt(limit, 10) : limit;
	const { labTests, totalLabTests } = await getPatientLabTests(
		patientId,
		currentPage,
		currentLimit,
		query,
		{ createdFrom, createdTo },
		statusFilters,
		flagFilters,
		encounterId,
	);

	return {
		labTests,
		page: currentPage,
		limit: currentLimit,
		totalPages: Math.ceil(totalLabTests / currentLimit) || 1,
	};
}
