import "server-only";

import { and, asc, count, desc, eq, gte, ilike, inArray, lte, or } from "drizzle-orm";
import { endOfDay, startOfDay } from "date-fns";
import { patientProcedure } from "@/db/schemas";
import { db } from "@/lib/better-auth/auth";
import { formatDate } from "@/lib/utils/format-date";
import { parseDateParam } from "@/lib/utils/parse-date-param";
import { getSharedRecord } from "./get-shared-record";

function procedureStatus(value: string): "Pending" | "Completed" | "Cancelled" {
	if (value.toLowerCase() === "completed") return "Completed";
	if (value.toLowerCase() === "cancelled") return "Cancelled";
	return "Pending";
}

export async function getSharedProcedures(
	accessId: string,
	{
		page,
		limit,
		query,
		sort,
		order,
		statusFilters,
		createdFrom,
		createdTo,
	}: {
		page: number;
		limit: number;
		query: string;
		sort: string;
		order: string;
		statusFilters: string[];
		createdFrom: string;
		createdTo: string;
	},
) {
	const sharedRecord = await getSharedRecord(accessId);
	if (!sharedRecord) return { rows: [], totalRows: 0 };

	const procedureIds = sharedRecord.selectedRecordIds
		.filter((record) => record.section === "procedures")
		.map((record) => record.recordId);
	const createdFromDate = parseDateParam(createdFrom);
	const createdToDate = parseDateParam(createdTo);
	const searchPattern = `%${query.trim()}%`;
	const procedureFilter = and(
		eq(patientProcedure.patientId, sharedRecord.patientId),
		inArray(patientProcedure.id, procedureIds),
		createdFromDate ? gte(patientProcedure.createdAt, startOfDay(createdFromDate)) : undefined,
		createdToDate ? lte(patientProcedure.createdAt, endOfDay(createdToDate)) : undefined,
		statusFilters.length > 0 ? inArray(patientProcedure.status, statusFilters) : undefined,
		or(
			ilike(patientProcedure.procedureName, searchPattern),
			ilike(patientProcedure.id, searchPattern),
			ilike(patientProcedure.indication, searchPattern),
			ilike(patientProcedure.facility, searchPattern),
			ilike(patientProcedure.plannedFacility, searchPattern),
			ilike(patientProcedure.status, searchPattern),
		),
	);
	const sortColumns = {
		procedure: patientProcedure.procedureName,
		indication: patientProcedure.indication,
		facility: patientProcedure.facility,
		createdAt: patientProcedure.createdAt,
		status: patientProcedure.status,
	};
	const sortColumn = Object.hasOwn(sortColumns, sort)
		? sortColumns[sort as keyof typeof sortColumns]
		: undefined;
	const sortDirection = sortColumn && order === "asc" ? asc : desc;
	const [countRows, procedures] = await Promise.all([
		db.select({ value: count() }).from(patientProcedure).where(procedureFilter),
		db
			.select()
			.from(patientProcedure)
			.where(procedureFilter)
			.orderBy(sortDirection(sortColumn ?? patientProcedure.createdAt), sortDirection(patientProcedure.id))
			.limit(limit)
			.offset((page - 1) * limit),
	]);

	return {
		totalRows: countRows[0]?.value ?? 0,
		rows: procedures.map((record) => ({
			procedure: record.procedureName,
			indication: record.indication || "-",
			facility: (record.facility ?? record.plannedFacility) || "-",
			procedureId: record.id,
			createdAt: formatDate(record.createdAt.toISOString()),
			createdAtValue: record.createdAt.toISOString(),
			status: procedureStatus(record.status),
		})),
	};
}
