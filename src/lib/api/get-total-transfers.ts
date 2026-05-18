import { patientTransfer } from "@/db/schemas";
import { db } from "../better-auth/auth";
import { eq } from "drizzle-orm";
import { getOrganizationId } from "./get-organization-id";

export async function getTotalTransfers() {
	const organizationId = await getOrganizationId();

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
