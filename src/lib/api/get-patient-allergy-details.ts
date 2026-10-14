import { cache } from "react";
import { patient, patientAllergy, patientAllergyHistory } from "@/db/schemas";
import type { AllergyDetailsHistoryEvent, AllergyDetailsType } from "@/features/patients/types";
import { db } from "@/lib/better-auth/auth";
import { getOrdinal } from "@/lib/utils/get-ordinal";
import { and, desc, eq } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { getOrganizationId } from "./get-organization-id";

const EMPTY_VALUE = "-";

function normalizeSeverity(value: string): AllergyDetailsType["severity"] {
	if (value === "Moderate" || value === "Severe") return value;

	return "Mild";
}

function normalizeStatus(value: string): AllergyDetailsType["status"] {
	return value === "Inactive" ? "Inactive" : "Active";
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

function groupHistoryEvents(
	historyRows: {
		fieldName: string;
		oldValue: string | null;
		newValue: string | null;
		updatedBy: string | null;
		createdAt: Date;
	}[],
): AllergyDetailsHistoryEvent[] {
	return historyRows.reduce<AllergyDetailsHistoryEvent[]>((events, row) => {
		const id = `${row.updatedBy}-${row.createdAt.getTime()}`;
		const item = {
			label: formatSentenceCaseValue(row.fieldName),
			previousValue: empty(row.oldValue),
			value: empty(row.newValue),
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

export const getPatientAllergyDetails = cache(async (allergyId: string) => {
	const organizationId = await getOrganizationId();

	if (!organizationId) {
		return null;
	}

	return getPatientAllergyDetailsForOrganization(allergyId, organizationId);
});

export async function getPatientAllergyDetailsForOrganization(
	allergyId: string,
	organizationId: string,
): Promise<AllergyDetailsType | null> {
	"use cache";
	cacheLife("max");
	cacheTag(`patient-allergy-details-${organizationId}-${allergyId}`);

	const [allergy] = await db
		.select({
			id: patientAllergy.id,
			encounterId: patientAllergy.encounterId,
			allergen: patientAllergy.allergen,
			reaction: patientAllergy.reaction,
			severity: patientAllergy.severity,
			status: patientAllergy.status,
			clinicalNote: patientAllergy.clinicalNote,
			createdBy: patientAllergy.createdBy,
			updatedBy: patientAllergy.updatedBy,
			createdAt: patientAllergy.createdAt,
			updatedAt: patientAllergy.updatedAt,
		})
		.from(patientAllergy)
		.innerJoin(patient, eq(patientAllergy.patientId, patient.id))
		.where(and(eq(patientAllergy.id, allergyId), eq(patient.organizationId, organizationId)))
		.limit(1);

	if (!allergy) {
		return null;
	}

	const historyRows = await db
		.select({
			id: patientAllergyHistory.id,
			fieldName: patientAllergyHistory.fieldName,
			oldValue: patientAllergyHistory.oldValue,
			newValue: patientAllergyHistory.newValue,
			updatedBy: patientAllergyHistory.updatedBy,
			createdAt: patientAllergyHistory.createdAt,
		})
		.from(patientAllergyHistory)
		.where(eq(patientAllergyHistory.allergyId, allergy.id))
		.orderBy(desc(patientAllergyHistory.createdAt));

	return {
		allergyId: allergy.id,
		encounterId: allergy.encounterId,
		allergen: allergy.allergen,
		reaction: empty(allergy.reaction),
		severity: normalizeSeverity(allergy.severity),
		status: normalizeStatus(allergy.status),
		createdAt: formatTimelineTimestamp(allergy.createdAt),
		updatedAt: formatDateOnly(allergy.updatedAt),
		createdBy: empty(allergy.createdBy),
		updatedBy: empty(allergy.updatedBy),
		clinicalNote: empty(allergy.clinicalNote),
		history: groupHistoryEvents(historyRows),
	};
}
