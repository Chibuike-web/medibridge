"use server";

import { and, eq, gte, lt } from "drizzle-orm";
import { updateTag } from "next/cache";
import { patient, patientMedication, patientMedicationHistory } from "@/db/schemas";
import { getOrganizationId } from "@/lib/api/get-organization-id";
import { getSessionData } from "@/lib/api/get-session-data";
import { db } from "@/lib/better-auth/auth";

type DiscontinuePatientMedicationResult =
	| { status: "success" }
	| { status: "failed" | "unauthorized"; error: string };

export async function discontinuePatientMedicationAction(
	medicationId: string,
	openedUpdatedAt: string,
): Promise<DiscontinuePatientMedicationResult> {
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

	const [currentMedication] = await db
		.select({
			patientId: patientMedication.patientId,
			status: patientMedication.status,
			updatedAt: patientMedication.updatedAt,
		})
		.from(patientMedication)
		.innerJoin(patient, eq(patientMedication.patientId, patient.id))
		.where(and(eq(patientMedication.id, medicationId), eq(patient.organizationId, organizationId)))
		.limit(1);

	if (!currentMedication) {
		return { status: "failed", error: "Medication could not be found." };
	}

	const staleRecordResult = {
		status: "failed" as const,
		error:
			"This medication was changed after you opened it. Close it and open it again to see the latest version.",
	};
	if (currentMedication.updatedAt.toISOString() !== openedUpdatedAt) {
		return staleRecordResult;
	}

	if (currentMedication.status !== "Active") {
		return { status: "failed", error: "Only an active medication can be discontinued." };
	}

	const updatedBy = session.user.name || session.user.email;
	const lastSavedAt = currentMedication.updatedAt;
	const updatedAt = new Date(Math.max(Date.now(), lastSavedAt.getTime() + 1));

	const staleRecordError = new Error("Record changed before saving.");
	try {
		await db.transaction(async (tx) => {
			const [updatedRecord] = await tx
				.update(patientMedication)
				.set({ status: "Discontinued", updatedBy, updatedAt })
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
			await tx.insert(patientMedicationHistory).values([
				{
					id: crypto.randomUUID(),
					medicationId,
					fieldName: "status",
					oldValue: currentMedication.status,
					newValue: "Discontinued",
					updatedBy,
					createdAt: updatedAt,
				},
			]);
		});
	} catch (error) {
		if (error === staleRecordError) return staleRecordResult;
		console.error("Discontinuing the medication failed:", error);
		return { status: "failed", error: "We couldn’t save this change. Please try again." };
	}

	updateTag(`patient-medications-${organizationId}-${currentMedication.patientId}`);
	updateTag(`patient-medication-details-${organizationId}-${medicationId}`);

	return { status: "success" };
}
