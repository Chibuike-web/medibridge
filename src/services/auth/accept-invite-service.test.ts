import { beforeEach, describe, expect, test, vi } from "vitest";
import {
	acceptInvitationService,
	createInvitedAdminService,
	getInvitationPreviewService,
} from "./accept-invite-service";

const {
	acceptInvitationMock,
	getSessionMock,
	headersMock,
	queryResultMock,
	selectMock,
	signUpEmailMock,
} = vi.hoisted(() => ({
	acceptInvitationMock: vi.fn(),
	getSessionMock: vi.fn(),
	headersMock: vi.fn(),
	queryResultMock: vi.fn(),
	selectMock: vi.fn(),
	signUpEmailMock: vi.fn(),
}));

vi.mock("next/headers", () => ({
	headers: headersMock,
}));

vi.mock("@/lib/utils/env", () => ({
	ENV: { BETTER_AUTH_URL: "http://localhost:4300" },
}));

vi.mock("@/lib/better-auth/auth", () => ({
	auth: {
		api: {
			acceptInvitation: acceptInvitationMock,
			getSession: getSessionMock,
			signUpEmail: signUpEmailMock,
		},
	},
	db: { select: selectMock },
}));

describe("accept invitation services", () => {
	beforeEach(() => {
		const queryBuilder = {
			from: vi.fn(),
			innerJoin: vi.fn(),
			leftJoin: vi.fn(),
			where: vi.fn(),
			limit: queryResultMock,
		};

		queryBuilder.from.mockReturnValue(queryBuilder);
		queryBuilder.innerJoin.mockReturnValue(queryBuilder);
		queryBuilder.leftJoin.mockReturnValue(queryBuilder);
		queryBuilder.where.mockReturnValue(queryBuilder);
		selectMock.mockReturnValue(queryBuilder);
		headersMock.mockResolvedValue(new Headers());
		queryResultMock.mockResolvedValue([
			{
				email: "admin@stmaryhospital.org",
				hasAccount: null,
				organizationName: "St Mary Hospital",
			},
		]);
		signUpEmailMock.mockResolvedValue({ user: { id: "user-1" }, token: null });
		getSessionMock.mockResolvedValue({ user: { email: "admin@stmaryhospital.org" } });
		acceptInvitationMock.mockResolvedValue({ member: { role: "admin" } });
	});

	test("returns the invited email and organization for a pending invitation", async () => {
		const result = await getInvitationPreviewService("invitation-1");

		expect(result).toEqual({
			status: "success",
			email: "admin@stmaryhospital.org",
			hasAccount: false,
			organizationName: "St Mary Hospital",
		});
	});

	test("rejects invalid account details before looking up the invitation", async () => {
		const result = await createInvitedAdminService("invitation-1", {
			name: "",
			password: "short",
		});

		expect(result).toEqual({
			status: "failed",
			error: "Enter valid account details.",
		});
		expect(selectMock).not.toHaveBeenCalled();
		expect(signUpEmailMock).not.toHaveBeenCalled();
	});

	test("creates the invited account with the invitation email and return URL", async () => {
		const result = await createInvitedAdminService("invitation-1", {
			name: "Sarah Thompson",
			password: "secure-password",
		});

		expect(signUpEmailMock).toHaveBeenCalledWith({
			body: {
				callbackURL: "http://localhost:4300/accept-invite?invitationId=invitation-1",
				email: "admin@stmaryhospital.org",
				name: "Sarah Thompson",
				password: "secure-password",
			},
			headers: expect.any(Headers),
		});
		expect(result).toEqual({ status: "verification-required" });
	});

	test("does not accept an invitation without an authenticated session", async () => {
		getSessionMock.mockResolvedValue(null);

		const result = await acceptInvitationService("invitation-1");

		expect(result).toEqual({ status: "unauthorized" });
		expect(acceptInvitationMock).not.toHaveBeenCalled();
	});

	test("accepts the invitation for the authenticated invited account", async () => {
		const result = await acceptInvitationService("invitation-1");

		expect(acceptInvitationMock).toHaveBeenCalledWith({
			body: { invitationId: "invitation-1" },
			headers: expect.any(Headers),
		});
		expect(result).toEqual({ status: "success" });
	});
});
