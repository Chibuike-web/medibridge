// @vitest-environment node

import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { GET } from "./route";

const { cleanupMock } = vi.hoisted(() => ({ cleanupMock: vi.fn() }));

vi.mock("@/services/patient/cleanup-abandoned-extractions-service", () => ({
	cleanupAbandonedExtractionsService: cleanupMock,
}));

const request = (authorization?: string) =>
	GET(
		new Request("http://localhost/api/cron/cleanup-abandoned-extractions", {
			headers: authorization ? { authorization } : {},
		}),
	);

beforeEach(() => {
	vi.stubEnv("CRON_SECRET", "cron-secret");
	cleanupMock.mockReset();
	cleanupMock.mockResolvedValue({ status: "success", removedCount: 2 });
});

afterEach(() => vi.unstubAllEnvs());

test("runs the cleanup for the scheduler's secret", async () => {
	const response = await request("Bearer cron-secret");

	expect(response.status).toBe(200);
	expect(await response.json()).toEqual({ status: "success", removedCount: 2 });
});

test.each([undefined, "Bearer wrong-secret"])(
	"refuses a request without the secret: %s",
	async (authorization) => {
		expect((await request(authorization)).status).toBe(401);
		expect(cleanupMock).not.toHaveBeenCalled();
	},
);

test("refuses every request when no secret is configured", async () => {
	vi.stubEnv("CRON_SECRET", "");

	expect((await request("Bearer ")).status).toBe(401);
	expect(cleanupMock).not.toHaveBeenCalled();
});

test("reports a failed cleanup to the scheduler", async () => {
	cleanupMock.mockResolvedValue({ status: "failed", error: "We couldn’t clean up." });

	expect((await request("Bearer cron-secret")).status).toBe(500);
});
