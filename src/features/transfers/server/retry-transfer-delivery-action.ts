"use server";

import bcrypt from "bcrypt";
import { randomInt, randomUUID } from "crypto";
import { and, eq } from "drizzle-orm";
import { updateTag } from "next/cache";
import {
	patientRecordAccess,
	patientRecordAccessVerification,
	patientTransfer,
	patientTransferProgress,
} from "@/db/schemas";
import { getOrganizationId } from "@/lib/api/get-organization-id";
import { getSessionData } from "@/lib/api/get-session-data";
import { db } from "@/lib/better-auth/auth";
import { ENV } from "@/lib/utils/env";
import { sendAccessCodeEmail } from "@/lib/utils/send-access-code-email";

type RetryTransferDeliveryResult =
	| { status: "success"; message: string }
	| { status: "failed" | "unauthorized"; error: string };

export async function retryTransferDeliveryAction(
	transferId: string,
): Promise<RetryTransferDeliveryResult> {
	const session = await getSessionData();

	if (!session?.user?.id) {
		return { status: "unauthorized", error: "You must be signed in to retry a transfer." };
	}

	if (!session.user.emailVerified) {
		return { status: "failed", error: "Verify your email before retrying a transfer." };
	}

	const organizationId = await getOrganizationId();

	if (!organizationId) {
		return {
			status: "failed",
			error: "Your hospital must be verified before you can retry a transfer.",
		};
	}

	const [transfer] = await db
		.select({
			status: patientTransfer.status,
			targetHospitalName: patientTransfer.targetHospitalName,
			targetHospitalEmail: patientTransfer.targetHospitalEmail,
			accessId: patientRecordAccess.id,
			accessStatus: patientRecordAccess.status,
			accessExpiresAt: patientRecordAccess.expiresAt,
		})
		.from(patientTransfer)
		.leftJoin(patientRecordAccess, eq(patientRecordAccess.patientTransferId, patientTransfer.id))
		.where(
			and(
				eq(patientTransfer.id, transferId),
				eq(patientTransfer.sourceOrganizationId, organizationId),
			),
		)
		.limit(1);

	if (!transfer) {
		return { status: "failed", error: "This transfer could not be found." };
	}

	if (transfer.status === "completed") {
		return { status: "success", message: "The access code was already sent." };
	}

	const { accessId } = transfer;

	if (transfer.status !== "failed" || !accessId || !transfer.accessExpiresAt) {
		return { status: "failed", error: "Only a transfer whose delivery failed can be retried." };
	}

	if (transfer.accessStatus === "revoked" || transfer.accessExpiresAt.getTime() <= Date.now()) {
		return {
			status: "failed",
			error: "The patient's approval for this transfer has ended. Start a new transfer instead.",
		};
	}

	const now = new Date();

	try {
		const delivery = await db.transaction(async (tx) => {
			// Keep the email send inside this transaction: the row lock is what stops two retries
			// sending two codes, and Postgres releases it if the process dies mid-send.
			const [lockedTransfer] = await tx
				.select({ id: patientTransfer.id })
				.from(patientTransfer)
				.where(and(eq(patientTransfer.id, transferId), eq(patientTransfer.status, "failed")))
				.for("update", { skipLocked: true });

			if (!lockedTransfer) return "busy";

			const code = randomInt(100000, 1000000).toString();
			const emailResult = await sendAccessCodeEmail({
				email: transfer.targetHospitalEmail,
				code,
				accessUrl: new URL(`/verify-access/${accessId}`, ENV.BETTER_AUTH_URL).toString(),
			});

			if (emailResult.error) {
				console.error("Retrying the access email failed:", emailResult.error);

				await tx
					.update(patientTransfer)
					.set({ failedAt: now, updatedAt: now, updatedBy: session.user.id })
					.where(eq(patientTransfer.id, transferId));

				return "failed";
			}

			await tx.insert(patientRecordAccessVerification).values({
				id: randomUUID(),
				accessId,
				codeHash: await bcrypt.hash(code, 10),
				codeExpiresAt: new Date(now.getTime() + 10 * 60 * 1000),
				targetHospitalEmail: transfer.targetHospitalEmail,
				targetHospitalName: transfer.targetHospitalName,
			});
			await tx
				.update(patientTransfer)
				.set({
					status: "completed",
					deliveryStatus: "sent",
					sentAt: now,
					completedAt: now,
					failedAt: null,
					updatedAt: now,
					updatedBy: session.user.id,
				})
				.where(eq(patientTransfer.id, transferId));
			await tx
				.update(patientTransferProgress)
				.set({
					status: "completed",
					description: "Selected records were sent to the receiving hospital.",
				})
				.where(
					and(
						eq(patientTransferProgress.transferId, transferId),
						eq(patientTransferProgress.title, "Clinical packet sent"),
					),
				);

			return "sent";
		});

		if (delivery === "busy") {
			return { status: "failed", error: "This transfer is already being retried." };
		}

		updateTag(`transfers-list-${organizationId}`);
		updateTag(`transfer-details-${organizationId}-${transferId}`);
		updateTag(`recent-transfers-${organizationId}`);
		updateTag(`overview-stats-${organizationId}`);

		if (delivery === "failed") {
			return {
				status: "failed",
				error: `We still couldn’t send the access email to ${transfer.targetHospitalName}. Please try again.`,
			};
		}

		return { status: "success", message: `Access code sent to ${transfer.targetHospitalEmail}.` };
	} catch (error) {
		console.error("Retrying the transfer delivery failed:", error);
		return { status: "failed", error: "We couldn’t retry this transfer. Please try again." };
	}
}
