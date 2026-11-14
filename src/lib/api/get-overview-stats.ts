import { cacheLife, cacheTag } from "next/cache";
import { and, count, eq, gte, lt, sql } from "drizzle-orm";
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import { patient, patientEncounter, patientTransfer } from "@/db/schemas";
import { db } from "../better-auth/auth";

export type OverviewStats = Awaited<ReturnType<typeof getOverviewStatsForOrganization>>;

function countByMonth(date: AnyPgColumn, monthStart: Date, lastMonthStart: Date) {
	return {
		total: count(),
		thisMonth: sql<number>`count(*) filter (where ${gte(date, monthStart)})`.mapWith(Number),
		lastMonth:
			sql<number>`count(*) filter (where ${and(gte(date, lastMonthStart), lt(date, monthStart))})`.mapWith(
				Number,
			),
	};
}

// monthStart must come from the caller: computed in here, the cached result would keep showing last month's numbers.
export async function getOverviewStatsForOrganization(organizationId: string, monthStart: Date) {
	"use cache";
	cacheLife("max");
	cacheTag(`overview-stats-${organizationId}`);

	const lastMonthStart = new Date(
		Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth() - 1, 1),
	);

	const [[patients], [completedTransfers], [pendingTransfers], [encounters]] = await Promise.all([
		db
			.select(countByMonth(patient.createdAt, monthStart, lastMonthStart))
			.from(patient)
			.where(eq(patient.organizationId, organizationId)),

		db
			.select(countByMonth(patientTransfer.completedAt, monthStart, lastMonthStart))
			.from(patientTransfer)
			.where(
				and(
					eq(patientTransfer.sourceOrganizationId, organizationId),
					eq(patientTransfer.status, "completed"),
				),
			),

		db
			.select(countByMonth(patientTransfer.createdAt, monthStart, lastMonthStart))
			.from(patientTransfer)
			.where(
				and(
					eq(patientTransfer.sourceOrganizationId, organizationId),
					eq(patientTransfer.status, "pending"),
				),
			),

		db
			.select(countByMonth(patientEncounter.createdAt, monthStart, lastMonthStart))
			.from(patientEncounter)
			.innerJoin(patient, eq(patientEncounter.patientId, patient.id))
			.where(eq(patient.organizationId, organizationId)),
	]);

	return {
		hasPatients: patients.total > 0,
		patients,
		completedTransfers,
		pendingTransfers,
		encounters,
	};
}
