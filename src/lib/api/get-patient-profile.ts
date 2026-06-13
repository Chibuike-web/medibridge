import { unstable_cache } from "next/cache";
import {
	patient,
	patientAllergy,
	patientContactInformation,
	patientDiagnosis,
	patientEmergencyContact,
	patientPersonalInformation,
	patientPhysicalInformation,
} from "@/db/schemas";
import { db } from "@/lib/better-auth/auth";
import { formatDateTime } from "@/lib/utils/format-date-time";
import { and, desc, eq } from "drizzle-orm";
import { getOrganizationId } from "./get-organization-id";

export type PatientProfile = Awaited<ReturnType<typeof getPatientProfile>>;

function empty(value: string | number | null | undefined) {
	return value ?? "-";
}

function formatSentenceCaseValue(value: string | null | undefined) {
	if (!value) return "-";

	const normalizedValue = value.replaceAll("_", " ").trim();

	if (!normalizedValue) return "-";

	return (
		normalizedValue.charAt(0).toUpperCase() +
		normalizedValue.slice(1).toLowerCase()
	);
}

function formatMonthYear(value: string | null) {
	if (!value) return "-";

	const date = new Date(value);

	if (Number.isNaN(date.getTime())) {
		return value;
	}

	return new Intl.DateTimeFormat("en-US", {
		month: "long",
		year: "numeric",
	}).format(date);
}

function normalizeDiagnosisStatus(status: string): "Active" | "Resolved" {
	return status === "Resolved" ? "Resolved" : "Active";
}

function normalizeAllergyStatus(status: string): "Active" | "Inactive" {
	return status === "Inactive" ? "Inactive" : "Active";
}

export async function getPatientProfile(patientId: string) {
	const organizationId = await getOrganizationId();

	if (!organizationId) {
		return null;
	}

	return unstable_cache(
		async () => {
			const [profile] = await db
				.select({
					id: patient.id,
					patientId: patient.patientId,
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
				.from(patient)
				.innerJoin(
					patientPersonalInformation,
					eq(patient.id, patientPersonalInformation.patientId),
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
				.where(and(eq(patient.id, patientId), eq(patient.organizationId, organizationId)))
				.limit(1);

			if (!profile) {
				return null;
			}

			const [diagnoses, allergies] = await Promise.all([
				db
					.select({
						id: patientDiagnosis.id,
						name: patientDiagnosis.diagnosisName,
						diagnosedAt: patientDiagnosis.diagnosedAt,
						updatedAt: patientDiagnosis.updatedAt,
						createdAt: patientDiagnosis.createdAt,
						status: patientDiagnosis.status,
					})
					.from(patientDiagnosis)
					.where(eq(patientDiagnosis.patientId, patientId))
					.orderBy(desc(patientDiagnosis.createdAt))
					.limit(4),
				db
					.select({
						id: patientAllergy.id,
						allergen: patientAllergy.allergen,
						reaction: patientAllergy.reaction,
						createdAt: patientAllergy.createdAt,
						severity: patientAllergy.severity,
						status: patientAllergy.status,
					})
					.from(patientAllergy)
					.where(eq(patientAllergy.patientId, patientId))
					.orderBy(desc(patientAllergy.createdAt))
					.limit(4),
			]);

			const fullName = [profile.firstName, profile.middleName, profile.lastName]
				.filter(Boolean)
				.join(" ");

			return {
				personalInformation: [
					{ label: "First name", value: profile.firstName },
					{ label: "Middle name", value: empty(profile.middleName) },
					{ label: "Last name", value: profile.lastName },
					{ label: "Patient ID", value: profile.patientId },
					{ label: "Age", value: empty(profile.age) },
					{ label: "Date of birth", value: empty(profile.dateOfBirth) },
					{ label: "Sex", value: formatSentenceCaseValue(profile.sex) },
					{
						label: "Marital status",
						value: formatSentenceCaseValue(profile.maritalStatus),
					},
					{ label: "National ID", value: empty(profile.nationalId) },
				],
				contactInformation: [
					{ label: "Phone number", value: empty(profile.phoneNumber) },
					{ label: "Email address", value: empty(profile.emailAddress) },
					{
						label: "Residential address",
						value: empty(profile.residentialAddress),
					},
					{ label: "State of origin", value: empty(profile.stateOfOrigin) },
					{ label: "Country of origin", value: empty(profile.countryOfOrigin) },
				],
				emergencyContact: [
					{ label: "First name", value: empty(profile.emergencyFirstName) },
					{ label: "Middle name", value: empty(profile.emergencyMiddleName) },
					{ label: "Last name", value: empty(profile.emergencyLastName) },
					{
						label: "Relationship",
						value: formatSentenceCaseValue(profile.emergencyRelationship),
					},
					{ label: "Phone", value: empty(profile.emergencyPhoneNumber) },
				],
				physicalInformation: [
					{ label: "Height", value: empty(profile.height) },
					{ label: "Weight", value: empty(profile.weight) },
					{ label: "Blood group", value: empty(profile.bloodGroup) },
					{ label: "Genotype", value: empty(profile.genotype) },
				],
				overviewPersonalInformation: [
					{ label: "Full name", value: fullName },
					{ label: "Age", value: empty(profile.age) },
					{ label: "Sex", value: formatSentenceCaseValue(profile.sex) },
					{ label: "Patient ID", value: profile.patientId },
					{ label: "Blood group", value: empty(profile.bloodGroup) },
					{ label: "Date of birth", value: empty(profile.dateOfBirth) },
					{ label: "Phone number", value: empty(profile.phoneNumber) },
					{ label: "Email address", value: empty(profile.emailAddress) },
					{
						label: "Residential address",
						value: empty(profile.residentialAddress),
					},
				],
				overviewMedicalInformation: [
					{ label: "Height", value: empty(profile.height) },
					{ label: "Weight", value: empty(profile.weight) },
					{ label: "Genotype", value: empty(profile.genotype) },
					{ label: "Blood group", value: empty(profile.bloodGroup) },
				],
				recentDiagnoses: diagnoses.map((diagnosis) => ({
					name: diagnosis.name,
					diagnosedAt: formatMonthYear(diagnosis.diagnosedAt),
					lastReviewed: formatDateTime(diagnosis.updatedAt),
					id: diagnosis.id,
					createdAt: formatDateTime(diagnosis.createdAt),
					status: normalizeDiagnosisStatus(diagnosis.status),
				})),
				recentAllergies: allergies.map((allergy) => ({
					allergen: allergy.allergen,
					id: allergy.id,
					reaction: allergy.reaction,
					createdAt: formatDateTime(allergy.createdAt),
					severity: allergy.severity,
					status: normalizeAllergyStatus(allergy.status),
				})),
			};
		},
		[`patient-profile-diagnosed-at-record-primary-ids-${organizationId}-${patientId}`],
		{ tags: [`patient-profile-${organizationId}-${patientId}`] },
	)();
}
