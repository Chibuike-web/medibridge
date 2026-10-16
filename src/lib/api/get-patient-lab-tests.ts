import { cache } from "react";
import { cacheLife, cacheTag } from "next/cache";
import { patient, patientLabTest, patientLabTestFile, patientLabTestHistory } from "@/db/schemas";
import type {
	LabTestDetailsHistoryEvent,
	LabTestFlagFilter,
	LabTestStatusFilter,
	LabTestType,
} from "@/features/patients/types";
import { db } from "@/lib/better-auth/auth";
import { formatDateTime } from "@/lib/utils/format-date-time";
import { parseDateParam } from "@/lib/utils/parse-date-param";
import { toSortValue } from "@/lib/utils/to-sort-value";
import { and, count, desc, eq, gte, ilike, inArray, lte, or } from "drizzle-orm";
import { endOfDay, startOfDay } from "date-fns";
import { getOrganizationId } from "./get-organization-id";

type LabTestDateFilters = {
	createdFrom?: string;
	createdTo?: string;
};

function normalizeStatus(value: string): LabTestType["status"] {
	const normalizedValue = value.toLowerCase();

	if (normalizedValue === "completed") {
		return "Completed";
	}

	if (normalizedValue === "cancelled") {
		return "Cancelled";
	}

	return "Pending";
}

function formatTestName(testName: string, result: string | null) {
	return result ? `${testName} - ${result}` : testName;
}

function toDatabaseFlagFilter(flagFilter: LabTestFlagFilter) {
	return flagFilter.charAt(0).toUpperCase() + flagFilter.slice(1).replaceAll("-", " ");
}

export const getPatientLabTests = cache(
	async (
		patientId: string,
		page = 1,
		limit = 14,
		query = "",
		dateFilters: LabTestDateFilters = {},
		statusFilters: LabTestStatusFilter[] = [],
		flagFilters: LabTestFlagFilter[] = [],
		encounterId?: string,
	): Promise<{ labTests: LabTestType[]; totalLabTests: number }> => {
		const organizationId = await getOrganizationId();

		if (!organizationId) return { labTests: [], totalLabTests: 0 };

		return getPatientLabTestsForOrganization(
			patientId,
			organizationId,
			page,
			limit,
			query.trim(),
			dateFilters,
			statusFilters,
			flagFilters,
			encounterId,
		);
	},
);

function groupHistoryEvents(
	historyRows: {
		fieldName: string;
		oldValue: string | null;
		newValue: string | null;
		updatedBy: string | null;
		createdAt: Date;
	}[],
): LabTestDetailsHistoryEvent[] {
	return historyRows.reduce<LabTestDetailsHistoryEvent[]>((events, row) => {
		const id = `${row.updatedBy}-${row.createdAt.getTime()}`;
		const item = {
			label: row.fieldName.charAt(0).toUpperCase() + row.fieldName.slice(1).replaceAll("_", " "),
			previousValue: row.oldValue || "-",
			value: row.newValue || "-",
		};
		const event = events.find((historyEvent) => historyEvent.id === id);

		if (event) {
			event.items.push(item);
		} else {
			events.push({
				id,
				title: "Updated",
				actor: row.updatedBy || "-",
				timestamp: formatDateTime(row.createdAt),
				items: [item],
			});
		}

		return events;
	}, []);
}

