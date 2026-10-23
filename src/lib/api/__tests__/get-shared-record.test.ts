// @vitest-environment node

import { beforeEach, expect, test, vi } from "vitest";
import {
	patientAllergy,
	patientDiagnosis,
	patientImaging,
	patientImmunization,
	patientLabTest,
	patientMedication,
	patientPersonalInformation,
	patientProcedure,
	patientRecordAccess,
} from "@/db/schemas";
import { getSharedAllergies } from "../get-shared-allergies";
import { getSharedDiagnoses } from "../get-shared-diagnoses";
import { getSharedImaging } from "../get-shared-imaging";
import { getSharedImmunizations } from "../get-shared-immunizations";
import { getSharedLabTests } from "../get-shared-lab-tests";
import { getSharedMedications } from "../get-shared-medications";
import { getSharedPatientDetails } from "../get-shared-patient-details";
import { getSharedProcedures } from "../get-shared-procedures";
import { getSharedRecord } from "../get-shared-record";

const database = vi.hoisted(() => ({
	access: null as Record<string, unknown> | null,
	records: new Map<unknown, Record<string, unknown>[]>(),
	queriedTables: new Set<unknown>(),
}));

vi.mock("@/lib/better-auth/auth", () => ({
	db: {
		select: () => ({
			from(table: unknown) {
				database.queriedTables.add(table);
				const query = {
					innerJoin: () => query,
					leftJoin: () => query,
					where: async () =>
						table === patientRecordAccess
							? database.access
								? [database.access]
								: []
							: (database.records.get(table) ?? []),
				};
				return query;
			},
		}),
	},
}));

const createdAt = new Date("2026-10-01T09:00:00.000Z");

const sections = [
	{
		section: "diagnoses",
		load: getSharedDiagnoses,
		table: patientDiagnosis,
		idKey: "diagnosisId",
		row: { id: "DIA-1", diagnosisName: "Asthma", status: "Active", createdAt },
	},
	{
		section: "allergies",
		load: getSharedAllergies,
		table: patientAllergy,
		idKey: "allergyId",
		row: {
			id: "ALG-1",
			allergen: "Penicillin",
			reaction: "Rash",
			severity: "Mild",
			status: "Active",
			createdAt,
		},
	},
	{
		section: "immunizations",
		load: getSharedImmunizations,
		table: patientImmunization,
		idKey: "immunizationId",
		row: { id: "IMM-1", vaccineName: "Hepatitis B", status: "Completed", createdAt },
	},
	{
		section: "procedures",
		load: getSharedProcedures,
		table: patientProcedure,
		idKey: "procedureId",
		row: { id: "PRO-1", procedureName: "Appendectomy", status: "Completed", createdAt },
	},
	{
		section: "medications",
		load: getSharedMedications,
		table: patientMedication,
		idKey: "medicationId",
		row: { id: "MED-1", medicationName: "Amoxicillin", status: "Discontinued", createdAt },
	},
	{
		section: "lab-tests",
		load: getSharedLabTests,
		table: patientLabTest,
		idKey: "labId",
		row: { id: "LAB-1", testName: "Full Blood Count", status: "Completed", createdAt },
	},
	{
		section: "imaging",
		load: getSharedImaging,
		table: patientImaging,
		idKey: "imagingId",
		row: {
			id: "IMG-1",
			study: "Chest X-ray",
			modality: "x-ray",
			region: "Chest",
			status: "Completed",
			createdAt,
		},
	},
] as const;

beforeEach(() => {
	database.queriedTables.clear();
	database.records.clear();
	database.access = {
		patientId: "patient-1",
		status: "active",
		expiresAt: new Date(Date.now() + 60_000),
		revokedAt: null,
		sourceOrganizationName: "Source Hospital",
		firstName: "Ada",
		lastName: "Obi",
		sex: "female",
		age: 34,
		selectedRecordIds: [
			{ section: "patient-details", recordId: "personal-information" },
			...sections.map(({ section, row }) => ({ section, recordId: row.id })),
		],
	};
	database.records.set(patientPersonalInformation, [
		{ firstName: "Ada", lastName: "Obi", age: 34, sex: "female", emailAddress: "ada@example.org" },
	]);
	for (const { table, row } of sections) database.records.set(table, [row]);
});

test("a valid link names the patient and the hospital that shared the record", async () => {
	const sharedRecord = await getSharedRecord("access-1");

	expect(sharedRecord?.patient).toEqual({ name: "Ada Obi", sex: "Female", age: "34" });
	expect(sharedRecord?.sourceOrganizationName).toBe("Source Hospital");
});

test.each(sections)("a valid link loads the shared $section", async ({ load, idKey, row }) => {
	expect(await load("access-1")).toEqual([expect.objectContaining({ [idKey]: row.id })]);
});

test("patient details include only the detail sections that were shared", async () => {
	const personalOnly = await getSharedPatientDetails("access-1");

	expect(personalOnly.map((section) => section.title)).toEqual(["Personal Information"]);
	expect(JSON.stringify(personalOnly)).not.toContain("ada@example.org");

	database.access!.selectedRecordIds = [
		{ section: "patient-details", recordId: "contact-information" },
	];
	const contactOnly = await getSharedPatientDetails("access-1");

	expect(contactOnly.map((section) => section.title)).toEqual(["Contact Information"]);
	expect(JSON.stringify(contactOnly)).toContain("ada@example.org");
});

test.each([
	{ status: "pending" },
	{ status: "revoked" },
	{ revokedAt: new Date() },
	{ expiresAt: new Date(0) },
])("an invalid link %j shows nothing and reads no records", async (access) => {
	Object.assign(database.access!, access);

	expect(await getSharedRecord("access-1")).toBeNull();
	expect(await getSharedPatientDetails("access-1")).toEqual([]);
	for (const { load } of sections) expect(await load("access-1")).toEqual([]);
	expect(database.queriedTables).toEqual(new Set([patientRecordAccess]));
});

test("a missing link shows nothing and reads no records", async () => {
	database.access = null;

	expect(await getSharedRecord("missing")).toBeNull();
	for (const { load } of sections) expect(await load("missing")).toEqual([]);
	expect(database.queriedTables).toEqual(new Set([patientRecordAccess]));
});
