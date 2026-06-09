"use server";

import { getPatients } from "@/lib/api/get-patients";
import { verifySession } from "@/lib/api/verify-session";

type GetTransferPatientOptionsParams = {
	page: number | string;
	limit?: number | string;
};

export async function getTransferPatientOptionsAction({
	page,
	limit,
}: GetTransferPatientOptionsParams) {
	await verifySession();

	const currentPage = typeof page === "string" ? parseInt(page, 10) : page;
	const currentLimit = typeof limit === "string" ? parseInt(limit, 10) : (limit ?? 20);
	const { patients, totalPatients } = await getPatients(currentPage, currentLimit);

	return {
		patients,
		page: currentPage,
		totalPages: Math.ceil(totalPatients / currentLimit) || 1,
	};
}
