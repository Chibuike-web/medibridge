import { beforeEach, describe, expect, test, vi } from "vitest";
import { inviteAdminService } from "./invite-admin-service";

const {
	createInvitationMock,
	getOrganizationAccessServiceMock,
	getSessionMock,
	headersMock,
	queryResultMock,
	selectMock,
	sendOrganizationInvitationEmailMock,
} = vi.hoisted(() => ({
	createInvitationMock: vi.fn(),
	getOrganizationAccessServiceMock: vi.fn(),
	getSessionMock: vi.fn(),
	headersMock: vi.fn(),
	queryResultMock: vi.fn(),
	selectMock: vi.fn(),
	sendOrganizationInvitationEmailMock: vi.fn(),
}));

vi.mock("next/headers", () => ({
	headers: headersMock,
}));

vi.mock("@/lib/better-auth/auth", () => ({
	auth: {
		api: {
			createInvitation: createInvitationMock,
			getSession: getSessionMock,
		},
	},
	db: { select: selectMock },
}));

vi.mock("./get-organization-access-service", () => ({
	getOrganizationAccessService: getOrganizationAccessServiceMock,
}));

vi.mock("@/lib/utils/env", () => ({
	ENV: { BETTER_AUTH_URL: "http://localhost:4300" },
}));

vi.mock("@/lib/utils/send-email", () => ({
	sendOrganizationInvitationEmail: sendOrganizationInvitationEmailMock,
}));

describe("inviteAdminService", () => {
	beforeEach(() => {
		const queryBuilder = {
			from: vi.fn(),
			innerJoin: vi.fn(),
			where: vi.fn(),
			limit: queryResultMock,
		};

		queryBuilder.from.mockReturnValue(queryBuilder);
		queryBuilder.innerJoin.mockReturnValue(queryBuilder);
		queryBuilder.where.mockReturnValue(queryBuilder);
		selectMock.mockReturnValue(queryBuilder);
		queryResultMock.mockResolvedValue([]);
		headersMock.mockResolvedValue(new Headers());
		getSessionMock.mockResolvedValue({
			session: { activeOrganizationId: "organization-1" },
			user: { name: "Hospital Owner" },
		});
		getOrganizationAccessServiceMock.mockResolvedValue({
			status: "success",
			isOrganizationVerified: true,
			organizationName: "St Mary Hospital",
			role: "owner",
		});
		createInvitationMock.mockResolvedValue({ id: "invitation-1" });
		sendOrganizationInvitationEmailMock.mockResolvedValue({ id: "email-1" });
	});

	test("rejects invalid administrator details before checking the session", async () => {
		const result = await inviteAdminService({ name: "", email: "invalid" });

		expect(result).toEqual({
			status: "failed",
			error: "Enter valid administrator details.",
		});
		expect(getSessionMock).not.toHaveBeenCalled();
		expect(createInvitationMock).not.toHaveBeenCalled();
	});

	test("does not create an invitation without a session", async () => {
		getSessionMock.mockResolvedValue(null);

		const result = await inviteAdminService({
			name: "Sarah Thompson",
			email: "sarah@stmaryhospital.org",
		});

		expect(result).toEqual({
			status: "unauthorized",
			error: "Sign in before sending an invitation.",
		});
		expect(getOrganizationAccessServiceMock).not.toHaveBeenCalled();
		expect(createInvitationMock).not.toHaveBeenCalled();
	});

	test("does not let a non-owner invite an administrator", async () => {
		getOrganizationAccessServiceMock.mockResolvedValue({
			status: "success",
			isOrganizationVerified: true,
			organizationName: "St Mary Hospital",
			role: "admin",
		});

		const result = await inviteAdminService({
			name: "Sarah Thompson",
			email: "sarah@stmaryhospital.org",
		});

		expect(result).toEqual({
			status: "forbidden",
			error: "Only the hospital owner can invite an administrator.",
		});
		expect(createInvitationMock).not.toHaveBeenCalled();
	});

	test("does not invite an administrator before the hospital is verified", async () => {
		getOrganizationAccessServiceMock.mockResolvedValue({
			status: "success",
			isOrganizationVerified: false,
			organizationName: "St Mary Hospital",
			role: "owner",
		});

		const result = await inviteAdminService({
			name: "Sarah Thompson",
			email: "sarah@stmaryhospital.org",
		});

		expect(result).toEqual({
			status: "forbidden",
			error: "Your hospital must be verified before inviting an administrator.",
		});
		expect(createInvitationMock).not.toHaveBeenCalled();
	});

	test("creates and emails an admin invitation for a verified hospital owner", async () => {
		const result = await inviteAdminService({
			name: " Sarah Thompson ",
			email: "SARAH@STMARYHOSPITAL.ORG",
		});

		expect(createInvitationMock).toHaveBeenCalledWith({
			body: {
				email: "sarah@stmaryhospital.org",
				organizationId: "organization-1",
				resend: true,
				role: "admin",
			},
			headers: expect.any(Headers),
		});
		expect(sendOrganizationInvitationEmailMock).toHaveBeenCalledWith({
			email: "sarah@stmaryhospital.org",
			invitationUrl: "http://localhost:4300/accept-invite?invitationId=invitation-1",
			inviterName: "Hospital Owner",
			organizationName: "St Mary Hospital",
			recipientName: "Sarah Thompson",
		});
		expect(result).toEqual({ status: "success" });
	});

	test("returns a fixed message instead of the internal error when the invitation fails", async () => {
		vi.spyOn(console, "error").mockImplementation(() => {});
		createInvitationMock.mockRejectedValue(new Error("connect ECONNREFUSED 127.0.0.1:5432"));

		const result = await inviteAdminService({
			name: "Sarah Thompson",
			email: "sarah@stmaryhospital.org",
		});

		expect(result).toEqual({
			status: "failed",
			error: "We couldn't send the invitation. Please try again.",
		});
		expect(sendOrganizationInvitationEmailMock).not.toHaveBeenCalled();
	});

	test("does not invite someone who already belongs to a hospital", async () => {
		queryResultMock.mockResolvedValue([{ id: "existing-member" }]);

		const result = await inviteAdminService({
			name: "Sarah Thompson",
			email: "sarah@stmaryhospital.org",
		});

		expect(result).toEqual({
			status: "failed",
			error: "This person already belongs to a hospital and can't be invited to another.",
		});
		expect(createInvitationMock).not.toHaveBeenCalled();
		expect(sendOrganizationInvitationEmailMock).not.toHaveBeenCalled();
	});
});
