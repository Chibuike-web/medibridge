import { cache } from "react";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/lib/better-auth/auth";
import { patient, patientPersonalInformation } from "@/db/schemas";
import { and, count, desc, eq, gte, ilike, lte, or } from "drizzle-orm";
import { getOrganizationId } from "./get-organization-id";
import type { PatientGenderFilter } from "@/features/patients/types";

export type PatientCreatedAtFilter = {
	from?: Date;
	to?: Date;
};

export type PatientFilterOptions = {
	gender?: Exclude<PatientGenderFilter, "">;
	ageRange?: {
		min?: number;
		max?: number;
	};
};

export const getPatients = cache(async (
	page: number,
	limit: number,
	query = "",
	createdAtFilter: PatientCreatedAtFilter = {},
	patientFilterOptions: PatientFilterOptions = {},
) => {
	const organizationId = await getOrganizationId();
	const currentPage = Number.isFinite(page) && page > 0 ? page : 1;
	const currentLimit = Number.isFinite(limit) && limit > 0 ? limit : 14;
	const normalizedQuery = query.trim();

	if (!organizationId) {
		return { totalPatients: 0, patientCreatedAt: [], patients: [], hasPatients: false };
	}

	return getPatientsForOrganization(
		organizationId,
		currentPage,
		currentLimit,
		normalizedQuery,
		createdAtFilter,
		patientFilterOptions,
	);
});

export async function getPatientsForOrganization(
	organizationId: string,
	page: number,
	limit: number,
	normalizedQuery: string,
	createdAtFilter: PatientCreatedAtFilter,
	patientFilterOptions: PatientFilterOptions,
) {
	"use cache";
	cacheLife("max");
	cacheTag(`patients-list-${organizationId}`);

	const offset = (page - 1) * limit;
	const searchPattern = `%${normalizedQuery}%`;
	const createdAtConditions = [
		createdAtFilter.from ? gte(patient.createdAt, createdAtFilter.from) : undefined,
		createdAtFilter.to ? lte(patient.createdAt, createdAtFilter.to) : undefined,
	].filter((condition) => condition !== undefined);
	const patientInformationConditions = [
		patientFilterOptions.gender
			? eq(patientPersonalInformation.sex, patientFilterOptions.gender)
			: undefined,
		patientFilterOptions.ageRange?.min !== undefined
			? gte(patientPersonalInformation.age, patientFilterOptions.ageRange.min)
			: undefined,
		patientFilterOptions.ageRange?.max !== undefined
			? lte(patientPersonalInformation.age, patientFilterOptions.ageRange.max)
			: undefined,
	].filter((condition) => condition !== undefined);
	const patientFilter = and(
		eq(patient.organizationId, organizationId),
		...createdAtConditions,
		...patientInformationConditions,
		or(
			ilike(patient.id, searchPattern),
			ilike(patient.patientId, searchPattern),
			ilike(patientPersonalInformation.firstName, searchPattern),
			ilike(patientPersonalInformation.lastName, searchPattern),
		),
	);

	const [allPatientCountRows, filteredPatientCountRows, rows] = await Promise.all([
		db.select({ value: count() }).from(patient).where(eq(patient.organizationId, organizationId)),
		db
			.select({ value: count() })
			.from(patient)
			.leftJoin(patientPersonalInformation, eq(patient.id, patientPersonalInformation.patientId))
			.where(patientFilter),
		db
			.select({
				name: patientPersonalInformation.firstName,
				lastName: patientPersonalInformation.lastName,
				createdAt: patient.createdAt,
				patientId: patient.id,
				gender: patientPersonalInformation.sex,
				age: patientPersonalInformation.age,
			})
			.from(patient)
			.leftJoin(patientPersonalInformation, eq(patient.id, patientPersonalInformation.patientId))
			.where(patientFilter)
			.orderBy(desc(patient.createdAt))
			.limit(limit)
			.offset(offset),
	]);

	const totalPatients = filteredPatientCountRows[0]?.value ?? 0;
	const allPatientCount = allPatientCountRows[0]?.value ?? 0;

	return {
		totalPatients,
		patientCreatedAt: rows.map((row) => row.createdAt.toISOString()),
		patients: rows.map((row) => ({
			name: `${row.name} ${row.lastName}`.trim(),
			createdAt: row.createdAt.toISOString(),
			patientId: row.patientId,
			gender: row.gender === "female" ? ("Female" as const) : ("Male" as const),
			age: row.age ?? 0,
		})),
		hasPatients: allPatientCount > 0,
	};
}
