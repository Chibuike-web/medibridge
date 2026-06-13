"use server";

import { deletePatientUploadService } from "@/services/patient/delete-patient-upload-service";
import { saveExtractedPatientsService } from "@/services/patient/save-extracted-patients-service";

import { PatientType } from "../schemas/patient-schema";
import { getPatientById as getCachedPatientById } from "@/lib/api/get-patient-by-id";
import { getPatients } from "@/lib/api/get-patients";
import { getPatientAllergies } from "@/lib/api/get-patient-allergies";
import { getPatientDiagnoses } from "@/lib/api/get-patient-diagnoses";
import { getPatientEncounters } from "@/lib/api/get-patient-encounters";
import { getPatientImaging } from "@/lib/api/get-patient-imaging";
import { getPatientImmunizations } from "@/lib/api/get-patient-immunizations";
import { getPatientLabTests } from "@/lib/api/get-patient-lab-tests";
import { getPatientMedications } from "@/lib/api/get-patient-medications";
import { getPatientProcedures } from "@/lib/api/get-patient-procedures";

export async function deletePatientUploadAction(relativePath: string) {
	return deletePatientUploadService(relativePath);
}

export async function savePatientsAction(records: PatientType) {
	return saveExtractedPatientsService(records);
}

export async function getPatientById(patientId: string) {
	const patient = await getCachedPatientById(patientId);

	if (!patient) return null;

	return {
		...patient,
		patientId,
	};
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

export async function getPatientProceduresTableAction({
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
	const { procedures, totalProcedures } = await getPatientProcedures(
		patientId,
		currentPage,
		currentLimit,
		query,
	);

	return {
		procedures,
		page: currentPage,
		limit: currentLimit,
		totalPages: Math.ceil(totalProcedures / currentLimit) || 1,
	};
}

export async function getPatientMedicationsTableAction({
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
	const { medications, totalMedications } = await getPatientMedications(
		patientId,
		currentPage,
		currentLimit,
		query,
	);

	return {
		medications,
		page: currentPage,
		limit: currentLimit,
		totalPages: Math.ceil(totalMedications / currentLimit) || 1,
	};
}

export async function getPatientEncountersTableAction({
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
	const { encounters, totalEncounters } = await getPatientEncounters(
		patientId,
		currentPage,
		currentLimit,
		query,
	);

	return {
		encounters,
		page: currentPage,
		limit: currentLimit,
		totalPages: Math.ceil(totalEncounters / currentLimit) || 1,
	};
}

export async function getPatientLabTestsTableAction({
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
	const { labTests, totalLabTests } = await getPatientLabTests(
		patientId,
		currentPage,
		currentLimit,
		query,
	);

	return {
		labTests,
		page: currentPage,
		limit: currentLimit,
		totalPages: Math.ceil(totalLabTests / currentLimit) || 1,
	};
}

export async function getPatientImagingTableAction({
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
	const { imagingStudies, totalImagingStudies } = await getPatientImaging(
		patientId,
		currentPage,
		currentLimit,
		query,
	);

	return {
		imagingStudies,
		page: currentPage,
		limit: currentLimit,
		totalPages: Math.ceil(totalImagingStudies / currentLimit) || 1,
	};
}
