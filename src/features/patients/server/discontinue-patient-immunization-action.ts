"use server";

import { and, eq, gte, lt } from "drizzle-orm";
import { updateTag } from "next/cache";
import { patient, patientImmunization, patientImmunizationHistory } from "@/db/schemas";
import { getOrganizationId } from "@/lib/api/get-organization-id";
import { getSessionData } from "@/lib/api/get-session-data";
import { db } from "@/lib/better-auth/auth";

type DiscontinuePatientImmunizationResult =
	| { status: "success" }
	| { status: "failed" | "unauthorized"; error: string };

export async function discontinuePatientImmunizationAction(
	immunizationId: string,
	openedUpdatedAt: string,
): Promise<DiscontinuePatientImmunizationResult> {
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

	const [currentImmunization] = await db
		.select({
			patientId: patientImmunization.patientId,
			status: patientImmunization.status,
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

	const staleRecordResult = {
		status: "failed" as const,
		error:
			"This immunization was changed after you opened it. Close it and open it again to see the latest version.",
	};
	if (currentImmunization.updatedAt.toISOString() !== openedUpdatedAt) {
		return staleRecordResult;
	}

	if (currentImmunization.status !== "Active") {
		return { status: "failed", error: "Only an active immunization can be discontinued." };
	}

	const updatedBy = session.user.name || session.user.email;
	const lastSavedAt = currentImmunization.updatedAt;
	const updatedAt = new Date(Math.max(Date.now(), lastSavedAt.getTime() + 1));

	const staleRecordError = new Error("Record changed before saving.");
	try {
		await db.transaction(async (tx) => {
			const [updatedRecord] = await tx
				.update(patientImmunization)
				.set({ status: "Discontinued", updatedBy, updatedAt })
				.where(
					and(
						eq(patientImmunization.id, immunizationId),
						// The form's timestamp has millisecond precision; database defaults can include microseconds.
						gte(patientImmunization.updatedAt, lastSavedAt),
						lt(patientImmunization.updatedAt, new Date(lastSavedAt.getTime() + 1)),
					),
				)
				.returning({ id: patientImmunization.id });
			if (!updatedRecord) throw staleRecordError;
			await tx.insert(patientImmunizationHistory).values([
				{
					id: crypto.randomUUID(),
					immunizationId,
					fieldName: "status",
					oldValue: currentImmunization.status,
					newValue: "Discontinued",
					updatedBy,
					createdAt: updatedAt,
				},
			]);
		});
	} catch (error) {
		if (error === staleRecordError) return staleRecordResult;
		console.error("Discontinuing the immunization failed:", error);
		return { status: "failed", error: "We couldn’t save this change. Please try again." };
	}

	updateTag(`patient-immunizations-${organizationId}-${currentImmunization.patientId}`);
	updateTag(`patient-immunization-details-${organizationId}-${immunizationId}`);

	return { status: "success" };
}
