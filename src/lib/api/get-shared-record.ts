import "server-only";

import { and, eq, inArray } from "drizzle-orm";
import {
	organization,
	patient,
	patientAllergy,
	patientContactInformation,
	patientDiagnosis,
	patientEmergencyContact,
	patientImaging,
	patientImmunization,
	patientLabTest,
	patientMedication,
	patientPersonalInformation,
	patientPhysicalInformation,
	patientProcedure,
	patientRecordAccess,
	type PatientRecordAccessSection,
} from "@/db/schemas";
import { db } from "@/lib/better-auth/auth";
import { capitalize } from "@/lib/utils/capitalize";
import { formatDate } from "@/lib/utils/format-date";

function display(value: string | number | null | undefined) {
	return value === null || value === undefined || value === "" ? "-" : value;
}

function formatTimestamp(value: Date | null) {
	return value ? formatDate(value.toISOString()) : "-";
}

function activeOrResolved(value: string): "Active" | "Resolved" {
	return value.toLowerCase() === "active" ? "Active" : "Resolved";
}

function activeOrInactive(value: string): "Active" | "Inactive" {
	return value.toLowerCase() === "active" ? "Active" : "Inactive";
}

function completedOrPending(value: string): "Completed" | "Pending" {
	return value.toLowerCase() === "completed" ? "Completed" : "Pending";
}

function activeOrCompleted(value: string): "Active" | "Completed" {
	return value.toLowerCase() === "active" ? "Active" : "Completed";
}

function allergySeverity(value: string): "Mild" | "Moderate" | "Severe" {
	if (value.toLowerCase() === "severe") return "Severe";
	if (value.toLowerCase() === "moderate") return "Moderate";
	return "Mild";
}

function imagingModality(value: string): "CT" | "MRI" | "Ultrasound" | "X-ray" {
	const normalizedValue = value.toLowerCase();
	if (normalizedValue === "ct") return "CT";
	if (normalizedValue === "mri") return "MRI";
	if (normalizedValue === "ultrasound") return "Ultrasound";
	return "X-ray";
}

