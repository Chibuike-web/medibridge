import "server-only";

import { and, count, desc, eq, gte, ilike, inArray, lte, or } from "drizzle-orm";
import { endOfDay, startOfDay } from "date-fns";
import { patientImmunization } from "@/db/schemas";
import { db } from "@/lib/better-auth/auth";
import { formatDate } from "@/lib/utils/format-date";
import { parseDateParam } from "@/lib/utils/parse-date-param";
import { getSharedRecord } from "./get-shared-record";

function immunizationStatus(value: string): "Active" | "Completed" | "Cancelled" | "Discontinued" {
	if (value.toLowerCase() === "completed") return "Completed";
	if (value.toLowerCase() === "cancelled") return "Cancelled";
	if (value.toLowerCase() === "discontinued") return "Discontinued";
	return "Active";
}

export async function getSharedImmunizations(
	accessId: string,
	{
		page,
		limit,
		query,
		statusFilters,
		createdFrom,
		createdTo,
	}: {
		page: number;
		limit: number;
		query: string;
		statusFilters: string[];
		createdFrom: string;
		createdTo: string;
	},
) {
	const sharedRecord = await getSharedRecord(accessId);
	if (!sharedRecord) return { rows: [], totalRows: 0 };

	const immunizationIds = sharedRecord.selectedRecordIds
		.filter((record) => record.section === "immunizations")
		.map((record) => record.recordId);
	const createdFromDate = parseDateParam(createdFrom);
	const createdToDate = parseDateParam(createdTo);
	const searchPattern = `%${query.trim()}%`;
	const immunizationFilter = and(
		eq(patientImmunization.patientId, sharedRecord.patientId),
		inArray(patientImmunization.id, immunizationIds),
		createdFromDate ? gte(patientImmunization.createdAt, startOfDay(createdFromDate)) : undefined,
		createdToDate ? lte(patientImmunization.createdAt, endOfDay(createdToDate)) : undefined,
		statusFilters.length > 0 ? inArray(patientImmunization.status, statusFilters) : undefined,
		or(
			ilike(patientImmunization.vaccineName, searchPattern),
			ilike(patientImmunization.id, searchPattern),
			ilike(patientImmunization.status, searchPattern),
		),
	);
	const [countRows, immunizations] = await Promise.all([
		db.select({ value: count() }).from(patientImmunization).where(immunizationFilter),
		db
			.select()
			.from(patientImmunization)
			.where(immunizationFilter)
			.orderBy(desc(patientImmunization.createdAt))
			.limit(limit)
			.offset((page - 1) * limit),
	]);

	return {
		totalRows: countRows[0]?.value ?? 0,
		rows: immunizations.map((record) => ({
			vaccineName: record.vaccineName,
			dose: record.currentDose || "-",
			immunizationId: record.id,
			createdAt: formatDate(record.createdAt.toISOString()),
			createdAtValue: record.createdAt.toISOString(),
			status: immunizationStatus(record.status),
		})),
	};
}
