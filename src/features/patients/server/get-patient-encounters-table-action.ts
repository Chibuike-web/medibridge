"use server";

import { getPatientEncounters } from "@/lib/api/get-patient-encounters";
import type { EncounterDepartmentFilter, EncounterTypeFilter } from "../types";

export async function getPatientEncountersTableAction({
	patientId,
	page,
	limit,
	query = "",
	encounterFrom = "",
	encounterTo = "",
	createdFrom = "",
	createdTo = "",
	encounterTypeFilters = [],
	departmentFilters = [],
}: {
	patientId: string;
	page: number | string;
	limit: number | string;
	query?: string;
	encounterFrom?: string;
	encounterTo?: string;
	createdFrom?: string;
	createdTo?: string;
	encounterTypeFilters?: EncounterTypeFilter[];
	departmentFilters?: EncounterDepartmentFilter[];
}) {
	const currentPage = typeof page === "string" ? parseInt(page, 10) : page;
	const currentLimit = typeof limit === "string" ? parseInt(limit, 10) : limit;
	const { encounters, totalEncounters } = await getPatientEncounters(
		patientId,
		currentPage,
		currentLimit,
		query,
		{ encounterFrom, encounterTo, createdFrom, createdTo },
		encounterTypeFilters,
		departmentFilters,
	);

	return {
		encounters,
		page: currentPage,
		limit: currentLimit,
		totalPages: Math.ceil(totalEncounters / currentLimit) || 1,
	};
}
