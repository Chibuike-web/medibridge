"use server";

import {
	patient,
	patientContactInformation,
	patientEmergencyContact,
	patientPersonalInformation,
	patientPhysicalInformation,
} from "@/db/schemas";
import { db } from "@/lib/better-auth/auth";
import { getOrganizationId } from "@/lib/api/get-organization-id";
import { deletePatientUploadService } from "@/services/patient/delete-patient-upload-service";
import { saveExtractedPatientsService } from "@/services/patient/save-extracted-patients-service";
import { updateTag } from "next/cache";
import { and, eq } from "drizzle-orm";

import { PatientType } from "../schemas/patient-schema";
import type { DiagnosisStatusFilter } from "../types";
import {
	updatePatientContactInformationSchema,
	updatePatientEmergencyContactSchema,
	updatePatientPersonalInformationSchema,
	updatePatientPhysicalInformationSchema,
} from "./schemas";
import { getPatientById } from "@/lib/api/get-patient-by-id";
import { getPatients } from "@/lib/api/get-patients";
import { getPatientAllergies } from "@/lib/api/get-patient-allergies";
import { getPatientDiagnoses } from "@/lib/api/get-patient-diagnoses";
import { getPatientDiagnosisDetails } from "@/lib/api/get-patient-diagnosis-details";
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

export async function updatePatientPersonalInformationAction(
	patientId: string,
	formData: FormData,
) {
	const organizationId = await getOrganizationId();

	if (!organizationId) {
		return { ok: false, message: "Unable to verify your hospital." };
	}

	const parsedPersonalInformation = updatePatientPersonalInformationSchema.safeParse({
		firstName: formData.get("firstName"),
		middleName: formData.get("middleName"),
		lastName: formData.get("lastName"),
		age: formData.get("age"),
		dateOfBirth: formData.get("dateOfBirth"),
		sex: formData.get("sex"),
		maritalStatus: formData.get("maritalStatus"),
		nationalId: formData.get("nationalId"),
	});

	if (!parsedPersonalInformation.success) {
		return {
			ok: false,
			message:
				parsedPersonalInformation.error.issues[0]?.message ??
				"Please check the personal information fields.",
		};
	}

	const [patientRow] = await db
		.select({ id: patient.id })
		.from(patient)
		.where(and(eq(patient.id, patientId), eq(patient.organizationId, organizationId)))
		.limit(1);

	if (!patientRow) {
		return { ok: false, message: "Patient record was not found." };
	}

	const personalInformation = parsedPersonalInformation.data;
	const normalizedAge = personalInformation.age ?? null;

	await db
		.update(patientPersonalInformation)
		.set({
			firstName: personalInformation.firstName,
			middleName: personalInformation.middleName || null,
			lastName: personalInformation.lastName,
			age: normalizedAge,
			dateOfBirth: personalInformation.dateOfBirth || null,
			sex: personalInformation.sex || null,
			maritalStatus: personalInformation.maritalStatus || null,
			nationalId: personalInformation.nationalId || null,
			updatedAt: new Date(),
		})
		.where(eq(patientPersonalInformation.patientId, patientId));

	updateTag(`patient-profile-${organizationId}-${patientId}`);
	updateTag(`patient-by-id-${organizationId}-${patientId}`);
	updateTag(`patients-list-${organizationId}`);
	updateTag(`recent-patients-${organizationId}`);
	updateTag(`recent-transfers-${organizationId}`);

	return { ok: true, message: "" };
}

