import { unstable_cache } from "next/cache";
import { and, count, desc, eq, ilike, inArray, or } from "drizzle-orm";
import {
	patient,
	patientPersonalInformation,
	patientTransfer,
	patientTransferContent,
} from "@/db/schemas";
import { db } from "../better-auth/auth";
import { getOrganizationId } from "./get-organization-id";
import type { TransferType } from "@/features/transfers/types";

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

type GetTransfersResult = {
	transfers: TransferType[];
	totalTransfers: number;
};

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

export async function getTransfers(
	page: number,
	limit: number,
	query = "",
): Promise<GetTransfersResult> {
	const organizationId = await getOrganizationId();
	const currentPage = Number.isFinite(page) && page > 0 ? page : 1;
	const currentLimit = Number.isFinite(limit) && limit > 0 ? limit : 14;
	const offset = (currentPage - 1) * currentLimit;
	const normalizedQuery = query.trim();
	const searchPattern = `%${normalizedQuery}%`;

	if (!organizationId) {
		return { transfers: [], totalTransfers: 0 };
	}

	return unstable_cache(
		async () => {
			const [countRows, rows] = await Promise.all([
				db
					.select({ value: count() })
					.from(patientTransfer)
					.innerJoin(patient, eq(patientTransfer.patientId, patient.id))
					.innerJoin(
						patientPersonalInformation,
						eq(patient.id, patientPersonalInformation.patientId),
					)
					.where(
						and(
							eq(patientTransfer.sourceOrganizationId, organizationId),
							or(
								ilike(patientTransfer.id, searchPattern),
								ilike(patientTransfer.transferId, searchPattern),
								ilike(patientTransfer.patientId, searchPattern),
								ilike(patientTransfer.targetHospitalName, searchPattern),
								ilike(patientPersonalInformation.firstName, searchPattern),
								ilike(patientPersonalInformation.lastName, searchPattern),
							),
						),
					),
				db
					.select({
						id: patientTransfer.id,
						status: patientTransfer.status,
						patientId: patientTransfer.patientId,
						requestedAt: patientTransfer.requestedAt,
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
							eq(patientTransfer.sourceOrganizationId, organizationId),
							or(
								ilike(patientTransfer.id, searchPattern),
								ilike(patientTransfer.transferId, searchPattern),
								ilike(patientTransfer.patientId, searchPattern),
								ilike(patientTransfer.targetHospitalName, searchPattern),
								ilike(patientPersonalInformation.firstName, searchPattern),
								ilike(patientPersonalInformation.lastName, searchPattern),
							),
						),
					)
					.orderBy(desc(patientTransfer.createdAt))
					.limit(currentLimit)
					.offset(offset),
			]);
			const totalTransfers = countRows[0]?.value ?? 0;
			const transferIds = rows.map((row) => row.id);
			const transferContentRows =
				transferIds.length > 0
					? await db
							.select({
								transferId: patientTransferContent.transferId,
								contentType: patientTransferContent.contentType,
							})
							.from(patientTransferContent)
							.where(inArray(patientTransferContent.transferId, transferIds))
					: [];
			const transferContentByTransferId = transferContentRows.reduce<Record<string, string[]>>(
				(acc, row) => {
					acc[row.transferId] = [
						...(acc[row.transferId] ?? []),
						formatContentType(row.contentType),
					];
					return acc;
				},
				{},
			);

			return {
				totalTransfers,
				transfers: rows.map((row) => ({
					id: row.id,
					patientName: formatPatientName(row),
					patientFirstName: row.firstName,
					patientMiddleName: row.middleName,
					patientLastName: row.lastName,
					patientId: row.patientId,
					status: toTransferStatus(row.status),
					requestedAt: row.requestedAt.toISOString(),
					targetHospitalName: row.targetHospitalName,
					targetHospitalAdminName: row.targetHospitalAdminName,
					targetHospitalAdminEmail: row.targetHospitalAdminEmail,
					transferContent: transferContentByTransferId[row.id] ?? [],
				})),
			};
		},
		[`transfers-${organizationId}-${currentPage}-${currentLimit}-${normalizedQuery}`],
		{ tags: [`transfers-list-${organizationId}`] },
	)();
}
