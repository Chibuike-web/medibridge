import { eq } from "drizzle-orm";

import { patient, patientPersonalInformation, patientTransfer } from "@/db/schemas";

import { db } from "../better-auth/auth";
import { getOrganizationId } from "./get-organization-id";

export async function getTotalTransfers() {
	const organizationId = await getOrganizationId();

	if (!organizationId) {
		return [];
	}

	const rows = await db
		.select({
			transferId: patientTransfer.id,
			transferStatus: patientTransfer.status,

			requestedAt: patientTransfer.createdAt,
			updatedAt: patientTransfer.updatedAt,

			patientId: patient.id,
			firstName: patientPersonalInformation.firstName,
			lastName: patientPersonalInformation.lastName,

			targetHospital: patientTransfer.targetHospitalName,

			targetHospitalAdminName: patientTransfer.targetHospitalAdminName,

			targetHospitalAdminEmail: patientTransfer.targetHospitalAdminEmail,

			patientApprovalStatus: patientTransfer.patientApprovalStatus,

			sentAt: patientTransfer.sentAt,
		})
		.from(patientTransfer)
		.leftJoin(patient, eq(patientTransfer.patientId, patient.id))
		.leftJoin(patientPersonalInformation, eq(patient.id, patientPersonalInformation.patientId))
		.where(eq(patientTransfer.sourceOrganizationId, organizationId));

	return rows.map((row) => ({
		transferStatus: row.transferStatus,

		patientId: row.patientId,

		transferId: row.transferId,

		patientName: `${row.firstName ?? ""} ${row.lastName ?? ""}`.trim(),

		targetHospital: row.targetHospital,

		targetHospitalAdminName: row.targetHospitalAdminName,

		targetHospitalAdminEmail: row.targetHospitalAdminEmail,

		requestedAt: row.requestedAt.toISOString(),

		transferProgress: {
			requested: {
				status: "completed",
				date: row.requestedAt.toISOString(),
			},

			patientApproval: {
				status: row.patientApprovalStatus,
				description:
					row.patientApprovalStatus === "approved"
						? "Patient approved transfer"
						: "Waiting for patient response",
			},

			sent: {
				status: row.sentAt ? "completed" : "not_started",
				date: row.sentAt?.toISOString() ?? null,
			},
		},
	}));
}
