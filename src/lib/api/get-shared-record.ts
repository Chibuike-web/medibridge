import "server-only";

import { getSharedSection } from "@/app/(app)/shared-records/[accessId]/shared-record-sections";
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

function toDateFilterValue(value: Date | string | null) {
	if (!value) return "";
	const date = new Date(value);
	return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

function activeOrResolved(value: string): "Active" | "Resolved" {
	return value.toLowerCase() === "active" ? "Active" : "Resolved";
}

function activeOrInactive(value: string): "Active" | "Inactive" {
	return value.toLowerCase() === "active" ? "Active" : "Inactive";
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

function immunizationStatus(value: string): "Active" | "Completed" | "Cancelled" | "Discontinued" {
	if (value.toLowerCase() === "completed") return "Completed";
	if (value.toLowerCase() === "cancelled") return "Cancelled";
	if (value.toLowerCase() === "discontinued") return "Discontinued";
	return "Active";
}

function procedureStatus(value: string): "Pending" | "Completed" | "Cancelled" {
	if (value.toLowerCase() === "completed") return "Completed";
	if (value.toLowerCase() === "cancelled") return "Cancelled";
	return "Pending";
}

function medicationStatus(value: string): "Active" | "Completed" | "Discontinued" {
	if (value.toLowerCase() === "completed") return "Completed";
	if (value.toLowerCase() === "discontinued") return "Discontinued";
	return "Active";
}

function labTestStatus(value: string): "Pending" | "Completed" | "Cancelled" {
	if (value.toLowerCase() === "completed") return "Completed";
	if (value.toLowerCase() === "cancelled") return "Cancelled";
	return "Pending";
}

function imagingStatus(value: string): "Pending" | "Completed" | "Cancelled" {
	if (value.toLowerCase() === "completed") return "Completed";
	if (value.toLowerCase() === "cancelled") return "Cancelled";
	return "Pending";
}

export async function getSharedRecord(accessId: string, section?: string) {
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
		.innerJoin(patientPersonalInformation, eq(patient.id, patientPersonalInformation.patientId))
		.innerJoin(organization, eq(patientRecordAccess.createdByOrganizationId, organization.id))
		.leftJoin(patientContactInformation, eq(patient.id, patientContactInformation.patientId))
		.leftJoin(patientEmergencyContact, eq(patient.id, patientEmergencyContact.patientId))
		.leftJoin(patientPhysicalInformation, eq(patient.id, patientPhysicalInformation.patientId))
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
	const patientDetailIds = selectedIds("patient-details");
	const availableSections = [
		...(patientDetailIds.length > 0 ? (["patient-details"] as const) : []),
		...(diagnosisIds.length > 0 ? (["diagnoses"] as const) : []),
		...(allergyIds.length > 0 ? (["allergies"] as const) : []),
		...(immunizationIds.length > 0 ? (["immunization"] as const) : []),
		...(procedureIds.length > 0 ? (["procedures"] as const) : []),
		...(medicationIds.length > 0 ? (["medications"] as const) : []),
		...(labTestIds.length > 0 ? (["lab-tests"] as const) : []),
		...(imagingIds.length > 0 ? (["imaging"] as const) : []),
	];
	const activeSection = getSharedSection(section, availableSections);

	const [diagnoses, allergies, immunizations, procedures, medications, labTests, imaging] =
		await Promise.all([
			activeSection !== "diagnoses" || diagnosisIds.length === 0
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
			activeSection !== "allergies" || allergyIds.length === 0
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
			activeSection !== "immunization" || immunizationIds.length === 0
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
			activeSection !== "procedures" || procedureIds.length === 0
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
			activeSection !== "medications" || medicationIds.length === 0
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
			activeSection !== "lab-tests" || labTestIds.length === 0
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
			activeSection !== "imaging" || imagingIds.length === 0
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

	return {
		accessId: access.accessId,
		sourceOrganizationName: access.sourceOrganizationName,
		expiresAt: access.expiresAt.toISOString(),
		availableSections,
		activeSection,
		patient: {
			name: [access.firstName, access.middleName, access.lastName].filter(Boolean).join(" "),
			sex: capitalize(String(display(access.sex))),
			age: String(display(access.age)),
		},
		patientDetailsSections: [
			{
				id: "personal-information",
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
				id: "contact-information",
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
				id: "emergency-contact",
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
				id: "physical-information",
				title: "Physical Information",
				items: [
					{ label: "Height", value: display(access.height) },
					{ label: "Weight", value: display(access.weight) },
					{ label: "Blood Group", value: display(access.bloodGroup) },
					{ label: "Genotype", value: display(access.genotype) },
				],
			},
		].filter(
			(section) => activeSection === "patient-details" && patientDetailIds.includes(section.id),
		),
		records: {
			diagnoses: diagnoses.map((record) => ({
				name: record.diagnosisName,
				diagnosedAt: String(display(record.diagnosedAt)),
				diagnosedAtValue: toDateFilterValue(record.diagnosedAt),
				lastReviewed: String(display(record.lastReviewedAt)),
				lastReviewedValue: toDateFilterValue(record.lastReviewedAt),
				diagnosisId: record.id,
				createdAt: formatTimestamp(record.createdAt),
				createdAtValue: toDateFilterValue(record.createdAt),
				status: activeOrResolved(record.status),
			})),
			allergies: allergies.map((record) => ({
				allergen: record.allergen,
				allergyId: record.id,
				reaction: record.reaction,
				createdAt: formatTimestamp(record.createdAt),
				createdAtValue: toDateFilterValue(record.createdAt),
				severity: allergySeverity(record.severity),
				status: activeOrInactive(record.status),
			})),
			immunizations: immunizations.map((record) => ({
				vaccineName: record.vaccineName,
				dose: String(display(record.currentDose)),
				immunizationId: record.id,
				createdAt: formatTimestamp(record.createdAt),
				createdAtValue: toDateFilterValue(record.createdAt),
				status: immunizationStatus(record.status),
			})),
			procedures: procedures.map((record) => ({
				procedure: record.procedureName,
				indication: String(display(record.indication)),
				facility: String(display(record.facility ?? record.plannedFacility)),
				procedureId: record.id,
				createdAt: formatTimestamp(record.createdAt),
				createdAtValue: toDateFilterValue(record.createdAt),
				status: procedureStatus(record.status),
			})),
			medications: medications.map((record) => ({
				medication: record.medicationName,
				dose: String(display(record.dose)),
				frequency: String(display(record.frequency)),
				duration: String(display(record.duration)),
				route: String(display(record.route)),
				indication: String(display(record.indication)),
				medicationId: record.id,
				createdAt: formatTimestamp(record.createdAt),
				createdAtValue: toDateFilterValue(record.createdAt),
				status: medicationStatus(record.status),
			})),
			labTests: labTests.map((record) => ({
				test: record.testName,
				result: String(display(record.result)),
				labId: record.id,
				referenceRange: String(display(record.referenceRange)),
				interpretation: String(display(record.flag ?? record.interpretation)),
				createdAt: formatTimestamp(record.createdAt),
				createdAtValue: toDateFilterValue(record.createdAt),
				status: labTestStatus(record.status),
			})),
			imaging: imaging.map((record) => ({
				study: record.study,
				modality: imagingModality(record.modality),
				region: record.region,
				impression: String(display(record.impression)),
				orderedAt: formatTimestamp(record.orderedAt),
				orderedAtValue: toDateFilterValue(record.orderedAt),
				createdAt: formatTimestamp(record.createdAt),
				createdAtValue: toDateFilterValue(record.createdAt),
				imagingId: record.id,
				status: imagingStatus(record.status),
			})),
		},
	};
}

export type SharedRecordData = NonNullable<Awaited<ReturnType<typeof getSharedRecord>>>;
