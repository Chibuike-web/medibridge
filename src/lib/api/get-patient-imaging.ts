import { unstable_cache } from "next/cache";
import { patient, patientImaging } from "@/db/schemas";
import type { ImagingType } from "@/features/patients/types";
import { db } from "@/lib/better-auth/auth";
import { formatDate } from "@/lib/utils/format-date";
import { toSortValue } from "@/lib/utils/to-sort-value";
import { and, desc, eq } from "drizzle-orm";
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

export async function getPatientImaging(patientId: string): Promise<ImagingType[]> {
	const organizationId = await getOrganizationId();

	if (!organizationId) return [];

	return unstable_cache(
		async () => {
			const rows = await db
				.select({
					study: patientImaging.study,
					imagingId: patientImaging.imagingId,
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
					),
				)
				.orderBy(desc(patientImaging.orderedAt));

			return rows.map((imaging) => ({
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
			}));
		},
		[`patient-imaging-${organizationId}-${patientId}`],
		{ tags: [`patient-imaging-${organizationId}-${patientId}`] },
	)();
}
