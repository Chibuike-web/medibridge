import { cache } from "react";
import { cacheLife, cacheTag } from "next/cache";
import { patient, patientImaging, patientImagingFile, patientImagingHistory } from "@/db/schemas";
import type {
	ImagingDetailsHistoryEvent,
	ImagingModalityFilter,
	ImagingStatusFilter,
	ImagingType,
} from "@/features/patients/types";
import { db } from "@/lib/better-auth/auth";
import { formatDate } from "@/lib/utils/format-date";
import { parseDateParam } from "@/lib/utils/parse-date-param";
import { toSortValue } from "@/lib/utils/to-sort-value";
import { and, asc, count, desc, eq, gte, ilike, inArray, lte, or } from "drizzle-orm";
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

export const getPatientImaging = cache(
	async (
		patientId: string,
		page = 1,
		limit = 14,
		query = "",
		sorting = { sort: "", order: "" },
		dateFilters: ImagingDateFilters = {},
		statusFilters: ImagingStatusFilter[] = [],
		modalityFilters: ImagingModalityFilter[] = [],
		encounterId?: string,
	): Promise<{ imagingStudies: ImagingType[]; totalImagingStudies: number }> => {
		const organizationId = await getOrganizationId();

		if (!organizationId) return { imagingStudies: [], totalImagingStudies: 0 };

		return getPatientImagingForOrganization(
			patientId,
			organizationId,
			page,
			limit,
			query.trim(),
			sorting,
			dateFilters,
			statusFilters,
			modalityFilters,
			encounterId,
		);
	},
);

function groupHistoryEvents(
	historyRows: {
		fieldName: string;
		oldValue: string | null;
		newValue: string | null;
		updatedBy: string | null;
		createdAt: Date;
	}[],
): ImagingDetailsHistoryEvent[] {
	return historyRows.reduce<ImagingDetailsHistoryEvent[]>((events, row) => {
		const id = `${row.updatedBy}-${row.createdAt.getTime()}`;
		const item = {
			label: row.fieldName.charAt(0).toUpperCase() + row.fieldName.slice(1).replaceAll("_", " "),
			previousValue: row.oldValue?.trim() || "None",
			value: row.newValue?.trim() || "None",
		};
		const event = events.find((historyEvent) => historyEvent.id === id);

		if (event) {
			event.items.push(item);
		} else {
			events.push({
				id,
				title: "Updated",
				actor: row.updatedBy || "-",
				timestamp: formatDate(row.createdAt.toISOString()),
				items: [item],
			});
		}

		return events;
	}, []);
}

export async function getPatientImagingForOrganization(
	patientId: string,
	organizationId: string,
	page: number,
	limit: number,
	normalizedQuery: string,
	{ sort, order }: { sort: string; order: string },
	dateFilters: ImagingDateFilters,
	statusFilters: ImagingStatusFilter[],
	modalityFilters: ImagingModalityFilter[],
	encounterId?: string,
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
	const databaseStatusFilters = statusFilters.map(
		(statusFilter) => statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1),
	);
	const databaseModalityFilters = modalityFilters.map(toDatabaseModalityFilter);
	const imagingFilter = and(
		eq(patientImaging.patientId, patientId),
		eq(patient.organizationId, organizationId),
		encounterId ? eq(patientImaging.encounterId, encounterId) : undefined,
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
			encounterId ? undefined : ilike(patientImaging.encounterId, searchPattern),
			ilike(patientImaging.modality, searchPattern),
			ilike(patientImaging.region, searchPattern),
			ilike(patientImaging.impression, searchPattern),
			ilike(patientImaging.status, searchPattern),
		),
	);

	const sortColumns = {
		study: patientImaging.study,
		modality: patientImaging.modality,
		region: patientImaging.region,
		orderedAt: patientImaging.orderedAt,
	};
	const sortColumn = Object.hasOwn(sortColumns, sort)
		? sortColumns[sort as keyof typeof sortColumns]
		: undefined;
	const sortDirection = sortColumn && order === "asc" ? asc : desc;
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
				createdBy: patientImaging.createdBy,
				updatedBy: patientImaging.updatedBy,
				createdAt: patientImaging.createdAt,
				updatedAt: patientImaging.updatedAt,
			})
			.from(patientImaging)
			.innerJoin(patient, eq(patientImaging.patientId, patient.id))
			.where(imagingFilter)
			.orderBy(sortDirection(sortColumn ?? patientImaging.orderedAt), sortDirection(patientImaging.id))
			.limit(limit)
			.offset(offset),
	]);
	const historyRows = rows.length
		? await db
				.select()
				.from(patientImagingHistory)
				.where(
					inArray(
						patientImagingHistory.imagingId,
						rows.map((row) => row.imagingId),
					),
				)
				.orderBy(desc(patientImagingHistory.createdAt))
		: [];
	const imagingFiles = rows.length
		? await db
				.select()
				.from(patientImagingFile)
				.where(
					inArray(
						patientImagingFile.parentRecordId,
						rows.map((row) => row.imagingId),
					),
				)
		: [];
	const filesByImagingId = new Map<string, typeof imagingFiles>();

	for (const file of imagingFiles) {
		const filesForImaging = filesByImagingId.get(file.parentRecordId) ?? [];
		filesForImaging.push(file);
		filesByImagingId.set(file.parentRecordId, filesForImaging);
	}

	return {
		totalImagingStudies: countRows[0]?.value ?? 0,
		imagingStudies: rows.map((imaging) => {
			const modality = normalizeModality(imaging.modality);
			const impression = imaging.impression ?? "";
			const orderedAtLabel = imaging.orderedAt
				? new Intl.DateTimeFormat("en-US", { dateStyle: "long", timeZone: "UTC" }).format(
						imaging.orderedAt,
					)
				: "-";
			const orderedBy = imaging.orderedBy ?? "";
			const reportedBy = imaging.reportedBy ?? imaging.orderedBy ?? "-";
			const status = normalizeStatus(imaging.status);
			const clinicalNote = imaging.clinicalNote ?? "";
			const createdBy = imaging.createdBy ?? imaging.orderedBy ?? "-";
			const updatedBy = imaging.updatedBy ?? imaging.reportedBy ?? imaging.orderedBy ?? "-";
			const createdAtLabel = formatDate(imaging.createdAt.toISOString());
			const updatedAtLabel = formatDate(imaging.updatedAt.toISOString());

			return {
				study: imaging.study,
				imagingId: imaging.imagingId,
				encounterId: imaging.encounterId ?? "",
				modality,
				region: imaging.region,
				impression,
				orderedAtLabel,
				orderedAtValue: imaging.orderedAt ? imaging.orderedAt.toISOString() : "",
				orderedAtSortValue: toSortValue(imaging.orderedAt),
				orderedBy,
				reportedBy,
				status,
				clinicalNote,
				files: (filesByImagingId.get(imaging.imagingId) ?? []).map((file) => ({
					id: file.id,
					name: file.name,
					type: file.type ?? "",
					url: file.url ?? "",
					size: file.size ?? "",
					uploadedAtLabel: formatDate(file.uploadedAt.toISOString()),
				})),
				createdBy,
				updatedBy,
				createdAtLabel,
				updatedAtLabel,
				updatedAtValue: imaging.updatedAt.toISOString(),
				history: groupHistoryEvents(
					historyRows.filter((row) => row.imagingId === imaging.imagingId),
				),
			};
		}),
	};
}
