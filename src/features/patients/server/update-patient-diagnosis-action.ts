"use server";

import { format, parseISO } from "date-fns";
import { and, eq, gte, lt } from "drizzle-orm";
import { updateTag } from "next/cache";
import { patient, patientDiagnosis, patientDiagnosisHistory } from "@/db/schemas";
import { getOrganizationId } from "@/lib/api/get-organization-id";
import { getSessionData } from "@/lib/api/get-session-data";
import { db } from "@/lib/better-auth/auth";
import { patientDiagnosisSchema } from "./schemas";

type UpdatePatientDiagnosisResult =
	| { status: "success" }
	| { status: "failed" | "unauthorized"; error: string };

export async function updatePatientDiagnosisAction(
	diagnosisId: string,
	formData: FormData,
): Promise<UpdatePatientDiagnosisResult> {
	const session = await getSessionData();

	if (!session?.user?.id) {
		return { status: "unauthorized", error: "You must be signed in to edit diagnoses." };
	}

	if (!session.user.emailVerified) {
		return { status: "failed", error: "Verify your email before editing diagnoses." };
	}

	const organizationId = await getOrganizationId();

	if (!organizationId) {
		return {
			status: "failed",
			error: "Your hospital must be verified before you can edit diagnoses.",
		};
	}

	const parsedDiagnosis = patientDiagnosisSchema.safeParse({
		diagnosisName: formData.get("diagnosisName") ?? "",
		severityStage: formData.get("severityStage") || undefined,
		status: formData.get("status"),
		diagnosedAt: formData.get("diagnosedAt") ?? "",
		diagnosedBy: formData.get("diagnosedBy") ?? "",
		clinicalNote: formData.get("clinicalNote") ?? "",
	});

	if (!parsedDiagnosis.success) {
		return { status: "failed", error: parsedDiagnosis.error.issues[0].message };
	}

	const [currentDiagnosis] = await db
		.select({
			patientId: patientDiagnosis.patientId,
			diagnosisName: patientDiagnosis.diagnosisName,
			severityStage: patientDiagnosis.severityStage,
			status: patientDiagnosis.status,
			diagnosedAt: patientDiagnosis.diagnosedAt,
			diagnosedBy: patientDiagnosis.diagnosedBy,
			clinicalNote: patientDiagnosis.clinicalNote,
			updatedAt: patientDiagnosis.updatedAt,
		})
		.from(patientDiagnosis)
		.innerJoin(patient, eq(patientDiagnosis.patientId, patient.id))
		.where(and(eq(patientDiagnosis.id, diagnosisId), eq(patient.organizationId, organizationId)))
		.limit(1);

	if (!currentDiagnosis) {
		return { status: "failed", error: "Diagnosis could not be found." };
	}

	const { patientId, updatedAt: lastSavedAt, ...previousDiagnosis } = currentDiagnosis;

	const staleRecordResult = {
		status: "failed" as const,
		error:
			"This diagnosis was changed after you opened it. Close it and open it again to see the latest version.",
	};
	if (lastSavedAt.toISOString() !== formData.get("updatedAt")) {
		return staleRecordResult;
	}
	const { severityStage, clinicalNote, ...diagnosis } = parsedDiagnosis.data;
	const nextDiagnosis = {
		...diagnosis,
		severityStage: severityStage ?? null,
		clinicalNote: clinicalNote || null,
	};
	const changedFields = (Object.keys(nextDiagnosis) as (keyof typeof nextDiagnosis)[]).filter(
		(field) => nextDiagnosis[field] !== previousDiagnosis[field],
	);

	if (changedFields.length === 0) {
		return { status: "success" };
	}

	const updatedBy = session.user.name || session.user.email;
	const updatedAt = new Date(Math.max(Date.now(), lastSavedAt.getTime() + 1));
	const historyValue = (field: keyof typeof nextDiagnosis, value: string | null) =>
		value && field === "diagnosedAt" ? format(parseISO(value), "do MMMM yyyy") : value;

	const staleRecordError = new Error("Record changed before saving.");
	try {
		await db.transaction(async (tx) => {
			const [updatedRecord] = await tx
				.update(patientDiagnosis)
				.set({ ...nextDiagnosis, updatedBy, updatedAt })
				.where(
					and(
						eq(patientDiagnosis.id, diagnosisId),
						// The form's timestamp has millisecond precision; database defaults can include microseconds.
						gte(patientDiagnosis.updatedAt, lastSavedAt),
						lt(patientDiagnosis.updatedAt, new Date(lastSavedAt.getTime() + 1)),
					),
				)
				.returning({ id: patientDiagnosis.id });
			if (!updatedRecord) throw staleRecordError;
			await tx.insert(patientDiagnosisHistory).values(
				changedFields.map((field) => ({
					id: crypto.randomUUID(),
					diagnosisId,
					fieldName: field.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`),
					oldValue: historyValue(field, previousDiagnosis[field]),
					newValue: historyValue(field, nextDiagnosis[field]),
					updatedBy,
					createdAt: updatedAt,
				})),
			);
		});
	} catch (error) {
		if (error === staleRecordError) return staleRecordResult;
		console.error("Updating patient diagnosis failed:", error);
		return { status: "failed", error: "We couldn’t save these changes. Please try again." };
	}

	updateTag(`patient-diagnoses-${organizationId}-${patientId}`);
	updateTag(`patient-diagnosis-details-${organizationId}-${diagnosisId}`);
	updateTag(`patient-profile-${organizationId}-${patientId}`);

	return { status: "success" };
}
