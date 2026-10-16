"use server";

import { format, parseISO } from "date-fns";
import { and, eq } from "drizzle-orm";
import { updateTag } from "next/cache";
import { patient, patientProcedure, patientProcedureHistory } from "@/db/schemas";
import { getOrganizationId } from "@/lib/api/get-organization-id";
import { getSessionData } from "@/lib/api/get-session-data";
import { db } from "@/lib/better-auth/auth";
import { patientProcedureSchema } from "./schemas";

type UpdatePatientProcedureResult =
	| { status: "success" }
	| { status: "failed" | "unauthorized"; error: string };

export async function updatePatientProcedureAction(
	procedureId: string,
	formData: FormData,
): Promise<UpdatePatientProcedureResult> {
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

	const parsedProcedure = patientProcedureSchema.safeParse({
		procedureName: formData.get("procedureName") ?? "",
		indication: formData.get("indication") ?? "",
		status: formData.get("status"),
		procedureDate: formData.get("procedureDate") ?? "",
		physician: formData.get("physician") ?? "",
		assistants: formData.get("assistants") ?? "",
		facility: formData.get("facility") ?? "",
		clinicalNote: formData.get("clinicalNote") ?? "",
	});

	if (!parsedProcedure.success) {
		return { status: "failed", error: parsedProcedure.error.issues[0].message };
	}

	const [currentProcedure] = await db
		.select({
			patientId: patientProcedure.patientId,
			procedureName: patientProcedure.procedureName,
			indication: patientProcedure.indication,
			status: patientProcedure.status,
			procedureDate: patientProcedure.procedureDate,
			performedBy: patientProcedure.performedBy,
			assistants: patientProcedure.assistants,
			facility: patientProcedure.facility,
			plannedDate: patientProcedure.plannedDate,
			plannedPhysician: patientProcedure.plannedPhysician,
			plannedAssistants: patientProcedure.plannedAssistants,
			plannedFacility: patientProcedure.plannedFacility,
			clinicalNote: patientProcedure.clinicalNote,
			updatedAt: patientProcedure.updatedAt,
		})
		.from(patientProcedure)
		.innerJoin(patient, eq(patientProcedure.patientId, patient.id))
		.where(and(eq(patientProcedure.id, procedureId), eq(patient.organizationId, organizationId)))
		.limit(1);

	if (!currentProcedure) {
		return { status: "failed", error: "Procedure could not be found." };
	}

	if (currentProcedure.updatedAt.toISOString() !== formData.get("updatedAt")) {
		return {
			status: "failed",
			error:
				"This procedure was changed after you opened it. Close it and open it again to see the latest version.",
		};
	}

	const isPlanned = currentProcedure.status === "Pending";
	const previousProcedure = {
		procedureName: currentProcedure.procedureName,
		indication: currentProcedure.indication,
		status: currentProcedure.status,
		procedureDate:
			(isPlanned
				? (currentProcedure.plannedDate ?? currentProcedure.procedureDate)
				: (currentProcedure.procedureDate ?? currentProcedure.plannedDate)
			)
				?.toISOString()
				.slice(0, 10) ?? null,
		physician: isPlanned
			? (currentProcedure.plannedPhysician ?? currentProcedure.performedBy)
			: (currentProcedure.performedBy ?? currentProcedure.plannedPhysician),
		assistants: isPlanned
			? (currentProcedure.plannedAssistants ?? currentProcedure.assistants)
			: (currentProcedure.assistants ?? currentProcedure.plannedAssistants),
		facility: isPlanned
			? (currentProcedure.plannedFacility ?? currentProcedure.facility)
			: (currentProcedure.facility ?? currentProcedure.plannedFacility),
		clinicalNote: currentProcedure.clinicalNote,
	};
	const { indication, clinicalNote, ...procedure } = parsedProcedure.data;
	const nextProcedure = {
		...procedure,
		indication: indication || null,
		clinicalNote: clinicalNote || null,
	};
	const changedFields = (Object.keys(nextProcedure) as (keyof typeof nextProcedure)[]).filter(
		(field) => nextProcedure[field] !== previousProcedure[field],
	);

	if (changedFields.length === 0) {
		return { status: "success" };
	}

	const updatedBy = session.user.name || session.user.email;
	const updatedAt = new Date();
	const date = new Date(nextProcedure.procedureDate);
	const historyValue = (field: keyof typeof nextProcedure, value: string | null) =>
		value && field === "procedureDate" ? format(parseISO(value), "do MMMM yyyy") : value;

	try {
		await db.transaction(async (tx) => {
			await tx
				.update(patientProcedure)
				.set({
					procedureName: nextProcedure.procedureName,
					indication: nextProcedure.indication,
					status: nextProcedure.status,
					clinicalNote: nextProcedure.clinicalNote,
					...(nextProcedure.status === "Pending"
						? {
								plannedDate: date,
								plannedPhysician: nextProcedure.physician,
								plannedAssistants: nextProcedure.assistants,
								plannedFacility: nextProcedure.facility,
							}
						: {
								procedureDate: date,
								performedBy: nextProcedure.physician,
								assistants: nextProcedure.assistants,
								facility: nextProcedure.facility,
							}),
					updatedBy,
					updatedAt,
				})
				.where(eq(patientProcedure.id, procedureId));
			await tx.insert(patientProcedureHistory).values(
				changedFields.map((field) => ({
					id: crypto.randomUUID(),
					procedureId,
					fieldName: field.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`),
					oldValue: historyValue(field, previousProcedure[field]),
					newValue: historyValue(field, nextProcedure[field]),
					updatedBy,
					createdAt: updatedAt,
				})),
			);
		});
	} catch (error) {
		console.error("Updating patient procedure failed:", error);
		return { status: "failed", error: "We couldn’t save these changes. Please try again." };
	}

	updateTag(`patient-procedures-${organizationId}-${currentProcedure.patientId}`);
	updateTag(`patient-procedure-details-${organizationId}-${procedureId}`);

	return { status: "success" };
}
