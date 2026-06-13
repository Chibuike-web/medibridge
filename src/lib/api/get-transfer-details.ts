import { unstable_cache } from "next/cache";
import { and, eq } from "drizzle-orm";
import {
	patient,
	patientPersonalInformation,
	patientTransfer,
	patientTransferContent,
} from "@/db/schemas";
import type { TransferDetailsType, TransferType } from "@/features/transfers/types";
import { db } from "../better-auth/auth";
import { getOrganizationId } from "./get-organization-id";

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

const transferStatuses = [
	"pending",
	"rejected",
	"completed",
	"failed",
	"cancelled",
] as const satisfies readonly TransferType["status"][];

function toTransferStatus(status: string): TransferType["status"] {
	if (status === "approved" || status === "sent") {
		return "completed";
	}

	return transferStatuses.includes(status as TransferType["status"])
		? (status as TransferType["status"])
		: "pending";
}

function formatContentType(value: string) {
	return value
		.split(/[-_\s]+/)
		.filter(Boolean)
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join(" ");
}

export async function getTransferDetails(
	transferId: string,
): Promise<TransferDetailsType | null> {
	const organizationId = await getOrganizationId();

	if (!organizationId) return null;

	return unstable_cache(
		async () => {
			const [transfer] = await db
				.select({
					transferId: patientTransfer.id,
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
				.innerJoin(patient, eq(patientTransfer.patientId, patient.id))
				.innerJoin(
					patientPersonalInformation,
					eq(patient.id, patientPersonalInformation.patientId),
				)
				.where(
					and(
						eq(patientTransfer.id, transferId),
						eq(patientTransfer.sourceOrganizationId, organizationId),
					),
				);

			if (!transfer) return null;

			const transferContent = await db
				.select({
					contentType: patientTransferContent.contentType,
					recordId: patientTransferContent.recordId,
				})
				.from(patientTransferContent)
				.where(eq(patientTransferContent.transferId, transfer.transferId));

			return {
				id: transfer.transferId,
				patientName: formatPatientName(transfer),
				patientFirstName: transfer.firstName,
				patientMiddleName: transfer.middleName,
				patientLastName: transfer.lastName,
				patientId: transfer.patientId,
				status: toTransferStatus(transfer.status),
				requestedAt: transfer.requestedAt.toISOString(),
				requestedBy: transfer.requestedBy,
				createdBy: transfer.createdBy,
				updatedBy: transfer.updatedBy,
				targetHospitalName: transfer.targetHospitalName,
				targetHospitalAdminName: transfer.targetHospitalAdminName,
				targetHospitalAdminEmail: transfer.targetHospitalAdminEmail,
				transferContent: transferContent.map((content) => ({
					contentType: formatContentType(content.contentType),
					recordId: content.recordId,
				})),
			};
		},
		[`transfer-details-record-primary-ids-${organizationId}-${transferId}`],
		{ tags: [`transfer-details-${organizationId}-${transferId}`] },
	)();
}
