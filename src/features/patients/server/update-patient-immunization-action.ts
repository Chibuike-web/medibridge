"use server";

import { format, parseISO } from "date-fns";
import { and, eq } from "drizzle-orm";
import { updateTag } from "next/cache";
import { patient, patientImmunization, patientImmunizationHistory } from "@/db/schemas";
import { getOrganizationId } from "@/lib/api/get-organization-id";
import { getSessionData } from "@/lib/api/get-session-data";
import { db } from "@/lib/better-auth/auth";
import { patientImmunizationSchema } from "./schemas";

type UpdatePatientImmunizationResult =
	| { status: "success" }
	| { status: "failed" | "unauthorized"; error: string };

export async function updatePatientImmunizationAction(
	immunizationId: string,
	formData: FormData,
): Promise<UpdatePatientImmunizationResult> {
	const session = await getSessionData();

	if (!session?.user?.id) {
		return { status: "unauthorized", error: "You must be signed in to edit immunizations." };
	}

	if (!session.user.emailVerified) {
		return { status: "failed", error: "Verify your email before editing immunizations." };
	}

	const organizationId = await getOrganizationId();

	if (!organizationId) {
		return {
			status: "failed",
			error: "Your hospital must be verified before you can edit immunizations.",
		};
	}

	const parsedImmunization = patientImmunizationSchema.safeParse({
		vaccineName: formData.get("vaccineName") ?? "",
		seriesType: formData.get("seriesType") || undefined,
		currentDose: formData.get("currentDose") ?? "",
		totalDoses: formData.get("totalDoses") ?? "",
		status: formData.get("status"),
		dateAdministered: formData.get("dateAdministered") ?? "",
		administeredBy: formData.get("administeredBy") ?? "",
		clinicalNote: formData.get("clinicalNote") ?? "",
	});

	if (!parsedImmunization.success) {
		return { status: "failed", error: parsedImmunization.error.issues[0].message };
	}

	const [currentImmunization] = await db
		.select({
			patientId: patientImmunization.patientId,
			vaccineName: patientImmunization.vaccineName,
			seriesType: patientImmunization.seriesType,
			currentDose: patientImmunization.currentDose,
			totalDoses: patientImmunization.totalDoses,
			status: patientImmunization.status,
			dateAdministered: patientImmunization.dateAdministered,
			administeredBy: patientImmunization.administeredBy,
			clinicalNote: patientImmunization.clinicalNote,
			updatedAt: patientImmunization.updatedAt,
		})
		.from(patientImmunization)
		.innerJoin(patient, eq(patientImmunization.patientId, patient.id))
		.where(
			and(eq(patientImmunization.id, immunizationId), eq(patient.organizationId, organizationId)),
		)
		.limit(1);

	if (!currentImmunization) {
		return { status: "failed", error: "Immunization could not be found." };
	}

	const {
		patientId,
		updatedAt: lastSavedAt,
		dateAdministered,
		...savedImmunization
	} = currentImmunization;

	if (lastSavedAt.toISOString() !== formData.get("updatedAt")) {
		return {
			status: "failed",
			error:
				"This immunization was changed after you opened it. Close it and open it again to see the latest version.",
		};
	}
	const previousImmunization = {
		...savedImmunization,
		dateAdministered: dateAdministered?.toISOString().slice(0, 10) ?? null,
	};
	const { seriesType, currentDose, totalDoses, clinicalNote, ...immunization } =
		parsedImmunization.data;
	const nextImmunization = {
		...immunization,
		seriesType: seriesType ?? null,
		currentDose: String(currentDose),
		totalDoses: String(totalDoses),
		clinicalNote: clinicalNote || null,
	};
	const changedFields = (Object.keys(nextImmunization) as (keyof typeof nextImmunization)[]).filter(
		(field) => nextImmunization[field] !== previousImmunization[field],
	);

	if (changedFields.length === 0) {
		return { status: "success" };
	}

	const updatedBy = session.user.name || session.user.email;
	const updatedAt = new Date();
	const historyValue = (field: keyof typeof nextImmunization, value: string | null) =>
		value && field === "dateAdministered" ? format(parseISO(value), "do MMMM yyyy") : value;

	try {
		await db.transaction(async (tx) => {
			await tx
				.update(patientImmunization)
				.set({
					...nextImmunization,
					dateAdministered: new Date(nextImmunization.dateAdministered),
					updatedBy,
					updatedAt,
				})
				.where(eq(patientImmunization.id, immunizationId));
			await tx.insert(patientImmunizationHistory).values(
				changedFields.map((field) => ({
					id: crypto.randomUUID(),
					immunizationId,
					fieldName: field.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`),
					oldValue: historyValue(field, previousImmunization[field]),
					newValue: historyValue(field, nextImmunization[field]),
					updatedBy,
					createdAt: updatedAt,
				})),
			);
		});
	} catch (error) {
		console.error("Updating patient immunization failed:", error);
		return { status: "failed", error: "We couldn’t save these changes. Please try again." };
	}

	updateTag(`patient-immunizations-${organizationId}-${patientId}`);
	updateTag(`patient-immunization-details-${organizationId}-${immunizationId}`);

	return { status: "success" };
}
