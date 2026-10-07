import { beforeEach, describe, expect, test, vi } from "vitest";
import { member } from "@/db/schemas/auth";
import { acceptInvitationService, getInvitationPreviewService } from "./accept-invite-service";

const {
	acceptInvitationMock,
	getSessionMock,
	headersMock,
	membershipResultMock,
	queryResultMock,
	selectMock,
} = vi.hoisted(() => ({
	acceptInvitationMock: vi.fn(),
	getSessionMock: vi.fn(),
	headersMock: vi.fn(),
	membershipResultMock: vi.fn(),
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
		selectMock.mockImplementation(() => {
			const queryBuilder = {
				from: vi.fn(),
				innerJoin: vi.fn(),
				leftJoin: vi.fn(),
				where: vi.fn(),
				limit: vi.fn(),
			};

			queryBuilder.from.mockImplementation((table) => {
				queryBuilder.limit.mockImplementation(
					table === member ? membershipResultMock : queryResultMock,
				);
				return queryBuilder;
			});
			queryBuilder.innerJoin.mockReturnValue(queryBuilder);
			queryBuilder.leftJoin.mockReturnValue(queryBuilder);
			queryBuilder.where.mockReturnValue(queryBuilder);
			return queryBuilder;
		});
		headersMock.mockResolvedValue(new Headers());
		queryResultMock.mockResolvedValue([
			{
				email: "admin@stmaryhospital.org",
				hasAccount: null,
				isOrganizationVerified: true,
				organizationName: "St Mary Hospital",
			},
		]);
		membershipResultMock.mockResolvedValue([]);
		getSessionMock.mockResolvedValue({
			user: { id: "user-1", email: "admin@stmaryhospital.org" },
		});
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

		expect(result).toEqual({
			status: "unauthorized",
			error: "Sign in before accepting the invitation.",
		});
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

	test("does not accept an invitation that is no longer pending", async () => {
		queryResultMock.mockResolvedValue([]);

		const result = await acceptInvitationService("invitation-1");

		expect(result).toEqual({
			status: "invalid",
			error: "This invitation is invalid or has expired.",
		});
		expect(acceptInvitationMock).not.toHaveBeenCalled();
	});

	test("does not accept an invitation to a hospital that isn't verified", async () => {
		queryResultMock.mockResolvedValue([
			{
				email: "admin@stmaryhospital.org",
				hasAccount: "user-1",
				isOrganizationVerified: false,
				organizationName: "St Mary Hospital",
			},
		]);

		const result = await acceptInvitationService("invitation-1");

		expect(result).toEqual({
			status: "failed",
			error: "This hospital must be verified before you can join it.",
		});
		expect(acceptInvitationMock).not.toHaveBeenCalled();
	});

	test("does not accept an invitation for an account that already belongs to a hospital", async () => {
		membershipResultMock.mockResolvedValue([{ id: "member-1" }]);

		const result = await acceptInvitationService("invitation-1");

		expect(result).toEqual({
			status: "failed",
			error: "Your account already belongs to a hospital. An account can only join one hospital.",
		});
		expect(acceptInvitationMock).not.toHaveBeenCalled();
	});

	test("returns a fixed message instead of the internal error when acceptance fails", async () => {
		vi.spyOn(console, "error").mockImplementation(() => {});
		acceptInvitationMock.mockRejectedValue(new Error("duplicate key value violates constraint"));

		const result = await acceptInvitationService("invitation-1");

		expect(result).toEqual({
			status: "failed",
			error: "We couldn't accept the invitation. Please try again.",
		});
	});
});
