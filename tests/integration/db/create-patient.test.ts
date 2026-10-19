// @vitest-environment node

import { eq } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, test, vi } from "vitest";
import * as schema from "@/db/schemas";
import type { ManualPatientType } from "@/features/patients/schemas/manual-patient-schema";
import {
	migrateTestDatabase,
	resetTestDatabase,
	testDatabaseUrl,
	useTestDatabase,
} from "../../helpers/test-database";

const session = vi.hoisted(() => ({ organizationId: "hospital-a" as string | null }));

vi.mock("@/lib/api/get-session-data", () => ({
	getSessionData: async () => ({ user: { id: "member-a", emailVerified: true } }),
}));
vi.mock("@/lib/api/get-organization-id", () => ({
	getOrganizationId: async () => session.organizationId,
}));
vi.mock("next/cache", () => ({ updateTag: vi.fn() }));

describe.skipIf(!testDatabaseUrl)("Creating a patient manually", () => {
	let authModule: typeof import("@/lib/better-auth/auth");
	let createPatientAction: typeof import("@/features/patients/server/create-patient-action").createPatientAction;

	beforeAll(async () => {
		useTestDatabase();
		await migrateTestDatabase();
		authModule = await import("@/lib/better-auth/auth");
		createPatientAction = (await import("@/features/patients/server/create-patient-action"))
			.createPatientAction;
	}, 60_000);

	beforeEach(async () => {
		await resetTestDatabase();
		session.organizationId = "hospital-a";
		await authModule.db.insert(schema.organization).values(
			["hospital-a", "hospital-b"].map((id) => ({
				id,
				name: id,
				slug: id,
				createdAt: new Date(),
				isVerified: true,
			})),
		);
	});

	afterAll(async () => {
		await authModule?.sql.end();
	});

	const patient: ManualPatientType = {
		personalInformation: {
			firstName: "Ada",
			middleName: "",
			lastName: "Okafor",
			dateOfBirth: "1990-04-12",
			sex: "female",
			age: 35,
			maritalStatus: "",
			nationalId: "",
		},
		contactInformation: {
			phoneNumber: "08031234567",
			emailAddress: "ada@example.com",
			residentialAddress: "",
			stateOfOrigin: "Lagos",
			countryOfOrigin: "Nigeria",
		},
		emergencyContact: {
			firstName: "Chidi",
			middleName: "",
			lastName: "Okafor",
			relationship: "Husband",
			phoneNumber: "08037654321",
		},
		physicalInformation: { height: "165", weight: "", bloodGroup: "O+", genotype: "" },
	};

	test("saves the patient and all four detail sections under the session's hospital", async () => {
		const result = await createPatientAction(patient);
		expect(result).toEqual({ status: "success", patientId: expect.any(String) });
		const patientId = result.status === "success" ? result.patientId : "";
		const { db } = authModule;

		expect(await db.select().from(schema.patient)).toEqual([
			expect.objectContaining({ id: patientId, organizationId: "hospital-a" }),
		]);
		expect(
			await db
				.select()
				.from(schema.patientPersonalInformation)
				.where(eq(schema.patientPersonalInformation.patientId, patientId)),
		).toEqual([
			expect.objectContaining({
				firstName: "Ada",
				lastName: "Okafor",
				sex: "female",
				middleName: null,
				maritalStatus: null,
			}),
		]);
		expect(
			await db
				.select()
				.from(schema.patientContactInformation)
				.where(eq(schema.patientContactInformation.patientId, patientId)),
		).toEqual([
			expect.objectContaining({
				emailAddress: "ada@example.com",
				stateOfOrigin: "Lagos",
				residentialAddress: null,
			}),
		]);
		expect(
			await db
				.select()
				.from(schema.patientEmergencyContact)
				.where(eq(schema.patientEmergencyContact.patientId, patientId)),
		).toEqual([expect.objectContaining({ firstName: "Chidi", phoneNumber: "08037654321" })]);
		expect(
			await db
				.select()
				.from(schema.patientPhysicalInformation)
				.where(eq(schema.patientPhysicalInformation.patientId, patientId)),
		).toEqual([expect.objectContaining({ height: "165", bloodGroup: "O+", weight: null })]);
	});

	test("saves nothing when the session has no verified hospital or the patient is incomplete", async () => {
		session.organizationId = null;
		expect(await createPatientAction(patient)).toMatchObject({ status: "failed" });
		session.organizationId = "hospital-a";
		expect(
			await createPatientAction({
				...patient,
				emergencyContact: { ...patient.emergencyContact, lastName: "" },
			}),
		).toMatchObject({ status: "failed" });

		const { db } = authModule;
		expect(await db.select().from(schema.patient)).toEqual([]);
		expect(await db.select().from(schema.patientPersonalInformation)).toEqual([]);

		expect(await createPatientAction(patient)).toMatchObject({ status: "success" });
		expect(await db.select().from(schema.patient)).toHaveLength(1);
	});
});
