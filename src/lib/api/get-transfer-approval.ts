import { format } from "date-fns";
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
	patientTransfer,
	patientTransferContent,
	user,
} from "@/db/schemas";
import { clinicalRecords, patientDetailSections } from "@/features/transfers/data";
import { db } from "@/lib/better-auth/auth";
import { capitalize } from "@/lib/utils/capitalize";

type SharedField = { label: string; value: string };

export type TransferApprovalRecord = {
	transferId: string;
	patientName: string;
	sourceHospitalName: string;
	targetHospitalName: string;
	requestedByName: string | null;
	requestedAt: string;
	reason: string | null;
	accessEndsAt: string;
	status: string;
	patientApprovalStatus: string | null;
	patientRejectionReason: string | null;
	sharedDetailSections: { title: string; fields: SharedField[] }[];
	sharedRecordGroups: {
		label: string;
		records: { id: string; name: string; status: string; fields: SharedField[] }[];
	}[];
};

function display(value: string | number | null | undefined) {
	return value === null || value === undefined || value === "" ? "-" : String(value);
}

function displayDate(value: Date | string | null) {
	return value ? format(new Date(value), "do MMMM yyyy") : "-";
}

export async function getTransferApproval(
	transferId: string,
): Promise<TransferApprovalRecord | null> {
	const [transfer] = await db
		.select({
			transferId: patientTransfer.id,
			patientId: patientTransfer.patientId,
			status: patientTransfer.status,
			patientApprovalStatus: patientTransfer.patientApprovalStatus,
			patientRejectionReason: patientTransfer.patientRejectionReason,
			requestedAt: patientTransfer.requestedAt,
			requestedByName: user.name,
			reason: patientTransfer.notes,
			accessExpiresAt: patientRecordAccess.expiresAt,
			sourceHospitalName: organization.name,
			targetHospitalName: patientTransfer.targetHospitalName,
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
		.from(patientTransfer)
		.innerJoin(patient, eq(patientTransfer.patientId, patient.id))
		.innerJoin(patientPersonalInformation, eq(patient.id, patientPersonalInformation.patientId))
		.innerJoin(organization, eq(patientTransfer.sourceOrganizationId, organization.id))
		.leftJoin(patientContactInformation, eq(patient.id, patientContactInformation.patientId))
		.leftJoin(patientEmergencyContact, eq(patient.id, patientEmergencyContact.patientId))
		.leftJoin(patientPhysicalInformation, eq(patient.id, patientPhysicalInformation.patientId))
		.leftJoin(user, eq(patientTransfer.requestedBy, user.id))
		.leftJoin(patientRecordAccess, eq(patientRecordAccess.patientTransferId, patientTransfer.id))
		.where(eq(patientTransfer.id, transferId));

	if (!transfer) return null;

	const transferContent = await db
		.select({
			contentType: patientTransferContent.contentType,
			recordId: patientTransferContent.recordId,
		})
		.from(patientTransferContent)
		.where(eq(patientTransferContent.transferId, transfer.transferId));
	const selectedIds = (contentType: string) =>
		transferContent
			.filter((content) => content.contentType === contentType)
			.map((content) => content.recordId);
	const patientId = transfer.patientId;
	const [
		diagnosisIds,
		allergyIds,
		immunizationIds,
		procedureIds,
		medicationIds,
		labTestIds,
		imagingIds,
	] = [
		"diagnoses",
		"allergies",
		"immunizations",
		"procedures",
		"medications",
		"lab-tests",
		"imaging",
	].map(selectedIds);

	const [diagnoses, allergies, immunizations, procedures, medications, labTests, imaging] =
		await Promise.all([
			diagnosisIds.length === 0
				? []
				: db
						.select()
						.from(patientDiagnosis)
						.where(
							and(
								eq(patientDiagnosis.patientId, patientId),
								inArray(patientDiagnosis.id, diagnosisIds),
							),
						),
			allergyIds.length === 0
				? []
				: db
						.select()
						.from(patientAllergy)
						.where(
							and(eq(patientAllergy.patientId, patientId), inArray(patientAllergy.id, allergyIds)),
						),
			immunizationIds.length === 0
				? []
				: db
						.select()
						.from(patientImmunization)
						.where(
							and(
								eq(patientImmunization.patientId, patientId),
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
								eq(patientProcedure.patientId, patientId),
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
								eq(patientMedication.patientId, patientId),
								inArray(patientMedication.id, medicationIds),
							),
						),
			labTestIds.length === 0
				? []
				: db
						.select()
						.from(patientLabTest)
						.where(
							and(eq(patientLabTest.patientId, patientId), inArray(patientLabTest.id, labTestIds)),
						),
			imagingIds.length === 0
				? []
				: db
						.select()
						.from(patientImaging)
						.where(
							and(eq(patientImaging.patientId, patientId), inArray(patientImaging.id, imagingIds)),
						),
		]);

	const detailFields: Record<string, SharedField[]> = {
		"personal-information": [
			{
				label: "Name",
				value: [transfer.firstName, transfer.middleName, transfer.lastName]
					.filter(Boolean)
					.join(" "),
			},
			{ label: "Age", value: display(transfer.age) },
			{ label: "Date of birth", value: display(transfer.dateOfBirth) },
			{ label: "Sex", value: capitalize(display(transfer.sex)) },
			{ label: "Marital status", value: capitalize(display(transfer.maritalStatus)) },
			{ label: "National ID", value: display(transfer.nationalId) },
		],
		"contact-information": [
			{ label: "Phone number", value: display(transfer.phoneNumber) },
			{ label: "Email address", value: display(transfer.emailAddress) },
			{ label: "Residential address", value: display(transfer.residentialAddress) },
			{ label: "State of origin", value: display(transfer.stateOfOrigin) },
			{ label: "Country of origin", value: display(transfer.countryOfOrigin) },
		],
		"emergency-contact": [
			{
				label: "Name",
				value: display(
					[transfer.emergencyFirstName, transfer.emergencyMiddleName, transfer.emergencyLastName]
						.filter(Boolean)
						.join(" "),
				),
			},
			{ label: "Relationship", value: capitalize(display(transfer.emergencyRelationship)) },
			{ label: "Phone number", value: display(transfer.emergencyPhoneNumber) },
		],
		"physical-information": [
			{ label: "Height", value: display(transfer.height) },
			{ label: "Weight", value: display(transfer.weight) },
			{ label: "Blood group", value: display(transfer.bloodGroup) },
			{ label: "Genotype", value: display(transfer.genotype) },
		],
	};
	const recordsByType = {
		diagnoses: diagnoses.map((record) => ({
			id: record.id,
			name: record.diagnosisName,
			status: record.status,
			fields: [
				{ label: "Severity/Stage", value: display(record.severityStage) },
				{ label: "Diagnosed by", value: display(record.diagnosedBy) },
				{ label: "Diagnosed at", value: displayDate(record.diagnosedAt) },
			],
		})),
		allergies: allergies.map((record) => ({
			id: record.id,
			name: record.allergen,
			status: record.status,
			fields: [
				{ label: "Severity", value: display(record.severity) },
				{ label: "Reaction", value: display(record.reaction) },
			],
		})),
		immunizations: immunizations.map((record) => ({
			id: record.id,
			name: record.vaccineName,
			status: record.status,
			fields: [
				{ label: "Dose", value: display(record.currentDose) },
				{ label: "Date given", value: displayDate(record.dateAdministered) },
			],
		})),
		procedures: procedures.map((record) => ({
			id: record.id,
			name: record.procedureName,
			status: record.status,
			fields: [
				{ label: "Indication", value: display(record.indication) },
				{ label: "Facility", value: display(record.facility ?? record.plannedFacility) },
				{ label: "Date", value: displayDate(record.procedureDate ?? record.plannedDate) },
			],
		})),
		medications: medications.map((record) => ({
			id: record.id,
			name: record.medicationName,
			status: record.status,
			fields: [
				{ label: "Dose", value: display(record.dose) },
				{ label: "Frequency", value: display(record.frequency) },
				{ label: "Duration", value: display(record.duration) },
			],
		})),
		"lab-tests": labTests.map((record) => ({
			id: record.id,
			name: record.testName,
			status: record.status,
			fields: [
				{ label: "Result", value: display(record.result) },
				{ label: "Flag", value: display(record.flag) },
			],
		})),
		imaging: imaging.map((record) => ({
			id: record.id,
			name: record.study,
			status: record.status,
			fields: [
				{ label: "Modality", value: display(record.modality) },
				{ label: "Region", value: display(record.region) },
			],
		})),
	};

	return {
		transferId: transfer.transferId,
		patientName: [transfer.firstName, transfer.middleName, transfer.lastName]
			.filter(Boolean)
			.join(" "),
		sourceHospitalName: transfer.sourceHospitalName,
		targetHospitalName: transfer.targetHospitalName,
		requestedByName: transfer.requestedByName,
		requestedAt: transfer.requestedAt.toISOString(),
		reason: transfer.reason,
		accessEndsAt: (
			transfer.accessExpiresAt ?? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
		).toISOString(),
		status: transfer.status,
		patientApprovalStatus: transfer.patientApprovalStatus,
		patientRejectionReason: transfer.patientRejectionReason,
		sharedDetailSections: patientDetailSections
			.filter((section) => selectedIds("patient-details").includes(section.id))
			.map((section) => ({ title: section.label, fields: detailFields[section.id] })),
		sharedRecordGroups: clinicalRecords
			.filter((record) => record.id !== "patient-details")
			.map((record) => ({
				label: record.label,
				records: recordsByType[record.id as keyof typeof recordsByType],
			}))
			.filter((group) => group.records.length > 0),
	};
}
