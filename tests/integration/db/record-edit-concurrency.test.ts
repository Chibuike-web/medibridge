// @vitest-environment node

import { eq, getTableName, sql } from "drizzle-orm";
import postgres from "postgres";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, test, vi } from "vitest";
import * as schema from "@/db/schemas";
import {
	migrateTestDatabase,
	resetTestDatabase,
	testDatabaseUrl,
	useTestDatabase,
} from "../../helpers/test-database";

vi.mock("@/lib/api/get-session-data", () => ({
	getSessionData: async () => ({
		user: { id: "editor", name: "Review editor", emailVerified: true },
	}),
}));
vi.mock("@/lib/api/get-organization-id", () => ({
	getOrganizationId: async () => "edit-hospital",
}));
vi.mock("next/cache", () => ({ updateTag: vi.fn() }));

const cases = [
	{
		name: "diagnosis",
		id: "DIA-edit",
		table: schema.patientDiagnosis,
		history: schema.patientDiagnosisHistory,
		historyRecordId: schema.patientDiagnosisHistory.diagnosisId,
		fields: {
			diagnosisName: "Review diagnosis",
			status: "Active",
			diagnosedAt: "2026-01-01",
			diagnosedBy: "Review editor",
		},
	},
	{
		name: "allergy",
		id: "ALLE-edit",
		table: schema.patientAllergy,
		history: schema.patientAllergyHistory,
		historyRecordId: schema.patientAllergyHistory.allergyId,
		fields: {
			allergen: "Review allergen",
			severity: "Mild",
			status: "Active",
			reaction: "Review reaction",
		},
	},
	{
		name: "medication",
		id: "MED-edit",
		table: schema.patientMedication,
		history: schema.patientMedicationHistory,
		historyRecordId: schema.patientMedicationHistory.medicationId,
		fields: {
			medicationName: "Review medication",
			indication: "Review indication",
			status: "Active",
			dose: "1 unit",
			route: "Oral",
			prescribedBy: "Review editor",
			frequency: "Once daily",
			duration: "7 days",
			startedAt: "2026-01-01",
		},
	},
	{
		name: "immunization",
		id: "IMM-edit",
		table: schema.patientImmunization,
		history: schema.patientImmunizationHistory,
		historyRecordId: schema.patientImmunizationHistory.immunizationId,
		fields: {
			vaccineName: "Review vaccine",
			seriesType: "Primary",
			currentDose: "1",
			totalDoses: "1",
			status: "Completed",
			dateAdministered: "2026-01-01",
			administeredBy: "Review editor",
		},
	},
	{
		name: "procedure",
		id: "PRO-edit",
		table: schema.patientProcedure,
		history: schema.patientProcedureHistory,
		historyRecordId: schema.patientProcedureHistory.procedureId,
		fields: {
			procedureName: "Review procedure",
			indication: "Review indication",
			status: "Completed",
			procedureDate: "2026-01-01",
			physician: "Review editor",
			assistants: "Review assistant",
			facility: "Review hospital",
		},
	},
	{
		name: "labTest",
		id: "LAB-edit",
		table: schema.patientLabTest,
		history: schema.patientLabTestHistory,
		historyRecordId: schema.patientLabTestHistory.labTestId,
		fields: {
			testName: "Review test",
			status: "Pending",
			referenceRange: "Review range",
			orderedBy: "Review editor",
			orderedAt: "2026-01-01",
			specimen: "Review specimen",
		},
	},
	{
		name: "imaging",
		id: "IMG-edit",
		table: schema.patientImaging,
		history: schema.patientImagingHistory,
		historyRecordId: schema.patientImagingHistory.imagingId,
		fields: {
			study: "Review study",
			modality: "X-ray",
			region: "Review region",
			orderedBy: "Review editor",
			orderedAt: "2026-01-01",
			status: "Pending",
		},
	},
];

