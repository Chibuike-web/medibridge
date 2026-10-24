// @vitest-environment node

import { eq } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, test } from "vitest";
import * as schema from "@/db/schemas";
import {
	migrateTestDatabase,
	resetTestDatabase,
	testDatabaseUrl,
	useTestDatabase,
} from "../../helpers/test-database";

const accessId = "access-tables";
const noFilters = { page: 1, limit: 14, query: "", createdFrom: "", createdTo: "" };

describe.skipIf(!testDatabaseUrl)("Shared record tables", () => {
	let authModule: typeof import("@/lib/better-auth/auth");
	let api: {
		getSharedDiagnoses: typeof import("@/lib/api/get-shared-diagnoses").getSharedDiagnoses;
		getSharedAllergies: typeof import("@/lib/api/get-shared-allergies").getSharedAllergies;
		getSharedImmunizations: typeof import("@/lib/api/get-shared-immunizations").getSharedImmunizations;
		getSharedProcedures: typeof import("@/lib/api/get-shared-procedures").getSharedProcedures;
		getSharedMedications: typeof import("@/lib/api/get-shared-medications").getSharedMedications;
		getSharedLabTests: typeof import("@/lib/api/get-shared-lab-tests").getSharedLabTests;
		getSharedImaging: typeof import("@/lib/api/get-shared-imaging").getSharedImaging;
	};

	const sections = [
		{
			section: "diagnoses",
			table: () => schema.patientDiagnosis,
			values: { diagnosisName: "Asthma", status: "Active" },
			idKey: "diagnosisId",
			load: () =>
				api.getSharedDiagnoses(accessId, {
					...noFilters,
					statusFilters: [],
					diagnosedFrom: "",
					diagnosedTo: "",
					reviewedFrom: "",
					reviewedTo: "",
				}),
		},
		{
			section: "allergies",
			table: () => schema.patientAllergy,
			values: { allergen: "Penicillin", reaction: "Rash", severity: "Mild", status: "Active" },
			idKey: "allergyId",
			load: () =>
				api.getSharedAllergies(accessId, { ...noFilters, statusFilters: [], severityFilters: [] }),
		},
		{
			section: "immunizations",
			table: () => schema.patientImmunization,
			values: { vaccineName: "Hepatitis B", status: "Completed" },
			idKey: "immunizationId",
			load: () => api.getSharedImmunizations(accessId, { ...noFilters, statusFilters: [] }),
		},
		{
			section: "procedures",
			table: () => schema.patientProcedure,
			values: { procedureName: "Appendectomy", status: "Completed" },
			idKey: "procedureId",
			load: () => api.getSharedProcedures(accessId, { ...noFilters, statusFilters: [] }),
		},
		{
			section: "medications",
			table: () => schema.patientMedication,
			values: { medicationName: "Amoxicillin", status: "Discontinued" },
			idKey: "medicationId",
			load: () => api.getSharedMedications(accessId, { ...noFilters, statusFilters: [] }),
		},
		{
			section: "lab-tests",
			table: () => schema.patientLabTest,
			values: { testName: "Full Blood Count", status: "Completed", flag: "High" },
			idKey: "labId",
			load: () =>
				api.getSharedLabTests(accessId, { ...noFilters, statusFilters: [], flagFilters: [] }),
		},
		{
			section: "imaging",
			table: () => schema.patientImaging,
			values: { study: "Chest X-ray", modality: "X-ray", region: "Chest", status: "Completed" },
			idKey: "imagingId",
			load: () =>
				api.getSharedImaging(accessId, {
					...noFilters,
					statusFilters: [],
					modalityFilters: [],
					orderedFrom: "",
					orderedTo: "",
				}),
		},
	] as const;

	beforeAll(async () => {
		useTestDatabase();
		await migrateTestDatabase();
		authModule = await import("@/lib/better-auth/auth");
		api = {
			getSharedDiagnoses: (await import("@/lib/api/get-shared-diagnoses")).getSharedDiagnoses,
			getSharedAllergies: (await import("@/lib/api/get-shared-allergies")).getSharedAllergies,
			getSharedImmunizations: (await import("@/lib/api/get-shared-immunizations"))
				.getSharedImmunizations,
			getSharedProcedures: (await import("@/lib/api/get-shared-procedures")).getSharedProcedures,
			getSharedMedications: (await import("@/lib/api/get-shared-medications")).getSharedMedications,
			getSharedLabTests: (await import("@/lib/api/get-shared-lab-tests")).getSharedLabTests,
			getSharedImaging: (await import("@/lib/api/get-shared-imaging")).getSharedImaging,
		};
	}, 60_000);

	beforeEach(async () => {
		await resetTestDatabase();
		await authModule.db.insert(schema.organization).values({
			id: "hospital-tables",
			name: "Source Hospital",
			slug: "hospital-tables",
			createdAt: new Date(),
			isVerified: true,
		});
		await authModule.db.insert(schema.user).values({
			id: "staff-tables",
			name: "Staff",
			email: "staff@source.org",
			emailVerified: true,
		});
		await authModule.db.insert(schema.patient).values([
			{ id: "patient-shared", organizationId: "hospital-tables" },
			{ id: "patient-other", organizationId: "hospital-tables" },
		]);
		await authModule.db.insert(schema.patientPersonalInformation).values([
			{ id: "personal-shared", patientId: "patient-shared", firstName: "Ada", lastName: "Obi" },
			{ id: "personal-other", patientId: "patient-other", firstName: "Chidi", lastName: "Eze" },
		]);
		await authModule.db.insert(schema.patientTransfer).values({
			id: "TRF-tables",
			patientId: "patient-shared",
			sourceOrganizationId: "hospital-tables",
			targetOrganizationId: "TGT-receiving",
			targetHospitalName: "Receiving Hospital",
			targetHospitalEmail: "records@receiving.org",
			status: "completed",
			patientApprovalStatus: "approved",
		});
		for (const { section, table, values } of sections) {
			await authModule.db.insert(table()).values([
				{ ...values, id: `${section}-shared`, patientId: "patient-shared" },
				{ ...values, id: `${section}-unshared`, patientId: "patient-shared" },
				{ ...values, id: `${section}-other-patient`, patientId: "patient-other" },
			]);
		}
		await authModule.db.insert(schema.patientRecordAccess).values({
			id: accessId,
			patientTransferId: "TRF-tables",
			patientId: "patient-shared",
			createdByOrganizationId: "hospital-tables",
			createdByUserId: "staff-tables",
			status: "active",
			expiresAt: new Date(Date.now() + 60 * 60 * 1000),
			permissions: {},
			selectedRecordIds: sections.flatMap(({ section }) => [
				{ section, recordId: `${section}-shared` },
				{ section, recordId: `${section}-other-patient` },
			]),
		});
	});

	afterAll(async () => {
		await authModule?.sql.end();
	});

	test.each(sections)(
		"the $section table shows only the shared records of the shared patient",
		async ({ section, idKey, load }) => {
			const { rows, totalRows } = await load();

			expect(rows.map((row) => row[idKey as keyof typeof row])).toEqual([`${section}-shared`]);
			expect(totalRows).toBe(1);
		},
	);

	test("filters, searches and pages the shared medications", async () => {
		await authModule.db.insert(schema.patientMedication).values({
			id: "medications-metformin",
			patientId: "patient-shared",
			medicationName: "Metformin",
			status: "Active",
			createdAt: new Date("2026-01-01T09:00:00.000Z"),
		});
		await authModule.db
			.update(schema.patientRecordAccess)
			.set({
				selectedRecordIds: [
					{ section: "medications", recordId: "medications-shared" },
					{ section: "medications", recordId: "medications-metformin" },
				],
			})
			.where(eq(schema.patientRecordAccess.id, accessId));
		const medicationNames = async (
			filters: Partial<typeof noFilters & { statusFilters: string[] }>,
		) =>
			(
				await api.getSharedMedications(accessId, { ...noFilters, statusFilters: [], ...filters })
			).rows.map((row) => row.medication);

		expect(await medicationNames({ statusFilters: ["Active"] })).toEqual(["Metformin"]);
		expect(await medicationNames({ query: "amox" })).toEqual(["Amoxicillin"]);
		expect(await medicationNames({ createdTo: "2026-06-30" })).toEqual(["Metformin"]);
		expect(await medicationNames({ limit: 1 })).toEqual(["Amoxicillin"]);
		expect(await medicationNames({ limit: 1, page: 2 })).toEqual(["Metformin"]);
		expect(
			(await api.getSharedMedications(accessId, { ...noFilters, statusFilters: [], limit: 1 }))
				.totalRows,
		).toBe(2);
	});

	test("filters shared lab tests by the flag the receiving hospital picks", async () => {
		const labTestIds = async (flagFilters: string[]) =>
			(
				await api.getSharedLabTests(accessId, { ...noFilters, statusFilters: [], flagFilters })
			).rows.map((row) => row.labId);

		expect(await labTestIds(["high"])).toEqual(["lab-tests-shared"]);
		expect(await labTestIds(["low"])).toEqual([]);
	});
});
