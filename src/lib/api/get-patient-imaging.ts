import { unstable_cache } from "next/cache";
import { patient, patientImaging } from "@/db/schemas";
import type { ImagingType } from "@/features/patients/types";
import { db } from "@/lib/better-auth/auth";
import { formatDate } from "@/lib/utils/format-date";
import { toSortValue } from "@/lib/utils/to-sort-value";
import { and, count, desc, eq, ilike, or } from "drizzle-orm";
import { getOrganizationId } from "./get-organization-id";

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

export async function getPatientImaging(
	patientId: string,
	page = 1,
	limit = 14,
	query = "",
): Promise<{ imagingStudies: ImagingType[]; totalImagingStudies: number }> {
	const organizationId = await getOrganizationId();
	const offset = (page - 1) * limit;
	const normalizedQuery = query.trim();
	const searchPattern = `%${normalizedQuery}%`;

	if (!organizationId) return { imagingStudies: [], totalImagingStudies: 0 };

	return unstable_cache(
		async () => {
			const [countRows, rows] = await Promise.all([
				db
					.select({ value: count() })
					.from(patientImaging)
					.innerJoin(patient, eq(patientImaging.patientId, patient.id))
					.where(
						and(
							eq(patientImaging.patientId, patientId),
							eq(patient.organizationId, organizationId),
							or(
								ilike(patientImaging.study, searchPattern),
								ilike(patientImaging.id, searchPattern),
								ilike(patientImaging.modality, searchPattern),
								ilike(patientImaging.region, searchPattern),
								ilike(patientImaging.impression, searchPattern),
								ilike(patientImaging.status, searchPattern),
							),
						),
					),
				db
					.select({
						study: patientImaging.study,
						imagingId: patientImaging.id,
						modality: patientImaging.modality,
						region: patientImaging.region,
						impression: patientImaging.impression,
						orderedAt: patientImaging.orderedAt,
						status: patientImaging.status,
					})
					.from(patientImaging)
					.innerJoin(patient, eq(patientImaging.patientId, patient.id))
					.where(
						and(
							eq(patientImaging.patientId, patientId),
							eq(patient.organizationId, organizationId),
							or(
								ilike(patientImaging.study, searchPattern),
								ilike(patientImaging.id, searchPattern),
								ilike(patientImaging.modality, searchPattern),
								ilike(patientImaging.region, searchPattern),
								ilike(patientImaging.impression, searchPattern),
								ilike(patientImaging.status, searchPattern),
							),
						),
					)
					.orderBy(desc(patientImaging.orderedAt))
					.limit(limit)
					.offset(offset),
			]);

			return {
				totalImagingStudies: countRows[0]?.value ?? 0,
				imagingStudies: rows.map((imaging) => ({
					study: imaging.study,
					imagingId: imaging.imagingId,
					modality: normalizeModality(imaging.modality),
					region: imaging.region,
					impression: imaging.impression ?? "-",
					orderedAtLabel: imaging.orderedAt
						? formatDate(imaging.orderedAt.toISOString())
						: "-",
					orderedAtSortValue: toSortValue(imaging.orderedAt),
					status: normalizeStatus(imaging.status),
				})),
			};
		},
		[`patient-imaging-record-primary-ids-${organizationId}-${patientId}-${page}-${limit}-${normalizedQuery}`],
		{ tags: [`patient-imaging-${organizationId}-${patientId}`] },
	)();
}
