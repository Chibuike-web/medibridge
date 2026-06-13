"use server";

import { getPatients } from "@/lib/api/get-patients";
import { getTransferDetails } from "@/lib/api/get-transfer-details";
import { getTransfers } from "@/lib/api/get-transfers";
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

export async function getTransfersTableAction({
	page,
	limit,
	query = "",
}: {
	page: number | string;
	limit: number | string;
	query?: string;
}) {
	await verifySession();

	const currentPage = typeof page === "string" ? parseInt(page, 10) : page;
	const currentLimit = typeof limit === "string" ? parseInt(limit, 10) : limit;
	const { transfers, totalTransfers } = await getTransfers(currentPage, currentLimit, query);

	return {
		transfers,
		page: currentPage,
		limit: currentLimit,
		totalPages: Math.ceil(totalTransfers / currentLimit) || 1,
	};
}

export async function getTransferDetailsAction(transferId: string) {
	await verifySession();

	const transfer = await getTransferDetails(transferId);

	return { transfer };
}
