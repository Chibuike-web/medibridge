"use server";

import { and, eq, inArray } from "drizzle-orm";
import { updateTag } from "next/cache";
import {
	organization,
	patient,
	patientAllergy,
	patientContactInformation,
	patientDiagnosis,
	patientImaging,
	patientImmunization,
	patientLabTest,
	patientMedication,
	patientPersonalInformation,
	patientProcedure,
	patientTransfer,
	patientTransferContent,
	patientTransferProgress,
} from "@/db/schemas";
import {
	createTransferRequestsSchema,
	type CreateTransferRequestsInput,
} from "../schemas";
import type { ClinicalRecordType } from "../types";
import { getOrganizationId } from "@/lib/api/get-organization-id";
import { getTransfers } from "@/lib/api/get-transfers";
import { createTransferApprovalToken } from "@/lib/api/transfer-approval-token";
import { db } from "@/lib/better-auth/auth";
import { ENV } from "@/lib/utils/env";
import { sendTransferApprovalEmail } from "@/lib/utils/send-transfer-approval-email";
import { verifySession } from "@/lib/api/verify-session";

type RecordOwnership = {
	id: string;
	patientId: string;
};

function selectedRecordKey(
	type: ClinicalRecordType,
	id: string,
	patientId: string,
) {
	return `${type}:${id}:${patientId}`;
}

function uniqueSelectedRecords(
	records: CreateTransferRequestsInput[number]["records"],
) {
	return [
		...new Map(
			records.map((record) => [`${record.type}:${record.id}`, record]),
		).values(),
	];
}

async function getSelectedRecordOwnership(input: CreateTransferRequestsInput) {
	const patientIds = [...new Set(input.map((transfer) => transfer.patientId))];
	const recordIdsByType = new Map<ClinicalRecordType, string[]>();

	for (const transfer of input) {
		for (const record of transfer.records) {
			const recordIds = recordIdsByType.get(record.type) ?? [];
			recordIds.push(record.id);
			recordIdsByType.set(record.type, recordIds);
		}
	}

	function ids(type: ClinicalRecordType) {
		return [...new Set(recordIdsByType.get(type) ?? [])];
	}

	function selectOwnership(
		type: ClinicalRecordType,
		table:
			| typeof patientDiagnosis
			| typeof patientAllergy
			| typeof patientImmunization
			| typeof patientProcedure
			| typeof patientMedication
			| typeof patientLabTest
			| typeof patientImaging,
	): Promise<RecordOwnership[]> {
		const recordIds = ids(type);

		if (recordIds.length === 0) return Promise.resolve([]);

		return db
			.select({ id: table.id, patientId: table.patientId })
			.from(table)
			.where(
				and(inArray(table.id, recordIds), inArray(table.patientId, patientIds)),
			);
	}

	const ownershipRowsByType = await Promise.all([
		selectOwnership("diagnoses", patientDiagnosis),
		selectOwnership("allergies", patientAllergy),
		selectOwnership("immunizations", patientImmunization),
		selectOwnership("procedures", patientProcedure),
		selectOwnership("medications", patientMedication),
		selectOwnership("lab-tests", patientLabTest),
		selectOwnership("imaging", patientImaging),
	]);
	const recordTypes: ClinicalRecordType[] = [
		"diagnoses",
		"allergies",
		"immunizations",
		"procedures",
		"medications",
		"lab-tests",
		"imaging",
	];
	const ownershipKeys = new Set<string>();

	for (const [index, rows] of ownershipRowsByType.entries()) {
		const recordType = recordTypes[index];
		for (const row of rows) {
			ownershipKeys.add(selectedRecordKey(recordType, row.id, row.patientId));
		}
	}

	return ownershipKeys;
}

