"use server";

import { getPatientProcedures } from "@/lib/api/get-patient-procedures";
import type { ProcedureStatusFilter } from "../types";

export async function getPatientProceduresTableAction({
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
	statusFilters?: ProcedureStatusFilter[];
}) {
	const currentPage = typeof page === "string" ? parseInt(page, 10) : page;
	const currentLimit = typeof limit === "string" ? parseInt(limit, 10) : limit;
	const { procedures, totalProcedures } = await getPatientProcedures(
		patientId,
		currentPage,
		currentLimit,
		query,
		{ createdFrom, createdTo },
		statusFilters,
		encounterId,
	);

	return {
		procedures,
		page: currentPage,
		limit: currentLimit,
		totalPages: Math.ceil(totalProcedures / currentLimit) || 1,
	};
}
