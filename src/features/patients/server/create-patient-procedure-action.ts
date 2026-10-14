"use server";

import { and, eq } from "drizzle-orm";
import { updateTag } from "next/cache";
import { patient, patientEncounter, patientProcedure } from "@/db/schemas";
import { getOrganizationId } from "@/lib/api/get-organization-id";
import { getSessionData } from "@/lib/api/get-session-data";
import { db } from "@/lib/better-auth/auth";
import { createPatientProcedureSchema } from "./schemas";

type CreatePatientProcedureResult =
	| { status: "success"; procedureId: string }
	| { status: "failed" | "unauthorized"; error: string };

export async function createPatientProcedureAction(
	patientId: string,
	formData: FormData,
): Promise<CreatePatientProcedureResult> {
	const session = await getSessionData();

	if (!session?.user?.id) {
		return { status: "unauthorized", error: "You must be signed in to add procedures." };
	}

	if (!session.user.emailVerified) {
		return { status: "failed", error: "Verify your email before adding procedures." };
	}

	const organizationId = await getOrganizationId();

	if (!organizationId) {
		return {
			status: "failed",
			error: "Your hospital must be verified before you can add procedures.",
		};
	}

	const parsedProcedure = createPatientProcedureSchema.safeParse({
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

	const [patientRow] = await db
		.select({ id: patient.id })
		.from(patient)
		.where(and(eq(patient.id, patientId), eq(patient.organizationId, organizationId)))
		.limit(1);

	if (!patientRow) {
		return { status: "failed", error: "Patient could not be found." };
	}

	const encounterId = String(formData.get("encounterId") ?? "").trim();

	if (encounterId) {
		const [encounter] = await db
			.select({ id: patientEncounter.id })
			.from(patientEncounter)
			.where(and(eq(patientEncounter.id, encounterId), eq(patientEncounter.patientId, patientId)))
			.limit(1);

		if (!encounter) {
			return { status: "failed", error: "This encounter could not be found for the patient." };
		}
	}

	const createdBy = session.user.name || session.user.email;
	const procedureId = `PRO-${crypto.randomUUID()}`;
	const {
		procedureName,
		indication,
		status,
		procedureDate,
		physician,
		assistants,
		facility,
		clinicalNote,
	} = parsedProcedure.data;
	const date = new Date(procedureDate);

	try {
		await db.insert(patientProcedure).values({
			id: procedureId,
			patientId,
			encounterId: encounterId || null,
			procedureName,
			indication: indication || null,
			status,
			...(status === "Pending"
				? {
						plannedDate: date,
						plannedPhysician: physician,
						plannedAssistants: assistants,
						plannedFacility: facility,
					}
				: { procedureDate: date, performedBy: physician, assistants, facility }),
			clinicalNote: clinicalNote || null,
			createdBy,
			updatedBy: createdBy,
		});
	} catch (error) {
		console.error("Creating patient procedure failed:", error);
		return { status: "failed", error: "We couldn’t add this procedure. Please try again." };
	}

	updateTag(`patient-procedures-${organizationId}-${patientId}`);

	return { status: "success", procedureId };
}
