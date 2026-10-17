// @vitest-environment node

import { eq } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, test, vi } from "vitest";
import * as schema from "@/db/schemas";
import {
	migrateTestDatabase,
	resetTestDatabase,
	testDatabaseUrl,
	useTestDatabase,
} from "../../helpers/test-database";

vi.mock("@/lib/utils/send-access-code-email", () => ({
	sendAccessCodeEmail: vi.fn(async () => ({ data: null, error: null })),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn(), updateTag: vi.fn() }));

describe.skipIf(!testDatabaseUrl)("Patient details in a shared record", () => {
	let authModule: typeof import("@/lib/better-auth/auth");
	let actions: typeof import("@/app/(app)/transfer-approval/[transferId]/actions");
	let getSharedRecord: typeof import("@/lib/api/get-shared-record").getSharedRecord;
	let getTransferApproval: typeof import("@/lib/api/get-transfer-approval").getTransferApproval;
	let createTransferApprovalToken: typeof import("@/lib/api/transfer-approval-token").createTransferApprovalToken;
	const transferId = "TRF-details";
	const patientId = "patient-details";

	beforeAll(async () => {
		useTestDatabase();
		await migrateTestDatabase();
		authModule = await import("@/lib/better-auth/auth");
		actions = await import("@/app/(app)/transfer-approval/[transferId]/actions");
		getSharedRecord = (await import("@/lib/api/get-shared-record")).getSharedRecord;
		getTransferApproval = (await import("@/lib/api/get-transfer-approval")).getTransferApproval;
		createTransferApprovalToken = (await import("@/lib/api/transfer-approval-token"))
			.createTransferApprovalToken;
	}, 60_000);

	beforeEach(async () => {
		await resetTestDatabase();
		await authModule.db.insert(schema.organization).values({
			id: "hospital-details",
			name: "Source Hospital",
			slug: "hospital-details",
			createdAt: new Date(),
			isVerified: true,
		});
		await authModule.db.insert(schema.user).values({
			id: "staff-details",
			name: "Staff",
			email: "staff@source.org",
			emailVerified: true,
		});
		await authModule.db
			.insert(schema.patient)
			.values({ id: patientId, organizationId: "hospital-details" });
		await authModule.db.insert(schema.patientPersonalInformation).values({
			id: "personal-details",
			patientId,
			firstName: "Ada",
			lastName: "Obi",
			age: 34,
			sex: "female",
		});
		await authModule.db.insert(schema.patientContactInformation).values({
			id: "contact-details",
			patientId,
			phoneNumber: "+2348012345678",
			emailAddress: "ada@example.org",
		});
		await authModule.db.insert(schema.patientPhysicalInformation).values({
			id: "physical-details",
			patientId,
			bloodGroup: "O+",
			genotype: "AA",
		});
		await authModule.db.insert(schema.patientDiagnosis).values({
			id: "DIA-details",
			patientId,
			diagnosisName: "Asthma",
			status: "Active",
			diagnosedAt: "2019-02-10",
			diagnosedBy: "Dr. Adeyemi",
		});
		await authModule.db.insert(schema.patientTransfer).values({
			id: transferId,
			patientId,
			sourceOrganizationId: "hospital-details",
			targetOrganizationId: "TGT-receiving",
			targetHospitalName: "Receiving Hospital",
			targetHospitalEmail: "records@receiving.org",
			status: "pending",
			patientApprovalStatus: "waiting",
			deliveryStatus: "not_started",
			createdBy: "staff-details",
			requestedBy: "staff-details",
		});
		await authModule.db.insert(schema.patientTransferProgress).values([
			{ id: "TPR-details", transferId, title: "Patient approval", status: "waiting" },
			{ id: "TPR-details-sent", transferId, title: "Clinical packet sent", status: "not_started" },
		]);
	});

	afterAll(async () => {
		await authModule?.sql.end();
	});

	async function approveAndOpen(records: { contentType: string; recordId: string }[]) {
		await authModule.db
			.insert(schema.patientTransferContent)
			.values(
				records.map((record, index) => ({ id: `TCO-details-${index}`, transferId, ...record })),
			);
		const approvalToken = await createTransferApprovalToken({
			transferId,
			patientId,
			expiresAt: new Date(Date.now() + 60 * 60 * 1000),
		});
		expect(await actions.approvePatientTransferAction(transferId, approvalToken)).toMatchObject({
			status: "success",
		});
		const [access] = await authModule.db
			.update(schema.patientRecordAccess)
			.set({ status: "active" })
			.where(eq(schema.patientRecordAccess.patientTransferId, transferId))
			.returning({ id: schema.patientRecordAccess.id });

		return getSharedRecord(access.id);
	}

	test("shows the receiving hospital only the patient details sections that were selected", async () => {
		const sharedRecord = await approveAndOpen([
			{ contentType: "patient-details", recordId: "personal-information" },
			{ contentType: "patient-details", recordId: "physical-information" },
			{ contentType: "diagnoses", recordId: "DIA-details" },
		]);

		expect(sharedRecord?.availableSections).toEqual(["patient-details", "diagnoses"]);
		expect(sharedRecord?.patientDetailsSections.map((section) => section.title)).toEqual([
			"Personal Information",
			"Physical Information",
		]);
		expect(sharedRecord?.patient).toEqual({ name: "Ada Obi", sex: "Female", age: "34" });
	});

	test("still names the patient when no patient details sections were shared", async () => {
		const sharedRecord = await approveAndOpen([
			{ contentType: "diagnoses", recordId: "DIA-details" },
		]);

		expect(sharedRecord?.availableSections).toEqual(["diagnoses"]);
		expect(sharedRecord?.patientDetailsSections).toEqual([]);
		expect(sharedRecord?.patient).toEqual({ name: "Ada Obi", sex: "Female", age: "34" });
		expect(JSON.stringify(sharedRecord)).not.toContain("ada@example.org");
	});
	test("shows the patient, before approving, exactly which details and records will be shared", async () => {
		await authModule.db.insert(schema.patientTransferContent).values([
			{
				id: "TCO-preview-1",
				transferId,
				contentType: "patient-details",
				recordId: "physical-information",
			},
			{ id: "TCO-preview-2", transferId, contentType: "diagnoses", recordId: "DIA-details" },
		]);

		const approval = await getTransferApproval(transferId);

		expect(approval?.requestedByName).toBe("Staff");
		expect(approval?.sharedDetailSections.map((section) => section.title)).toEqual([
			"Physical Information",
		]);
		expect(approval?.sharedRecordGroups).toEqual([
			{
				label: "Diagnoses",
				records: [expect.objectContaining({ name: "Asthma", status: "Active" })],
			},
		]);
		expect(JSON.stringify(approval)).not.toContain("ada@example.org");
	});

	test("lets the patient reject without giving a reason", async () => {
		const approvalToken = await createTransferApprovalToken({
			transferId,
			patientId,
			expiresAt: new Date(Date.now() + 60 * 60 * 1000),
		});

		expect(
			await actions.rejectPatientTransferAction({ transferId, approvalToken, reason: "  " }),
		).toMatchObject({ status: "success" });
		const [transfer] = await authModule.db
			.select({
				patientApprovalStatus: schema.patientTransfer.patientApprovalStatus,
				patientRejectionReason: schema.patientTransfer.patientRejectionReason,
			})
			.from(schema.patientTransfer)
			.where(eq(schema.patientTransfer.id, transferId));
		expect(transfer).toEqual({ patientApprovalStatus: "rejected", patientRejectionReason: null });
	});
});
