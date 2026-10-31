// @vitest-environment node
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { GET } from "./route";

const { session, organization, signedUrl, storageFetch, rows } = vi.hoisted(() => ({
	session: vi.fn(),
	organization: vi.fn(),
	signedUrl: vi.fn(),
	storageFetch: vi.fn(),
	rows: {
		lab: [] as { name: string; type: string; recordId: string }[],
		imaging: [] as { name: string; type: string; recordId: string }[],
	},
}));
vi.mock("@/lib/api/get-session-data", () => ({ getSessionData: session }));
vi.mock("@/lib/api/get-organization-id", () => ({ getOrganizationId: organization }));
vi.mock("@/lib/storage/client", () => ({ patientUploads: { createSignedUrl: signedUrl } }));
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
const request = (query = "", headers: HeadersInit = {}) =>
	GET(new Request(`http://localhost/api/patient-record-files/f1${query}`, { headers }), {
		params: Promise.resolve({ fileId: "f1" }),
	});

describe("private clinical report access", () => {
	afterEach(() => vi.unstubAllGlobals());
	beforeEach(() => {
		session.mockResolvedValue({ user: { id: "member-1", emailVerified: true } });
		organization.mockResolvedValue("hospital-1");
		rows.lab = [{ name: "Full blood count.pdf", type: "application/pdf", recordId: "LAB-1" }];
		rows.imaging = [];
		vi.stubGlobal("fetch", storageFetch);
		storageFetch.mockReset();
		storageFetch.mockImplementation(
			async () => new Response("%PDF-1.4", { headers: { "Content-Length": "8" } }),
		);
		signedUrl.mockResolvedValue({
			data: { signedUrl: "https://storage.test/scoped-file?token=short-lived" },
			error: null,
		});
	});
	test("streams a preview through the app so the browser never sees a storage link", async () => {
		const response = await request();

		expect(response.status).toBe(200);
		expect(await response.text()).toBe("%PDF-1.4");
		expect(response.headers.get("Location")).toBeNull();
		expect(response.headers.get("Content-Type")).toBe("application/pdf");
		expect(response.headers.get("Content-Disposition")).toBe(
			"inline; filename*=UTF-8''Full%20blood%20count.pdf",
		);
		expect(response.headers.get("Cache-Control")).toBe("private, no-store");
		expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
		expect(signedUrl).toHaveBeenCalledWith("hospital-1/record-files/f1.pdf", 60);
	});
	test("downloads under the saved name, encoded once", async () => {
		rows.lab[0].name = "CBC (final).pdf";

		const response = await request("?download");

		expect(response.headers.get("Content-Disposition")).toBe(
			"attachment; filename*=UTF-8''CBC%20(final).pdf",
		);
	});
	test("serves part of a large PDF when the browser asks for a range", async () => {
		storageFetch.mockResolvedValue(
			new Response("%PDF", {
				status: 206,
				headers: { "Content-Length": "4", "Content-Range": "bytes 0-3/8" },
			}),
		);

		const response = await request("", { range: "bytes=0-3" });

		expect(response.status).toBe(206);
		expect(response.headers.get("Content-Range")).toBe("bytes 0-3/8");
		expect(storageFetch.mock.calls[0][1].headers.get("Range")).toBe("bytes=0-3");
	});
	test("opens a scoped imaging report", async () => {
		rows.lab = [];
		rows.imaging = [{ name: "Chest.png", type: "image/png", recordId: "IMG-1" }];
		const response = await request();
		expect(response.status).toBe(200);
		expect(response.headers.get("Content-Type")).toBe("image/png");
		expect(signedUrl).toHaveBeenCalledWith("hospital-1/record-files/f1.png", 60);
	});
	test("denies an existing report outside the member's hospital without signing access", async () => {
		expect((await request()).status).toBe(200);
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
		vi.spyOn(console, "error").mockImplementation(() => {});
		signedUrl.mockResolvedValue({ data: null, error: new Error("Object not found") });
		expect((await request()).status).toBe(404);
		expect(storageFetch).not.toHaveBeenCalled();
	});
	test("returns not found when storage can't serve the file", async () => {
		vi.spyOn(console, "error").mockImplementation(() => {});
		storageFetch.mockResolvedValue(new Response("private detail", { status: 400 }));
		const response = await request();
		expect(response.status).toBe(404);
		expect(await response.json()).toEqual({ status: "failed", error: "File not found." });
	});
	test("does not expose storage provider errors", async () => {
		vi.spyOn(console, "error").mockImplementation(() => {});
		signedUrl.mockResolvedValue({ data: null, error: new Error("private credential details") });
		const response = await request();
		expect(response.status).toBe(404);
		expect(await response.json()).toEqual({ status: "failed", error: "File not found." });
	});
});
