import {
	patient,
	patientDiagnosis,
	patientDiagnosisHistory,
	patientImaging,
	patientLabTest,
	patientMedication,
	patientProcedure,
} from "@/db/schemas";
import type {
	DiagnosisDetailsHistoryEvent,
	DiagnosisDetailsRelatedRecord,
	DiagnosisDetailsType,
} from "@/features/patients/types";
import { db } from "@/lib/better-auth/auth";
import { and, desc, eq, ilike, or } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { getOrdinal } from "@/lib/utils/get-ordinal";
import { getOrganizationId } from "./get-organization-id";

const EMPTY_VALUE = "-";

function normalizeDiagnosisStatus(value: string): DiagnosisDetailsType["status"] {
	return value === "Resolved" ? "Resolved" : "Active";
}

function normalizeRecordStatus(value: string) {
	const normalizedValue = value.toLowerCase();

	if (normalizedValue === "completed") return "Completed";
	if (normalizedValue === "cancelled") return "Cancelled";
	if (normalizedValue === "discontinued") return "Discontinued";
	if (normalizedValue === "resolved") return "Resolved";

	return "Active";
}

function formatSentenceCaseValue(value: string | null | undefined) {
	if (!value) return EMPTY_VALUE;

	const normalizedValue = value.replaceAll("_", " ").trim();

	if (!normalizedValue) return EMPTY_VALUE;

	return normalizedValue.charAt(0).toUpperCase() + normalizedValue.slice(1).toLowerCase();
}

function formatDateOnly(value: Date | string | null | undefined) {
	if (!value) return EMPTY_VALUE;

	const date = value instanceof Date ? value : new Date(value);

	if (Number.isNaN(date.getTime())) {
		return typeof value === "string" ? value : EMPTY_VALUE;
	}

	const day = date.getDate();
	const month = date.toLocaleString("en-US", { month: "long" });
	const year = date.getFullYear();

	return `${day}${getOrdinal(day)} ${month} ${year}`;
}

function formatTimelineTimestamp(value: Date | string | null | undefined) {
	if (!value) return EMPTY_VALUE;

	const date = value instanceof Date ? value : new Date(value);

	if (Number.isNaN(date.getTime())) {
		return typeof value === "string" ? value : EMPTY_VALUE;
	}

	const dateLabel = new Intl.DateTimeFormat("en-GB", {
		day: "numeric",
		month: "long",
		year: "numeric",
	}).format(date);
	const timeLabel = new Intl.DateTimeFormat("en-GB", {
		hour: "2-digit",
		minute: "2-digit",
		hour12: false,
	}).format(date);

	return `${dateLabel} at ${timeLabel}`;
}

function empty(value: string | null | undefined) {
	return value?.trim() || EMPTY_VALUE;
}

function buildCreatedHistoryEvent(
	diagnosis: {
		severityStage: string | null;
		diagnosedAt: string | null;
		status: string;
		diagnosedBy: string | null;
		createdAt: Date;
	},
): DiagnosisDetailsHistoryEvent {
	return {
		id: "created",
		title: "Created",
		timestamp: formatTimelineTimestamp(diagnosis.createdAt),
		items: [
			{ label: "Severity/Stage", value: formatSentenceCaseValue(diagnosis.severityStage) },
			{ label: "Onset", value: formatDateOnly(diagnosis.diagnosedAt) },
			{ label: "Status", value: normalizeDiagnosisStatus(diagnosis.status) },
			{ label: "Diagnosed by", value: empty(diagnosis.diagnosedBy) },
		],
	};
}

function buildUpdatedHistoryEvent(
	diagnosis: {
		status: string;
		updatedBy: string | null;
		updatedAt: Date;
	},
): DiagnosisDetailsHistoryEvent {
	return {
		id: "updated",
		title: "Updated",
		timestamp: formatTimelineTimestamp(diagnosis.updatedAt),
		items: [
			{ label: "Status", value: normalizeDiagnosisStatus(diagnosis.status) },
			{ label: "Updated by", value: empty(diagnosis.updatedBy) },
		],
	};
}

function mapHistoryEvent(history: {
	id: string;
	fieldName: string;
	newValue: string | null;
	updatedBy: string | null;
	createdAt: Date;
}): DiagnosisDetailsHistoryEvent {
	return {
		id: history.id,
		title: "Updated",
		timestamp: formatTimelineTimestamp(history.createdAt),
		items: [
			{ label: formatSentenceCaseValue(history.fieldName), value: empty(history.newValue) },
			{ label: "Updated by", value: empty(history.updatedBy) },
		],
	};
}

function mapRelatedRecord(record: {
	id: string;
	name: string;
	status: string;
}): DiagnosisDetailsRelatedRecord {
	return {
		id: record.id,
		name: record.name,
		status: normalizeRecordStatus(record.status),
	};
}

