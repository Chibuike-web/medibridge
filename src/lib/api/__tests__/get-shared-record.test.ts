// @vitest-environment node

import { beforeEach, expect, test, vi } from "vitest";
import {
	patientAllergy,
	patientDiagnosis,
	patientImaging,
	patientImmunization,
	patientLabTest,
	patientMedication,
	patientProcedure,
	patientRecordAccess,
} from "@/db/schemas";
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

const sections = [
	{
		section: "diagnoses",
		key: "diagnoses",
		table: patientDiagnosis,
		row: { id: "DIA-1", diagnosisName: "Asthma", status: "Active" },
	},
	{
		section: "allergies",
		key: "allergies",
		table: patientAllergy,
		row: {
			id: "ALG-1",
			allergen: "Penicillin",
			reaction: "Rash",
			severity: "Mild",
			status: "Active",
		},
	},
	{
		section: "immunization",
		key: "immunizations",
		table: patientImmunization,
		row: { id: "IMM-1", vaccineName: "Hepatitis B", status: "Completed" },
	},
	{
		section: "procedures",
		key: "procedures",
		table: patientProcedure,
		row: { id: "PRO-1", procedureName: "Appendectomy", status: "Completed" },
	},
	{
		section: "medications",
		key: "medications",
		table: patientMedication,
		row: { id: "MED-1", medicationName: "Amoxicillin", status: "Discontinued" },
	},
	{
		section: "lab-tests",
		key: "labTests",
		table: patientLabTest,
		row: { id: "LAB-1", testName: "Full Blood Count", status: "Completed" },
	},
	{
		section: "imaging",
		key: "imaging",
		table: patientImaging,
		row: {
			id: "IMG-1",
			study: "Chest X-ray",
			modality: "x-ray",
			region: "Chest",
			status: "Completed",
		},
	},
] as const;

beforeEach(() => {
	database.queriedTables.clear();
	database.records.clear();
	database.access = {
		accessId: "access-1",
		patientId: "patient-1",
		status: "active",
		expiresAt: new Date(Date.now() + 60_000),
		revokedAt: null,
		firstName: "Ada",
		lastName: "Obi",
		sex: "female",
		age: 34,
		emailAddress: "ada@example.org",
		selectedRecordIds: [
			{ section: "patient-details", recordId: "personal-information" },
			...sections.map(({ section, row }) => ({
				section: section === "immunization" ? "immunizations" : section,
				recordId: row.id,
			})),
		],
	};
	for (const { table, row } of sections) database.records.set(table, [row]);
});

test.each(sections)(
	"opening $section loads only its records and keeps the other shared tabs available",
	async ({ section, key, table, row }) => {
		const result = await getSharedRecord("access-1", section);

		expect(result?.activeSection).toBe(section);
		expect(JSON.stringify(result?.records[key])).toContain(row.id);
		for (const other of sections.filter((item) => item.key !== key)) {
			expect(result?.records[other.key]).toEqual([]);
		}
		expect(result?.availableSections).toEqual([
			"patient-details",
			...sections.map((item) => item.section),
		]);
		expect(result?.patient).toEqual({ name: "Ada Obi", sex: "Female", age: "34" });
		expect(result?.patientDetailsSections).toEqual([]);
		expect(database.queriedTables).toEqual(new Set([patientRecordAccess, table]));
	},
);

test.each([undefined, "unknown-section", "vitals"])(
	"opening %s falls back to the first shared section without loading clinical records",
	async (section) => {
		const result = await getSharedRecord("access-1", section);

		expect(result?.activeSection).toBe("patient-details");
		expect(result?.patientDetailsSections.map((detail) => detail.title)).toEqual([
			"Personal Information",
		]);
		expect(JSON.stringify(result)).not.toContain("ada@example.org");
		expect(database.queriedTables).toEqual(new Set([patientRecordAccess]));
	},
);

test("an unshared URL section falls back to a shared section", async () => {
	database.access!.selectedRecordIds = [{ section: "medications", recordId: "MED-1" }];
	const result = await getSharedRecord("access-1", "diagnoses");

	expect(result?.activeSection).toBe("medications");
	expect(result?.availableSections).toEqual(["medications"]);
	expect(result?.records.medications).toEqual([expect.objectContaining({ medicationId: "MED-1" })]);
	expect(result?.records.diagnoses).toEqual([]);
	expect(database.queriedTables).toEqual(new Set([patientRecordAccess, patientMedication]));
});

test("a selected section with no remaining rows stays available and displays an empty result", async () => {
	database.records.set(patientMedication, []);
	const result = await getSharedRecord("access-1", "medications");

	expect(result?.activeSection).toBe("medications");
	expect(result?.availableSections).toContain("medications");
	expect(result?.records.medications).toEqual([]);
});

test.each([
	{ status: "pending" },
	{ status: "revoked" },
	{ revokedAt: new Date() },
	{ expiresAt: new Date(0) },
])("invalid access %j returns no shared records", async (access) => {
	Object.assign(database.access!, access);

	expect(await getSharedRecord("access-1", "medications")).toBeNull();
	expect(database.queriedTables).toEqual(new Set([patientRecordAccess]));
});

test("a missing access link returns no shared records", async () => {
	database.access = null;

	expect(await getSharedRecord("missing", "medications")).toBeNull();
	expect(database.queriedTables).toEqual(new Set([patientRecordAccess]));
});
