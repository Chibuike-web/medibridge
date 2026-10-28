import { cache } from "react";
import {
	patient,
	patientDiagnosis,
	patientMedication,
	patientProcedure,
	patientProcedureHistory,
} from "@/db/schemas";
import type {
	ProcedureDetailsHistoryEvent,
	ProcedureDetailsRelatedRecord,
	ProcedureDetailsType,
} from "@/features/patients/types";
import { db } from "@/lib/better-auth/auth";
import { getOrdinal } from "@/lib/utils/get-ordinal";
import { and, desc, eq } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { getOrganizationId } from "./get-organization-id";

const EMPTY_VALUE = "-";

function normalizeStatus(value: string): ProcedureDetailsType["status"] {
	const normalizedValue = value.toLowerCase();

	if (normalizedValue === "completed") return "Completed";
	if (normalizedValue === "cancelled") return "Cancelled";

	return "Pending";
}

function empty(value: string | null | undefined) {
	return value?.trim() || EMPTY_VALUE;
}

function splitList(value: string | null | undefined) {
	return (
		value
			?.split(",")
			.map((item) => item.trim())
			.filter(Boolean) ?? []
	);
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
		hour12: false,
		minute: "2-digit",
	}).format(date);

	return `${dateLabel} at ${timeLabel}`;
}

function groupHistoryEvents(
	historyRows: {
		fieldName: string;
		oldValue: string | null;
		newValue: string | null;
		updatedBy: string | null;
		createdAt: Date;
	}[],
): ProcedureDetailsHistoryEvent[] {
	return historyRows.reduce<ProcedureDetailsHistoryEvent[]>((events, row) => {
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

function mapRelatedRecord(
	record:
		| {
				id: string;
				name: string;
				status: string;
		  }
		| undefined,
): ProcedureDetailsRelatedRecord | null {
	if (!record) return null;

	return {
		id: record.id,
		name: record.name,
		status: formatSentenceCaseValue(record.status),
	};
}

export const getPatientProcedureDetails = cache(async (procedureId: string) => {
	const organizationId = await getOrganizationId();

	if (!organizationId) {
		return null;
	}

	return getPatientProcedureDetailsForOrganization(procedureId, organizationId);
});

export async function getPatientProcedureDetailsForOrganization(
	procedureId: string,
	organizationId: string,
): Promise<ProcedureDetailsType | null> {
	"use cache";
	cacheLife("max");
	cacheTag(`patient-procedure-details-${organizationId}-${procedureId}`);

	const [procedure] = await db
		.select({
			id: patientProcedure.id,
			encounterId: patientProcedure.encounterId,
			name: patientProcedure.procedureName,
			indication: patientProcedure.indication,
			facility: patientProcedure.facility,
			status: patientProcedure.status,
			procedureDate: patientProcedure.procedureDate,
			performedBy: patientProcedure.performedBy,
			assistants: patientProcedure.assistants,
			plannedDate: patientProcedure.plannedDate,
			plannedPhysician: patientProcedure.plannedPhysician,
			plannedAssistants: patientProcedure.plannedAssistants,
			plannedFacility: patientProcedure.plannedFacility,
			diagnosisId: patientProcedure.diagnosisId,
			medicationId: patientProcedure.medicationId,
			clinicalNote: patientProcedure.clinicalNote,
			createdBy: patientProcedure.createdBy,
			updatedBy: patientProcedure.updatedBy,
			createdAt: patientProcedure.createdAt,
			updatedAt: patientProcedure.updatedAt,
		})
		.from(patientProcedure)
		.innerJoin(patient, eq(patientProcedure.patientId, patient.id))
		.where(and(eq(patientProcedure.id, procedureId), eq(patient.organizationId, organizationId)))
		.limit(1);

	if (!procedure) {
		return null;
	}

	const [historyRows, diagnosisRows, medicationRows] = await Promise.all([
		db
			.select({
				id: patientProcedureHistory.id,
				fieldName: patientProcedureHistory.fieldName,
				oldValue: patientProcedureHistory.oldValue,
				newValue: patientProcedureHistory.newValue,
				updatedBy: patientProcedureHistory.updatedBy,
				createdAt: patientProcedureHistory.createdAt,
			})
			.from(patientProcedureHistory)
			.where(eq(patientProcedureHistory.procedureId, procedure.id))
			.orderBy(desc(patientProcedureHistory.createdAt)),
		procedure.diagnosisId
			? db
					.select({
						id: patientDiagnosis.id,
						name: patientDiagnosis.diagnosisName,
						status: patientDiagnosis.status,
					})
					.from(patientDiagnosis)
					.where(eq(patientDiagnosis.id, procedure.diagnosisId))
					.limit(1)
			: Promise.resolve([]),
		procedure.medicationId
			? db
					.select({
						id: patientMedication.id,
						name: patientMedication.medicationName,
						status: patientMedication.status,
					})
					.from(patientMedication)
					.where(eq(patientMedication.id, procedure.medicationId))
					.limit(1)
			: Promise.resolve([]),
	]);

	return {
		procedureId: procedure.id,
		encounterId: procedure.encounterId,
		name: procedure.name,
		indication: empty(procedure.indication),
		status: normalizeStatus(procedure.status),
		procedureDate: formatDateOnly(procedure.procedureDate),
		performedBy: empty(procedure.performedBy),
		assistants: splitList(procedure.assistants),
		facility: empty(procedure.facility),
		plannedDate: formatDateOnly(procedure.plannedDate),
		plannedPhysician: empty(procedure.plannedPhysician),
		plannedAssistants: splitList(procedure.plannedAssistants),
		plannedFacility: empty(procedure.plannedFacility),
		clinicalNote: empty(procedure.clinicalNote),
		createdAt: formatTimelineTimestamp(procedure.createdAt),
		updatedAt: formatDateOnly(procedure.updatedAt),
		createdBy: empty(procedure.createdBy),
		updatedBy: empty(procedure.updatedBy),
		relatedRecords: {
			diagnosis: mapRelatedRecord(diagnosisRows[0]),
			medication: mapRelatedRecord(medicationRows[0]),
		},
		editValues: {
			updatedAt: procedure.updatedAt.toISOString(),
			indication: procedure.indication ?? "",
			procedureDate:
				(procedure.status === "Pending"
					? (procedure.plannedDate ?? procedure.procedureDate)
					: (procedure.procedureDate ?? procedure.plannedDate)
				)
					?.toISOString()
					.slice(0, 10) ?? "",
			physician:
				(procedure.status === "Pending"
					? (procedure.plannedPhysician ?? procedure.performedBy)
					: (procedure.performedBy ?? procedure.plannedPhysician)) ?? "",
			assistants:
				(procedure.status === "Pending"
					? (procedure.plannedAssistants ?? procedure.assistants)
					: (procedure.assistants ?? procedure.plannedAssistants)) ?? "",
			facility:
				(procedure.status === "Pending"
					? (procedure.plannedFacility ?? procedure.facility)
					: (procedure.facility ?? procedure.plannedFacility)) ?? "",
			clinicalNote: procedure.clinicalNote ?? "",
		},
		history: groupHistoryEvents(historyRows),
	};
}
