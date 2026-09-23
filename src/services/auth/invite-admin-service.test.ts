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
			where: vi.fn(),
			limit: queryResultMock,
		};

		queryBuilder.from.mockReturnValue(queryBuilder);
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

		expect(result).toEqual({ status: "unauthorized" });
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

	test("does not invite an email that already belongs to a MediBridge account", async () => {
		queryResultMock.mockResolvedValue([{ id: "existing-user" }]);

		const result = await inviteAdminService({
			name: "Sarah Thompson",
			email: "sarah@stmaryhospital.org",
		});

		expect(result).toEqual({
			status: "failed",
			error: "This email already belongs to a MediBridge account.",
		});
		expect(createInvitationMock).not.toHaveBeenCalled();
		expect(sendOrganizationInvitationEmailMock).not.toHaveBeenCalled();
	});
});
