// @vitest-environment node
import { beforeEach, describe, expect, test, vi } from "vitest";
import { GET } from "./route";

const { session, organization, signedUrl, info, rows } = vi.hoisted(() => ({
	session: vi.fn(),
	organization: vi.fn(),
	signedUrl: vi.fn(),
	info: vi.fn(),
	rows: {
		lab: [] as { name: string; type: string; recordId: string }[],
		imaging: [] as { name: string; type: string; recordId: string }[],
	},
}));
vi.mock("@/lib/api/get-session-data", () => ({ getSessionData: session }));
vi.mock("@/lib/api/get-organization-id", () => ({ getOrganizationId: organization }));
vi.mock("@/lib/storage/client", () => ({ patientUploads: { createSignedUrl: signedUrl, info } }));
vi.mock("@/lib/better-auth/auth", async () => {
	const { patientImagingFile } = await import("@/db/schemas");
	return {
		db: {
			select: () => ({
				from: (table: unknown) => ({
					innerJoin: () => ({
						innerJoin: () => ({
							where: () => ({
								limit: async () => (table === patientImagingFile ? rows.imaging : rows.lab),
							}),
						}),
					}),
				}),
			}),
		},
	};
});
const request = (query = "") =>
	GET(new Request(`http://localhost/api/patient-record-files/f1${query}`), {
		params: Promise.resolve({ fileId: "f1" }),
	});

describe("private clinical report access", () => {
	beforeEach(() => {
		session.mockResolvedValue({ user: { id: "member-1", emailVerified: true } });
		organization.mockResolvedValue("hospital-1");
		rows.lab = [{ name: "Full blood count.pdf", type: "application/pdf", recordId: "LAB-1" }];
		rows.imaging = [];
		info.mockResolvedValue({ data: { size: 500 }, error: null });
		signedUrl.mockResolvedValue({
			data: { signedUrl: "https://storage.test/scoped-file?token=short-lived" },
			error: null,
		});
	});
	for (const download of [false, true])
		test(`authorizes a ${download ? "download" : "preview"} before granting 60-second access`, async () => {
			const response = await request(download ? "?download" : "");
			expect(response.status).toBe(302);
			expect(response.headers.get("Location")).toBe(
				"https://storage.test/scoped-file?token=short-lived",
			);
			expect(response.headers.get("Cache-Control")).toBe("private, no-store");
			expect(signedUrl).toHaveBeenCalledWith("hospital-1/record-files/f1.pdf", 60, {
				download: download ? "Full blood count.pdf" : false,
			});
		});
	test("opens a scoped imaging report", async () => {
		rows.lab = [];
		rows.imaging = [{ name: "Chest.png", type: "image/png", recordId: "IMG-1" }];
		expect((await request()).status).toBe(302);
		expect(signedUrl).toHaveBeenCalledWith("hospital-1/record-files/f1.png", 60, {
			download: false,
		});
	});
	test("denies an existing report outside the member's hospital without signing access", async () => {
		expect((await request()).status).toBe(302);
		signedUrl.mockClear();
		rows.lab = [];
		expect((await request()).status).toBe(404);
		expect(signedUrl).not.toHaveBeenCalled();
	});
	test.each([null, false])("requires a signed-in verified user: %s", async (verified) => {
		session.mockResolvedValue(
			verified === null ? null : { user: { id: "member-1", emailVerified: false } },
		);
		expect((await request()).status).toBe(verified === null ? 401 : 403);
		expect(signedUrl).not.toHaveBeenCalled();
	});
	test("requires a verified hospital", async () => {
		organization.mockResolvedValue(null);
		expect((await request()).status).toBe(403);
		expect(signedUrl).not.toHaveBeenCalled();
	});
	test("does not expose an unsupported file type", async () => {
		rows.lab[0].type = "text/html";
		expect((await request()).status).toBe(404);
		expect(signedUrl).not.toHaveBeenCalled();
	});
	test("returns not found for a missing storage object", async () => {
		info.mockResolvedValue({ data: null, error: new Error("missing") });
		expect((await request()).status).toBe(404);
		expect(signedUrl).not.toHaveBeenCalled();
	});
	test("does not expose storage provider errors", async () => {
		vi.spyOn(console, "error").mockImplementation(() => {});
		signedUrl.mockResolvedValue({ data: null, error: new Error("private credential details") });
		const response = await request();
		expect(response.status).toBe(404);
		expect(await response.json()).toEqual({ status: "failed", error: "File not found." });
	});
});
