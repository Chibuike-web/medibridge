import { count, eq } from "drizzle-orm";
import { patient, patientTransfer } from "@/db/schemas";
import { db } from "../better-auth/auth";
import { getOrganizationId } from "./get-organization-id";

export async function getOverviewStats() {
	const organizationId = await getOrganizationId();

	if (!organizationId) {
		return {
			totalPatients: 0,
			transferredRecords: 0,
			pendingTransfers: 0,
			patientCreatedAt: [],
			patientTransferredAt: [],
			pendingTransferredAt: [],
			hasPatients: false,
		};
	}

	const [
		patientCountRows,
		transferCountRows,
		pendingTransferCountRows,
		patientRows,
		transferRows,
		pendingRows,
	] = await Promise.all([
		db.select({ value: count() }).from(patient).where(eq(patient.organizationId, organizationId)),

		db
			.select({ value: count() })
			.from(patientTransfer)
			.where(eq(patientTransfer.sourceOrganizationId, organizationId)),

		db
			.select({ value: count() })
			.from(patientTransfer)
			.where(eq(patientTransfer.targetOrganizationId, organizationId)),

		db
			.select({ createdAt: patient.createdAt })
			.from(patient)
			.where(eq(patient.organizationId, organizationId)),

		db
			.select({ createdAt: patientTransfer.createdAt })
			.from(patientTransfer)
			.where(eq(patientTransfer.sourceOrganizationId, organizationId)),

		db
			.select({ createdAt: patientTransfer.createdAt })
			.from(patientTransfer)
			.where(eq(patientTransfer.targetOrganizationId, organizationId)),
	]);

	const totalPatients = patientCountRows[0]?.value ?? 0;

	return {
		totalPatients,
		transferredRecords: transferCountRows[0]?.value ?? 0,
		pendingTransfers: pendingTransferCountRows[0]?.value ?? 0,
		patientCreatedAt: patientRows.map((row) => row.createdAt.toISOString()),
		patientTransferredAt: transferRows.map((row) => row.createdAt.toISOString()),
		pendingTransferredAt: pendingRows.map((row) => row.createdAt.toISOString()),
		hasPatients: totalPatients > 0,
	};
}
