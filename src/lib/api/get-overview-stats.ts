import { cache } from "react";
import { cacheLife, cacheTag } from "next/cache";
import { and, count, eq } from "drizzle-orm";
import { patient, patientEncounter, patientTransfer } from "@/db/schemas";
import { db } from "../better-auth/auth";
import { getOrganizationId } from "./get-organization-id";

export const getOverviewStats = cache(async () => {
	const organizationId = await getOrganizationId();

	if (!organizationId) {
		return {
			totalPatients: 0,
			completedTransfers: 0,
			pendingTransfers: 0,
			patientCreatedAt: [],
			patientTransferredAt: [],
			pendingTransferredAt: [],
			encounterCreatedAt: [],
			hasPatients: false,
		};
	}

	return getOverviewStatsForOrganization(organizationId);
});

export async function getOverviewStatsForOrganization(organizationId: string) {
	"use cache";
	cacheLife("max");
	cacheTag(`overview-stats-${organizationId}`);

	const [
		patientCountRows,
		completedTransferCountRows,
		pendingTransferCountRows,
		patientRows,
		completedTransferRows,
		pendingRows,
		encounterRows,
	] = await Promise.all([
		db.select({ value: count() }).from(patient).where(eq(patient.organizationId, organizationId)),

		db
			.select({ value: count() })
			.from(patientTransfer)
			.where(
				and(
					eq(patientTransfer.sourceOrganizationId, organizationId),
					eq(patientTransfer.status, "completed"),
				),
			),

		db
			.select({ value: count() })
			.from(patientTransfer)
			.where(
				and(
					eq(patientTransfer.sourceOrganizationId, organizationId),
					eq(patientTransfer.status, "pending"),
				),
			),

		db
			.select({ createdAt: patient.createdAt })
			.from(patient)
			.where(eq(patient.organizationId, organizationId)),

		db
			.select({ completedAt: patientTransfer.completedAt })
			.from(patientTransfer)
			.where(
				and(
					eq(patientTransfer.sourceOrganizationId, organizationId),
					eq(patientTransfer.status, "completed"),
				),
			),

		db
			.select({ createdAt: patientTransfer.createdAt })
			.from(patientTransfer)
			.where(
				and(
					eq(patientTransfer.sourceOrganizationId, organizationId),
					eq(patientTransfer.status, "pending"),
				),
			),

		db
			.select({ createdAt: patientEncounter.createdAt })
			.from(patientEncounter)
			.innerJoin(patient, eq(patientEncounter.patientId, patient.id))
			.where(eq(patient.organizationId, organizationId)),
	]);

	const totalPatients = patientCountRows[0]?.value ?? 0;

	return {
		totalPatients,
		completedTransfers: completedTransferCountRows[0]?.value ?? 0,
		pendingTransfers: pendingTransferCountRows[0]?.value ?? 0,
		patientCreatedAt: patientRows.map((row) => row.createdAt.toISOString()),
		patientTransferredAt: completedTransferRows.flatMap((row) =>
			row.completedAt ? [row.completedAt.toISOString()] : [],
		),
		pendingTransferredAt: pendingRows.map((row) => row.createdAt.toISOString()),
		encounterCreatedAt: encounterRows.map((row) => row.createdAt.toISOString()),
		hasPatients: totalPatients > 0,
	};
}
