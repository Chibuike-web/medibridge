"use server";

import { PatientSchema, PatientType } from "@/app/api/extract-file/schemas/patient-schema";
import {
	patientContactInformation,
	patientEmergencyContact,
	patientPersonalIdentification,
	patientPhysicalInformation,
} from "@/db/schemas/patient";
import { auth, db } from "@/lib/better-auth/auth";
import { headers } from "next/headers";
import { SavePatientRecordsResult } from "./types";

function isBlank(value: string | null | undefined) {
	return value === null || value === undefined || value.trim() === "";
}

function validatePatientRecords(records: PatientType) {
	for (const [index, record] of records.entries()) {
		const label = `Patient ${index + 1}`;
		const { personalInfo, emergencyInfo } = record;

		if (isBlank(personalInfo.firstName)) return `${label}: first name is required.`;
		if (isBlank(personalInfo.lastName)) return `${label}: last name is required.`;
		if (isBlank(personalInfo.patientId)) return `${label}: patient ID is required.`;
		if (isBlank(emergencyInfo.firstName)) {
			return `${label}: emergency contact first name is required.`;
		}
		if (isBlank(emergencyInfo.lastName)) {
			return `${label}: emergency contact last name is required.`;
		}
	}

	return null;
}

export async function saveExtractedPatientRecordsService(
	input: PatientType,
): Promise<SavePatientRecordsResult> {
	try {
		const parsedRecords = PatientSchema.safeParse(input);
		if (!parsedRecords.success) {
			return {
				status: "failed",
				error: "Invalid patient record payload.",
			};
		}

		const records = parsedRecords.data;
		if (records.length === 0) {
			return { status: "failed", error: "No patient records were provided." };
		}

		const validationError = validatePatientRecords(records);
		if (validationError) {
			return { status: "failed", error: validationError };
		}

		const session = await auth.api.getSession({ headers: await headers() });
		const organizationId = session?.session.activeOrganizationId;

		if (!session?.user?.id) {
			return { status: "failed", error: "You must be signed in to save patient records." };
		}

		if (!organizationId) {
			return { status: "failed", error: "No active organization was found for this session." };
		}

		await db.transaction(async (tx) => {
			for (const record of records) {
				const personalIdentificationId = crypto.randomUUID();
				const contactInformationId = crypto.randomUUID();
				const emergencyContactId = crypto.randomUUID();
				const physicalInformationId = crypto.randomUUID();

				await tx.insert(patientPersonalIdentification).values({
					id: personalIdentificationId,
					organizationId,
					firstName: record.personalInfo.firstName!.trim(),
					middleName: record.personalInfo.middleName,
					lastName: record.personalInfo.lastName!.trim(),
					patientId: record.personalInfo.patientId!.trim(),
					dateOfBirth: record.personalInfo.dateOfBirth,
					age: record.personalInfo.age,
					sex: record.personalInfo.sex,
					maritalStatus: record.personalInfo.maritalStatus,
					nationalId: record.personalInfo.nationalId,
				});

				await tx.insert(patientContactInformation).values({
					id: contactInformationId,
					personalIdentificationId,
					phoneNumber: record.contactInfo.phoneNumber,
					emailAddress: record.contactInfo.emailAddress,
					residentialAddress: record.contactInfo.residentialAddress,
					stateOfOrigin: record.contactInfo.stateOfOrigin,
					countryOfOrigin: record.contactInfo.countryOfOrigin,
				});

				await tx.insert(patientEmergencyContact).values({
					id: emergencyContactId,
					personalIdentificationId,
					firstName: record.emergencyInfo.firstName!.trim(),
					middleName: record.emergencyInfo.middleName,
					lastName: record.emergencyInfo.lastName!.trim(),
					relationship: record.emergencyInfo.relationship,
					phoneNumber: record.emergencyInfo.phone,
				});

				await tx.insert(patientPhysicalInformation).values({
					id: physicalInformationId,
					personalIdentificationId,
					height: record.physicalInfo.height,
					weight: record.physicalInfo.weight,
					bloodGroup: record.physicalInfo.bloodGroup,
					genotype: record.physicalInfo.genotype,
				});
			}
		});

		return {
			status: "success",
			savedCount: records.length,
		};
	} catch (error) {
		console.error(error);
		return {
			status: "failed",
			error: error instanceof Error ? error.message : "Failed to save patient records.",
		};
	}
}
