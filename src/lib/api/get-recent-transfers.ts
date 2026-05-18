import { patientPersonalInformation, patientTransfer } from "@/db/schemas";
import { db } from "../better-auth/auth";
import { desc, eq } from "drizzle-orm";
import { getOrganizationId } from "./get-organization-id";

export async function getRecentTransfer() {
	const organizationId = await getOrganizationId();

	if (!organizationId) return [];

	const rows = await db
		.select({
			id: patientTransfer.id,
			status: patientTransfer.status,
			patientId: patientTransfer.patientId,
			requestedAt: patientTransfer.requestedAt,
			targetHospitalName: patientTransfer.targetHospitalName,
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
		patientFirstName: row.firstName,
		patientMiddleName: row.middleName,
		patientLastName: row.lastName,
		patientId: row.patientId,
		status: row.status as
			| "pending"
			| "approved"
			| "rejected"
			| "sent"
			| "completed"
			| "failed"
			| "cancelled",
		requestedAt: row.requestedAt.toISOString(),
		targetHospitalName: row.targetHospitalName,
	}));
}
