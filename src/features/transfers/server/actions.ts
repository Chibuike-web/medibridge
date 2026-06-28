"use server";

import { getTransfers } from "@/lib/api/get-transfers";
import { verifySession } from "@/lib/api/verify-session";

export async function getTransfersTableAction({
	page,
	limit,
	query = "",
	requestedAtFilter = {},
}: {
	page: number | string;
	limit: number | string;
	query?: string;
	requestedAtFilter?: {
		from?: Date;
		to?: Date;
	};
}) {
	await verifySession();

	const currentPage = typeof page === "string" ? parseInt(page, 10) : page;
	const currentLimit = typeof limit === "string" ? parseInt(limit, 10) : limit;
	const { transfers, totalTransfers } = await getTransfers(
		currentPage,
		currentLimit,
		query,
		requestedAtFilter,
	);

	return {
		transfers,
		page: currentPage,
		limit: currentLimit,
		totalPages: Math.ceil(totalTransfers / currentLimit) || 1,
	};
}
