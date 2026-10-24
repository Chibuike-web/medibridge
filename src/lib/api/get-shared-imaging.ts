import "server-only";

import { and, count, desc, eq, gte, ilike, inArray, lte, or } from "drizzle-orm";
import { endOfDay, startOfDay } from "date-fns";
import { patientImaging } from "@/db/schemas";
import { db } from "@/lib/better-auth/auth";
import { formatDate } from "@/lib/utils/format-date";
import { parseDateParam } from "@/lib/utils/parse-date-param";
import { getSharedRecord } from "./get-shared-record";

function imagingModality(value: string): "CT" | "MRI" | "Ultrasound" | "X-ray" {
	const normalizedValue = value.toLowerCase();
	if (normalizedValue === "ct") return "CT";
	if (normalizedValue === "mri") return "MRI";
	if (normalizedValue === "ultrasound") return "Ultrasound";
	return "X-ray";
}

function imagingStatus(value: string): "Pending" | "Completed" | "Cancelled" {
	if (value.toLowerCase() === "completed") return "Completed";
	if (value.toLowerCase() === "cancelled") return "Cancelled";
	return "Pending";
}

export async function getSharedImaging(
	accessId: string,
	{
		page,
		limit,
		query,
		statusFilters,
		modalityFilters,
		orderedFrom,
		orderedTo,
		createdFrom,
		createdTo,
	}: {
		page: number;
		limit: number;
		query: string;
		statusFilters: string[];
		modalityFilters: string[];
		orderedFrom: string;
		orderedTo: string;
		createdFrom: string;
		createdTo: string;
	},
) {
	const sharedRecord = await getSharedRecord(accessId);
	if (!sharedRecord) return { rows: [], totalRows: 0 };

	const imagingIds = sharedRecord.selectedRecordIds
		.filter((record) => record.section === "imaging")
		.map((record) => record.recordId);
	const orderedFromDate = parseDateParam(orderedFrom);
	const orderedToDate = parseDateParam(orderedTo);
	const createdFromDate = parseDateParam(createdFrom);
	const createdToDate = parseDateParam(createdTo);
	const searchPattern = `%${query.trim()}%`;
	const imagingFilter = and(
		eq(patientImaging.patientId, sharedRecord.patientId),
		inArray(patientImaging.id, imagingIds),
		orderedFromDate ? gte(patientImaging.orderedAt, startOfDay(orderedFromDate)) : undefined,
		orderedToDate ? lte(patientImaging.orderedAt, endOfDay(orderedToDate)) : undefined,
		createdFromDate ? gte(patientImaging.createdAt, startOfDay(createdFromDate)) : undefined,
		createdToDate ? lte(patientImaging.createdAt, endOfDay(createdToDate)) : undefined,
		statusFilters.length > 0 ? inArray(patientImaging.status, statusFilters) : undefined,
		modalityFilters.length > 0 ? inArray(patientImaging.modality, modalityFilters) : undefined,
		or(
			ilike(patientImaging.study, searchPattern),
			ilike(patientImaging.id, searchPattern),
			ilike(patientImaging.modality, searchPattern),
			ilike(patientImaging.region, searchPattern),
			ilike(patientImaging.impression, searchPattern),
			ilike(patientImaging.status, searchPattern),
		),
	);
	const [countRows, imaging] = await Promise.all([
		db.select({ value: count() }).from(patientImaging).where(imagingFilter),
		db
			.select()
			.from(patientImaging)
			.where(imagingFilter)
			.orderBy(desc(patientImaging.orderedAt))
			.limit(limit)
			.offset((page - 1) * limit),
	]);

	return {
		totalRows: countRows[0]?.value ?? 0,
		rows: imaging.map((record) => ({
			study: record.study,
			modality: imagingModality(record.modality),
			region: record.region,
			impression: record.impression || "-",
			orderedAt: record.orderedAt ? formatDate(record.orderedAt.toISOString()) : "-",
			orderedAtValue: record.orderedAt?.toISOString() ?? "",
			createdAt: formatDate(record.createdAt.toISOString()),
			createdAtValue: record.createdAt.toISOString(),
			imagingId: record.id,
			status: imagingStatus(record.status),
		})),
	};
}
