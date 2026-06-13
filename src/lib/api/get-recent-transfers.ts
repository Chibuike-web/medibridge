import { unstable_cache } from "next/cache";
import { patientPersonalInformation, patientTransfer } from "@/db/schemas";
import { db } from "../better-auth/auth";
import { desc, eq } from "drizzle-orm";
import { getOrganizationId } from "./get-organization-id";
import type { TransferType } from "@/features/transfers/types";

function formatPatientName({
	firstName,
	middleName,
	lastName,
}: {
	firstName: string;
	middleName: string | null;
	lastName: string;
}) {
	return [firstName, middleName, lastName].filter(Boolean).join(" ");
}

function toTransferStatus(status: string): TransferType["status"] {
	if (status === "approved" || status === "sent") {
		return "completed";
	}

	if (
		status === "pending" ||
		status === "rejected" ||
		status === "completed" ||
		status === "failed" ||
		status === "cancelled"
	) {
		return status;
	}

	return "pending";
}

export async function getRecentTransfer() {
	const organizationId = await getOrganizationId();

	if (!organizationId) return [];

	return unstable_cache(
		async () => {
			const rows = await db
				.select({
					id: patientTransfer.id,
					status: patientTransfer.status,
					patientId: patientTransfer.patientId,
					requestedAt: patientTransfer.requestedAt,
					requestedBy: patientTransfer.requestedBy,
					createdBy: patientTransfer.createdBy,
					updatedBy: patientTransfer.updatedBy,
					targetHospitalName: patientTransfer.targetHospitalName,
					targetHospitalAdminName: patientTransfer.targetHospitalAdminName,
					targetHospitalAdminEmail: patientTransfer.targetHospitalAdminEmail,
					firstName: patientPersonalInformation.firstName,
					middleName: patientPersonalInformation.middleName,
					lastName: patientPersonalInformation.lastName,
				})
				.from(patientTransfer)
				.innerJoin(
					patientPersonalInformation,
					eq(patientTransfer.patientId, patientPersonalInformation.patientId),
				)
				.where(eq(patientTransfer.sourceOrganizationId, organizationId))
				.orderBy(desc(patientTransfer.createdAt))
				.limit(10);

			return rows.map((row) => ({
				id: row.id,
				patientName: formatPatientName(row),
				patientFirstName: row.firstName,
				patientMiddleName: row.middleName,
				patientLastName: row.lastName,
				patientId: row.patientId,
				status: toTransferStatus(row.status),
				requestedAt: row.requestedAt.toISOString(),
				requestedBy: row.requestedBy,
				createdBy: row.createdBy,
				updatedBy: row.updatedBy,
				targetHospitalName: row.targetHospitalName,
				targetHospitalAdminName: row.targetHospitalAdminName,
				targetHospitalAdminEmail: row.targetHospitalAdminEmail,
				transferContent: [],
			}));
		},
		[`recent-transfers-${organizationId}`],
		{ tags: [`recent-transfers-${organizationId}`] },
	)();
}
