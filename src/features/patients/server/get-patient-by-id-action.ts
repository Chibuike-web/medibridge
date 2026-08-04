"use server";

import { getPatientById } from "@/lib/api/get-patient-by-id";

export async function getPatientByIdAction(patientId: string) {
	const patient = await getPatientById(patientId);

	if (!patient) return null;

	return {
		...patient,
		patientId,
	};
}
