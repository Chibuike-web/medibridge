import "server-only";

import { eq } from "drizzle-orm";
import {
	patientContactInformation,
	patientEmergencyContact,
	patientPersonalInformation,
	patientPhysicalInformation,
} from "@/db/schemas";
import { db } from "@/lib/better-auth/auth";
import { capitalize } from "@/lib/utils/capitalize";
import { getSharedRecord } from "./get-shared-record";

function display(value: string | number | null | undefined) {
	return value === null || value === undefined || value === "" ? "-" : value;
}

export async function getSharedPatientDetails(accessId: string) {
	const sharedRecord = await getSharedRecord(accessId);
	if (!sharedRecord) return [];

	const detailIds = sharedRecord.selectedRecordIds
		.filter((record) => record.section === "patient-details")
		.map((record) => record.recordId);
	const [details] = await db
		.select({
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
		.from(patientPersonalInformation)
		.leftJoin(
			patientContactInformation,
			eq(patientPersonalInformation.patientId, patientContactInformation.patientId),
		)
		.leftJoin(
			patientEmergencyContact,
			eq(patientPersonalInformation.patientId, patientEmergencyContact.patientId),
		)
		.leftJoin(
			patientPhysicalInformation,
			eq(patientPersonalInformation.patientId, patientPhysicalInformation.patientId),
		)
		.where(eq(patientPersonalInformation.patientId, sharedRecord.patientId));

	return [
		{
			id: "personal-information",
			title: "Personal Information",
			items: [
				{ label: "First Name", value: display(details.firstName) },
				{ label: "Middle Name", value: display(details.middleName) },
				{ label: "Last Name", value: display(details.lastName) },
				{ label: "Age", value: display(details.age) },
				{ label: "Date of Birth", value: display(details.dateOfBirth) },
				{ label: "Sex", value: capitalize(String(display(details.sex))) },
				{
					label: "Marital Status",
					value: capitalize(String(display(details.maritalStatus))),
				},
			],
		},
		{
			id: "contact-information",
			title: "Contact Information",
			items: [
				{ label: "Phone Number", value: display(details.phoneNumber) },
				{ label: "Email Address", value: display(details.emailAddress) },
				{
					label: "Residential Address",
					value: display(details.residentialAddress),
				},
				{ label: "State of Origin", value: display(details.stateOfOrigin) },
				{
					label: "Country of Origin",
					value: display(details.countryOfOrigin),
				},
			],
		},
		{
			id: "emergency-contact",
			title: "Emergency Contact",
			items: [
				{ label: "First Name", value: display(details.emergencyFirstName) },
				{ label: "Middle Name", value: display(details.emergencyMiddleName) },
				{ label: "Last Name", value: display(details.emergencyLastName) },
				{
					label: "Relationship",
					value: capitalize(String(display(details.emergencyRelationship))),
				},
				{
					label: "Phone Number",
					value: display(details.emergencyPhoneNumber),
				},
			],
		},
		{
			id: "physical-information",
			title: "Physical Information",
			items: [
				{ label: "Height", value: display(details.height) },
				{ label: "Weight", value: display(details.weight) },
				{ label: "Blood Group", value: display(details.bloodGroup) },
				{ label: "Genotype", value: display(details.genotype) },
			],
		},
	].filter((section) => detailIds.includes(section.id));
}
