// @vitest-environment node

import { beforeEach, describe, expect, test, vi } from "vitest";
import { verifySession } from "../verify-session";

const { getSessionDataMock } = vi.hoisted(() => ({ getSessionDataMock: vi.fn() }));
vi.mock("../get-session-data", () => ({ getSessionData: getSessionDataMock }));
vi.mock("next/navigation", () => ({
	redirect: (path: string) => {
		throw new Error(`REDIRECT:${path}`);
	},
}));

describe("page session verification", () => {
	beforeEach(() => getSessionDataMock.mockReset());

	test("returns the signed-in user's session so pages can handle email verification separately", async () => {
		const session = { user: { id: "user-1", emailVerified: false } };
		getSessionDataMock.mockResolvedValue(session);
		expect(await verifySession()).toEqual(session);
	});

	test.each([null, { user: {} }, { user: { id: "", emailVerified: true } }])(
		"redirects a missing user identity to sign-in: %j",
		async (session) => {
			getSessionDataMock.mockResolvedValue(session);
			await expect(verifySession()).rejects.toThrow("REDIRECT:/sign-in");
		},
	);
});