export async function getPatientLabTestsForOrganization(
	patientId: string,
	organizationId: string,
	page: number,
	limit: number,
	normalizedQuery: string,
	dateFilters: LabTestDateFilters,
	statusFilters: LabTestStatusFilter[],
	flagFilters: LabTestFlagFilter[],
	encounterId?: string,
): Promise<{ labTests: LabTestType[]; totalLabTests: number }> {
	"use cache";
	cacheLife("max");
	cacheTag(`patient-lab-tests-${organizationId}-${patientId}`);

	const offset = (page - 1) * limit;
	const searchPattern = `%${normalizedQuery}%`;
	const createdFromDate = parseDateParam(dateFilters.createdFrom ?? "");
	const createdToDate = parseDateParam(dateFilters.createdTo ?? "");
	const databaseStatusFilters = statusFilters.map(
		(statusFilter) => statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1),
	);
	const databaseFlagFilters = flagFilters.map(toDatabaseFlagFilter);
	const labTestFilter = and(
		eq(patient.id, patientId),
		eq(patient.organizationId, organizationId),
		encounterId ? eq(patientLabTest.encounterId, encounterId) : undefined,
		createdFromDate ? gte(patientLabTest.createdAt, startOfDay(createdFromDate)) : undefined,
		createdToDate ? lte(patientLabTest.createdAt, endOfDay(createdToDate)) : undefined,
		databaseStatusFilters.length > 0
			? inArray(patientLabTest.status, databaseStatusFilters)
			: undefined,
		databaseFlagFilters.length > 0 ? inArray(patientLabTest.flag, databaseFlagFilters) : undefined,
		or(
			ilike(patientLabTest.testName, searchPattern),
			ilike(patientLabTest.result, searchPattern),
			ilike(patientLabTest.id, searchPattern),
			encounterId ? undefined : ilike(patientLabTest.encounterId, searchPattern),
			ilike(patientLabTest.referenceRange, searchPattern),
			ilike(patientLabTest.interpretation, searchPattern),
			ilike(patientLabTest.status, searchPattern),
		),
	);

	const [countRows, rows] = await Promise.all([
		db
			.select({ value: count() })
			.from(patientLabTest)
			.innerJoin(patient, eq(patientLabTest.patientId, patient.id))
			.where(labTestFilter),
		db
			.select({
				testName: patientLabTest.testName,
				result: patientLabTest.result,
				labId: patientLabTest.id,
				encounterId: patientLabTest.encounterId,
				specimen: patientLabTest.specimen,
				referenceRange: patientLabTest.referenceRange,
				interpretation: patientLabTest.interpretation,
				flag: patientLabTest.flag,
				orderedAt: patientLabTest.orderedAt,
				orderedBy: patientLabTest.orderedBy,
				clinicalNote: patientLabTest.clinicalNote,
				createdBy: patientLabTest.createdBy,
				updatedBy: patientLabTest.updatedBy,
				createdAt: patientLabTest.createdAt,
				updatedAt: patientLabTest.updatedAt,
				status: patientLabTest.status,
			})
			.from(patientLabTest)
			.innerJoin(patient, eq(patientLabTest.patientId, patient.id))
			.where(labTestFilter)
			.orderBy(desc(patientLabTest.createdAt))
			.limit(limit)
			.offset(offset),
	]);
	const historyRows = rows.length
		? await db
				.select()
				.from(patientLabTestHistory)
				.where(
					inArray(
						patientLabTestHistory.labTestId,
						rows.map((row) => row.labId),
					),
				)
				.orderBy(desc(patientLabTestHistory.createdAt))
		: [];
	const labTestFiles = rows.length
		? await db
				.select()
				.from(patientLabTestFile)
				.where(
					inArray(
						patientLabTestFile.parentRecordId,
						rows.map((row) => row.labId),
					),
				)
		: [];
	const filesByLabTestId = new Map<string, typeof labTestFiles>();

	for (const file of labTestFiles) {
		const filesForLabTest = filesByLabTestId.get(file.parentRecordId) ?? [];
		filesForLabTest.push(file);
		filesByLabTestId.set(file.parentRecordId, filesForLabTest);
	}

	return {
		totalLabTests: countRows[0]?.value ?? 0,
		labTests: rows.map((labTest) => {
			const status = normalizeStatus(labTest.status);
			const result = labTest.result ?? "";
			const specimen = labTest.specimen ?? "";
			const referenceRange = labTest.referenceRange ?? "";
			const interpretation = labTest.interpretation ?? "";
			const flag = labTest.flag ?? "";
			const orderedAtLabel = labTest.orderedAt
				? new Intl.DateTimeFormat("en-US", { dateStyle: "long", timeZone: "UTC" }).format(
						labTest.orderedAt,
					)
				: "-";
			const orderedBy = labTest.orderedBy ?? "";
			const createdAtLabel = formatDateTime(labTest.createdAt);
			const updatedAtLabel = formatDateTime(labTest.updatedAt);
			const updatedBy = labTest.updatedBy ?? "";
			const clinicalNote = labTest.clinicalNote ?? "";
			const persistedFiles = filesByLabTestId.get(labTest.labId) ?? [];
			const files = persistedFiles.map((file) => ({
				id: file.id,
				name: file.name,
				url: file.url ?? "",
				type: file.type ?? "",
				size: file.size ?? "",
				uploadedAtLabel: formatDateTime(file.uploadedAt),
			}));

			return {
				test: formatTestName(labTest.testName, labTest.result),
				testName: labTest.testName,
				labId: labTest.labId,
				encounterId: labTest.encounterId,
				result,
				specimen,
				referenceRange,
				interpretation,
				flag,
				orderedAtValue: labTest.orderedAt?.toISOString() ?? "",
				orderedAtLabel,
				orderedAtSortValue: toSortValue(labTest.orderedAt),
				orderedBy,
				createdAtLabel,
				createdAtSortValue: toSortValue(labTest.createdAt),
				updatedAtLabel,
				updatedAtSortValue: toSortValue(labTest.updatedAt),
				createdBy: labTest.createdBy ?? "",
				updatedBy,
				status,
				clinicalNote,
				files,
				history: groupHistoryEvents(historyRows.filter((row) => row.labTestId === labTest.labId)),
			};
		}),
	};
}