export async function getPatientDiagnosisDetails(diagnosisId: string) {
	const organizationId = await getOrganizationId();

	if (!organizationId) {
		return null;
	}

	return unstable_cache(
		async (): Promise<DiagnosisDetailsType | null> => {
			const [diagnosis] = await db
				.select({
					id: patientDiagnosis.id,
					patientId: patientDiagnosis.patientId,
					encounterId: patientDiagnosis.encounterId,
					name: patientDiagnosis.diagnosisName,
					status: patientDiagnosis.status,
					severityStage: patientDiagnosis.severityStage,
					diagnosedAt: patientDiagnosis.diagnosedAt,
					lastReviewedAt: patientDiagnosis.lastReviewedAt,
					clinicalNote: patientDiagnosis.clinicalNote,
					diagnosedBy: patientDiagnosis.diagnosedBy,
					createdBy: patientDiagnosis.createdBy,
					updatedBy: patientDiagnosis.updatedBy,
					createdAt: patientDiagnosis.createdAt,
					updatedAt: patientDiagnosis.updatedAt,
				})
				.from(patientDiagnosis)
				.innerJoin(patient, eq(patientDiagnosis.patientId, patient.id))
				.where(and(eq(patientDiagnosis.id, diagnosisId), eq(patient.organizationId, organizationId)))
				.limit(1);

			if (!diagnosis) {
				return null;
			}

			const relationFilter = diagnosis.encounterId
				? or(
						eq(patientMedication.encounterId, diagnosis.encounterId),
						ilike(patientMedication.indication, `%${diagnosis.name}%`),
					)
				: ilike(patientMedication.indication, `%${diagnosis.name}%`);

			const [historyRows, medications, labTests, imagingStudies, procedures] = await Promise.all([
				db
					.select({
						id: patientDiagnosisHistory.id,
						fieldName: patientDiagnosisHistory.fieldName,
						newValue: patientDiagnosisHistory.newValue,
						updatedBy: patientDiagnosisHistory.updatedBy,
						createdAt: patientDiagnosisHistory.createdAt,
					})
					.from(patientDiagnosisHistory)
					.where(eq(patientDiagnosisHistory.diagnosisId, diagnosis.id))
					.orderBy(desc(patientDiagnosisHistory.createdAt)),
				db
					.select({
						id: patientMedication.id,
						name: patientMedication.medicationName,
						status: patientMedication.status,
					})
					.from(patientMedication)
					.where(and(eq(patientMedication.patientId, diagnosis.patientId), relationFilter))
					.orderBy(desc(patientMedication.createdAt))
					.limit(6),
				diagnosis.encounterId
					? db
							.select({
								id: patientLabTest.id,
								name: patientLabTest.testName,
								status: patientLabTest.status,
							})
							.from(patientLabTest)
							.where(
								and(
									eq(patientLabTest.patientId, diagnosis.patientId),
									eq(patientLabTest.encounterId, diagnosis.encounterId),
								),
							)
							.orderBy(desc(patientLabTest.createdAt))
							.limit(6)
					: Promise.resolve([]),
				diagnosis.encounterId
					? db
							.select({
								id: patientImaging.id,
								name: patientImaging.study,
								status: patientImaging.status,
							})
							.from(patientImaging)
							.where(
								and(
									eq(patientImaging.patientId, diagnosis.patientId),
									eq(patientImaging.encounterId, diagnosis.encounterId),
								),
							)
							.orderBy(desc(patientImaging.createdAt))
							.limit(6)
					: Promise.resolve([]),
				db
					.select({
						id: patientProcedure.id,
						name: patientProcedure.procedureName,
						status: patientProcedure.status,
					})
					.from(patientProcedure)
					.where(
						and(
							eq(patientProcedure.patientId, diagnosis.patientId),
							eq(patientProcedure.diagnosisId, diagnosis.id),
						),
					)
					.orderBy(desc(patientProcedure.createdAt))
					.limit(6),
			]);

			const history = [
				...historyRows.map(mapHistoryEvent),
				buildUpdatedHistoryEvent(diagnosis),
				buildCreatedHistoryEvent(diagnosis),
			];

			return {
				diagnosisId: diagnosis.id,
				encounterId: diagnosis.encounterId,
				name: diagnosis.name,
				status: normalizeDiagnosisStatus(diagnosis.status),
				severityStage: formatSentenceCaseValue(diagnosis.severityStage),
				diagnosedAt: formatDateOnly(diagnosis.diagnosedAt),
				createdAt: formatDateOnly(diagnosis.createdAt),
				updatedAt: formatDateOnly(diagnosis.updatedAt),
				lastReviewedAt: formatDateOnly(diagnosis.lastReviewedAt ?? diagnosis.updatedAt),
				diagnosedBy: empty(diagnosis.diagnosedBy),
				createdBy: empty(diagnosis.createdBy),
				updatedBy: empty(diagnosis.updatedBy),
				clinicalNote: empty(diagnosis.clinicalNote),
				history,
				relatedRecords: {
					medications: medications.map(mapRelatedRecord),
					labTests: labTests.map(mapRelatedRecord),
					imaging: imagingStudies.map(mapRelatedRecord),
					procedures: procedures.map(mapRelatedRecord),
				},
			};
		},
		[`patient-diagnosis-details-${organizationId}-${diagnosisId}`],
		{ tags: [`patient-diagnosis-details-${organizationId}-${diagnosisId}`] },
	)();
}