describe.skipIf(!testDatabaseUrl)("Competing clinical record edits", () => {
	let authModule: typeof import("@/lib/better-auth/auth");
	let controlSql: ReturnType<typeof postgres>;
	let actions: Record<
		string,
		(id: string, form: FormData) => Promise<{ status: string; error?: string }>
	>;

	beforeAll(async () => {
		useTestDatabase();
		await migrateTestDatabase();
		authModule = await import("@/lib/better-auth/auth");
		controlSql = postgres(testDatabaseUrl!, { max: 3 });
		const [diagnosis, allergy, medication, immunization, procedure, labTest, imaging] =
			await Promise.all([
				import("@/features/patients/server/update-patient-diagnosis-action"),
				import("@/features/patients/server/update-patient-allergy-action"),
				import("@/features/patients/server/update-patient-medication-action"),
				import("@/features/patients/server/update-patient-immunization-action"),
				import("@/features/patients/server/update-patient-procedure-action"),
				import("@/features/patients/server/update-patient-lab-test-action"),
				import("@/features/patients/server/update-patient-imaging-action"),
			]);
		actions = {
			diagnosis: diagnosis.updatePatientDiagnosisAction,
			allergy: allergy.updatePatientAllergyAction,
			medication: medication.updatePatientMedicationAction,
			immunization: immunization.updatePatientImmunizationAction,
			procedure: procedure.updatePatientProcedureAction,
			labTest: labTest.updatePatientLabTestAction,
			imaging: imaging.updatePatientImagingAction,
		};
	}, 60_000);

	beforeEach(async () => {
		await resetTestDatabase();
		const db = authModule.db;
		await db
			.insert(schema.organization)
			.values({
				id: "edit-hospital",
				name: "Review hospital",
				slug: "edit-hospital",
				createdAt: new Date(),
				isVerified: true,
			});
		await db.insert(schema.patient).values({ id: "edit-patient", organizationId: "edit-hospital" });
		const common = { patientId: "edit-patient", clinicalNote: "Original note" };
		await db
			.insert(schema.patientDiagnosis)
			.values({
				...common,
				id: "DIA-edit",
				diagnosisName: "Review diagnosis",
				status: "Active",
				diagnosedAt: "2026-01-01",
				diagnosedBy: "Review editor",
			});
		await db
			.insert(schema.patientAllergy)
			.values({
				...common,
				id: "ALLE-edit",
				allergen: "Review allergen",
				severity: "Mild",
				status: "Active",
				reaction: "Review reaction",
			});
		await db
			.insert(schema.patientMedication)
			.values({
				...common,
				id: "MED-edit",
				medicationName: "Review medication",
				indication: "Review indication",
				status: "Active",
				dose: "1 unit",
				route: "Oral",
				prescribedBy: "Review editor",
				frequency: "Once daily",
				duration: "7 days",
				startedAt: "2026-01-01",
			});
		await db
			.insert(schema.patientImmunization)
			.values({
				...common,
				id: "IMM-edit",
				vaccineName: "Review vaccine",
				seriesType: "Primary",
				currentDose: "1",
				totalDoses: "1",
				status: "Completed",
				dateAdministered: new Date("2026-01-01"),
				administeredBy: "Review editor",
			});
		await db
			.insert(schema.patientProcedure)
			.values({
				...common,
				id: "PRO-edit",
				procedureName: "Review procedure",
				indication: "Review indication",
				status: "Completed",
				procedureDate: new Date("2026-01-01"),
				performedBy: "Review editor",
				assistants: "Review assistant",
				facility: "Review hospital",
			});
		await db
			.insert(schema.patientLabTest)
			.values({
				...common,
				id: "LAB-edit",
				testName: "Review test",
				status: "Pending",
				referenceRange: "Review range",
				orderedBy: "Review editor",
				orderedAt: new Date("2026-01-01"),
				specimen: "Review specimen",
			});
		await db
			.insert(schema.patientImaging)
			.values({
				...common,
				id: "IMG-edit",
				study: "Review study",
				modality: "X-ray",
				region: "Review region",
				orderedBy: "Review editor",
				orderedAt: new Date("2026-01-01"),
				status: "Pending",
			});
	});

	afterEach(() => vi.restoreAllMocks());
	afterAll(async () => {
		await controlSql?.end();
		await authModule?.sql.end();
	});

	test.each(cases)(
		"only one competing $name save succeeds, and only its history is recorded",
		async ({ name, id, table, history, historyRecordId, fields }) => {
			// Database defaults retain microseconds, but browser versions have millisecond precision.
			await authModule.db
				.update(table)
				.set({ updatedAt: sql`timestamp '2026-01-02 09:00:00.123456'` })
				.where(eq(table.id, id));
			const [original] = await authModule.db
				.select({ updatedAt: table.updatedAt })
				.from(table)
				.where(eq(table.id, id));
			// Even two writes within the same clock tick must invalidate the previous version.
			vi.spyOn(Date, "now").mockReturnValue(original.updatedAt.getTime());
			const forms = ["First editor note", "Second editor note"].map((clinicalNote) => {
				const form = new FormData();
				for (const [field, value] of Object.entries({
					...fields,
					clinicalNote,
					updatedAt: original.updatedAt.toISOString(),
				})) {
					form.set(field, value);
				}
				return form;
			});

			let releaseLock!: () => void;
			let markLocked!: () => void;
			const locked = new Promise<void>((resolve) => {
				markLocked = resolve;
			});
			const release = new Promise<void>((resolve) => {
				releaseLock = resolve;
			});
			const tableName = getTableName(table);
			const lock = controlSql.begin(async (tx) => {
				await tx`select id from ${tx(tableName)} where id = ${id} for update`;
				markLocked();
				await release;
			});
			await locked;
			const saves = Promise.all(forms.map((form) => actions[name](id, form)));
			try {
				// Hold the row until both saves have read the same version and reached the write.
				let waiting = 0;
				const deadline = performance.now() + 10_000;
				while (waiting < 2 && performance.now() < deadline) {
					const [activity] =
						await controlSql`select count(*)::int as waiting from pg_stat_activity where datname = current_database() and wait_event_type = 'Lock' and query like ${'%update "' + tableName + '"%'}`;
					waiting = activity.waiting;
					if (waiting < 2) await new Promise((resolve) => setTimeout(resolve, 20));
				}
				expect(waiting, "both editors must contend for the same row").toBeGreaterThanOrEqual(2);
			} finally {
				releaseLock();
				await lock;
			}

			const results = await saves;
			expect(results.filter((result) => result.status === "success")).toHaveLength(1);
			expect(results.filter((result) => result.status === "failed")).toEqual([
				expect.objectContaining({ error: expect.stringContaining("changed after you opened it") }),
			]);
			const [saved] = await authModule.db
				.select({ clinicalNote: table.clinicalNote, updatedAt: table.updatedAt })
				.from(table)
				.where(eq(table.id, id));
			const winner = results.findIndex((result) => result.status === "success");
			expect(saved.clinicalNote).toBe(forms[winner].get("clinicalNote"));
			expect(saved.updatedAt.getTime()).toBeGreaterThan(original.updatedAt.getTime());
			expect(
				await authModule.db
					.select({
						field: history.fieldName,
						oldValue: history.oldValue,
						newValue: history.newValue,
					})
					.from(history)
					.where(eq(historyRecordId, id)),
			).toEqual([
				{ field: "clinical_note", oldValue: "Original note", newValue: saved.clinicalNote },
			]);
			// Reusing the losing form is refused without changing the winner or adding history.
			expect(await actions[name](id, forms[1 - winner])).toEqual(
				expect.objectContaining({ status: "failed" }),
			);
			expect(
				await authModule.db.select({ id: history.id }).from(history).where(eq(historyRecordId, id)),
			).toHaveLength(1);
		},
		20_000,
	);
});
