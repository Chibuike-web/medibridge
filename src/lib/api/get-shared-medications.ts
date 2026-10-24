import "server-only";

import { and, count, desc, eq, gte, ilike, inArray, lte, or } from "drizzle-orm";
import { endOfDay, startOfDay } from "date-fns";
import { patientMedication } from "@/db/schemas";
import { db } from "@/lib/better-auth/auth";
import { formatDate } from "@/lib/utils/format-date";
import { parseDateParam } from "@/lib/utils/parse-date-param";
import { getSharedRecord } from "./get-shared-record";

function medicationStatus(value: string): "Active" | "Completed" | "Discontinued" {
	if (value.toLowerCase() === "completed") return "Completed";
	if (value.toLowerCase() === "discontinued") return "Discontinued";
	return "Active";
}

export async function getSharedMedications(
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

	const medicationIds = sharedRecord.selectedRecordIds
		.filter((record) => record.section === "medications")
		.map((record) => record.recordId);
	const createdFromDate = parseDateParam(createdFrom);
	const createdToDate = parseDateParam(createdTo);
	const searchPattern = `%${query.trim()}%`;
	const medicationFilter = and(
		eq(patientMedication.patientId, sharedRecord.patientId),
		inArray(patientMedication.id, medicationIds),
		createdFromDate ? gte(patientMedication.createdAt, startOfDay(createdFromDate)) : undefined,
		createdToDate ? lte(patientMedication.createdAt, endOfDay(createdToDate)) : undefined,
		statusFilters.length > 0 ? inArray(patientMedication.status, statusFilters) : undefined,
		or(
			ilike(patientMedication.medicationName, searchPattern),
			ilike(patientMedication.id, searchPattern),
			ilike(patientMedication.dose, searchPattern),
			ilike(patientMedication.route, searchPattern),
			ilike(patientMedication.indication, searchPattern),
			ilike(patientMedication.status, searchPattern),
		),
	);
	const [countRows, medications] = await Promise.all([
		db.select({ value: count() }).from(patientMedication).where(medicationFilter),
		db
			.select()
			.from(patientMedication)
			.where(medicationFilter)
			.orderBy(desc(patientMedication.createdAt))
			.limit(limit)
			.offset((page - 1) * limit),
	]);

	return {
		totalRows: countRows[0]?.value ?? 0,
		rows: medications.map((record) => ({
			medication: record.medicationName,
			dose: record.dose || "-",
			frequency: record.frequency || "-",
			duration: record.duration || "-",
			route: record.route || "-",
			indication: record.indication || "-",
			medicationId: record.id,
			createdAt: formatDate(record.createdAt.toISOString()),
			createdAtValue: record.createdAt.toISOString(),
			status: medicationStatus(record.status),
		})),
	};
}