export async function updatePatientContactInformationAction(
	patientId: string,
	formData: FormData,
) {
	const organizationId = await getOrganizationId();

	if (!organizationId) {
		return { ok: false, message: "Unable to verify your hospital." };
	}

	const parsedContactInformation = updatePatientContactInformationSchema.safeParse({
		phoneNumber: formData.get("phoneNumber"),
		emailAddress: formData.get("emailAddress"),
		residentialAddress: formData.get("residentialAddress"),
		stateOfOrigin: formData.get("stateOfOrigin"),
		countryOfOrigin: formData.get("countryOfOrigin"),
	});

	if (!parsedContactInformation.success) {
		return {
			ok: false,
			message:
				parsedContactInformation.error.issues[0]?.message ??
				"Please check the contact information fields.",
		};
	}

	const [patientRow] = await db
		.select({ id: patient.id })
		.from(patient)
		.where(and(eq(patient.id, patientId), eq(patient.organizationId, organizationId)))
		.limit(1);

	if (!patientRow) {
		return { ok: false, message: "Patient record was not found." };
	}

	const contactInformation = parsedContactInformation.data;

	await db
		.insert(patientContactInformation)
		.values({
			id: crypto.randomUUID(),
			patientId,
			phoneNumber: contactInformation.phoneNumber || null,
			emailAddress: contactInformation.emailAddress || null,
			residentialAddress: contactInformation.residentialAddress || null,
			stateOfOrigin: contactInformation.stateOfOrigin || null,
			countryOfOrigin: contactInformation.countryOfOrigin || null,
			updatedAt: new Date(),
		})
		.onConflictDoUpdate({
			target: patientContactInformation.patientId,
			set: {
				phoneNumber: contactInformation.phoneNumber || null,
				emailAddress: contactInformation.emailAddress || null,
				residentialAddress: contactInformation.residentialAddress || null,
				stateOfOrigin: contactInformation.stateOfOrigin || null,
				countryOfOrigin: contactInformation.countryOfOrigin || null,
				updatedAt: new Date(),
			},
		});

	updateTag(`patient-profile-${organizationId}-${patientId}`);
	updateTag(`patient-by-id-${organizationId}-${patientId}`);
	updateTag(`patients-list-${organizationId}`);
	updateTag(`recent-patients-${organizationId}`);
	updateTag(`recent-transfers-${organizationId}`);

	return { ok: true, message: "" };
}

export async function updatePatientEmergencyContactAction(
	patientId: string,
	formData: FormData,
) {
	const organizationId = await getOrganizationId();

	if (!organizationId) {
		return { ok: false, message: "Unable to verify your hospital." };
	}

	const parsedEmergencyContact = updatePatientEmergencyContactSchema.safeParse({
		firstName: formData.get("firstName"),
		middleName: formData.get("middleName"),
		lastName: formData.get("lastName"),
		relationship: formData.get("relationship"),
		phoneNumber: formData.get("phoneNumber"),
	});

	if (!parsedEmergencyContact.success) {
		return {
			ok: false,
			message:
				parsedEmergencyContact.error.issues[0]?.message ??
				"Please check the emergency contact fields.",
		};
	}

	const [patientRow] = await db
		.select({ id: patient.id })
		.from(patient)
		.where(and(eq(patient.id, patientId), eq(patient.organizationId, organizationId)))
		.limit(1);

	if (!patientRow) {
		return { ok: false, message: "Patient record was not found." };
	}

	const emergencyContact = parsedEmergencyContact.data;

	await db
		.insert(patientEmergencyContact)
		.values({
			id: crypto.randomUUID(),
			patientId,
			firstName: emergencyContact.firstName,
			middleName: emergencyContact.middleName || null,
			lastName: emergencyContact.lastName,
			relationship: emergencyContact.relationship || null,
			phoneNumber: emergencyContact.phoneNumber || null,
			updatedAt: new Date(),
		})
		.onConflictDoUpdate({
			target: patientEmergencyContact.patientId,
			set: {
				firstName: emergencyContact.firstName,
				middleName: emergencyContact.middleName || null,
				lastName: emergencyContact.lastName,
				relationship: emergencyContact.relationship || null,
				phoneNumber: emergencyContact.phoneNumber || null,
				updatedAt: new Date(),
			},
		});

	updateTag(`patient-profile-${organizationId}-${patientId}`);
	updateTag(`patient-by-id-${organizationId}-${patientId}`);
	updateTag(`patients-list-${organizationId}`);
	updateTag(`recent-patients-${organizationId}`);
	updateTag(`recent-transfers-${organizationId}`);

	return { ok: true, message: "" };
}

