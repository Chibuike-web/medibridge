import "server-only";

import { and, count, desc, eq, gte, ilike, inArray, lte, or } from "drizzle-orm";
import { endOfDay, startOfDay } from "date-fns";
import { patientAllergy } from "@/db/schemas";
import { db } from "@/lib/better-auth/auth";
import { formatDate } from "@/lib/utils/format-date";
import { parseDateParam } from "@/lib/utils/parse-date-param";
import { getSharedRecord } from "./get-shared-record";

function activeOrInactive(value: string): "Active" | "Inactive" {
	return value.toLowerCase() === "active" ? "Active" : "Inactive";
}

function allergySeverity(value: string): "Mild" | "Moderate" | "Severe" {
	if (value.toLowerCase() === "severe") return "Severe";
	if (value.toLowerCase() === "moderate") return "Moderate";
	return "Mild";
}

export async function getSharedAllergies(
	accessId: string,
	{
		page,
		limit,
		query,
		statusFilters,
		severityFilters,
		createdFrom,
		createdTo,
	}: {
		page: number;
		limit: number;
		query: string;
		statusFilters: string[];
		severityFilters: string[];
		createdFrom: string;
		createdTo: string;
	},
) {
	const sharedRecord = await getSharedRecord(accessId);
	if (!sharedRecord) return { rows: [], totalRows: 0 };

	const allergyIds = sharedRecord.selectedRecordIds
		.filter((record) => record.section === "allergies")
		.map((record) => record.recordId);
	const createdFromDate = parseDateParam(createdFrom);
	const createdToDate = parseDateParam(createdTo);
	const searchPattern = `%${query.trim()}%`;
	const allergyFilter = and(
		eq(patientAllergy.patientId, sharedRecord.patientId),
		inArray(patientAllergy.id, allergyIds),
		createdFromDate ? gte(patientAllergy.createdAt, startOfDay(createdFromDate)) : undefined,
		createdToDate ? lte(patientAllergy.createdAt, endOfDay(createdToDate)) : undefined,
		statusFilters.length > 0 ? inArray(patientAllergy.status, statusFilters) : undefined,
		severityFilters.length > 0 ? inArray(patientAllergy.severity, severityFilters) : undefined,
		or(
			ilike(patientAllergy.allergen, searchPattern),
			ilike(patientAllergy.id, searchPattern),
			ilike(patientAllergy.reaction, searchPattern),
			ilike(patientAllergy.severity, searchPattern),
			ilike(patientAllergy.status, searchPattern),
		),
	);
	const [countRows, allergies] = await Promise.all([
		db.select({ value: count() }).from(patientAllergy).where(allergyFilter),
		db
			.select()
			.from(patientAllergy)
			.where(allergyFilter)
			.orderBy(desc(patientAllergy.createdAt))
			.limit(limit)
			.offset((page - 1) * limit),
	]);

	return {
		totalRows: countRows[0]?.value ?? 0,
		rows: allergies.map((record) => ({
			allergen: record.allergen,
			allergyId: record.id,
			reaction: record.reaction,
			createdAt: formatDate(record.createdAt.toISOString()),
			createdAtValue: record.createdAt.toISOString(),
			severity: allergySeverity(record.severity),
			status: activeOrInactive(record.status),
		})),
	};
}
