import { cache } from "react";
import { cacheLife, cacheTag } from "next/cache";
import { and, count, desc, eq, gte, ilike, inArray, lte, or } from "drizzle-orm";
import { patient, patientPersonalInformation, patientTransfer } from "@/db/schemas";
import { db } from "../better-auth/auth";
import { getOrganizationId } from "./get-organization-id";
import type { TransferStatusFilter, TransferType } from "@/features/transfers/types";

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
	hasTransfers: boolean;
};

export type TransferRequestedAtFilter = {
	from?: Date;
	to?: Date;
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

export const getTransfers = cache(async (
	page: number,
	limit: number,
	query = "",
	requestedAtFilter: TransferRequestedAtFilter = {},
	statusFilters: TransferStatusFilter[] = [],
): Promise<GetTransfersResult> => {
	const organizationId = await getOrganizationId();
	const currentPage = Number.isFinite(page) && page > 0 ? page : 1;
	const currentLimit = Number.isFinite(limit) && limit > 0 ? limit : 14;
	const normalizedQuery = query.trim();

	if (!organizationId) {
		return { transfers: [], totalTransfers: 0, hasTransfers: false };
	}

	return getTransfersForOrganization(
		organizationId,
		currentPage,
		currentLimit,
		normalizedQuery,
		requestedAtFilter,
		statusFilters,
	);
});

export async function getTransfersForOrganization(
	organizationId: string,
	page: number,
	limit: number,
	normalizedQuery: string,
	requestedAtFilter: TransferRequestedAtFilter,
	statusFilters: TransferStatusFilter[],
): Promise<GetTransfersResult> {
	"use cache";
	cacheLife("max");
	cacheTag(`transfers-list-${organizationId}`);

	const offset = (page - 1) * limit;
	const searchPattern = `%${normalizedQuery}%`;
	const requestedAtConditions = [
		requestedAtFilter.from ? gte(patientTransfer.requestedAt, requestedAtFilter.from) : undefined,
		requestedAtFilter.to ? lte(patientTransfer.requestedAt, requestedAtFilter.to) : undefined,
	].filter((condition) => condition !== undefined);
	const databaseStatusFilters = statusFilters.flatMap((statusFilter) =>
		statusFilter === "completed" ? ["completed", "approved", "sent"] : [statusFilter],
	);
	const transferFilter = and(
		eq(patientTransfer.sourceOrganizationId, organizationId),
		...requestedAtConditions,
		databaseStatusFilters.length > 0
			? inArray(patientTransfer.status, databaseStatusFilters)
			: undefined,
		or(
			ilike(patientTransfer.id, searchPattern),
			ilike(patientTransfer.patientId, searchPattern),
			ilike(patientTransfer.targetHospitalName, searchPattern),
			ilike(patientPersonalInformation.firstName, searchPattern),
			ilike(patientPersonalInformation.lastName, searchPattern),
		),
	);

	const [allTransferCountRows, filteredTransferCountRows, rows] = await Promise.all([
		db
			.select({ value: count() })
			.from(patientTransfer)
			.where(eq(patientTransfer.sourceOrganizationId, organizationId)),
		db
			.select({ value: count() })
			.from(patientTransfer)
			.innerJoin(patient, eq(patientTransfer.patientId, patient.id))
			.innerJoin(
				patientPersonalInformation,
				eq(patient.id, patientPersonalInformation.patientId),
			)
			.where(transferFilter),
		db
			.select({
				id: patientTransfer.id,
				status: patientTransfer.status,
				patientId: patientTransfer.patientId,
				requestedAt: patientTransfer.requestedAt,
				targetHospitalName: patientTransfer.targetHospitalName,
				targetHospitalEmail: patientTransfer.targetHospitalEmail,
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
			.where(transferFilter)
			.orderBy(desc(patientTransfer.createdAt))
			.limit(limit)
			.offset(offset),
	]);
	const totalTransfers = filteredTransferCountRows[0]?.value ?? 0;
	const allTransferCount = allTransferCountRows[0]?.value ?? 0;

	return {
		totalTransfers,
		hasTransfers: allTransferCount > 0,
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
			targetHospitalEmail: row.targetHospitalEmail,
		})),
	};
}
