// @vitest-environment node

import { afterAll, beforeAll, beforeEach, describe, expect, test } from "vitest";
import * as schema from "@/db/schemas";
import {
	migrateTestDatabase,
	resetTestDatabase,
	testDatabaseUrl,
	useTestDatabase,
} from "../../helpers/test-database";

describe.skipIf(!testDatabaseUrl)("Shared record statuses", () => {
	let authModule: typeof import("@/lib/better-auth/auth");
	let getSharedRecord: typeof import("@/lib/api/get-shared-record").getSharedRecord;
	const accessId = "access-statuses";

	beforeAll(async () => {
		useTestDatabase();
		await migrateTestDatabase();
		authModule = await import("@/lib/better-auth/auth");
		getSharedRecord = (await import("@/lib/api/get-shared-record")).getSharedRecord;
	}, 60_000);

	beforeEach(async () => {
		await resetTestDatabase();
		await authModule.db.insert(schema.organization).values({
			id: "hospital-statuses",
			name: "Source Hospital",
			slug: "hospital-statuses",
			createdAt: new Date(),
			isVerified: true,
		});
		await authModule.db.insert(schema.user).values({
			id: "staff-statuses",
			name: "Staff",
			email: "staff@source.org",
			emailVerified: true,
		});
		await authModule.db
			.insert(schema.patient)
			.values({ id: "patient-statuses", organizationId: "hospital-statuses" });
		await authModule.db.insert(schema.patientPersonalInformation).values({
			id: "personal-statuses",
			patientId: "patient-statuses",
			firstName: "Ada",
			lastName: "Obi",
		});
		await authModule.db.insert(schema.patientTransfer).values({
			id: "TRF-statuses",
			patientId: "patient-statuses",
			sourceOrganizationId: "hospital-statuses",
			targetOrganizationId: "TGT-receiving",
			targetHospitalName: "Receiving Hospital",
			targetHospitalEmail: "records@receiving.org",
			status: "completed",
			patientApprovalStatus: "approved",
		});
		await authModule.db.insert(schema.patientMedication).values({
			id: "MED-discontinued",
			patientId: "patient-statuses",
			medicationName: "Amoxicillin",
			dose: "500 mg",
			frequency: "Three times daily",
			duration: "7 days",
			status: "Discontinued",
		});
		await authModule.db.insert(schema.patientLabTest).values({
			id: "LAB-completed",
			patientId: "patient-statuses",
			testName: "Full Blood Count",
			status: "Completed",
		});
		await authModule.db.insert(schema.patientRecordAccess).values({
			id: accessId,
			patientTransferId: "TRF-statuses",
			patientId: "patient-statuses",
			createdByOrganizationId: "hospital-statuses",
			createdByUserId: "staff-statuses",
			status: "active",
			expiresAt: new Date(Date.now() + 60 * 60 * 1000),
			permissions: { medications: true, labTests: true },
			selectedRecordIds: [
				{ section: "medications", recordId: "MED-discontinued" },
				{ section: "lab-tests", recordId: "LAB-completed" },
			],
		});
	});

	afterAll(async () => {
		await authModule?.sql.end();
	});

	test("shows the receiving hospital the statuses the records were saved with", async () => {
		const sharedRecord = await getSharedRecord(accessId);

		expect(sharedRecord?.records.medications).toEqual([
			expect.objectContaining({ medication: "Amoxicillin", status: "Discontinued" }),
		]);
		expect(sharedRecord?.records.labTests).toEqual([
			expect.objectContaining({ status: "Completed" }),
		]);
	});

	test("shows the receiving hospital how much, how often and how long each medication is taken", async () => {
		const sharedRecord = await getSharedRecord(accessId);

		expect(sharedRecord?.records.medications).toEqual([
			expect.objectContaining({
				medication: "Amoxicillin",
				dose: "500 mg",
				frequency: "Three times daily",
				duration: "7 days",
			}),
		]);
	});
});
