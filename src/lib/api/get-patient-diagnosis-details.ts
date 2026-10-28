import { cache } from "react";
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
import { cacheLife, cacheTag } from "next/cache";
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

function groupHistoryEvents(
	historyRows: {
		fieldName: string;
		oldValue: string | null;
		newValue: string | null;
		updatedBy: string | null;
		createdAt: Date;
	}[],
): DiagnosisDetailsHistoryEvent[] {
	return historyRows.reduce<DiagnosisDetailsHistoryEvent[]>((events, row) => {
		const id = `${row.updatedBy}-${row.createdAt.getTime()}`;
		const item = {
			label: formatSentenceCaseValue(row.fieldName),
			previousValue: row.oldValue?.trim() ?? "",
			value: row.newValue?.trim() ?? "",
		};
		const event = events.find((historyEvent) => historyEvent.id === id);

		if (event) {
			event.items.push(item);
		} else {
			events.push({
				id,
				title: "Updated",
				actor: empty(row.updatedBy),
				timestamp: formatTimelineTimestamp(row.createdAt),
				items: [item],
			});
		}

		return events;
	}, []);
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

export const getPatientDiagnosisDetails = cache(async (diagnosisId: string) => {
	const organizationId = await getOrganizationId();

	if (!organizationId) {
		return null;
	}

	return getPatientDiagnosisDetailsForOrganization(diagnosisId, organizationId);
});

export async function getPatientDiagnosisDetailsForOrganization(
	diagnosisId: string,
	organizationId: string,
): Promise<DiagnosisDetailsType | null> {
	"use cache";
	cacheLife("max");
	cacheTag(`patient-diagnosis-details-${organizationId}-${diagnosisId}`);

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
				oldValue: patientDiagnosisHistory.oldValue,
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

	return {
		diagnosisId: diagnosis.id,
		encounterId: diagnosis.encounterId,
		name: diagnosis.name,
		status: normalizeDiagnosisStatus(diagnosis.status),
		severityStage: formatSentenceCaseValue(diagnosis.severityStage),
		diagnosedAt: formatDateOnly(diagnosis.diagnosedAt),
		createdAt: formatTimelineTimestamp(diagnosis.createdAt),
		updatedAt: formatDateOnly(diagnosis.updatedAt),
		lastReviewedAt: formatDateOnly(diagnosis.lastReviewedAt ?? diagnosis.updatedAt),
		diagnosedBy: empty(diagnosis.diagnosedBy),
		createdBy: empty(diagnosis.createdBy),
		updatedBy: empty(diagnosis.updatedBy),
		clinicalNote: empty(diagnosis.clinicalNote),
		editValues: {
			updatedAt: diagnosis.updatedAt.toISOString(),
			severityStage: diagnosis.severityStage ?? "",
			diagnosedAt: diagnosis.diagnosedAt ?? "",
			diagnosedBy: diagnosis.diagnosedBy ?? "",
			clinicalNote: diagnosis.clinicalNote ?? "",
		},
		history: groupHistoryEvents(historyRows),
		relatedRecords: {
			medications: medications.map(mapRelatedRecord),
			labTests: labTests.map(mapRelatedRecord),
			imaging: imagingStudies.map(mapRelatedRecord),
			procedures: procedures.map(mapRelatedRecord),
		},
	};
}
