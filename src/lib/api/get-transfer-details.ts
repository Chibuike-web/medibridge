import { unstable_cache } from "next/cache";
import { and, eq, inArray } from "drizzle-orm";
import {
	patient,
	patientAllergy,
	patientDiagnosis,
	patientEncounter,
	patientImaging,
	patientImmunization,
	patientLabTest,
	patientMedication,
	patientPersonalInformation,
	patientProcedure,
	patientTransfer,
	patientTransferContent,
} from "@/db/schemas";
import type {
	TransferContent,
	TransferDetailsType,
	TransferType,
} from "@/features/transfers/types";
import { db } from "../better-auth/auth";
import { getOrganizationId } from "./get-organization-id";

function formatPatientName({
	firstName,
	middleName,
	lastName,
}: {
	firstName: string;
	middleName: string | null;
	lastName: string;
}) {
	return [firstName, middleName, lastName].filter(Boolean).join(" ");
}

const transferStatuses = [
	"pending",
	"rejected",
	"completed",
	"failed",
	"cancelled",
] as const satisfies readonly TransferType["status"][];

function toTransferStatus(status: string): TransferType["status"] {
	if (status === "approved" || status === "sent") {
		return "completed";
	}

	return transferStatuses.includes(status as TransferType["status"])
		? (status as TransferType["status"])
		: "pending";
}

function formatContentType(value: string) {
	return value
		.split(/[-_\s]+/)
		.filter(Boolean)
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join(" ");
}

type TransferContentRow = {
	contentType: string;
	recordId: string;
};

type TransferContentMetadata = Pick<TransferContent, "recordName" | "status">;

function getNormalizedContentType(value: string) {
	return value.toLowerCase().replace(/[-_\s]+/g, "");
}

function getRecordIdsForContentType(
	transferContent: TransferContentRow[],
	contentTypeKeys: string[],
) {
	const normalizedContentTypeKeys = new Set(contentTypeKeys.map(getNormalizedContentType));

	return transferContent
		.filter((content) =>
			normalizedContentTypeKeys.has(getNormalizedContentType(content.contentType)),
		)
		.map((content) => content.recordId);
}

function addRecordMetadata(
	metadataByRecordId: Map<string, TransferContentMetadata>,
	rows: { recordId: string; recordName: string | null; status: string | null }[],
) {
	for (const row of rows) {
		metadataByRecordId.set(row.recordId, {
			recordName: row.recordName,
			status: row.status,
		});
	}
}

async function getTransferContentMetadata(
	transferContent: TransferContentRow[],
	patientId: string,
) {
	const metadataByRecordId = new Map<string, TransferContentMetadata>();
	const diagnosisRecordIds = getRecordIdsForContentType(transferContent, [
		"diagnosis",
		"diagnoses",
	]);
	const allergyRecordIds = getRecordIdsForContentType(transferContent, [
		"allergy",
		"allergies",
	]);
	const immunizationRecordIds = getRecordIdsForContentType(transferContent, [
		"immunization",
		"immunizations",
	]);
	const procedureRecordIds = getRecordIdsForContentType(transferContent, [
		"procedure",
		"procedures",
	]);
	const medicationRecordIds = getRecordIdsForContentType(transferContent, [
		"medication",
		"medications",
	]);
	const labRecordIds = getRecordIdsForContentType(transferContent, [
		"lab",
		"labs",
		"labtest",
		"labtests",
	]);
	const imagingRecordIds = getRecordIdsForContentType(transferContent, ["imaging"]);
	const encounterRecordIds = getRecordIdsForContentType(transferContent, [
		"encounter",
		"encounters",
	]);

	const [
		diagnoses,
		allergies,
		immunizations,
		procedures,
		medications,
		labs,
		imaging,
		encounters,
	] = await Promise.all([
		diagnosisRecordIds.length > 0
			? db
					.select({
						recordId: patientDiagnosis.id,
						recordName: patientDiagnosis.diagnosisName,
						status: patientDiagnosis.status,
					})
					.from(patientDiagnosis)
					.where(
						and(
							eq(patientDiagnosis.patientId, patientId),
							inArray(patientDiagnosis.id, diagnosisRecordIds),
						),
					)
			: [],
		allergyRecordIds.length > 0
			? db
					.select({
						recordId: patientAllergy.id,
						recordName: patientAllergy.allergen,
						status: patientAllergy.status,
					})
					.from(patientAllergy)
					.where(
						and(
							eq(patientAllergy.patientId, patientId),
							inArray(patientAllergy.id, allergyRecordIds),
						),
					)
			: [],
		immunizationRecordIds.length > 0
			? db
					.select({
						recordId: patientImmunization.id,
						recordName: patientImmunization.vaccineName,
						status: patientImmunization.status,
					})
					.from(patientImmunization)
					.where(
						and(
							eq(patientImmunization.patientId, patientId),
							inArray(patientImmunization.id, immunizationRecordIds),
						),
					)
			: [],
		procedureRecordIds.length > 0
			? db
					.select({
						recordId: patientProcedure.id,
						recordName: patientProcedure.procedureName,
						status: patientProcedure.status,
					})
					.from(patientProcedure)
					.where(
						and(
							eq(patientProcedure.patientId, patientId),
							inArray(patientProcedure.id, procedureRecordIds),
						),
					)
			: [],
		medicationRecordIds.length > 0
			? db
					.select({
						recordId: patientMedication.id,
						recordName: patientMedication.medicationName,
						status: patientMedication.status,
					})
					.from(patientMedication)
					.where(
						and(
							eq(patientMedication.patientId, patientId),
							inArray(patientMedication.id, medicationRecordIds),
						),
					)
			: [],
		labRecordIds.length > 0
			? db
					.select({
						recordId: patientLabTest.id,
						recordName: patientLabTest.testName,
						status: patientLabTest.status,
					})
					.from(patientLabTest)
					.where(
						and(
							eq(patientLabTest.patientId, patientId),
							inArray(patientLabTest.id, labRecordIds),
						),
					)
			: [],
		imagingRecordIds.length > 0
			? db
					.select({
						recordId: patientImaging.id,
						recordName: patientImaging.study,
						status: patientImaging.status,
					})
					.from(patientImaging)
					.where(
						and(
							eq(patientImaging.patientId, patientId),
							inArray(patientImaging.id, imagingRecordIds),
						),
					)
			: [],
		encounterRecordIds.length > 0
			? db
					.select({
						recordId: patientEncounter.id,
						recordName: patientEncounter.encounterType,
					})
					.from(patientEncounter)
					.where(
						and(
							eq(patientEncounter.patientId, patientId),
							inArray(patientEncounter.id, encounterRecordIds),
						),
					)
			: [],
	]);

	addRecordMetadata(metadataByRecordId, diagnoses);
	addRecordMetadata(metadataByRecordId, allergies);
	addRecordMetadata(metadataByRecordId, immunizations);
	addRecordMetadata(metadataByRecordId, procedures);
	addRecordMetadata(metadataByRecordId, medications);
	addRecordMetadata(metadataByRecordId, labs);
	addRecordMetadata(metadataByRecordId, imaging);
	addRecordMetadata(
		metadataByRecordId,
		encounters.map((encounter) => ({
			...encounter,
			status: null,
		})),
	);

	return metadataByRecordId;
}