export async function updatePatientPhysicalInformationAction(
	patientId: string,
	formData: FormData,
) {
	const organizationId = await getOrganizationId();

	if (!organizationId) {
		return { ok: false, message: "Unable to verify your hospital." };
	}

	const parsedPhysicalInformation = updatePatientPhysicalInformationSchema.safeParse({
		height: formData.get("height"),
		weight: formData.get("weight"),
		bloodGroup: formData.get("bloodGroup"),
		genotype: formData.get("genotype"),
	});

	if (!parsedPhysicalInformation.success) {
		return {
			ok: false,
			message:
				parsedPhysicalInformation.error.issues[0]?.message ??
				"Please check the physical information fields.",
		};
	}

	const [patientRow] = await db
		.select({ id: patient.id })
		.from(patient)
		.where(and(eq(patient.id, patientId), eq(patient.organizationId, organizationId)))
		.limit(1);

	if (!patientRow) {
		return { ok: false, message: "Patient record was not found." };
	}

	const physicalInformation = parsedPhysicalInformation.data;

	await db
		.insert(patientPhysicalInformation)
		.values({
			id: crypto.randomUUID(),
			patientId,
			height: physicalInformation.height || null,
			weight: physicalInformation.weight || null,
			bloodGroup: physicalInformation.bloodGroup || null,
			genotype: physicalInformation.genotype || null,
			updatedAt: new Date(),
		})
		.onConflictDoUpdate({
			target: patientPhysicalInformation.patientId,
			set: {
				height: physicalInformation.height || null,
				weight: physicalInformation.weight || null,
				bloodGroup: physicalInformation.bloodGroup || null,
				genotype: physicalInformation.genotype || null,
				updatedAt: new Date(),
			},
		});

	updateTag(`patient-profile-${organizationId}-${patientId}`);
	updateTag(`patient-by-id-${organizationId}-${patientId}`);
	updateTag(`patients-list-${organizationId}`);
	updateTag(`recent-patients-${organizationId}`);
	updateTag(`recent-transfers-${organizationId}`);

	return { ok: true, message: "" };
}

export async function getPatientByIdAction(patientId: string) {
	const patient = await getPatientById(patientId);

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
	createdFrom = "",
	createdTo = "",
	diagnosedFrom = "",
	diagnosedTo = "",
	lastReviewedFrom = "",
	lastReviewedTo = "",
	statusFilters = [],
}: {
	patientId: string;
	page: number | string;
	limit: number | string;
	query?: string;
	createdFrom?: string;
	createdTo?: string;
	diagnosedFrom?: string;
	diagnosedTo?: string;
	lastReviewedFrom?: string;
	lastReviewedTo?: string;
	statusFilters?: DiagnosisStatusFilter[];
}) {
	const currentPage = typeof page === "string" ? parseInt(page, 10) : page;
	const currentLimit = typeof limit === "string" ? parseInt(limit, 10) : limit;
	const { diagnoses, totalDiagnoses } = await getPatientDiagnoses(
		patientId,
		currentPage,
		currentLimit,
		query,
		{
			createdFrom,
			createdTo,
			diagnosedFrom,
			diagnosedTo,
			lastReviewedFrom,
			lastReviewedTo,
		},
		statusFilters,
	);

	return {
		diagnoses,
		page: currentPage,
		limit: currentLimit,
		totalPages: Math.ceil(totalDiagnoses / currentLimit) || 1,
	};
}

export async function getPatientDiagnosisDetailsAction(diagnosisId: string) {
	return getPatientDiagnosisDetails(diagnosisId);
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
