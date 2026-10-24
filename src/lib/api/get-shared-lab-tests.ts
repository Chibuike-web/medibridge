import "server-only";

import { and, count, desc, eq, gte, ilike, inArray, lte, or } from "drizzle-orm";
import { endOfDay, startOfDay } from "date-fns";
import { patientLabTest } from "@/db/schemas";
import { db } from "@/lib/better-auth/auth";
import { formatDate } from "@/lib/utils/format-date";
import { parseDateParam } from "@/lib/utils/parse-date-param";
import { getSharedRecord } from "./get-shared-record";

function labTestStatus(value: string): "Pending" | "Completed" | "Cancelled" {
	if (value.toLowerCase() === "completed") return "Completed";
	if (value.toLowerCase() === "cancelled") return "Cancelled";
	return "Pending";
}

export async function getSharedLabTests(
	accessId: string,
	{
		page,
		limit,
		query,
		statusFilters,
		flagFilters,
		createdFrom,
		createdTo,
	}: {
		page: number;
		limit: number;
		query: string;
		statusFilters: string[];
		flagFilters: string[];
		createdFrom: string;
		createdTo: string;
	},
) {
	const sharedRecord = await getSharedRecord(accessId);
	if (!sharedRecord) return { rows: [], totalRows: 0 };

	const labTestIds = sharedRecord.selectedRecordIds
		.filter((record) => record.section === "lab-tests")
		.map((record) => record.recordId);
	const createdFromDate = parseDateParam(createdFrom);
	const createdToDate = parseDateParam(createdTo);
	const databaseFlagFilters = flagFilters.map(
		(flag) => flag.charAt(0).toUpperCase() + flag.slice(1).replaceAll("-", " "),
	);
	const searchPattern = `%${query.trim()}%`;
	const labTestFilter = and(
		eq(patientLabTest.patientId, sharedRecord.patientId),
		inArray(patientLabTest.id, labTestIds),
		createdFromDate ? gte(patientLabTest.createdAt, startOfDay(createdFromDate)) : undefined,
		createdToDate ? lte(patientLabTest.createdAt, endOfDay(createdToDate)) : undefined,
		statusFilters.length > 0 ? inArray(patientLabTest.status, statusFilters) : undefined,
		databaseFlagFilters.length > 0 ? inArray(patientLabTest.flag, databaseFlagFilters) : undefined,
		or(
			ilike(patientLabTest.testName, searchPattern),
			ilike(patientLabTest.result, searchPattern),
			ilike(patientLabTest.id, searchPattern),
			ilike(patientLabTest.referenceRange, searchPattern),
			ilike(patientLabTest.interpretation, searchPattern),
			ilike(patientLabTest.status, searchPattern),
		),
	);
	const [countRows, labTests] = await Promise.all([
		db.select({ value: count() }).from(patientLabTest).where(labTestFilter),
		db
			.select()
			.from(patientLabTest)
			.where(labTestFilter)
			.orderBy(desc(patientLabTest.createdAt))
			.limit(limit)
			.offset((page - 1) * limit),
	]);

	return {
		totalRows: countRows[0]?.value ?? 0,
		rows: labTests.map((record) => ({
			test: record.testName,
			result: record.result || "-",
			labId: record.id,
			referenceRange: record.referenceRange || "-",
			interpretation: (record.flag ?? record.interpretation) || "-",
			createdAt: formatDate(record.createdAt.toISOString()),
			createdAtValue: record.createdAt.toISOString(),
			status: labTestStatus(record.status),
		})),
	};
}
