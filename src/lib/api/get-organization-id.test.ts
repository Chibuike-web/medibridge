import { describe, expect, test, vi } from "vitest";
import { verifySession } from "./verify-session";
import { getOrganizationContext } from "./get-organization-id";

const { verifySessionMock } = vi.hoisted(() => ({
  verifySessionMock: vi.fn(),
}));

vi.mock("./verify-session", () => ({
  verifySession: verifySessionMock,
}));

vi.mock("@/lib/better-auth/auth", () => ({
  db: {},
}));

describe("getOrganizationContext", async () => {
  test("returns null when the session has no active organization", async () => {
    const mockSession = {
      user: { id: "user-1" },
      session: { activeOrganizationId: null },
    };
    verifySessionMock.mockResolvedValue(mockSession);

    const organizationContext = await getOrganizationContext();
    expect(verifySessionMock).toHaveBeenCalledOnce();
    expect(organizationContext).toBeNull();
  });
});
