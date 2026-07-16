"use server";

import { endOfDay, startOfDay } from "date-fns";
import { hasVerifiedExternalAccessSession } from "@/lib/api/external-access-session";
import { getSharedRecord } from "@/lib/api/get-shared-record";
import { parseDateParam } from "@/lib/utils/parse-date-param";

export async function getSharedDiagnosesTableAction({
	accessId,
	query,
	statusFilters,
	diagnosedFrom,
	diagnosedTo,
	reviewedFrom,
	reviewedTo,
	createdFrom,
	createdTo,
}: {
	accessId: string;
	query: string;
	statusFilters: ("Active" | "Resolved")[];
	diagnosedFrom: string;
	diagnosedTo: string;
	reviewedFrom: string;
	reviewedTo: string;
	createdFrom: string;
	createdTo: string;
}) {
	if (!(await hasVerifiedExternalAccessSession(accessId)))
		throw new Error("Unauthorized shared-record access.");
	const sharedRecord = await getSharedRecord(accessId);
	if (!sharedRecord) return [];
	const normalizedQuery = query.trim().toLowerCase();
	const diagnosedFromDate = parseDateParam(diagnosedFrom);
	const diagnosedToDate = parseDateParam(diagnosedTo);
	const reviewedFromDate = parseDateParam(reviewedFrom);
	const reviewedToDate = parseDateParam(reviewedTo);
	const createdFromDate = parseDateParam(createdFrom);
	const createdToDate = parseDateParam(createdTo);

	return sharedRecord.records.diagnoses.filter((row) => {
		const diagnosedAt = new Date(row.diagnosedAtValue);
		const reviewedAt = new Date(row.lastReviewedValue);
		const createdAt = new Date(row.createdAtValue);
		const matchesSearch =
			!normalizedQuery ||
			[row.name, row.diagnosisId, row.status].some((value) =>
				value.toLowerCase().includes(normalizedQuery),
			);
		return (
			matchesSearch &&
			(statusFilters.length === 0 || statusFilters.includes(row.status)) &&
			(!diagnosedFromDate || diagnosedAt >= startOfDay(diagnosedFromDate)) &&
			(!diagnosedToDate || diagnosedAt <= endOfDay(diagnosedToDate)) &&
			(!reviewedFromDate || reviewedAt >= startOfDay(reviewedFromDate)) &&
			(!reviewedToDate || reviewedAt <= endOfDay(reviewedToDate)) &&
			(!createdFromDate || createdAt >= startOfDay(createdFromDate)) &&
			(!createdToDate || createdAt <= endOfDay(createdToDate))
		);
	});
}

export async function getSharedAllergiesTableAction({
	accessId,
	query,
	statusFilters,
	severityFilters,
	createdFrom,
	createdTo,
}: {
	accessId: string;
	query: string;
	statusFilters: ("Active" | "Inactive")[];
	severityFilters: ("Mild" | "Moderate" | "Severe")[];
	createdFrom: string;
	createdTo: string;
}) {
	if (!(await hasVerifiedExternalAccessSession(accessId)))
		throw new Error("Unauthorized shared-record access.");
	const sharedRecord = await getSharedRecord(accessId);
	if (!sharedRecord) return [];
	const normalizedQuery = query.trim().toLowerCase();
	const createdFromDate = parseDateParam(createdFrom);
	const createdToDate = parseDateParam(createdTo);

	return sharedRecord.records.allergies.filter((row) => {
		const createdAt = new Date(row.createdAtValue);
		const matchesSearch =
			!normalizedQuery ||
			[
				row.allergen,
				row.allergyId,
				row.reaction,
				row.createdAt,
				row.severity,
				row.status,
			].some((value) => value.toLowerCase().includes(normalizedQuery));
		return (
			matchesSearch &&
			(statusFilters.length === 0 || statusFilters.includes(row.status)) &&
			(severityFilters.length === 0 ||
				severityFilters.includes(row.severity)) &&
			(!createdFromDate || createdAt >= startOfDay(createdFromDate)) &&
			(!createdToDate || createdAt <= endOfDay(createdToDate))
		);
	});
}