export async function getTransferDetails(
	transferId: string,
): Promise<TransferDetailsType | null> {
	const organizationId = await getOrganizationId();

	if (!organizationId) return null;

	return unstable_cache(
		async () => {
			const [transfer] = await db
				.select({
					transferId: patientTransfer.id,
					status: patientTransfer.status,
					patientId: patientTransfer.patientId,
					requestedAt: patientTransfer.requestedAt,
					requestedBy: patientTransfer.requestedBy,
					createdBy: patientTransfer.createdBy,
					updatedBy: patientTransfer.updatedBy,
					targetHospitalName: patientTransfer.targetHospitalName,
					targetHospitalAdminName: patientTransfer.targetHospitalAdminName,
					targetHospitalAdminEmail: patientTransfer.targetHospitalAdminEmail,
					firstName: patientPersonalInformation.firstName,
					middleName: patientPersonalInformation.middleName,
					lastName: patientPersonalInformation.lastName,
				})
				.from(patientTransfer)
				.innerJoin(patient, eq(patientTransfer.patientId, patient.id))
				.innerJoin(
					patientPersonalInformation,
					eq(patient.id, patientPersonalInformation.patientId),
				)
				.where(
					and(
						eq(patientTransfer.id, transferId),
						eq(patientTransfer.sourceOrganizationId, organizationId),
					),
				);

			if (!transfer) return null;

			const transferContent = await db
				.select({
					contentType: patientTransferContent.contentType,
					recordId: patientTransferContent.recordId,
				})
				.from(patientTransferContent)
				.where(eq(patientTransferContent.transferId, transfer.transferId));
			const transferContentMetadata = await getTransferContentMetadata(
				transferContent,
				transfer.patientId,
			);

			return {
				id: transfer.transferId,
				patientName: formatPatientName(transfer),
				patientFirstName: transfer.firstName,
				patientMiddleName: transfer.middleName,
				patientLastName: transfer.lastName,
				patientId: transfer.patientId,
				status: toTransferStatus(transfer.status),
				requestedAt: transfer.requestedAt.toISOString(),
				requestedBy: transfer.requestedBy,
				createdBy: transfer.createdBy,
				updatedBy: transfer.updatedBy,
				targetHospitalName: transfer.targetHospitalName,
				targetHospitalAdminName: transfer.targetHospitalAdminName,
				targetHospitalAdminEmail: transfer.targetHospitalAdminEmail,
				transferContent: transferContent.map((content) => {
					const metadata = transferContentMetadata.get(content.recordId);

					return {
						contentType: formatContentType(content.contentType),
						recordId: content.recordId,
						recordName: metadata?.recordName ?? null,
						status: metadata?.status ?? null,
					};
				}),
			};
		},
		[`transfer-details-record-metadata-v3-${organizationId}-${transferId}`],
		{ tags: [`transfer-details-${organizationId}-${transferId}`] },
	)();
}
