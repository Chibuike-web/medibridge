"use server";

import { and, eq } from "drizzle-orm";
import { updateTag } from "next/cache";
import { patient, patientEncounter, patientVital } from "@/db/schemas";
import type { VitalType } from "@/features/patients/types";
import { getOrganizationId } from "@/lib/api/get-organization-id";
import { getPatientVitalsCacheTag, toVitalType } from "@/lib/api/get-patient-vitals";
import { getSessionData } from "@/lib/api/get-session-data";
import { db } from "@/lib/better-auth/auth";

const numericVitalFields = [
	"heartRate",
	"respiratoryRate",
	"temperature",
	"oxygenSaturation",
	"weight",
	"bmi",
] as const;

type CreatePatientVitalResult = { ok: true; vital: VitalType } | { ok: false; message: string };

export async function createPatientVitalAction(
	patientId: string,
	formData: FormData,
): Promise<CreatePatientVitalResult> {
	const organizationId = await getOrganizationId();

	if (!organizationId) {
		return { ok: false, message: "You need an active organization to add vitals." };
	}

	const session = await getSessionData();
	const createdBy = session?.user.name || session?.user.email || session?.user.id;

	if (!createdBy) {
		return { ok: false, message: "You need to be signed in to add vitals." };
	}

	const encounterId = String(formData.get("encounterId") ?? "").trim();

	if (!encounterId) {
		return { ok: false, message: "Select the encounter for these vitals." };
	}

	const [systolic, diastolic] = String(formData.get("bloodPressure") ?? "")
		.trim()
		.split("/")
		.map(Number);
	const measurements = Object.fromEntries(
		numericVitalFields.map((field) => [field, Number(formData.get(field))]),
	) as Record<(typeof numericVitalFields)[number], number>;
	const allValues = [systolic, diastolic, ...Object.values(measurements)];

	if (allValues.some((value) => !Number.isFinite(value) || value <= 0)) {
		return { ok: false, message: "Enter a valid positive number for every measurement." };
	}

	if (measurements.oxygenSaturation > 100) {
		return { ok: false, message: "Oxygen saturation cannot exceed 100%." };
	}

	const recordedAtInput = String(formData.get("recordedAt") ?? "").trim();
	const recordedAt = recordedAtInput ? new Date(recordedAtInput) : new Date();

	if (Number.isNaN(recordedAt.getTime())) {
		return { ok: false, message: "Enter a valid encounter date." };
	}

	const [patientRow] = await db
		.select({ id: patient.id })
		.from(patient)
		.where(and(eq(patient.id, patientId), eq(patient.organizationId, organizationId)))
		.limit(1);

	if (!patientRow) return { ok: false, message: "Patient could not be found." };

	const [encounter] = await db
		.select({ encounterType: patientEncounter.encounterType })
		.from(patientEncounter)
		.where(and(eq(patientEncounter.id, encounterId), eq(patientEncounter.patientId, patientId)))
		.limit(1);

	if (!encounter) {
		return { ok: false, message: "Select an encounter that belongs to this patient." };
	}

	const [inserted] = await db
		.insert(patientVital)
		.values({
			id: `VIT-${crypto.randomUUID()}`,
			patientId,
			encounterId,
			createdBy,
			recordedAt,
			systolic,
			diastolic,
			...measurements,
			notes: String(formData.get("notes") ?? "").trim(),
		})
		.returning();
	updateTag(getPatientVitalsCacheTag(organizationId, patientId));

	return { ok: true, vital: toVitalType(inserted, encounter.encounterType) };
}