export async function getSharedImmunizationsTableAction({
	accessId,
	query,
	statusFilters,
	createdFrom,
	createdTo,
}: {
	accessId: string;
	query: string;
	statusFilters: ("Active" | "Completed" | "Cancelled" | "Discontinued")[];
	createdFrom: string;
	createdTo: string;
}) {
	if (!(await hasVerifiedExternalAccessSession(accessId)))
		throw new Error("Unauthorized shared-record access.");
	const sharedRecord = await getSharedRecord(accessId);
	if (!sharedRecord) return [];
	const normalizedQuery = query.trim().toLowerCase();
	const createdFromDate = parseDateParam(createdFrom);
	const createdToDate = parseDateParam(createdTo);
	return sharedRecord.records.immunizations.filter((row) => {
		const createdAt = new Date(row.createdAtValue);
		const matchesSearch =
			!normalizedQuery ||
			[row.vaccineName, row.immunizationId, row.status].some((value) =>
				value.toLowerCase().includes(normalizedQuery),
			);
		return (
			matchesSearch &&
			(statusFilters.length === 0 || statusFilters.includes(row.status)) &&
			(!createdFromDate || createdAt >= startOfDay(createdFromDate)) &&
			(!createdToDate || createdAt <= endOfDay(createdToDate))
		);
	});
}

export async function getSharedProceduresTableAction({
	accessId,
	query,
	statusFilters,
	createdFrom,
	createdTo,
}: {
	accessId: string;
	query: string;
	statusFilters: ("Pending" | "Completed" | "Cancelled")[];
	createdFrom: string;
	createdTo: string;
}) {
	if (!(await hasVerifiedExternalAccessSession(accessId)))
		throw new Error("Unauthorized shared-record access.");
	const sharedRecord = await getSharedRecord(accessId);
	if (!sharedRecord) return [];
	const normalizedQuery = query.trim().toLowerCase();
	const createdFromDate = parseDateParam(createdFrom);
	const createdToDate = parseDateParam(createdTo);
	return sharedRecord.records.procedures.filter((row) => {
		const createdAt = new Date(row.createdAtValue);
		const matchesSearch =
			!normalizedQuery ||
			[
				row.procedure,
				row.indication,
				row.facility,
				row.procedureId,
				row.createdAt,
				row.status,
			].some((value) => value.toLowerCase().includes(normalizedQuery));
		return (
			matchesSearch &&
			(statusFilters.length === 0 || statusFilters.includes(row.status)) &&
			(!createdFromDate || createdAt >= startOfDay(createdFromDate)) &&
			(!createdToDate || createdAt <= endOfDay(createdToDate))
		);
	});
}

export async function getSharedMedicationsTableAction({
	accessId,
	query,
	statusFilters,
	createdFrom,
	createdTo,
}: {
	accessId: string;
	query: string;
	statusFilters: ("Active" | "Completed" | "Discontinued")[];
	createdFrom: string;
	createdTo: string;
}) {
	if (!(await hasVerifiedExternalAccessSession(accessId)))
		throw new Error("Unauthorized shared-record access.");
	const sharedRecord = await getSharedRecord(accessId);
	if (!sharedRecord) return [];
	const normalizedQuery = query.trim().toLowerCase();
	const createdFromDate = parseDateParam(createdFrom);
	const createdToDate = parseDateParam(createdTo);
	return sharedRecord.records.medications.filter((row) => {
		const createdAt = new Date(row.createdAtValue);
		const matchesSearch =
			!normalizedQuery ||
			[
				row.medication,
				row.dose,
				row.route,
				row.indication,
				row.medicationId,
				row.createdAt,
				row.status,
			].some((value) => value.toLowerCase().includes(normalizedQuery));
		return (
			matchesSearch &&
			(statusFilters.length === 0 || statusFilters.includes(row.status)) &&
			(!createdFromDate || createdAt >= startOfDay(createdFromDate)) &&
			(!createdToDate || createdAt <= endOfDay(createdToDate))
		);
	});
}

