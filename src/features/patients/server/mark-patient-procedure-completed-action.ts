"use server";

import { addDays, format } from "date-fns";
import { and, eq, gte, lt } from "drizzle-orm";
import { updateTag } from "next/cache";
import { patient, patientProcedure, patientProcedureHistory } from "@/db/schemas";
import { getOrganizationId } from "@/lib/api/get-organization-id";
import { getSessionData } from "@/lib/api/get-session-data";
import { db } from "@/lib/better-auth/auth";

type MarkPatientProcedureCompletedResult =
	| { status: "success" }
	| { status: "failed" | "unauthorized"; error: string };

export async function markPatientProcedureCompletedAction(
	procedureId: string,
	openedUpdatedAt: string,
): Promise<MarkPatientProcedureCompletedResult> {
	const session = await getSessionData();

	if (!session?.user?.id) {
		return { status: "unauthorized", error: "You must be signed in to edit procedures." };
	}

	if (!session.user.emailVerified) {
		return { status: "failed", error: "Verify your email before editing procedures." };
	}

	const organizationId = await getOrganizationId();

	if (!organizationId) {
		return {
			status: "failed",
			error: "Your hospital must be verified before you can edit procedures.",
		};
	}

	const [currentProcedure] = await db
		.select({
			patientId: patientProcedure.patientId,
			status: patientProcedure.status,
			procedureDate: patientProcedure.procedureDate,
			updatedAt: patientProcedure.updatedAt,
		})
		.from(patientProcedure)
		.innerJoin(patient, eq(patientProcedure.patientId, patient.id))
		.where(and(eq(patientProcedure.id, procedureId), eq(patient.organizationId, organizationId)))
		.limit(1);

	if (!currentProcedure) {
		return { status: "failed", error: "Procedure could not be found." };
	}

	const staleRecordResult = {
		status: "failed" as const,
		error:
			"This procedure was changed after you opened it. Close it and open it again to see the latest version.",
	};
	if (currentProcedure.updatedAt.toISOString() !== openedUpdatedAt) {
		return staleRecordResult;
	}

	if (currentProcedure.status !== "Pending") {
		return { status: "failed", error: "Only a pending procedure can be marked as completed." };
	}

	if (
		currentProcedure.procedureDate &&
		format(currentProcedure.procedureDate, "yyyy-MM-dd") >
			format(addDays(new Date(), 1), "yyyy-MM-dd")
	) {
		return { status: "failed", error: "A completed procedure can’t be dated in the future." };
	}

	const updatedBy = session.user.name || session.user.email;
	const lastSavedAt = currentProcedure.updatedAt;
	const updatedAt = new Date(Math.max(Date.now(), lastSavedAt.getTime() + 1));

	const staleRecordError = new Error("Record changed before saving.");
	try {
		await db.transaction(async (tx) => {
			const [updatedRecord] = await tx
				.update(patientProcedure)
				.set({ status: "Completed", updatedBy, updatedAt })
				.where(
					and(
						eq(patientProcedure.id, procedureId),
						// The form's timestamp has millisecond precision; database defaults can include microseconds.
						gte(patientProcedure.updatedAt, lastSavedAt),
						lt(patientProcedure.updatedAt, new Date(lastSavedAt.getTime() + 1)),
					),
				)
				.returning({ id: patientProcedure.id });
			if (!updatedRecord) throw staleRecordError;
			await tx.insert(patientProcedureHistory).values([
				{
					id: crypto.randomUUID(),
					procedureId,
					fieldName: "status",
					oldValue: currentProcedure.status,
					newValue: "Completed",
					updatedBy,
					createdAt: updatedAt,
				},
			]);
		});
	} catch (error) {
		if (error === staleRecordError) return staleRecordResult;
		console.error("Marking the procedure as completed failed:", error);
		return { status: "failed", error: "We couldn’t save this change. Please try again." };
	}

	updateTag(`patient-procedures-${organizationId}-${currentProcedure.patientId}`);
	updateTag(`patient-procedure-details-${organizationId}-${procedureId}`);

	return { status: "success" };
}
