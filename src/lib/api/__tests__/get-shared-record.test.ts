// @vitest-environment node

import { beforeEach, expect, test, vi } from "vitest";
import { patientPersonalInformation, patientRecordAccess } from "@/db/schemas";
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

const noFilters = { page: 1, limit: 14, query: "", createdFrom: "", createdTo: "" };
const sectionLoaders = [
	(accessId: string) =>
		getSharedDiagnoses(accessId, {
			...noFilters,
			statusFilters: [],
			diagnosedFrom: "",
			diagnosedTo: "",
			reviewedFrom: "",
			reviewedTo: "",
		}),
	(accessId: string) =>
		getSharedAllergies(accessId, { ...noFilters, statusFilters: [], severityFilters: [] }),
	(accessId: string) => getSharedImmunizations(accessId, { ...noFilters, statusFilters: [] }),
	(accessId: string) => getSharedProcedures(accessId, { ...noFilters, statusFilters: [] }),
	(accessId: string) => getSharedMedications(accessId, { ...noFilters, statusFilters: [] }),
	(accessId: string) =>
		getSharedLabTests(accessId, { ...noFilters, statusFilters: [], flagFilters: [] }),
	(accessId: string) =>
		getSharedImaging(accessId, {
			...noFilters,
			statusFilters: [],
			modalityFilters: [],
			orderedFrom: "",
			orderedTo: "",
		}),
];

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
			{ section: "medications", recordId: "MED-1" },
		],
	};
	database.records.set(patientPersonalInformation, [
		{ firstName: "Ada", lastName: "Obi", age: 34, sex: "female", emailAddress: "ada@example.org" },
	]);
});

test("a valid link names the patient and the hospital that shared the record", async () => {
	const sharedRecord = await getSharedRecord("access-1");

	expect(sharedRecord?.patient).toEqual({ name: "Ada Obi", sex: "Female", age: "34" });
	expect(sharedRecord?.sourceOrganizationName).toBe("Source Hospital");
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
	for (const load of sectionLoaders) {
		expect(await load("access-1")).toEqual({ rows: [], totalRows: 0 });
	}
	expect(database.queriedTables).toEqual(new Set([patientRecordAccess]));
});

test("a missing link shows nothing and reads no records", async () => {
	database.access = null;

	expect(await getSharedRecord("missing")).toBeNull();
	for (const load of sectionLoaders) {
		expect(await load("missing")).toEqual({ rows: [], totalRows: 0 });
	}
	expect(database.queriedTables).toEqual(new Set([patientRecordAccess]));
});
