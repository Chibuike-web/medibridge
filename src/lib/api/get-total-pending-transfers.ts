import { patientTransfer } from "@/db/schemas";
import { db } from "../better-auth/auth";
import { and, eq } from "drizzle-orm";
import { getActiveOrganizationId } from "./get-active-organization-id";

export async function getTotalPendingTransfers() {
	const organizationId = await getActiveOrganizationId();

	if (!organizationId) {
		return { pendingTransfers: 0, pendingTransferredAt: [] };
	}

	const rows = await db
		.select({ createdAt: patientTransfer.createdAt })
		.from(patientTransfer)
		.where(
			and(
				eq(patientTransfer.sourceOrganizationId, organizationId),
				eq(patientTransfer.status, "pending"),
			),
		);

	return {
		pendingTransfers: rows.length,
		pendingTransferredAt: rows.map((row) => row.createdAt.toISOString()),
	};
}
