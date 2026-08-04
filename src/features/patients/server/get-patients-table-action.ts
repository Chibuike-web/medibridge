"use server";

import { getPatients } from "@/lib/api/get-patients";
import type { PatientCreatedAtFilter, PatientFilterOptions } from "@/lib/api/get-patients";

export async function getPatientsTableAction({
	page,
	limit,
	query = "",
	createdAtFilter = {},
	patientFilterOptions = {},
}: {
	page: number | string;
	limit: number | string;
	query?: string;
	createdAtFilter?: PatientCreatedAtFilter;
	patientFilterOptions?: PatientFilterOptions;
}) {
	const currentPage = typeof page === "string" ? parseInt(page, 10) : page;
	const currentLimit = typeof limit === "string" ? parseInt(limit, 10) : limit;
	const { patients, totalPatients } = await getPatients(
		currentPage,
		currentLimit,
		query,
		createdAtFilter,
		patientFilterOptions,
	);

	return {
		patients,
		page: currentPage,
		limit: currentLimit,
		totalPages: Math.ceil(totalPatients / currentLimit) || 1,
	};
}
