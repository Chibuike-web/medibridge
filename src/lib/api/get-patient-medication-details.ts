import { cache } from "react";
import { patient, patientMedication, patientMedicationHistory } from "@/db/schemas";
import type {
	MedicationDetailsHistoryEvent,
	MedicationDetailsType,
} from "@/features/patients/types";
import { db } from "@/lib/better-auth/auth";
import { getOrdinal } from "@/lib/utils/get-ordinal";
import { and, desc, eq } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { getOrganizationId } from "./get-organization-id";

const EMPTY_VALUE = "-";

function normalizeStatus(value: string): MedicationDetailsType["status"] {
	const normalizedValue = value.toLowerCase();

	if (normalizedValue === "completed") return "Completed";
	if (normalizedValue === "discontinued") return "Discontinued";

	return "Active";
}

function empty(value: string | null | undefined) {
	return value?.trim() || EMPTY_VALUE;
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

function mapMedicationHistoryEvent(history: {
	id: string;
	fieldName: string;
	newValue: string | null;
	updatedBy: string | null;
	createdAt: Date;
}): MedicationDetailsHistoryEvent {
	const fieldName = formatSentenceCaseValue(history.fieldName);

	return {
		id: history.id,
		title: "Updated",
		timestamp: formatTimelineTimestamp(history.createdAt),
		items: [
			{ label: fieldName, value: empty(history.newValue) },
			{ label: "Updated by", value: empty(history.updatedBy) },
		],
	};
}

function buildCreatedHistoryEvent(medication: {
	dose: string | null;
	route: string | null;
	indication: string | null;
	status: string;
	createdAt: Date;
}): MedicationDetailsHistoryEvent {
	return {
		id: "created",
		title: "Prescribed",
		timestamp: formatTimelineTimestamp(medication.createdAt),
		items: [
			{ label: "Status", value: normalizeStatus(medication.status) },
			{ label: "Dose", value: empty(medication.dose) },
			{ label: "Route", value: empty(medication.route) },
			{ label: "Frequency", value: EMPTY_VALUE },
			{ label: "Indication", value: empty(medication.indication) },
		],
	};
}

function buildUpdatedHistoryEvent(medication: {
	status: string;
	dose: string | null;
	updatedAt: Date;
}): MedicationDetailsHistoryEvent {
	return {
		id: "updated",
		title: "Updated",
		timestamp: formatTimelineTimestamp(medication.updatedAt),
		items: [
			{ label: "Status", value: normalizeStatus(medication.status) },
			{ label: "Dose", value: empty(medication.dose) },
		],
	};
}

export const getPatientMedicationDetails = cache(async (medicationId: string) => {
	const organizationId = await getOrganizationId();

	if (!organizationId) {
		return null;
	}

	return getPatientMedicationDetailsForOrganization(medicationId, organizationId);
});

export async function getPatientMedicationDetailsForOrganization(
	medicationId: string,
	organizationId: string,
): Promise<MedicationDetailsType | null> {
	"use cache";
	cacheLife("max");
	cacheTag(`patient-medication-details-${organizationId}-${medicationId}`);

	const [medication] = await db
		.select({
			id: patientMedication.id,
			encounterId: patientMedication.encounterId,
			name: patientMedication.medicationName,
			dose: patientMedication.dose,
			route: patientMedication.route,
			indication: patientMedication.indication,
			status: patientMedication.status,
			createdAt: patientMedication.createdAt,
			updatedAt: patientMedication.updatedAt,
		})
		.from(patientMedication)
		.innerJoin(patient, eq(patientMedication.patientId, patient.id))
		.where(and(eq(patientMedication.id, medicationId), eq(patient.organizationId, organizationId)))
		.limit(1);

	if (!medication) {
		return null;
	}

	const historyRows = await db
		.select({
			id: patientMedicationHistory.id,
			fieldName: patientMedicationHistory.fieldName,
			newValue: patientMedicationHistory.newValue,
			updatedBy: patientMedicationHistory.updatedBy,
			createdAt: patientMedicationHistory.createdAt,
		})
		.from(patientMedicationHistory)
		.where(eq(patientMedicationHistory.medicationId, medication.id))
		.orderBy(desc(patientMedicationHistory.createdAt));

	return {
		medicationId: medication.id,
		encounterId: medication.encounterId,
		name: medication.name,
		dose: empty(medication.dose),
		route: empty(medication.route),
		indication: empty(medication.indication),
		status: normalizeStatus(medication.status),
		frequency: EMPTY_VALUE,
		duration: EMPTY_VALUE,
		prescribedBy: EMPTY_VALUE,
		startedAt: formatDateOnly(medication.createdAt),
		createdAt: formatDateOnly(medication.createdAt),
		updatedAt: formatDateOnly(medication.updatedAt),
		createdBy: EMPTY_VALUE,
		clinicalNote: EMPTY_VALUE,
		history: [
			...historyRows.map(mapMedicationHistoryEvent),
			buildUpdatedHistoryEvent(medication),
			buildCreatedHistoryEvent(medication),
		],
	};
}
