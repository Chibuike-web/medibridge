import { patientTransfer } from "@/db/schemas";
import { db } from "../better-auth/auth";
import { eq } from "drizzle-orm";
import { getActiveOrganizationId } from "./get-active-organization-id";

export async function getTotalTransfers() {
	const organizationId = await getActiveOrganizationId();

	if (!organizationId) {
		return { transferredRecords: 0, patientTransferredAt: [] };
	}

	const rows = await db
		.select({ createdAt: patientTransfer.createdAt })
		.from(patientTransfer)
		.where(eq(patientTransfer.sourceOrganizationId, organizationId));

	return {
		transferredRecords: rows.length,
		patientTransferredAt: rows.map((row) => row.createdAt.toISOString()),
	};
}
