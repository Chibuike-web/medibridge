"use server";

import { getTotalPatient } from "@/lib/api/get-total-patient";
import { getTotalPendingTransfers } from "@/lib/api/get-total-pending-transfers";
import { getTotalTransfers } from "@/lib/api/get-total-transfers";
import { OverviewStats } from "./types";

export async function getOverviewStatsService(): Promise<OverviewStats> {
	const [patients, transfers, pendingTransfers] = await Promise.all([
		getTotalPatient(),
		getTotalTransfers(),
		getTotalPendingTransfers(),
	]);

	return { ...patients, ...transfers, ...pendingTransfers };
}
