import { eq, or } from "drizzle-orm";
import {
	organization,
	patient,
	patientPersonalInformation,
	patientTransfer,
	patientTransferContent,
} from "@/db/schemas";
import { db } from "@/lib/better-auth/auth";

export type TransferApprovalRecord = {
	id: string;
	transferId: string;
	patientName: string;
	patientId: string;
	sourceHospitalName: string;
	targetHospitalName: string;
	requestedBy: string | null;
	requestedAt: string;
	status: string;
	patientApprovalStatus: string | null;
	patientRejectionReason: string | null;
	selectedRecords: {
		contentType: string;
		recordId: string;
	}[];
};

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

function formatContentType(value: string) {
	return value
		.split(/[-_\s]+/)
		.filter(Boolean)
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join(" ");
}

export async function getTransferApproval(
	transferId: string,
): Promise<TransferApprovalRecord | null> {
	const [transfer] = await db
		.select({
			id: patientTransfer.id,
			transferId: patientTransfer.transferId,
			patientId: patientTransfer.patientId,
			status: patientTransfer.status,
			patientApprovalStatus: patientTransfer.patientApprovalStatus,
			patientRejectionReason: patientTransfer.patientRejectionReason,
			requestedAt: patientTransfer.requestedAt,
			requestedBy: patientTransfer.requestedBy,
			sourceHospitalName: organization.name,
			targetHospitalName: patientTransfer.targetHospitalName,
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
		.innerJoin(organization, eq(patientTransfer.sourceOrganizationId, organization.id))
		.where(or(eq(patientTransfer.transferId, transferId), eq(patientTransfer.id, transferId)));

	if (!transfer) return null;

	const selectedRecords = await db
		.select({
			contentType: patientTransferContent.contentType,
			recordId: patientTransferContent.recordId,
		})
		.from(patientTransferContent)
		.where(eq(patientTransferContent.transferId, transfer.id));

	return {
		id: transfer.id,
		transferId: transfer.transferId,
		patientName: formatPatientName(transfer),
		patientId: transfer.patientId,
		sourceHospitalName: transfer.sourceHospitalName,
		targetHospitalName: transfer.targetHospitalName,
		requestedBy: transfer.requestedBy,
		requestedAt: transfer.requestedAt.toISOString(),
		status: transfer.status,
		patientApprovalStatus: transfer.patientApprovalStatus,
		patientRejectionReason: transfer.patientRejectionReason,
		selectedRecords: selectedRecords.map((record) => ({
			contentType: formatContentType(record.contentType),
			recordId: record.recordId,
		})),
	};
}