export async function getSharedRecord(accessId: string) {
	const [access] = await db
		.select({
			accessId: patientRecordAccess.id,
			patientId: patientRecordAccess.patientId,
			status: patientRecordAccess.status,
			expiresAt: patientRecordAccess.expiresAt,
			revokedAt: patientRecordAccess.revokedAt,
			selectedRecordIds: patientRecordAccess.selectedRecordIds,
			sourceOrganizationName: organization.name,
			firstName: patientPersonalInformation.firstName,
			middleName: patientPersonalInformation.middleName,
			lastName: patientPersonalInformation.lastName,
			age: patientPersonalInformation.age,
			dateOfBirth: patientPersonalInformation.dateOfBirth,
			sex: patientPersonalInformation.sex,
			maritalStatus: patientPersonalInformation.maritalStatus,
			nationalId: patientPersonalInformation.nationalId,
			phoneNumber: patientContactInformation.phoneNumber,
			emailAddress: patientContactInformation.emailAddress,
			residentialAddress: patientContactInformation.residentialAddress,
			stateOfOrigin: patientContactInformation.stateOfOrigin,
			countryOfOrigin: patientContactInformation.countryOfOrigin,
			emergencyFirstName: patientEmergencyContact.firstName,
			emergencyMiddleName: patientEmergencyContact.middleName,
			emergencyLastName: patientEmergencyContact.lastName,
			emergencyRelationship: patientEmergencyContact.relationship,
			emergencyPhoneNumber: patientEmergencyContact.phoneNumber,
			height: patientPhysicalInformation.height,
			weight: patientPhysicalInformation.weight,
			bloodGroup: patientPhysicalInformation.bloodGroup,
			genotype: patientPhysicalInformation.genotype,
		})
		.from(patientRecordAccess)
		.innerJoin(patient, eq(patientRecordAccess.patientId, patient.id))
		.innerJoin(
			patientPersonalInformation,
			eq(patient.id, patientPersonalInformation.patientId),
		)
		.innerJoin(
			organization,
			eq(patientRecordAccess.createdByOrganizationId, organization.id),
		)
		.leftJoin(
			patientContactInformation,
			eq(patient.id, patientContactInformation.patientId),
		)
		.leftJoin(
			patientEmergencyContact,
			eq(patient.id, patientEmergencyContact.patientId),
		)
		.leftJoin(
			patientPhysicalInformation,
			eq(patient.id, patientPhysicalInformation.patientId),
		)
		.where(eq(patientRecordAccess.id, accessId));

	if (
		!access ||
		access.status !== "active" ||
		access.revokedAt ||
		access.expiresAt.getTime() <= Date.now()
	) {
		return null;
	}

	const selectedIdsBySection = new Map<PatientRecordAccessSection, string[]>();
	for (const selectedRecord of access.selectedRecordIds) {
		const ids = selectedIdsBySection.get(selectedRecord.section) ?? [];
		ids.push(selectedRecord.recordId);
		selectedIdsBySection.set(selectedRecord.section, ids);
	}

	function selectedIds(section: PatientRecordAccessSection) {
		return [...new Set(selectedIdsBySection.get(section) ?? [])];
	}

	const diagnosisIds = selectedIds("diagnoses");
	const allergyIds = selectedIds("allergies");
	const immunizationIds = selectedIds("immunizations");
	const procedureIds = selectedIds("procedures");
	const medicationIds = selectedIds("medications");
	const labTestIds = selectedIds("lab-tests");
	const imagingIds = selectedIds("imaging");

	const [
		diagnoses,
		allergies,
		immunizations,
		procedures,
		medications,
		labTests,
		imaging,
	] = await Promise.all([
		diagnosisIds.length === 0
			? []
			: db
					.select()
					.from(patientDiagnosis)
					.where(
						and(
							eq(patientDiagnosis.patientId, access.patientId),
							inArray(patientDiagnosis.id, diagnosisIds),
						),
					),
		allergyIds.length === 0
			? []
			: db
					.select()
					.from(patientAllergy)
					.where(
						and(
							eq(patientAllergy.patientId, access.patientId),
							inArray(patientAllergy.id, allergyIds),
						),
					),
		immunizationIds.length === 0
			? []
			: db
					.select()
					.from(patientImmunization)
					.where(
						and(
							eq(patientImmunization.patientId, access.patientId),
							inArray(patientImmunization.id, immunizationIds),
						),
					),
		procedureIds.length === 0
			? []
			: db
					.select()
					.from(patientProcedure)
					.where(
						and(
							eq(patientProcedure.patientId, access.patientId),
							inArray(patientProcedure.id, procedureIds),
						),
					),
		medicationIds.length === 0
			? []
			: db
					.select()
					.from(patientMedication)
					.where(
						and(
							eq(patientMedication.patientId, access.patientId),
							inArray(patientMedication.id, medicationIds),
						),
					),
		labTestIds.length === 0
			? []
			: db
					.select()
					.from(patientLabTest)
					.where(
						and(
							eq(patientLabTest.patientId, access.patientId),
							inArray(patientLabTest.id, labTestIds),
						),
					),
		imagingIds.length === 0
			? []
			: db
					.select()
					.from(patientImaging)
					.where(
						and(
							eq(patientImaging.patientId, access.patientId),
							inArray(patientImaging.id, imagingIds),
						),
					),
	]);

	const availableSections = [
		"patient-details" as const,
		...(diagnoses.length > 0 ? (["diagnoses"] as const) : []),
		...(allergies.length > 0 ? (["allergies"] as const) : []),
		...(immunizations.length > 0 ? (["immunization"] as const) : []),
		...(procedures.length > 0 ? (["procedures"] as const) : []),
		...(medications.length > 0 ? (["medications"] as const) : []),
		...(labTests.length > 0 ? (["lab-tests"] as const) : []),
		...(imaging.length > 0 ? (["imaging"] as const) : []),
	];

	return {
		accessId: access.accessId,
		sourceOrganizationName: access.sourceOrganizationName,
		expiresAt: access.expiresAt.toISOString(),
		availableSections,
		patient: {
			name: [access.firstName, access.middleName, access.lastName]
				.filter(Boolean)
				.join(" "),
			sex: capitalize(String(display(access.sex))),
			email: String(display(access.emailAddress)),
			phoneNumber: String(display(access.phoneNumber)),
			address: String(display(access.residentialAddress)),
		},
		patientDetailsSections: [
			{
				title: "Personal Information",
				items: [
					{ label: "First Name", value: display(access.firstName) },
					{ label: "Middle Name", value: display(access.middleName) },
					{ label: "Last Name", value: display(access.lastName) },
					{ label: "Age", value: display(access.age) },
					{ label: "Date of Birth", value: display(access.dateOfBirth) },
					{ label: "Sex", value: capitalize(String(display(access.sex))) },
					{
						label: "Marital Status",
						value: capitalize(String(display(access.maritalStatus))),
					},
				],
			},
			{
				title: "Contact Information",
				items: [
					{ label: "Phone Number", value: display(access.phoneNumber) },
					{ label: "Email Address", value: display(access.emailAddress) },
					{
						label: "Residential Address",
						value: display(access.residentialAddress),
					},
					{ label: "State of Origin", value: display(access.stateOfOrigin) },
					{
						label: "Country of Origin",
						value: display(access.countryOfOrigin),
					},
				],
			},
			{
				title: "Emergency Contact",
				items: [
					{ label: "First Name", value: display(access.emergencyFirstName) },
					{ label: "Middle Name", value: display(access.emergencyMiddleName) },
					{ label: "Last Name", value: display(access.emergencyLastName) },
					{
						label: "Relationship",
						value: capitalize(String(display(access.emergencyRelationship))),
					},
					{
						label: "Phone Number",
						value: display(access.emergencyPhoneNumber),
					},
				],
			},
			{
				title: "Physical Information",
				items: [
					{ label: "Height", value: display(access.height) },
					{ label: "Weight", value: display(access.weight) },
					{ label: "Blood Group", value: display(access.bloodGroup) },
					{ label: "Genotype", value: display(access.genotype) },
				],
			},
		],
		records: {
			diagnoses: diagnoses.map((record) => ({
				name: record.diagnosisName,
				diagnosedAt: String(display(record.diagnosedAt)),
				lastReviewed: String(display(record.lastReviewedAt)),
				diagnosisId: record.id,
				createdAt: formatTimestamp(record.createdAt),
				status: activeOrResolved(record.status),
			})),
			allergies: allergies.map((record) => ({
				allergen: record.allergen,
				allergyId: record.id,
				reaction: record.reaction,
				createdAt: formatTimestamp(record.createdAt),
				severity: allergySeverity(record.severity),
				status: activeOrInactive(record.status),
			})),
			immunizations: immunizations.map((record) => ({
				vaccineName: record.vaccineName,
				dose: String(display(record.currentDose)),
				immunizationId: record.id,
				createdAt: formatTimestamp(record.createdAt),
				status: completedOrPending(record.status),
			})),
			procedures: procedures.map((record) => ({
				procedure: record.procedureName,
				indication: String(display(record.indication)),
				facility: String(display(record.facility ?? record.plannedFacility)),
				procedureId: record.id,
				createdAt: formatTimestamp(record.createdAt),
				status: completedOrPending(record.status),
			})),
			medications: medications.map((record) => ({
				medication: record.medicationName,
				dose: String(display(record.dose)),
				route: String(display(record.route)),
				indication: String(display(record.indication)),
				medicationId: record.id,
				createdAt: formatTimestamp(record.createdAt),
				status: activeOrCompleted(record.status),
			})),
			labTests: labTests.map((record) => ({
				test: record.testName,
				labId: record.id,
				referenceRange: String(display(record.referenceRange)),
				interpretation: String(display(record.flag ?? record.interpretation)),
				createdAt: formatTimestamp(record.createdAt),
				status: completedOrPending(record.status),
			})),
			imaging: imaging.map((record) => ({
				study: record.study,
				modality: imagingModality(record.modality),
				region: record.region,
				impression: String(display(record.impression)),
				orderedAt: formatTimestamp(record.orderedAt),
				imagingId: record.id,
				status: completedOrPending(record.status),
			})),
		},
	};
}

export type SharedRecordData = NonNullable<
	Awaited<ReturnType<typeof getSharedRecord>>
>;
