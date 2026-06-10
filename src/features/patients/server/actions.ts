"use server";

import { deletePatientUploadService } from "@/services/patient/delete-patient-upload-service";
import { saveExtractedPatientsService } from "@/services/patient/save-extracted-patients-service";
import { eq } from "drizzle-orm";
import { db } from "@/lib/better-auth/auth";
import { patientContactInformation, patientPersonalInformation } from "@/db/schemas";

import { PatientType } from "../schemas/patient-schema";
import { getOrganizationId } from "@/lib/api/get-organization-id";
import { getPatients } from "@/lib/api/get-patients";
import { getPatientAllergies } from "@/lib/api/get-patient-allergies";
import { getPatientDiagnoses } from "@/lib/api/get-patient-diagnoses";
import { getPatientImmunizations } from "@/lib/api/get-patient-immunizations";

export async function deletePatientUploadAction(relativePath: string) {
	return deletePatientUploadService(relativePath);
}

export async function savePatientsAction(records: PatientType) {
	return saveExtractedPatientsService(records);
}

export async function getPatientById(patientId: string) {
	const organizationId = await getOrganizationId();

	if (!organizationId) {
		return null;
	}

	const rows = await db
		.select({
			patientId: patientPersonalInformation.patientId,
			firstName: patientPersonalInformation.firstName,
			lastName: patientPersonalInformation.lastName,
			email: patientContactInformation.emailAddress,
			phoneNumber: patientContactInformation.phoneNumber,
			address: patientContactInformation.residentialAddress,
		})
		.from(patientPersonalInformation)
		.leftJoin(
			patientContactInformation,
			eq(patientPersonalInformation.patientId, patientContactInformation.patientId),
		)
		.where(eq(patientPersonalInformation.patientId, patientId));

	return rows[0] ?? null;
}

export async function getPatientsTableAction({
	page,
	limit,
	query = "",
}: {
	page: number | string;
	limit: number | string;
	query?: string;
}) {
	const currentPage = typeof page === "string" ? parseInt(page, 10) : page;
	const currentLimit = typeof limit === "string" ? parseInt(limit, 10) : limit;
	const { patients, totalPatients } = await getPatients(currentPage, currentLimit, query);

	return {
		patients,
		page: currentPage,
		limit: currentLimit,
		totalPages: Math.ceil(totalPatients / currentLimit) || 1,
	};
}

export async function getPatientDiagnosesTableAction({
	patientId,
	page,
	limit,
	query = "",
}: {
	patientId: string;
	page: number | string;
	limit: number | string;
	query?: string;
}) {
	const currentPage = typeof page === "string" ? parseInt(page, 10) : page;
	const currentLimit = typeof limit === "string" ? parseInt(limit, 10) : limit;
	const { diagnoses, totalDiagnoses } = await getPatientDiagnoses(
		patientId,
		currentPage,
		currentLimit,
		query,
	);

	return {
		diagnoses,
		page: currentPage,
		limit: currentLimit,
		totalPages: Math.ceil(totalDiagnoses / currentLimit) || 1,
	};
}

export async function getPatientAllergiesTableAction({
	patientId,
	page,
	limit,
	query = "",
}: {
	patientId: string;
	page: number | string;
	limit: number | string;
	query?: string;
}) {
	const currentPage = typeof page === "string" ? parseInt(page, 10) : page;
	const currentLimit = typeof limit === "string" ? parseInt(limit, 10) : limit;
	const { allergies, totalAllergies } = await getPatientAllergies(
		patientId,
		currentPage,
		currentLimit,
		query,
	);

	return {
		allergies,
		page: currentPage,
		limit: currentLimit,
		totalPages: Math.ceil(totalAllergies / currentLimit) || 1,
	};
}

export async function getPatientImmunizationsTableAction({
	patientId,
	page,
	limit,
	query = "",
}: {
	patientId: string;
	page: number | string;
	limit: number | string;
	query?: string;
}) {
	const currentPage = typeof page === "string" ? parseInt(page, 10) : page;
	const currentLimit = typeof limit === "string" ? parseInt(limit, 10) : limit;
	const { immunizations, totalImmunizations } = await getPatientImmunizations(
		patientId,
		currentPage,
		currentLimit,
		query,
	);

	return {
		immunizations,
		page: currentPage,
		limit: currentLimit,
		totalPages: Math.ceil(totalImmunizations / currentLimit) || 1,
	};
}
