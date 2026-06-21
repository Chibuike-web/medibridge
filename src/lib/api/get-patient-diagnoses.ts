import { unstable_cache } from "next/cache";
import { patient, patientDiagnosis } from "@/db/schemas";
import type {
	DiagnosisStatusFilter,
	DiagnosisType,
} from "@/features/patients/types";
import { db } from "@/lib/better-auth/auth";
import { formatDateTime } from "@/lib/utils/format-date-time";
import { parseDateParam } from "@/lib/utils/parse-date-param";
import { toSortValue } from "@/lib/utils/to-sort-value";
import { endOfDay, startOfDay } from "date-fns";
import {
	and,
	count,
	desc,
	eq,
	gte,
	ilike,
	inArray,
	lte,
	or,
} from "drizzle-orm";
import { getOrganizationId } from "./get-organization-id";

type DiagnosisDateFilters = {
	createdFrom?: string;
	createdTo?: string;
	diagnosedFrom?: string;
	diagnosedTo?: string;
	lastReviewedFrom?: string;
	lastReviewedTo?: string;
};

function formatDate(value: Date | string | null) {
	if (!value) return "-";

	const date = value instanceof Date ? value : new Date(value);

	if (Number.isNaN(date.getTime())) {
		return value instanceof Date ? "-" : value;
	}

	return new Intl.DateTimeFormat("en-US", {
		month: "long",
		year: "numeric",
	}).format(date);
}

function normalizeStatus(value: string): DiagnosisType["status"] {
	return value === "Resolved" ? "Resolved" : "Active";
}

export async function getPatientDiagnoses(
	patientId: string,
	page = 1,
	limit = 14,
	query = "",
	dateFilters: DiagnosisDateFilters = {},
	statusFilters: DiagnosisStatusFilter[] = [],
): Promise<{ diagnoses: DiagnosisType[]; totalDiagnoses: number }> {
	const organizationId = await getOrganizationId();
	const offset = (page - 1) * limit;
	const normalizedQuery = query.trim();
	const searchPattern = `%${normalizedQuery}%`;
	const createdFromDate = parseDateParam(dateFilters.createdFrom ?? "");
	const createdToDate = parseDateParam(dateFilters.createdTo ?? "");
	const lastReviewedFromDate = parseDateParam(
		dateFilters.lastReviewedFrom ?? "",
	);
	const lastReviewedToDate = parseDateParam(dateFilters.lastReviewedTo ?? "");
	const diagnosedFrom = dateFilters.diagnosedFrom ?? "";
	const diagnosedTo = dateFilters.diagnosedTo ?? "";
	const databaseStatusFilters = statusFilters.flatMap((statusFilter) => [
		statusFilter,
		toTitleCase(statusFilter),
	]);
	const diagnosisFilter = and(
		eq(patientDiagnosis.patientId, patientId),
		eq(patient.organizationId, organizationId ?? ""),
		createdFromDate
			? gte(patientDiagnosis.createdAt, startOfDay(createdFromDate))
			: undefined,
		createdToDate
			? lte(patientDiagnosis.createdAt, endOfDay(createdToDate))
			: undefined,
		lastReviewedFromDate
			? gte(patientDiagnosis.updatedAt, startOfDay(lastReviewedFromDate))
			: undefined,
		lastReviewedToDate
			? lte(patientDiagnosis.updatedAt, endOfDay(lastReviewedToDate))
			: undefined,
		diagnosedFrom
			? gte(patientDiagnosis.diagnosedAt, diagnosedFrom)
			: undefined,
		diagnosedTo ? lte(patientDiagnosis.diagnosedAt, diagnosedTo) : undefined,
		databaseStatusFilters.length > 0
			? inArray(patientDiagnosis.status, databaseStatusFilters)
			: undefined,
		or(
			ilike(patientDiagnosis.id, searchPattern),
			ilike(patientDiagnosis.diagnosisName, searchPattern),
			ilike(patientDiagnosis.status, searchPattern),
		),
	);

	if (!organizationId) return { diagnoses: [], totalDiagnoses: 0 };

	return unstable_cache(
		async () => {
			const [countRows, rows] = await Promise.all([
				db
					.select({ value: count() })
					.from(patientDiagnosis)
					.innerJoin(patient, eq(patientDiagnosis.patientId, patient.id))
					.where(diagnosisFilter),
				db
					.select({
						id: patientDiagnosis.id,
						name: patientDiagnosis.diagnosisName,
						diagnosedAt: patientDiagnosis.diagnosedAt,
						updatedAt: patientDiagnosis.updatedAt,
						status: patientDiagnosis.status,
						createdAt: patientDiagnosis.createdAt,
					})
					.from(patientDiagnosis)
					.innerJoin(patient, eq(patientDiagnosis.patientId, patient.id))
					.where(diagnosisFilter)
					.orderBy(desc(patientDiagnosis.createdAt))
					.limit(limit)
					.offset(offset),
			]);

			return {
				totalDiagnoses: countRows[0]?.value ?? 0,
				diagnoses: rows.map((diagnosis) => ({
					name: diagnosis.name,
					diagnosedAtLabel: formatDate(diagnosis.diagnosedAt),
					diagnosedAtSortValue: toSortValue(diagnosis.diagnosedAt),
					lastReviewedLabel: formatDateTime(diagnosis.updatedAt),
					lastReviewedSortValue: toSortValue(diagnosis.updatedAt),
					diagnosisId: diagnosis.id,
					createdAtLabel: formatDateTime(diagnosis.createdAt),
					createdAtSortValue: toSortValue(diagnosis.createdAt),
					status: normalizeStatus(diagnosis.status),
				})),
			};
		},
		[
			`patient-diagnoses-diagnosed-at-${organizationId}-${patientId}-${page}-${limit}-${normalizedQuery}-${dateFilters.createdFrom ?? ""}-${dateFilters.createdTo ?? ""}-${dateFilters.diagnosedFrom ?? ""}-${dateFilters.diagnosedTo ?? ""}-${dateFilters.lastReviewedFrom ?? ""}-${dateFilters.lastReviewedTo ?? ""}-${statusFilters.join(",")}`,
		],
		{ tags: [`patient-diagnoses-${organizationId}-${patientId}`] },
	)();
}

function toTitleCase(value: string) {
	return value.charAt(0).toUpperCase() + value.slice(1);
}
