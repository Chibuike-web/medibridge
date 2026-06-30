import { cache } from "react";
import { cacheLife, cacheTag } from "next/cache";
import { patient, patientImaging } from "@/db/schemas";
import type {
	ImagingModalityFilter,
	ImagingStatusFilter,
	ImagingType,
} from "@/features/patients/types";
import { db } from "@/lib/better-auth/auth";
import { formatDate } from "@/lib/utils/format-date";
import { parseDateParam } from "@/lib/utils/parse-date-param";
import { toSortValue } from "@/lib/utils/to-sort-value";
import { and, count, desc, eq, gte, ilike, inArray, lte, or } from "drizzle-orm";
import { endOfDay, startOfDay } from "date-fns";
import { getOrganizationId } from "./get-organization-id";

type ImagingDateFilters = {
	orderedFrom?: string;
	orderedTo?: string;
	createdFrom?: string;
	createdTo?: string;
};

function normalizeModality(value: string): ImagingType["modality"] {
	const normalizedValue = value.toLowerCase();

	if (normalizedValue === "mri") {
		return "MRI";
	}

	if (normalizedValue === "ultrasound") {
		return "Ultrasound";
	}

	if (normalizedValue === "x-ray" || normalizedValue === "xray") {
		return "X-ray";
	}

	return "CT";
}

function normalizeStatus(value: string): ImagingType["status"] {
	const normalizedValue = value.toLowerCase();

	if (normalizedValue === "completed") {
		return "Completed";
	}

	if (normalizedValue === "cancelled") {
		return "Cancelled";
	}

	return "Pending";
}

function toDatabaseModalityFilter(modalityFilter: ImagingModalityFilter) {
	if (modalityFilter === "ct") return "CT";
	if (modalityFilter === "mri") return "MRI";
	if (modalityFilter === "x-ray") return "X-ray";
	return "Ultrasound";
}

export const getPatientImaging = cache(async (
	patientId: string,
	page = 1,
	limit = 14,
	query = "",
	dateFilters: ImagingDateFilters = {},
	statusFilters: ImagingStatusFilter[] = [],
	modalityFilters: ImagingModalityFilter[] = [],
): Promise<{ imagingStudies: ImagingType[]; totalImagingStudies: number }> => {
	const organizationId = await getOrganizationId();

	if (!organizationId) return { imagingStudies: [], totalImagingStudies: 0 };

	return getPatientImagingForOrganization(
		patientId,
		organizationId,
		page,
		limit,
		query.trim(),
		dateFilters,
		statusFilters,
		modalityFilters,
	);
});

export async function getPatientImagingForOrganization(
	patientId: string,
	organizationId: string,
	page: number,
	limit: number,
	normalizedQuery: string,
	dateFilters: ImagingDateFilters,
	statusFilters: ImagingStatusFilter[],
	modalityFilters: ImagingModalityFilter[],
): Promise<{ imagingStudies: ImagingType[]; totalImagingStudies: number }> {
	"use cache";
	cacheLife("max");
	cacheTag(`patient-imaging-${organizationId}-${patientId}`);

	const offset = (page - 1) * limit;
	const searchPattern = `%${normalizedQuery}%`;
	const orderedFromDate = parseDateParam(dateFilters.orderedFrom ?? "");
	const orderedToDate = parseDateParam(dateFilters.orderedTo ?? "");
	const createdFromDate = parseDateParam(dateFilters.createdFrom ?? "");
	const createdToDate = parseDateParam(dateFilters.createdTo ?? "");
	const databaseStatusFilters = statusFilters.map((statusFilter) => statusFilter.toLowerCase());
	const databaseModalityFilters = modalityFilters.map(toDatabaseModalityFilter);
	const imagingFilter = and(
		eq(patientImaging.patientId, patientId),
		eq(patient.organizationId, organizationId),
		orderedFromDate ? gte(patientImaging.orderedAt, startOfDay(orderedFromDate)) : undefined,
		orderedToDate ? lte(patientImaging.orderedAt, endOfDay(orderedToDate)) : undefined,
		createdFromDate ? gte(patientImaging.createdAt, startOfDay(createdFromDate)) : undefined,
		createdToDate ? lte(patientImaging.createdAt, endOfDay(createdToDate)) : undefined,
		databaseStatusFilters.length > 0
			? inArray(patientImaging.status, databaseStatusFilters)
			: undefined,
		databaseModalityFilters.length > 0
			? inArray(patientImaging.modality, databaseModalityFilters)
			: undefined,
		or(
			ilike(patientImaging.study, searchPattern),
			ilike(patientImaging.id, searchPattern),
			ilike(patientImaging.modality, searchPattern),
			ilike(patientImaging.region, searchPattern),
			ilike(patientImaging.impression, searchPattern),
			ilike(patientImaging.status, searchPattern),
		),
	);

	const [countRows, rows] = await Promise.all([
		db
			.select({ value: count() })
			.from(patientImaging)
			.innerJoin(patient, eq(patientImaging.patientId, patient.id))
			.where(imagingFilter),
		db
			.select({
				study: patientImaging.study,
				imagingId: patientImaging.id,
				encounterId: patientImaging.encounterId,
				modality: patientImaging.modality,
				region: patientImaging.region,
				impression: patientImaging.impression,
				orderedAt: patientImaging.orderedAt,
				orderedBy: patientImaging.orderedBy,
				reportedBy: patientImaging.reportedBy,
				status: patientImaging.status,
				clinicalNote: patientImaging.clinicalNote,
				fileName: patientImaging.fileName,
				fileUrl: patientImaging.fileUrl,
				fileType: patientImaging.fileType,
				fileSize: patientImaging.fileSize,
				createdBy: patientImaging.createdBy,
				updatedBy: patientImaging.updatedBy,
				createdAt: patientImaging.createdAt,
				updatedAt: patientImaging.updatedAt,
			})
			.from(patientImaging)
			.innerJoin(patient, eq(patientImaging.patientId, patient.id))
			.where(imagingFilter)
			.orderBy(desc(patientImaging.orderedAt))
			.limit(limit)
			.offset(offset),
	]);

	return {
		totalImagingStudies: countRows[0]?.value ?? 0,
		imagingStudies: rows.map((imaging) => ({
			study: imaging.study,
			imagingId: imaging.imagingId,
			encounterId: imaging.encounterId ?? "",
			modality: normalizeModality(imaging.modality),
			region: imaging.region,
			impression: imaging.impression ?? "-",
			orderedAtLabel: imaging.orderedAt ? formatDate(imaging.orderedAt.toISOString()) : "-",
			orderedAtValue: imaging.orderedAt ? imaging.orderedAt.toISOString() : "",
			orderedAtSortValue: toSortValue(imaging.orderedAt),
			orderedBy: imaging.orderedBy ?? "-",
			reportedBy: imaging.reportedBy ?? imaging.orderedBy ?? "-",
			status: normalizeStatus(imaging.status),
			clinicalNote: imaging.clinicalNote ?? "-",
			fileName: imaging.fileName ?? "",
			fileUrl: imaging.fileUrl ?? "",
			fileType: imaging.fileType ?? "pdf",
			fileSize: imaging.fileSize ?? "120KB",
			createdBy: imaging.createdBy ?? imaging.orderedBy ?? "-",
			updatedBy: imaging.updatedBy ?? imaging.reportedBy ?? imaging.orderedBy ?? "-",
			createdAtLabel: formatDate(imaging.createdAt.toISOString()),
			updatedAtLabel: formatDate(imaging.updatedAt.toISOString()),
		})),
	};
}