export async function createTransferRequestsAction(
	input: CreateTransferRequestsInput,
) {
	const parsedInput = createTransferRequestsSchema.safeParse(input);

	if (!parsedInput.success) {
		return {
			ok: false as const,
			message:
				parsedInput.error.issues[0]?.message ??
				"Check the transfer request details.",
		};
	}

	const session = await verifySession();
	const organizationId = await getOrganizationId();
	const userId = session.user.id;
	const transferRequests = parsedInput.data;
	const patientIds = transferRequests.map((transfer) => transfer.patientId);

	if (!organizationId) {
		return { ok: false as const, message: "Unable to verify your hospital." };
	}

	if (new Set(patientIds).size !== patientIds.length) {
		return {
			ok: false as const,
			message: "Each patient can only appear once per request.",
		};
	}

	const [sourceOrganizationRows, patientRows, recordOwnership] =
		await Promise.all([
			db
				.select({ name: organization.name })
				.from(organization)
				.where(eq(organization.id, organizationId))
				.limit(1),
			db
				.select({
					id: patient.id,
					firstName: patientPersonalInformation.firstName,
					middleName: patientPersonalInformation.middleName,
					lastName: patientPersonalInformation.lastName,
					email: patientContactInformation.emailAddress,
				})
				.from(patient)
				.innerJoin(
					patientPersonalInformation,
					eq(patient.id, patientPersonalInformation.patientId),
				)
				.leftJoin(
					patientContactInformation,
					eq(patient.id, patientContactInformation.patientId),
				)
				.where(
					and(
						eq(patient.organizationId, organizationId),
						inArray(patient.id, patientIds),
					),
				),
			getSelectedRecordOwnership(transferRequests),
		]);
	const sourceOrganization = sourceOrganizationRows[0];
	const patientById = new Map(
		patientRows.map((patientRow) => [patientRow.id, patientRow]),
	);

	if (!sourceOrganization || patientById.size !== patientIds.length) {
		return {
			ok: false as const,
			message: "One or more selected patients could not be found.",
		};
	}

	for (const transfer of transferRequests) {
		const patientRow = patientById.get(transfer.patientId);

		if (!patientRow?.email) {
			return {
				ok: false as const,
				message: `${patientRow?.firstName ?? "The selected patient"} needs an email address before a transfer can be sent for approval.`,
			};
		}

		for (const record of uniqueSelectedRecords(transfer.records)) {
			if (
				!recordOwnership.has(
					selectedRecordKey(record.type, record.id, transfer.patientId),
				)
			) {
				return {
					ok: false as const,
					message:
						"One or more selected clinical records do not belong to the selected patient.",
				};
			}
		}
	}

	const now = new Date();
	const approvalExpiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
	const runtimeTargetIds = new Map<string, string>();
	const createdTransfers = transferRequests.map((transfer) => {
		const targetKey = `${transfer.targetHospitalName.toLowerCase()}:${transfer.targetHospitalEmail.toLowerCase()}`;
		const targetOrganizationId =
			runtimeTargetIds.get(targetKey) ?? `TGT-${crypto.randomUUID()}`;
		runtimeTargetIds.set(targetKey, targetOrganizationId);

		return {
			...transfer,
			records: uniqueSelectedRecords(transfer.records),
			transferId: `TRF-${crypto.randomUUID()}`,
			targetOrganizationId,
		};
	});

	await db.transaction(async (tx) => {
		await tx.insert(patientTransfer).values(
			createdTransfers.map((transfer) => ({
				id: transfer.transferId,
				patientId: transfer.patientId,
				sourceOrganizationId: organizationId,
				targetOrganizationId: transfer.targetOrganizationId,
				targetHospitalName: transfer.targetHospitalName,
			targetHospitalEmail: transfer.targetHospitalEmail,
				notes: transfer.notes || null,
				status: "pending",
				patientApprovalStatus: "waiting",
				deliveryStatus: "not_started",
				requestedBy: userId,
				createdBy: userId,
				updatedBy: userId,
				requestedAt: now,
				createdAt: now,
				updatedAt: now,
			})),
		);

		await tx.insert(patientTransferContent).values(
			createdTransfers.flatMap((transfer) =>
				transfer.records.map((record) => ({
					id: `TCO-${crypto.randomUUID()}`,
					transferId: transfer.transferId,
					contentType: record.type,
					recordId: record.id,
					createdAt: now,
				})),
			),
		);

		await tx.insert(patientTransferProgress).values(
			createdTransfers.flatMap((transfer) => [
				{
					id: `TPR-${crypto.randomUUID()}`,
					transferId: transfer.transferId,
					title: "Transfer requested",
					description: "Transfer request created by source hospital.",
					status: "completed",
					createdAt: now,
				},
				{
					id: `TPR-${crypto.randomUUID()}`,
					transferId: transfer.transferId,
					title: "Patient approval",
					description: "Waiting for patient approval.",
					status: "waiting",
					createdAt: now,
				},
				{
					id: `TPR-${crypto.randomUUID()}`,
					transferId: transfer.transferId,
					title: "Clinical packet sent",
					description: "Selected records have not been sent yet.",
					status: "not_started",
					createdAt: now,
				},
			]),
		);
	});

	const approvalEmailResults = await Promise.allSettled(
		createdTransfers.map(async (transfer) => {
			const patientRow = patientById.get(transfer.patientId)!;
			const approvalToken = await createTransferApprovalToken({
				transferId: transfer.transferId,
				patientId: transfer.patientId,
				expiresAt: approvalExpiresAt,
			});
			const approvalUrl = new URL(
				`/transfer-approval/${transfer.transferId}`,
				ENV.BETTER_AUTH_URL,
			);
			approvalUrl.searchParams.set("token", approvalToken);

			return sendTransferApprovalEmail({
				email: patientRow.email!,
				patientName: [
					patientRow.firstName,
					patientRow.middleName,
					patientRow.lastName,
				]
					.filter(Boolean)
					.join(" "),
				sourceHospitalName: sourceOrganization.name,
				targetHospitalName: transfer.targetHospitalName,
				approvalUrl: approvalUrl.toString(),
			});
		}),
	);
	const failedApprovalEmails = approvalEmailResults.filter(
		(result) => result.status === "rejected" || Boolean(result.value.error),
	).length;

	updateTag(`transfers-list-${organizationId}`);
	updateTag(`recent-transfers-${organizationId}`);
	updateTag(`overview-stats-${organizationId}`);

	return {
		ok: true as const,
		createdTransferIds: createdTransfers.map((transfer) => transfer.transferId),
		message:
			failedApprovalEmails > 0
				? `${createdTransfers.length} transfer request${createdTransfers.length === 1 ? " was" : "s were"} created, but ${failedApprovalEmails} patient approval email${failedApprovalEmails === 1 ? "" : "s"} could not be sent.`
				: `${createdTransfers.length} transfer request${createdTransfers.length === 1 ? " was" : "s were"} sent for patient approval.`,
	};
}

export async function getTransfersTableAction({
	page,
	limit,
	query = "",
	requestedAtFilter = {},
}: {
	page: number | string;
	limit: number | string;
	query?: string;
	requestedAtFilter?: {
		from?: Date;
		to?: Date;
	};
}) {
	await verifySession();

	const currentPage = typeof page === "string" ? parseInt(page, 10) : page;
	const currentLimit = typeof limit === "string" ? parseInt(limit, 10) : limit;
	const { transfers, totalTransfers } = await getTransfers(
		currentPage,
		currentLimit,
		query,
		requestedAtFilter,
	);

	return {
		transfers,
		page: currentPage,
		limit: currentLimit,
		totalPages: Math.ceil(totalTransfers / currentLimit) || 1,
	};
}
