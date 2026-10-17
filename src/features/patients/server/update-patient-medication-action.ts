"use server";

import { format, parseISO } from "date-fns";
import { and, eq, gte, lt } from "drizzle-orm";
import { updateTag } from "next/cache";
import { patient, patientMedication, patientMedicationHistory } from "@/db/schemas";
import { getOrganizationId } from "@/lib/api/get-organization-id";
import { getSessionData } from "@/lib/api/get-session-data";
import { db } from "@/lib/better-auth/auth";
import { patientMedicationSchema } from "./schemas";

type UpdatePatientMedicationResult =
	| { status: "success" }
	| { status: "failed" | "unauthorized"; error: string };

export async function updatePatientMedicationAction(
	medicationId: string,
	formData: FormData,
): Promise<UpdatePatientMedicationResult> {
	const session = await getSessionData();

	if (!session?.user?.id) {
		return { status: "unauthorized", error: "You must be signed in to edit medications." };
	}

	if (!session.user.emailVerified) {
		return { status: "failed", error: "Verify your email before editing medications." };
	}

	const organizationId = await getOrganizationId();

	if (!organizationId) {
		return {
			status: "failed",
			error: "Your hospital must be verified before you can edit medications.",
		};
	}

	const parsedMedication = patientMedicationSchema.safeParse({
		medicationName: formData.get("medicationName") ?? "",
		indication: formData.get("indication") ?? "",
		status: formData.get("status"),
		dose: formData.get("dose") ?? "",
		route: formData.get("route"),
		prescribedBy: formData.get("prescribedBy") ?? "",
		frequency: formData.get("frequency") ?? "",
		duration: formData.get("duration") ?? "",
		startedAt: formData.get("startedAt") ?? "",
		clinicalNote: formData.get("clinicalNote") ?? "",
	});

	if (!parsedMedication.success) {
		return { status: "failed", error: parsedMedication.error.issues[0].message };
	}

	const [currentMedication] = await db
		.select({
			patientId: patientMedication.patientId,
			medicationName: patientMedication.medicationName,
			indication: patientMedication.indication,
			status: patientMedication.status,
			dose: patientMedication.dose,
			route: patientMedication.route,
			prescribedBy: patientMedication.prescribedBy,
			frequency: patientMedication.frequency,
			duration: patientMedication.duration,
			startedAt: patientMedication.startedAt,
			clinicalNote: patientMedication.clinicalNote,
			updatedAt: patientMedication.updatedAt,
		})
		.from(patientMedication)
		.innerJoin(patient, eq(patientMedication.patientId, patient.id))
		.where(and(eq(patientMedication.id, medicationId), eq(patient.organizationId, organizationId)))
		.limit(1);

	if (!currentMedication) {
		return { status: "failed", error: "Medication could not be found." };
	}

	const { patientId, updatedAt: lastSavedAt, ...previousMedication } = currentMedication;

	const staleRecordResult = {
		status: "failed" as const,
		error:
			"This medication was changed after you opened it. Close it and open it again to see the latest version.",
	};
	if (lastSavedAt.toISOString() !== formData.get("updatedAt")) {
		return staleRecordResult;
	}
	const { clinicalNote, ...medication } = parsedMedication.data;
	const nextMedication = { ...medication, clinicalNote: clinicalNote || null };
	const changedFields = (Object.keys(nextMedication) as (keyof typeof nextMedication)[]).filter(
		(field) => nextMedication[field] !== previousMedication[field],
	);

	if (changedFields.length === 0) {
		return { status: "success" };
	}

	const updatedBy = session.user.name || session.user.email;
	const updatedAt = new Date(Math.max(Date.now(), lastSavedAt.getTime() + 1));
	const historyValue = (field: keyof typeof nextMedication, value: string | null) =>
		value && field === "startedAt" ? format(parseISO(value), "do MMMM yyyy") : value;

	const staleRecordError = new Error("Record changed before saving.");
	try {
		await db.transaction(async (tx) => {
			const [updatedRecord] = await tx
				.update(patientMedication)
				.set({ ...nextMedication, updatedBy, updatedAt })
				.where(
					and(
						eq(patientMedication.id, medicationId),
						// The form's timestamp has millisecond precision; database defaults can include microseconds.
						gte(patientMedication.updatedAt, lastSavedAt),
						lt(patientMedication.updatedAt, new Date(lastSavedAt.getTime() + 1)),
					),
				)
				.returning({ id: patientMedication.id });
			if (!updatedRecord) throw staleRecordError;
			await tx.insert(patientMedicationHistory).values(
				changedFields.map((field) => ({
					id: crypto.randomUUID(),
					medicationId,
					fieldName: field.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`),
					oldValue: historyValue(field, previousMedication[field]),
					newValue: historyValue(field, nextMedication[field]),
					updatedBy,
					createdAt: updatedAt,
				})),
			);
		});
	} catch (error) {
		if (error === staleRecordError) return staleRecordResult;
		console.error("Updating patient medication failed:", error);
		return { status: "failed", error: "We couldn’t save these changes. Please try again." };
	}

	updateTag(`patient-medications-${organizationId}-${patientId}`);
	updateTag(`patient-medication-details-${organizationId}-${medicationId}`);

	return { status: "success" };
}
