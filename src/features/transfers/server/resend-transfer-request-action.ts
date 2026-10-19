"use server";

import { and, eq } from "drizzle-orm";
import { updateTag } from "next/cache";
import {
	organization,
	patientContactInformation,
	patientPersonalInformation,
	patientTransfer,
} from "@/db/schemas";
import { getOrganizationId } from "@/lib/api/get-organization-id";
import { getSessionData } from "@/lib/api/get-session-data";
import { createTransferApprovalToken } from "@/lib/api/transfer-approval-token";
import { db } from "@/lib/better-auth/auth";
import { ENV } from "@/lib/utils/env";
import { sendTransferApprovalEmail } from "@/lib/utils/send-transfer-approval-email";

type ResendTransferRequestResult =
	| { status: "success"; message: string }
	| { status: "failed" | "unauthorized"; error: string };

export async function resendTransferRequestAction(
	transferId: string,
): Promise<ResendTransferRequestResult> {
	const session = await getSessionData();

	if (!session?.user?.id) {
		return { status: "unauthorized", error: "You must be signed in to resend a transfer request." };
	}

	if (!session.user.emailVerified) {
		return { status: "failed", error: "Verify your email before resending a transfer request." };
	}

	const organizationId = await getOrganizationId();

	if (!organizationId) {
		return {
			status: "failed",
			error: "Your hospital must be verified before you can resend a transfer request.",
		};
	}

	const [transfer] = await db
		.select({
			patientId: patientTransfer.patientId,
			status: patientTransfer.status,
			patientApprovalStatus: patientTransfer.patientApprovalStatus,
			targetHospitalName: patientTransfer.targetHospitalName,
			sourceHospitalName: organization.name,
			firstName: patientPersonalInformation.firstName,
			middleName: patientPersonalInformation.middleName,
			lastName: patientPersonalInformation.lastName,
			email: patientContactInformation.emailAddress,
		})
		.from(patientTransfer)
		.innerJoin(organization, eq(organization.id, patientTransfer.sourceOrganizationId))
		.innerJoin(
			patientPersonalInformation,
			eq(patientPersonalInformation.patientId, patientTransfer.patientId),
		)
		.leftJoin(
			patientContactInformation,
			eq(patientContactInformation.patientId, patientTransfer.patientId),
		)
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

	if (transfer.status !== "pending" || transfer.patientApprovalStatus !== "waiting") {
		return {
			status: "failed",
			error: "Only a transfer still waiting for the patient's answer can be resent.",
		};
	}

	if (!transfer.email) {
		return {
			status: "failed",
			error: "Add an email address for this patient before resending the request.",
		};
	}

	const now = new Date();
	const approvalUrl = new URL(`/transfer-approval/${transferId}`, ENV.BETTER_AUTH_URL);
	approvalUrl.searchParams.set(
		"token",
		await createTransferApprovalToken({
			transferId,
			patientId: transfer.patientId,
			expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
		}),
	);

	try {
		const emailResult = await sendTransferApprovalEmail({
			email: transfer.email,
			patientName: [transfer.firstName, transfer.middleName, transfer.lastName]
				.filter(Boolean)
				.join(" "),
			sourceHospitalName: transfer.sourceHospitalName,
			targetHospitalName: transfer.targetHospitalName,
			approvalUrl: approvalUrl.toString(),
		});

		if (emailResult.error) {
			console.error("Resending the transfer approval email failed:", emailResult.error);
			return { status: "failed", error: "We couldn’t send the approval link. Please try again." };
		}
	} catch (error) {
		console.error("Resending the transfer approval email failed:", error);
		return { status: "failed", error: "We couldn’t send the approval link. Please try again." };
	}

	await db
		.update(patientTransfer)
		.set({ updatedAt: now, updatedBy: session.user.id })
		.where(eq(patientTransfer.id, transferId));

	updateTag(`transfer-details-${organizationId}-${transferId}`);

	return { status: "success", message: `Approval link sent to ${transfer.email}.` };
}
