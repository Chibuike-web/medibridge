// @vitest-environment node

import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { GET } from "./route";

const { cleanupMock, cleanupUploadsMock } = vi.hoisted(() => ({
	cleanupMock: vi.fn(),
	cleanupUploadsMock: vi.fn(),
}));

vi.mock("@/services/patient/cleanup-abandoned-extractions-service", () => ({
	cleanupAbandonedExtractionsService: cleanupMock,
}));
vi.mock("@/services/patient/cleanup-unreferenced-uploads-service", () => ({
	cleanupUnreferencedUploadsService: cleanupUploadsMock,
}));

const request = (authorization?: string) =>
	GET(
		new Request("http://localhost/api/cron/cleanup-uploads", {
			headers: authorization ? { authorization } : {},
		}),
	);

beforeEach(() => {
	vi.stubEnv("CRON_SECRET", "cron-secret");
	cleanupMock.mockReset();
	cleanupMock.mockResolvedValue({ status: "success", removedCount: 2 });
	cleanupUploadsMock.mockReset();
	cleanupUploadsMock.mockResolvedValue({ status: "success", removedCount: 3 });
});

afterEach(() => vi.unstubAllEnvs());

test("runs the cleanup for the scheduler's secret", async () => {
	const response = await request("Bearer cron-secret");

	expect(response.status).toBe(200);
	expect(await response.json()).toEqual({
		status: "success",
		removedReviews: 2,
		removedUploads: 3,
	});
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

test("still sweeps uploads and reports the failure when review cleanup fails", async () => {
	cleanupMock.mockResolvedValue({ status: "failed", error: "We couldn’t clean up." });

	expect((await request("Bearer cron-secret")).status).toBe(500);
	expect(cleanupUploadsMock).toHaveBeenCalled();
});

test("reports a failed upload sweep to the scheduler", async () => {
	cleanupUploadsMock.mockResolvedValue({ status: "failed", error: "We couldn’t clean up." });

	expect((await request("Bearer cron-secret")).status).toBe(500);
});