export async function getSharedLabTestsTableAction({
	accessId,
	query,
	statusFilters,
	flagFilters,
	createdFrom,
	createdTo,
}: {
	accessId: string;
	query: string;
	statusFilters: ("Pending" | "Completed" | "Cancelled")[];
	flagFilters: string[];
	createdFrom: string;
	createdTo: string;
}) {
	if (!(await hasVerifiedExternalAccessSession(accessId)))
		throw new Error("Unauthorized shared-record access.");
	const sharedRecord = await getSharedRecord(accessId);
	if (!sharedRecord) return [];
	const normalizedQuery = query.trim().toLowerCase();
	const createdFromDate = parseDateParam(createdFrom);
	const createdToDate = parseDateParam(createdTo);
	return sharedRecord.records.labTests.filter((row) => {
		const createdAt = new Date(row.createdAtValue);
		const matchesSearch =
			!normalizedQuery ||
			[
				row.test,
				row.result,
				row.labId,
				row.referenceRange,
				row.interpretation,
				row.createdAt,
				row.status,
			].some((value) => value.toLowerCase().includes(normalizedQuery));
		return (
			matchesSearch &&
			(statusFilters.length === 0 || statusFilters.includes(row.status)) &&
			(flagFilters.length === 0 || flagFilters.includes(row.interpretation)) &&
			(!createdFromDate || createdAt >= startOfDay(createdFromDate)) &&
			(!createdToDate || createdAt <= endOfDay(createdToDate))
		);
	});
}

export async function getSharedImagingTableAction({
	accessId,
	query,
	statusFilters,
	modalityFilters,
	orderedFrom,
	orderedTo,
	createdFrom,
	createdTo,
}: {
	accessId: string;
	query: string;
	statusFilters: ("Pending" | "Completed" | "Cancelled")[];
	modalityFilters: ("CT" | "MRI" | "Ultrasound" | "X-ray")[];
	orderedFrom: string;
	orderedTo: string;
	createdFrom: string;
	createdTo: string;
}) {
	if (!(await hasVerifiedExternalAccessSession(accessId)))
		throw new Error("Unauthorized shared-record access.");
	const sharedRecord = await getSharedRecord(accessId);
	if (!sharedRecord) return [];
	const normalizedQuery = query.trim().toLowerCase();
	const orderedFromDate = parseDateParam(orderedFrom);
	const orderedToDate = parseDateParam(orderedTo);
	const createdFromDate = parseDateParam(createdFrom);
	const createdToDate = parseDateParam(createdTo);
	return sharedRecord.records.imaging.filter((row) => {
		const orderedAt = new Date(row.orderedAtValue);
		const createdAt = new Date(row.createdAtValue);
		const matchesSearch =
			!normalizedQuery ||
			[
				row.study,
				row.modality,
				row.region,
				row.impression,
				row.orderedAt,
				row.imagingId,
				row.status,
			].some((value) => value.toLowerCase().includes(normalizedQuery));
		return (
			matchesSearch &&
			(statusFilters.length === 0 || statusFilters.includes(row.status)) &&
			(modalityFilters.length === 0 ||
				modalityFilters.includes(row.modality)) &&
			(!orderedFromDate || orderedAt >= startOfDay(orderedFromDate)) &&
			(!orderedToDate || orderedAt <= endOfDay(orderedToDate)) &&
			(!createdFromDate || createdAt >= startOfDay(createdFromDate)) &&
			(!createdToDate || createdAt <= endOfDay(createdToDate))
		);
	});
}
