import "server-only";

import {
	PatientRecordSchema,
	type PatientRecord,
} from "@/features/patients/schemas/patient-schema";
import {
	patient,
	patientContactInformation,
	patientEmergencyContact,
	patientPersonalInformation,
	patientExtraction,
	patientPhysicalInformation,
} from "@/db/schemas/patient";
import { db } from "@/lib/better-auth/auth";
import { patientUploads } from "@/lib/storage/client";
import { updateTag } from "next/cache";
import { and, eq } from "drizzle-orm";
import { SavePatientsResult } from "./types";
import { getOrganizationId } from "@/lib/api/get-organization-id";
import { getSessionData } from "@/lib/api/get-session-data";
import { z } from "zod";

function isBlank(value: string | null | undefined) {
	return value === null || value === undefined || value.trim() === "";
}

function validatePatient({ personalInfo, emergencyInfo }: PatientRecord) {
	if (isBlank(personalInfo.firstName)) return "First name is required.";
	if (isBlank(personalInfo.lastName)) return "Last name is required.";
	if (isBlank(personalInfo.dateOfBirth)) return "Date of birth is required.";
	if (!z.iso.date().safeParse(personalInfo.dateOfBirth).success) {
		return "Provide a valid date of birth.";
	}
	if (isBlank(emergencyInfo.firstName)) return "Emergency contact first name is required.";
	if (isBlank(emergencyInfo.lastName)) return "Emergency contact last name is required.";
	return null;
}

export async function saveExtractedPatientsService(
	extractionId: string,
	documentId: string,
	input: PatientRecord,
): Promise<SavePatientsResult> {
	try {
		const parsedRecord = PatientRecordSchema.safeParse(input);
		if (!parsedRecord.success) {
			return { status: "failed", error: "Invalid patient payload." };
		}

		const record = parsedRecord.data;
		const validationError = validatePatient(record);
		if (validationError) {
			return { status: "failed", error: validationError };
		}

		const session = await getSessionData();

		if (!session?.user?.id) {
			return { status: "unauthorized", error: "You must be signed in to save patients." };
		}

		if (!session.user.emailVerified) {
			return { status: "failed", error: "Verify your email before saving patients." };
		}

		const organizationId = await getOrganizationId();

		if (!organizationId) {
			return { status: "failed", error: "No active organization was found for this session." };
		}

		const personalInformation = {
			firstName: record.personalInfo.firstName!.trim(),
			middleName: record.personalInfo.middleName,
			lastName: record.personalInfo.lastName!.trim(),
			dateOfBirth: record.personalInfo.dateOfBirth,
			age: record.personalInfo.age,
			sex: record.personalInfo.sex?.toLowerCase() ?? null,
			maritalStatus: record.personalInfo.maritalStatus?.toLowerCase() ?? null,
			nationalId: record.personalInfo.nationalId,
		};
		const contactInformation = {
			phoneNumber: record.contactInfo.phoneNumber,
			emailAddress: record.contactInfo.emailAddress,
			residentialAddress: record.contactInfo.residentialAddress,
			stateOfOrigin: record.contactInfo.stateOfOrigin,
			countryOfOrigin: record.contactInfo.countryOfOrigin,
		};
		const emergencyContact = {
			firstName: record.emergencyInfo.firstName!.trim(),
			middleName: record.emergencyInfo.middleName,
			lastName: record.emergencyInfo.lastName!.trim(),
			relationship: record.emergencyInfo.relationship,
			phoneNumber: record.emergencyInfo.phone,
		};
		const physicalInformation = {
			height: record.physicalInfo.height,
			weight: record.physicalInfo.weight,
			bloodGroup: record.physicalInfo.bloodGroup,
			genotype: record.physicalInfo.genotype,
		};

		const saveResult = await db.transaction(async (tx) => {
			const [extraction] = await tx
				.select({
					createdBy: patientExtraction.createdBy,
					extractedData: patientExtraction.extractedData,
				})
				.from(patientExtraction)
				.where(
					and(
						eq(patientExtraction.id, extractionId),
						eq(patientExtraction.organizationId, organizationId),
					),
				)
				.for("update");

			if (!extraction) {
				return { status: "invalid", error: "This review was already cleared." } as const;
			}

			const document = extraction.extractedData.find(
				(document) => document.documentId === documentId,
			);
			if (!document) {
				return { status: "invalid", error: "This patient was already saved." } as const;
			}
			if (document.status !== "ready") {
				return { status: "failed", error: "This document can’t be saved." } as const;
			}

			const patientId = crypto.randomUUID();
			await tx.insert(patient).values({ id: patientId, organizationId });
			await tx.insert(patientPersonalInformation).values({
				id: crypto.randomUUID(),
				patientId,
				...personalInformation,
			});
			await tx.insert(patientContactInformation).values({
				id: crypto.randomUUID(),
				patientId,
				...contactInformation,
			});
			await tx.insert(patientEmergencyContact).values({
				id: crypto.randomUUID(),
				patientId,
				...emergencyContact,
			});
			await tx.insert(patientPhysicalInformation).values({
				id: crypto.randomUUID(),
				patientId,
				...physicalInformation,
			});

			const remainingDocuments = extraction.extractedData.filter(
				(document) => document.documentId !== documentId,
			);
			if (remainingDocuments.length === 0) {
				await tx.delete(patientExtraction).where(eq(patientExtraction.id, extractionId));
			} else {
				await tx
					.update(patientExtraction)
					.set({ extractedData: remainingDocuments })
					.where(eq(patientExtraction.id, extractionId));
			}

			return {
				status: "success",
				patientId,
				sourceKey: `${organizationId}/${extraction.createdBy}/${documentId}`,
			} as const;
		});

		if (saveResult.status !== "success") {
			return saveResult;
		}

		updateTag(`patients-list-${organizationId}`);
		updateTag(`recent-patients-${organizationId}`);
		updateTag(`overview-stats-${organizationId}`);
		updateTag(`patient-profile-${organizationId}-${saveResult.patientId}`);
		updateTag(`patient-by-id-${organizationId}-${saveResult.patientId}`);
		updateTag(`recent-transfers-${organizationId}`);
		updateTag(`transfers-list-${organizationId}`);
		updateTag(`patient-extraction-${organizationId}-${extractionId}`);

		const { error: removeError } = await patientUploads.remove([saveResult.sourceKey]);
		if (removeError) console.error("Removing saved patient document failed:", removeError);

		return { status: "success", savedCount: 1 };
	} catch (error) {
		console.error(error);
		return { status: "failed", error: "We couldn’t save this patient. Please try again." };
	}
}
