import "server-only";

import { and, count, desc, eq, gte, ilike, inArray, lte, or } from "drizzle-orm";
import { endOfDay, startOfDay } from "date-fns";
import { patientDiagnosis } from "@/db/schemas";
import { db } from "@/lib/better-auth/auth";
import { formatDate } from "@/lib/utils/format-date";
import { parseDateParam } from "@/lib/utils/parse-date-param";
import { getSharedRecord } from "./get-shared-record";

function toDateFilterValue(value: string | null) {
	if (!value) return "";
	const date = new Date(value);
	return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

function activeOrResolved(value: string): "Active" | "Resolved" {
	return value.toLowerCase() === "active" ? "Active" : "Resolved";
}

export async function getSharedDiagnoses(
	accessId: string,
	{
		page,
		limit,
		query,
		statusFilters,
		diagnosedFrom,
		diagnosedTo,
		reviewedFrom,
		reviewedTo,
		createdFrom,
		createdTo,
	}: {
		page: number;
		limit: number;
		query: string;
		statusFilters: string[];
		diagnosedFrom: string;
		diagnosedTo: string;
		reviewedFrom: string;
		reviewedTo: string;
		createdFrom: string;
		createdTo: string;
	},
) {
	const sharedRecord = await getSharedRecord(accessId);
	if (!sharedRecord) return { rows: [], totalRows: 0 };

	const diagnosisIds = sharedRecord.selectedRecordIds
		.filter((record) => record.section === "diagnoses")
		.map((record) => record.recordId);
	const createdFromDate = parseDateParam(createdFrom);
	const createdToDate = parseDateParam(createdTo);
	const databaseStatusFilters = statusFilters.flatMap((status) => [status, status.toLowerCase()]);
	const searchPattern = `%${query.trim()}%`;
	const diagnosisFilter = and(
		eq(patientDiagnosis.patientId, sharedRecord.patientId),
		inArray(patientDiagnosis.id, diagnosisIds),
		diagnosedFrom ? gte(patientDiagnosis.diagnosedAt, diagnosedFrom) : undefined,
		diagnosedTo ? lte(patientDiagnosis.diagnosedAt, diagnosedTo) : undefined,
		reviewedFrom ? gte(patientDiagnosis.lastReviewedAt, reviewedFrom) : undefined,
		reviewedTo ? lte(patientDiagnosis.lastReviewedAt, reviewedTo) : undefined,
		createdFromDate ? gte(patientDiagnosis.createdAt, startOfDay(createdFromDate)) : undefined,
		createdToDate ? lte(patientDiagnosis.createdAt, endOfDay(createdToDate)) : undefined,
		databaseStatusFilters.length > 0
			? inArray(patientDiagnosis.status, databaseStatusFilters)
			: undefined,
		or(
			ilike(patientDiagnosis.diagnosisName, searchPattern),
			ilike(patientDiagnosis.id, searchPattern),
			ilike(patientDiagnosis.status, searchPattern),
		),
	);
	const [countRows, diagnoses] = await Promise.all([
		db.select({ value: count() }).from(patientDiagnosis).where(diagnosisFilter),
		db
			.select()
			.from(patientDiagnosis)
			.where(diagnosisFilter)
			.orderBy(desc(patientDiagnosis.createdAt))
			.limit(limit)
			.offset((page - 1) * limit),
	]);

	return {
		totalRows: countRows[0]?.value ?? 0,
		rows: diagnoses.map((record) => ({
			name: record.diagnosisName,
			diagnosedAt: record.diagnosedAt || "-",
			diagnosedAtValue: toDateFilterValue(record.diagnosedAt),
			lastReviewed: record.lastReviewedAt || "-",
			lastReviewedValue: toDateFilterValue(record.lastReviewedAt),
			diagnosisId: record.id,
			createdAt: formatDate(record.createdAt.toISOString()),
			createdAtValue: record.createdAt.toISOString(),
			status: activeOrResolved(record.status),
		})),
	};
}
