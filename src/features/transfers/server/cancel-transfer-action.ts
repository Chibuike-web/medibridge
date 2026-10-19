"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath, updateTag } from "next/cache";
import { patientTransfer, patientTransferProgress } from "@/db/schemas";
import { getOrganizationId } from "@/lib/api/get-organization-id";
import { getSessionData } from "@/lib/api/get-session-data";
import { db } from "@/lib/better-auth/auth";

type CancelTransferResult =
	| { status: "success"; message: string }
	| { status: "failed" | "unauthorized"; error: string };

export async function cancelTransferAction(transferId: string): Promise<CancelTransferResult> {
	const session = await getSessionData();

	if (!session?.user?.id) {
		return { status: "unauthorized", error: "You must be signed in to cancel a transfer." };
	}

	if (!session.user.emailVerified) {
		return { status: "failed", error: "Verify your email before cancelling a transfer." };
	}

	const organizationId = await getOrganizationId();

	if (!organizationId) {
		return {
			status: "failed",
			error: "Your hospital must be verified before you can cancel a transfer.",
		};
	}

	const now = new Date();

	try {
		const isCancelled = await db.transaction(async (tx) => {
			const [cancelledTransfer] = await tx
				.update(patientTransfer)
				.set({ status: "cancelled", cancelledAt: now, updatedAt: now, updatedBy: session.user.id })
				.where(
					and(
						eq(patientTransfer.id, transferId),
						eq(patientTransfer.sourceOrganizationId, organizationId),
						eq(patientTransfer.status, "pending"),
						eq(patientTransfer.patientApprovalStatus, "waiting"),
					),
				)
				.returning({ id: patientTransfer.id });

			if (!cancelledTransfer) return false;

			await tx
				.update(patientTransferProgress)
				.set({ status: "cancelled", description: "The hospital withdrew the approval request." })
				.where(
					and(
						eq(patientTransferProgress.transferId, transferId),
						eq(patientTransferProgress.title, "Patient approval"),
					),
				);

			return true;
		});

		if (!isCancelled) {
			const [currentTransfer] = await db
				.select({
					status: patientTransfer.status,
					patientApprovalStatus: patientTransfer.patientApprovalStatus,
				})
				.from(patientTransfer)
				.where(
					and(
						eq(patientTransfer.id, transferId),
						eq(patientTransfer.sourceOrganizationId, organizationId),
					),
				)
				.limit(1);

			if (!currentTransfer) {
				return { status: "failed", error: "This transfer could not be found." };
			}

			if (currentTransfer.status === "cancelled") {
				return { status: "success", message: "This transfer was already cancelled." };
			}

			return {
				status: "failed",
				error:
					currentTransfer.patientApprovalStatus === "approved"
						? "The patient has already approved this transfer, so it can no longer be cancelled."
						: "The patient has already rejected this transfer, so there is nothing to cancel.",
			};
		}
	} catch (error) {
		console.error("Cancelling the transfer failed:", error);
		return { status: "failed", error: "We couldn’t cancel this transfer. Please try again." };
	}

	revalidatePath(`/transfer-approval/${transferId}`);
	updateTag(`transfers-list-${organizationId}`);
	updateTag(`transfer-details-${organizationId}-${transferId}`);
	updateTag(`recent-transfers-${organizationId}`);
	updateTag(`overview-stats-${organizationId}`);

	return {
		status: "success",
		message: "Transfer cancelled. The patient can no longer respond to the request.",
	};
}
