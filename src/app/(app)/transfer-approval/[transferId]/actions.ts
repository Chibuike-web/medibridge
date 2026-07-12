"use server";

import bcrypt from "bcrypt";
import { randomInt, randomUUID } from "crypto";
import { and, eq } from "drizzle-orm";
import { revalidatePath, revalidateTag } from "next/cache";
import {
	patientRecordAccess,
	patientRecordAccessVerification,
	patientTransfer,
	patientTransferContent,
	patientTransferProgress,
	type PatientRecordAccessPermissions,
	type PatientRecordAccessSection,
	type PatientRecordAccessSelectedRecord,
} from "@/db/schemas";
import { db } from "@/lib/better-auth/auth";
import { sendAccessCodeEmail } from "@/lib/utils/send-access-code-email";
import { ENV } from "@/lib/utils/env";
import { verifyTransferApprovalToken } from "@/lib/api/transfer-approval-token";

const transferContentTypeToAccessSection = {
	diagnoses: "diagnoses",
	allergies: "allergies",
	immunizations: "immunizations",
	immunization: "immunizations",
	procedures: "procedures",
	medications: "medications",
	"lab-tests": "lab-tests",
	encounters: "encounters",
	imaging: "imaging",
} satisfies Record<string, PatientRecordAccessSection>;

async function getTransferForAction(transferId: string) {
	const [transfer] = await db
		.select({
			transferId: patientTransfer.id,
			patientId: patientTransfer.patientId,
			sourceOrganizationId: patientTransfer.sourceOrganizationId,
			targetHospitalAdminEmail: patientTransfer.targetHospitalAdminEmail,
			targetHospitalAdminName: patientTransfer.targetHospitalAdminName,
			targetHospitalName: patientTransfer.targetHospitalName,
			createdBy: patientTransfer.createdBy,
			requestedBy: patientTransfer.requestedBy,
			patientApprovalStatus: patientTransfer.patientApprovalStatus,
			status: patientTransfer.status,
		})
		.from(patientTransfer)
		.where(eq(patientTransfer.id, transferId));

	return transfer;
}

function getAccessSectionFromTransferContentType(contentType: string) {
	return transferContentTypeToAccessSection[contentType as keyof typeof transferContentTypeToAccessSection];
}

function buildAccessPermissions(
	selectedRecordIds: PatientRecordAccessSelectedRecord[],
): PatientRecordAccessPermissions {
	const permissions: PatientRecordAccessPermissions = {};

	for (const selectedRecord of selectedRecordIds) {
		if (selectedRecord.section === "diagnoses") {
			permissions.diagnoses = true;
		}

		if (selectedRecord.section === "allergies") {
			permissions.allergies = true;
		}

		if (selectedRecord.section === "immunizations") {
			permissions.immunizations = true;
		}

		if (selectedRecord.section === "procedures") {
			permissions.procedures = true;
		}

		if (selectedRecord.section === "medications") {
			permissions.medications = true;
		}

		if (selectedRecord.section === "lab-tests") {
			permissions.labTests = true;
		}

		if (selectedRecord.section === "encounters") {
			permissions.encounters = true;
		}

		if (selectedRecord.section === "imaging") {
			permissions.imaging = true;
		}
	}

	return permissions;
}

function buildVerifyAccessUrl(accessId: string) {
	return new URL(`/verify-access/${accessId}`, ENV.BETTER_AUTH_URL).toString();
}

function revalidateTransferApproval({
	transferId,
	sourceOrganizationId,
}: {
	transferId: string;
	sourceOrganizationId: string;
}) {
	revalidatePath(`/transfer-approval/${transferId}`);
	revalidateTag(`transfers-list-${sourceOrganizationId}`, "max");
	revalidateTag(`transfer-details-${sourceOrganizationId}-${transferId}`, "max");
}

