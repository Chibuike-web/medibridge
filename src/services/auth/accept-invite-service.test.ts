import { beforeEach, describe, expect, test, vi } from "vitest";
import { acceptInvitationService, getInvitationPreviewService } from "./accept-invite-service";

const {
	acceptInvitationMock,
	getSessionMock,
	headersMock,
	queryResultMock,
	selectMock,
} = vi.hoisted(() => ({
	acceptInvitationMock: vi.fn(),
	getSessionMock: vi.fn(),
	headersMock: vi.fn(),
	queryResultMock: vi.fn(),
	selectMock: vi.fn(),
}));

vi.mock("next/headers", () => ({
	headers: headersMock,
}));

vi.mock("@/lib/better-auth/auth", () => ({
	auth: {
		api: {
			acceptInvitation: acceptInvitationMock,
			getSession: getSessionMock,
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
