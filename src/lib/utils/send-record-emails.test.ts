// @vitest-environment node

import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { sendAccessCodeEmail } from "./send-access-code-email";
import { sendTransferApprovalEmail } from "./send-transfer-approval-email";

const { sendEmailMock } = vi.hoisted(() => ({ sendEmailMock: vi.fn() }));

vi.mock("resend", () => ({
	Resend: class {
		emails = { send: sendEmailMock };
	},
}));

beforeEach(() => {
	vi.stubEnv("NODE_ENV", "development");
});

afterEach(() => {
	vi.unstubAllEnvs();
});

test("delivers transfer approval emails through Resend during local development", async () => {
	const providerResult = { data: { id: "approval-email" }, error: null };
	sendEmailMock.mockResolvedValue(providerResult);

	const result = await sendTransferApprovalEmail({
		email: "patient@example.com",
		patientName: "Test Patient",
		sourceHospitalName: "Source Hospital",
		targetHospitalName: "Receiving Hospital",
		approvalUrl: "https://example.com/transfer-approval/test",
	});

	expect(result).toEqual(providerResult);
	expect(sendEmailMock).toHaveBeenCalledWith(
		expect.objectContaining({
			from: "Medibridge <noreply@medibridge.chibu.dev>",
			to: "patient@example.com",
			subject: "Review your Medibridge record transfer",
			html: expect.stringContaining("https://example.com/transfer-approval/test"),
		}),
	);
});

test("delivers access codes through Resend during local development", async () => {
	const providerResult = { data: { id: "access-code-email" }, error: null };
	sendEmailMock.mockResolvedValue(providerResult);

	const result = await sendAccessCodeEmail({
		email: "recipient@example.com",
		code: "123456",
		accessUrl: "https://example.com/shared-records/test",
	});

	expect(result).toEqual(providerResult);
	expect(sendEmailMock).toHaveBeenCalledWith(
		expect.objectContaining({
			from: "Medibridge <noreply@medibridge.chibu.dev>",
			to: "recipient@example.com",
			subject: "Your shared patient record access code",
			html: expect.stringContaining("123456"),
		}),
	);
});

test("returns Resend failures so callers cannot mistake failed delivery for success", async () => {
	const providerResult = { data: null, error: { message: "Delivery failed" } };
	sendEmailMock.mockResolvedValue(providerResult);

	await expect(
		sendAccessCodeEmail({ email: "recipient@example.com", code: "123456" }),
	).resolves.toEqual(providerResult);
	await expect(
		sendTransferApprovalEmail({
			email: "patient@example.com",
			patientName: "Test Patient",
			sourceHospitalName: "Source Hospital",
			targetHospitalName: "Receiving Hospital",
			approvalUrl: "https://example.com/transfer-approval/test",
		}),
	).resolves.toEqual(providerResult);
});