export async function approvePatientTransferAction(transferId: string, approvalToken: string) {
	const transfer = await getTransferForAction(transferId);
	const tokenPayload = await verifyTransferApprovalToken(approvalToken, transferId);

	if (!transfer || tokenPayload?.patientId !== transfer.patientId) {
		return {
			success: false,
			message: "This transfer request could not be found.",
		};
	}

	if (transfer.patientApprovalStatus === "approved") {
		return {
			success: true,
			status: "approved",
			message: "This transfer is already approved.",
		};
	}

	if (!transfer.createdBy && !transfer.requestedBy) {
		return {
			success: false,
			message: "This transfer does not have a requesting user.",
		};
	}

	if (!transfer.targetHospitalAdminEmail) {
		return {
			success: false,
			message: "This transfer does not have a target hospital admin email.",
		};
	}

	if (transfer.patientApprovalStatus === "rejected" || transfer.status === "rejected") {
		return {
			success: false,
			message: "This transfer has already been rejected and cannot be approved.",
		};
	}

	const transferContentRows = await db
		.select({
			contentType: patientTransferContent.contentType,
			recordId: patientTransferContent.recordId,
		})
		.from(patientTransferContent)
		.where(eq(patientTransferContent.transferId, transfer.transferId));

	const selectedRecordIds = transferContentRows
		.map((transferContent) => {
			const section = getAccessSectionFromTransferContentType(transferContent.contentType);

			if (!section) return null;

			return {
				section,
				recordId: transferContent.recordId,
			} satisfies PatientRecordAccessSelectedRecord;
		})
		.filter((selectedRecord): selectedRecord is PatientRecordAccessSelectedRecord => Boolean(selectedRecord));

	if (selectedRecordIds.length === 0) {
		return {
			success: false,
			message: "This transfer does not include any records that can be shared.",
		};
	}

	const [existingAccess] = await db
		.select({ id: patientRecordAccess.id })
		.from(patientRecordAccess)
		.where(eq(patientRecordAccess.patientTransferId, transfer.transferId))
		.limit(1);

	const now = new Date();
	const accessExpiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
	const accessId = existingAccess?.id ?? randomUUID();
	const verificationCode = randomInt(100000, 1000000).toString();
	const verificationCodeHash = await bcrypt.hash(verificationCode, 10);
	const verificationCodeExpiresAt = new Date(now.getTime() + 10 * 60 * 1000);

	await db
		.update(patientTransfer)
		.set({
			patientApprovalStatus: "approved",
			patientRejectionReason: null,
			deliveryStatus: "not_started",
			updatedAt: new Date(),
		})
		.where(eq(patientTransfer.id, transfer.transferId));

	await db
		.update(patientTransferProgress)
		.set({
			status: "approved",
			description: "Patient approved the transfer request.",
		})
		.where(
			and(
				eq(patientTransferProgress.transferId, transfer.transferId),
				eq(patientTransferProgress.title, "Patient approval"),
			),
		);

	if (!existingAccess) {
		await db.insert(patientRecordAccess).values({
			id: accessId,
			patientTransferId: transfer.transferId,
			patientId: transfer.patientId,
			createdByOrganizationId: transfer.sourceOrganizationId,
			createdByUserId: transfer.createdBy ?? transfer.requestedBy!,
			recipientEmail: transfer.targetHospitalAdminEmail,
			recipientOrganizationName: transfer.targetHospitalName,
			status: "pending",
			expiresAt: accessExpiresAt,
			permissions: buildAccessPermissions(selectedRecordIds),
			selectedRecordIds,
		});
	}

	await db.insert(patientRecordAccessVerification).values({
		id: randomUUID(),
		accessId,
		codeHash: verificationCodeHash,
		codeExpiresAt: verificationCodeExpiresAt,
		targetHospitalAdminEmail: transfer.targetHospitalAdminEmail,
		targetHospitalAdminName: transfer.targetHospitalAdminName,
	});

	try {
		const emailResult = await sendAccessCodeEmail({
			email: transfer.targetHospitalAdminEmail,
			code: verificationCode,
			accessUrl: buildVerifyAccessUrl(accessId),
		});

		await db
			.update(patientTransfer)
			.set({
				status: emailResult.error ? "failed" : "completed",
				deliveryStatus: emailResult.error ? "failed" : "sent",
				sentAt: emailResult.error ? null : now,
				completedAt: emailResult.error ? null : now,
				failedAt: emailResult.error ? now : null,
				updatedAt: now,
			})
			.where(eq(patientTransfer.id, transfer.transferId));

		await db
			.update(patientTransferProgress)
			.set({
				status: emailResult.error ? "failed" : "completed",
				description: emailResult.error
					? "The receiving hospital access email could not be sent."
					: "Selected records were sent to the receiving hospital.",
			})
			.where(
				and(
					eq(patientTransferProgress.transferId, transfer.transferId),
					eq(patientTransferProgress.title, "Clinical packet sent"),
				),
			);
	} catch (error) {
		console.error(error);

		await db
			.update(patientTransfer)
			.set({
				status: "failed",
				deliveryStatus: "failed",
				failedAt: now,
				updatedAt: now,
			})
			.where(eq(patientTransfer.id, transfer.transferId));

		await db
			.update(patientTransferProgress)
			.set({
				status: "failed",
				description: "The receiving hospital access email could not be sent.",
			})
			.where(
				and(
					eq(patientTransferProgress.transferId, transfer.transferId),
					eq(patientTransferProgress.title, "Clinical packet sent"),
				),
			);
	}

	revalidateTransferApproval(transfer);

	return {
		success: true,
		status: "approved",
		message: "Transfer request approved.",
	};
}

export async function rejectPatientTransferAction({
	transferId,
	approvalToken,
	reason,
}: {
	transferId: string;
	approvalToken: string;
	reason: string;
}) {
	const transfer = await getTransferForAction(transferId);
	const tokenPayload = await verifyTransferApprovalToken(approvalToken, transferId);
	const rejectionReason = reason.trim();

	if (!transfer || tokenPayload?.patientId !== transfer.patientId) {
		return {
			success: false,
			message: "This transfer request could not be found.",
		};
	}

	if (!rejectionReason) {
		return {
			success: false,
			message: "Please enter a reason for rejecting this transfer.",
		};
	}

	if (transfer.patientApprovalStatus === "approved") {
		return {
			success: false,
			message: "This transfer has already been approved and cannot be rejected.",
		};
	}

	if (transfer.patientApprovalStatus === "rejected" || transfer.status === "rejected") {
		return {
			success: true,
			status: "rejected",
			message: "This transfer is already rejected.",
		};
	}

	await db
		.update(patientTransfer)
		.set({
			status: "rejected",
			patientApprovalStatus: "rejected",
			patientRejectionReason: rejectionReason,
			updatedAt: new Date(),
		})
		.where(eq(patientTransfer.id, transfer.transferId));

	await db
		.update(patientTransferProgress)
		.set({
			status: "rejected",
			description: `Patient rejected the transfer request: ${rejectionReason}`,
		})
		.where(
			and(
				eq(patientTransferProgress.transferId, transfer.transferId),
				eq(patientTransferProgress.title, "Patient approval"),
			),
		);

	revalidateTransferApproval(transfer);

	return {
		success: true,
		status: "rejected",
		message: "Transfer request rejected.",
	};
}
