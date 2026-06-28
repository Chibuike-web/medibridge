import { cache } from "react";
import { patient, patientImmunization, patientImmunizationHistory } from "@/db/schemas";
import type {
	ImmunizationDetailsHistoryEvent,
	ImmunizationDetailsType,
} from "@/features/patients/types";
import { db } from "@/lib/better-auth/auth";
import { getOrdinal } from "@/lib/utils/get-ordinal";
import { and, desc, eq } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { getOrganizationId } from "./get-organization-id";

const EMPTY_VALUE = "-";

function normalizeStatus(value: string): ImmunizationDetailsType["status"] {
	const normalizedValue = value.toLowerCase();

	if (normalizedValue === "completed") return "Completed";
	if (normalizedValue === "cancelled") return "Cancelled";
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

function buildCreatedHistoryEvent(immunization: {
	seriesType: string | null;
	currentDose: string | null;
	totalDoses: string | null;
	dateAdministered: Date | null;
	administeredBy: string | null;
	status: string;
	createdBy: string | null;
	createdAt: Date;
}): ImmunizationDetailsHistoryEvent {
	return {
		id: "created",
		title: "Created",
		timestamp: formatTimelineTimestamp(immunization.createdAt),
		items: [
			{ label: "Series Type", value: empty(immunization.seriesType) },
			{ label: "Dose", value: empty(immunization.currentDose) },
			{ label: "Total Doses", value: empty(immunization.totalDoses) },
			{ label: "Date administered", value: formatDateOnly(immunization.dateAdministered) },
			{ label: "Administered by", value: empty(immunization.administeredBy) },
			{ label: "Created by", value: empty(immunization.createdBy) },
			{ label: "Status", value: normalizeStatus(immunization.status) },
		],
	};
}

function buildUpdatedHistoryEvent(immunization: {
	currentDose: string | null;
	dateAdministered: Date | null;
	administeredBy: string | null;
	status: string;
	updatedBy: string | null;
	updatedAt: Date;
}): ImmunizationDetailsHistoryEvent {
	return {
		id: "updated",
		title: "Updated",
		timestamp: formatTimelineTimestamp(immunization.updatedAt),
		items: [
			{ label: "Dose", value: empty(immunization.currentDose) },
			{ label: "Date administered", value: formatDateOnly(immunization.dateAdministered) },
			{ label: "Administered by", value: empty(immunization.administeredBy) },
			{ label: "Status", value: normalizeStatus(immunization.status) },
			{ label: "Updated by", value: empty(immunization.updatedBy) },
		],
	};
}

function mapHistoryEvent(history: {
	id: string;
	fieldName: string;
	newValue: string | null;
	updatedBy: string | null;
	createdAt: Date;
}): ImmunizationDetailsHistoryEvent {
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

export const getPatientImmunizationDetails = cache(async (immunizationId: string) => {
	const organizationId = await getOrganizationId();

	if (!organizationId) {
		return null;
	}

	return getPatientImmunizationDetailsForOrganization(immunizationId, organizationId);
});

export async function getPatientImmunizationDetailsForOrganization(
	immunizationId: string,
	organizationId: string,
): Promise<ImmunizationDetailsType | null> {
	"use cache";
	cacheLife("max");
	cacheTag(`patient-immunization-details-${organizationId}-${immunizationId}`);

	const [immunization] = await db
		.select({
			id: patientImmunization.id,
			encounterId: patientImmunization.encounterId,
			vaccineName: patientImmunization.vaccineName,
			seriesType: patientImmunization.seriesType,
			currentDose: patientImmunization.currentDose,
			totalDoses: patientImmunization.totalDoses,
			dateAdministered: patientImmunization.dateAdministered,
			administeredBy: patientImmunization.administeredBy,
			status: patientImmunization.status,
			clinicalNote: patientImmunization.clinicalNote,
			createdBy: patientImmunization.createdBy,
			updatedBy: patientImmunization.updatedBy,
			createdAt: patientImmunization.createdAt,
			updatedAt: patientImmunization.updatedAt,
		})
		.from(patientImmunization)
		.innerJoin(patient, eq(patientImmunization.patientId, patient.id))
		.where(and(eq(patientImmunization.id, immunizationId), eq(patient.organizationId, organizationId)))
		.limit(1);

	if (!immunization) {
		return null;
	}

	const historyRows = await db
		.select({
			id: patientImmunizationHistory.id,
			fieldName: patientImmunizationHistory.fieldName,
			newValue: patientImmunizationHistory.newValue,
			updatedBy: patientImmunizationHistory.updatedBy,
			createdAt: patientImmunizationHistory.createdAt,
		})
		.from(patientImmunizationHistory)
		.where(eq(patientImmunizationHistory.immunizationId, immunization.id))
		.orderBy(desc(patientImmunizationHistory.createdAt));

	return {
		immunizationId: immunization.id,
		encounterId: immunization.encounterId,
		vaccineName: immunization.vaccineName,
		seriesType: empty(immunization.seriesType),
		currentDose: empty(immunization.currentDose),
		totalDoses: empty(immunization.totalDoses),
		status: normalizeStatus(immunization.status),
		dateAdministered: formatDateOnly(immunization.dateAdministered),
		administeredBy: empty(immunization.administeredBy),
		createdAt: formatTimelineTimestamp(immunization.createdAt),
		updatedAt: formatTimelineTimestamp(immunization.updatedAt),
		createdBy: empty(immunization.createdBy),
		updatedBy: empty(immunization.updatedBy),
		clinicalNote: empty(immunization.clinicalNote),
		history: [
			...historyRows.map(mapHistoryEvent),
			buildUpdatedHistoryEvent(immunization),
			buildCreatedHistoryEvent(immunization),
		],
	};
}
