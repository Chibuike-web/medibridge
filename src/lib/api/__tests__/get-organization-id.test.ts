// @vitest-environment node

import { describe, expect, test, vi } from "vitest";
import { getOrganizationContext, getOrganizationId } from "../get-organization-id";

const { verifySessionMock, selectMock, limitMock } = vi.hoisted(() => {
	const limitMock = vi.fn();
	const selectMock = vi.fn(() => ({
		from: vi.fn(() => ({
			innerJoin: vi.fn(() => ({
				where: vi.fn(() => ({
					limit: limitMock,
				})),
			})),
		})),
	}));

	return {
		verifySessionMock: vi.fn(),
		selectMock,
		limitMock,
	};
});

vi.mock("../verify-session", () => ({
	verifySession: verifySessionMock,
}));

vi.mock("@/lib/better-auth/auth", () => ({
	db: { select: selectMock },
}));

describe("getOrganizationContext", async () => {
	test("returns null when the session has no active organization", async () => {
		verifySessionMock.mockResolvedValue({
			user: { id: "user-1" },
			session: { activeOrganizationId: null },
		});

		const result = await getOrganizationContext();
		expect(verifySessionMock).toHaveBeenCalledOnce();
		expect(result).toBeNull();
	});
	test("returns the user's organization context when membership exists", async () => {
		verifySessionMock.mockResolvedValue({
			user: { id: "user-1" },
			session: { activeOrganizationId: "org-1" },
		});
		limitMock.mockResolvedValue([
			{
				userId: "user-1",
				organizationId: "org-1",
				memberId: "member-1",
				role: "admin",
				organizationName: "Test Hospital",
				isOrganizationVerified: true,
			},
		]);
		const result = await getOrganizationContext();
		expect(result).toEqual({
			userId: "user-1",
			organizationId: "org-1",
			memberId: "member-1",
			role: "admin",
			organizationName: "Test Hospital",
			isOrganizationVerified: true,
		});
	});
	test("returns null when membership does not exist", async () => {
		verifySessionMock.mockResolvedValue({
			user: { id: "user-1" },
			session: { activeOrganizationId: "org-1" },
		});
		limitMock.mockResolvedValue([]);
		const result = await getOrganizationContext();

		expect(result).toBeNull();
	});
});

describe("getOrganizationId", () => {
	test("returns the active organization ID when context exists", async () => {
		verifySessionMock.mockResolvedValue({
			user: { id: "user-1" },
			session: { activeOrganizationId: "org-1" },
		});

		limitMock.mockResolvedValue([
			{
				userId: "user-1",
				organizationId: "org-1",
				memberId: "member-1",
				role: "admin",
				organizationName: "Test Hospital",
				isOrganizationVerified: true,
			},
		]);

		const result = await getOrganizationId();

		expect(result).toBe("org-1");
	});
	test("returns null when organization context does not exist", async () => {
		verifySessionMock.mockResolvedValue({
			user: { id: "user-1" },
			session: { activeOrganizationId: "org-1" },
		});

		limitMock.mockResolvedValue([]);

		const result = await getOrganizationId();

		expect(result).toBeNull();
	});
});
