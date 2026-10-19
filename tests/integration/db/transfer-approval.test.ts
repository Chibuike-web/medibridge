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

const { sendAccessCodeEmailMock } = vi.hoisted(() => ({
	sendAccessCodeEmailMock: vi.fn(
		async (): Promise<{ data: null; error: { message: string } | null }> => ({
			data: null,
			error: null,
		}),
	),
}));
vi.mock("@/lib/utils/send-access-code-email", () => ({
	sendAccessCodeEmail: sendAccessCodeEmailMock,
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn(), updateTag: vi.fn() }));
vi.mock("@/lib/api/get-session-data", () => ({
	getSessionData: async () => ({ user: { id: "staff-approval", emailVerified: true } }),
}));
vi.mock("@/lib/api/get-organization-id", () => ({
	getOrganizationId: async () => "hospital-approval",
}));

describe.skipIf(!testDatabaseUrl)("Patient transfer approval", () => {
	let authModule: typeof import("@/lib/better-auth/auth");
	let actions: typeof import("@/app/(app)/transfer-approval/[transferId]/actions");
	let cancelTransferAction: typeof import("@/features/transfers/server/cancel-transfer-action").cancelTransferAction;
	let retryTransferDeliveryAction: typeof import("@/features/transfers/server/retry-transfer-delivery-action").retryTransferDeliveryAction;
	let approvalToken: string;
	const transferId = "TRF-approval";
	const patientId = "patient-approval";

	beforeAll(async () => {
		useTestDatabase();
		await migrateTestDatabase();
		authModule = await import("@/lib/better-auth/auth");
		actions = await import("@/app/(app)/transfer-approval/[transferId]/actions");
		({ cancelTransferAction } = await import("@/features/transfers/server/cancel-transfer-action"));
		({ retryTransferDeliveryAction } =
			await import("@/features/transfers/server/retry-transfer-delivery-action"));
		const { createTransferApprovalToken } = await import("@/lib/api/transfer-approval-token");
		approvalToken = await createTransferApprovalToken({
			transferId,
			patientId,
			expiresAt: new Date(Date.now() + 60 * 60 * 1000),
		});
	}, 60_000);

	beforeEach(async () => {
		await resetTestDatabase();
		await authModule.db.insert(schema.organization).values({
			id: "hospital-approval",
			name: "Source Hospital",
			slug: "hospital-approval",
			createdAt: new Date(),
			isVerified: true,
		});
		await authModule.db.insert(schema.user).values({
			id: "staff-approval",
			name: "Staff",
			email: "staff@source.org",
			emailVerified: true,
		});
		await authModule.db
			.insert(schema.patient)
			.values({ id: patientId, organizationId: "hospital-approval" });
		await authModule.db.insert(schema.patientTransfer).values({
			id: transferId,
			patientId,
			sourceOrganizationId: "hospital-approval",
			targetOrganizationId: "TGT-receiving",
			targetHospitalName: "Receiving Hospital",
			targetHospitalEmail: "records@receiving.org",
			status: "pending",
			patientApprovalStatus: "waiting",
			deliveryStatus: "not_started",
			createdBy: "staff-approval",
			requestedBy: "staff-approval",
		});
		await authModule.db.insert(schema.patientTransferContent).values({
			id: "TCO-approval",
			transferId,
			contentType: "diagnoses",
			recordId: "DIA-approval",
		});
		await authModule.db.insert(schema.patientTransferProgress).values([
			{ id: "TPR-approval", transferId, title: "Patient approval", status: "waiting" },
			{ id: "TPR-sent", transferId, title: "Clinical packet sent", status: "not_started" },
		]);
	});

	afterAll(async () => {
		await authModule?.sql.end();
	});

	async function getTransferState() {
		const [transfer] = await authModule.db
			.select()
			.from(schema.patientTransfer)
			.where(eq(schema.patientTransfer.id, transferId));
		const accessGrants = await authModule.db
			.select({ id: schema.patientRecordAccess.id })
			.from(schema.patientRecordAccess)
			.where(eq(schema.patientRecordAccess.patientTransferId, transferId));

		return { transfer, accessGrants };
	}

	test("approvals sent at the same moment share the records once and send one access code", async () => {
		const results = await Promise.all(
			Array.from({ length: 5 }, () =>
				actions.approvePatientTransferAction(transferId, approvalToken),
			),
		);

		expect(results.every((result) => result.status === "success")).toBe(true);
		const { transfer, accessGrants } = await getTransferState();
		expect(transfer.patientApprovalStatus).toBe("approved");
		expect(transfer.status).toBe("completed");
		expect(accessGrants).toHaveLength(1);
		expect(sendAccessCodeEmailMock).toHaveBeenCalledTimes(1);
	});

	test("an approval and a rejection at the same moment tell the patient what actually happened", async () => {
		const [approveResult, rejectResult] = await Promise.all([
			actions.approvePatientTransferAction(transferId, approvalToken),
			actions.rejectPatientTransferAction({ transferId, approvalToken, reason: "Changed my mind" }),
		]);

		const { transfer, accessGrants } = await getTransferState();
		if (transfer.patientApprovalStatus === "approved") {
			expect(approveResult.status).toBe("success");
			expect(rejectResult).toEqual({
				status: "failed",
				error: "This transfer has already been approved and cannot be rejected.",
			});
			expect(transfer.status).toBe("completed");
			expect(accessGrants).toHaveLength(1);
			expect(sendAccessCodeEmailMock).toHaveBeenCalledTimes(1);
		} else {
			expect(rejectResult.status).toBe("success");
			expect(approveResult).toEqual({
				status: "failed",
				error: "This transfer has already been rejected and cannot be approved.",
			});
			expect(transfer.status).toBe("rejected");
			expect(accessGrants).toHaveLength(0);
			expect(sendAccessCodeEmailMock).not.toHaveBeenCalled();
		}
	});

	test("a failed approval leaves the transfer waiting so the patient can approve again", async () => {
		await authModule.db
			.update(schema.patientTransfer)
			.set({ createdBy: "removed-staff", requestedBy: "removed-staff" })
			.where(eq(schema.patientTransfer.id, transferId));
		vi.spyOn(console, "error").mockImplementation(() => {});

		expect(await actions.approvePatientTransferAction(transferId, approvalToken)).toEqual({
			status: "failed",
			error: "We couldn’t approve this transfer. Please try again.",
		});
		const failedState = await getTransferState();
		expect(failedState.transfer.patientApprovalStatus).toBe("waiting");
		expect(failedState.accessGrants).toHaveLength(0);
		expect(sendAccessCodeEmailMock).not.toHaveBeenCalled();

		await authModule.db
			.update(schema.patientTransfer)
			.set({ createdBy: "staff-approval", requestedBy: "staff-approval" })
			.where(eq(schema.patientTransfer.id, transferId));

		expect(await actions.approvePatientTransferAction(transferId, approvalToken)).toEqual({
			status: "success",
			message: "Transfer request approved.",
		});
		expect((await getTransferState()).accessGrants).toHaveLength(1);
	});

	test("a cancelled request can no longer be approved or rejected", async () => {
		expect(await cancelTransferAction(transferId)).toEqual({
			status: "success",
			message: "Transfer cancelled. The patient can no longer respond to the request.",
		});

		const withdrawn = {
			status: "failed",
			error: "The hospital withdrew this transfer request.",
		};
		expect(await actions.approvePatientTransferAction(transferId, approvalToken)).toEqual(
			withdrawn,
		);
		expect(
			await actions.rejectPatientTransferAction({ transferId, approvalToken, reason: "" }),
		).toEqual(withdrawn);
		const { transfer, accessGrants } = await getTransferState();
		expect(transfer.status).toBe("cancelled");
		expect(transfer.cancelledAt).toBeInstanceOf(Date);
		expect(transfer.patientApprovalStatus).toBe("waiting");
		expect(accessGrants).toHaveLength(0);
		expect(sendAccessCodeEmailMock).not.toHaveBeenCalled();
	});

	test("a cancellation and an approval at the same moment give one outcome", async () => {
		const [cancelResult, approveResult] = await Promise.all([
			cancelTransferAction(transferId),
			actions.approvePatientTransferAction(transferId, approvalToken),
		]);

		const { transfer, accessGrants } = await getTransferState();
		if (transfer.status === "cancelled") {
			expect(cancelResult.status).toBe("success");
			expect(approveResult).toEqual({
				status: "failed",
				error: "The hospital withdrew this transfer request.",
			});
			expect(accessGrants).toHaveLength(0);
		} else {
			expect(approveResult.status).toBe("success");
			expect(cancelResult).toEqual({
				status: "failed",
				error: "The patient has already approved this transfer, so it can no longer be cancelled.",
			});
			expect(transfer.patientApprovalStatus).toBe("approved");
			expect(accessGrants).toHaveLength(1);
		}
	});

	test("retrying a failed delivery sends a new code for the same grant", async () => {
		sendAccessCodeEmailMock.mockResolvedValueOnce({ data: null, error: { message: "down" } });
		vi.spyOn(console, "error").mockImplementation(() => {});
		await actions.approvePatientTransferAction(transferId, approvalToken);
		expect((await getTransferState()).transfer.status).toBe("failed");

		expect(await retryTransferDeliveryAction(transferId)).toEqual({
			status: "success",
			message: "Access code sent to records@receiving.org.",
		});

		const { transfer, accessGrants } = await getTransferState();
		expect(transfer.status).toBe("completed");
		expect(transfer.deliveryStatus).toBe("sent");
		expect(accessGrants).toHaveLength(1);
		const codes = await authModule.db
			.select({ id: schema.patientRecordAccessVerification.id })
			.from(schema.patientRecordAccessVerification)
			.where(eq(schema.patientRecordAccessVerification.accessId, accessGrants[0].id));
		expect(codes).toHaveLength(2);
		expect(sendAccessCodeEmailMock).toHaveBeenCalledTimes(2);
	});

	test("a retry that breaks mid-send leaves the transfer ready to retry again", async () => {
		sendAccessCodeEmailMock.mockResolvedValueOnce({ data: null, error: { message: "down" } });
		vi.spyOn(console, "error").mockImplementation(() => {});
		await actions.approvePatientTransferAction(transferId, approvalToken);
		const [grant] = (await getTransferState()).accessGrants;
		const codesFor = () =>
			authModule.db
				.select({ id: schema.patientRecordAccessVerification.id })
				.from(schema.patientRecordAccessVerification)
				.where(eq(schema.patientRecordAccessVerification.accessId, grant.id));
		const codesBefore = (await codesFor()).length;
		sendAccessCodeEmailMock.mockRejectedValueOnce(new Error("process died"));

		expect(await retryTransferDeliveryAction(transferId)).toEqual({
			status: "failed",
			error: "We couldn’t retry this transfer. Please try again.",
		});
		const { transfer } = await getTransferState();
		expect(transfer.status).toBe("failed");
		expect(transfer.deliveryStatus).toBe("failed");
		expect(await codesFor()).toHaveLength(codesBefore);

		expect((await retryTransferDeliveryAction(transferId)).status).toBe("success");
		expect((await getTransferState()).transfer.status).toBe("completed");
	});

	test("a retry whose access email is refused keeps no unsent code", async () => {
		sendAccessCodeEmailMock.mockResolvedValueOnce({ data: null, error: { message: "down" } });
		vi.spyOn(console, "error").mockImplementation(() => {});
		await actions.approvePatientTransferAction(transferId, approvalToken);
		const [grant] = (await getTransferState()).accessGrants;
		const codesFor = () =>
			authModule.db
				.select({ id: schema.patientRecordAccessVerification.id })
				.from(schema.patientRecordAccessVerification)
				.where(eq(schema.patientRecordAccessVerification.accessId, grant.id));
		const codesBefore = await codesFor();
		sendAccessCodeEmailMock.mockResolvedValueOnce({ data: null, error: { message: "down" } });

		expect(await retryTransferDeliveryAction(transferId)).toEqual({
			status: "failed",
			error: "We still couldn’t send the access email to Receiving Hospital. Please try again.",
		});
		expect((await getTransferState()).transfer.status).toBe("failed");
		expect(await codesFor()).toEqual(codesBefore);

		expect((await retryTransferDeliveryAction(transferId)).status).toBe("success");
		expect(await codesFor()).toHaveLength(codesBefore.length + 1);
	});

	test("retries sent at the same moment send one new code", async () => {
		sendAccessCodeEmailMock.mockResolvedValueOnce({ data: null, error: { message: "down" } });
		vi.spyOn(console, "error").mockImplementation(() => {});
		await actions.approvePatientTransferAction(transferId, approvalToken);

		const results = await Promise.all([
			retryTransferDeliveryAction(transferId),
			retryTransferDeliveryAction(transferId),
		]);

		expect(results.filter((result) => result.status === "success")).toHaveLength(1);
		expect(results).toContainEqual({
			status: "failed",
			error: "This transfer is already being retried.",
		});
		expect((await getTransferState()).transfer.status).toBe("completed");
		expect(sendAccessCodeEmailMock).toHaveBeenCalledTimes(2);
	});
});
