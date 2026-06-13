"use server";

import { eq, or } from "drizzle-orm";
import { revalidatePath, revalidateTag } from "next/cache";
import { patientTransfer } from "@/db/schemas";
import { db } from "@/lib/better-auth/auth";

async function getTransferForAction(transferId: string) {
	const [transfer] = await db
		.select({
			id: patientTransfer.id,
			transferId: patientTransfer.transferId,
			sourceOrganizationId: patientTransfer.sourceOrganizationId,
			patientApprovalStatus: patientTransfer.patientApprovalStatus,
			status: patientTransfer.status,
		})
		.from(patientTransfer)
		.where(or(eq(patientTransfer.transferId, transferId), eq(patientTransfer.id, transferId)));

	return transfer;
}

function revalidateTransferApproval({
	id,
	transferId,
	sourceOrganizationId,
}: {
	id: string;
	transferId: string;
	sourceOrganizationId: string;
}) {
	revalidatePath(`/transfer-approval/${transferId}`);
	revalidatePath(`/transfer-approval/${id}`);
	revalidateTag(`transfers-list-${sourceOrganizationId}`, "max");
	revalidateTag(`transfer-details-${sourceOrganizationId}-${id}`, "max");
}

export async function approvePatientTransferAction(transferId: string) {
	const transfer = await getTransferForAction(transferId);

	if (!transfer) {
		return { success: false, message: "This transfer request could not be found." };
	}

	if (transfer.patientApprovalStatus === "approved") {
		return { success: true, status: "approved", message: "This transfer is already approved." };
	}

	if (transfer.patientApprovalStatus === "rejected" || transfer.status === "rejected") {
		return {
			success: false,
			message: "This transfer has already been rejected and cannot be approved.",
		};
	}

	await db
		.update(patientTransfer)
		.set({
			patientApprovalStatus: "approved",
			patientRejectionReason: null,
			updatedAt: new Date(),
		})
		.where(eq(patientTransfer.id, transfer.id));

	revalidateTransferApproval(transfer);

	return {
		success: true,
		status: "approved",
		message: "Transfer request approved.",
	};
}

export async function rejectPatientTransferAction({
	transferId,
	reason,
}: {
	transferId: string;
	reason: string;
}) {
	const transfer = await getTransferForAction(transferId);
	const rejectionReason = reason.trim();

	if (!transfer) {
		return { success: false, message: "This transfer request could not be found." };
	}

	if (!rejectionReason) {
		return { success: false, message: "Please enter a reason for rejecting this transfer." };
	}

	if (transfer.patientApprovalStatus === "approved") {
		return {
			success: false,
			message: "This transfer has already been approved and cannot be rejected.",
		};
	}

	if (transfer.patientApprovalStatus === "rejected" || transfer.status === "rejected") {
		return { success: true, status: "rejected", message: "This transfer is already rejected." };
	}

	await db
		.update(patientTransfer)
		.set({
			status: "rejected",
			patientApprovalStatus: "rejected",
			patientRejectionReason: rejectionReason,
			updatedAt: new Date(),
		})
		.where(eq(patientTransfer.id, transfer.id));

	revalidateTransferApproval(transfer);

	return {
		success: true,
		status: "rejected",
		message: "Transfer request rejected.",
	};
}
