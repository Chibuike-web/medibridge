// @vitest-environment node
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { GET } from "./route";
import { GET as getImagingFile } from "../../imaging/[fileId]/route";

const { hasVerifiedSession, sharedRecord, signedUrl, storageFetch, rows } = vi.hoisted(() => ({
	hasVerifiedSession: vi.fn(),
	sharedRecord: vi.fn(),
	signedUrl: vi.fn(),
	storageFetch: vi.fn(),
	rows: {
		lab: [] as { name: string; type: string }[],
		imaging: [] as { name: string; type: string }[],
	},
}));
vi.mock("@/lib/api/external-access-session", () => ({
	hasVerifiedExternalAccessSession: hasVerifiedSession,
}));
vi.mock("@/lib/api/get-shared-record", () => ({ getSharedRecord: sharedRecord }));
vi.mock("@/lib/storage/client", () => ({ patientUploads: { createSignedUrl: signedUrl } }));
vi.mock("@/lib/better-auth/auth", async () => {
	const { patientImagingFile } = await import("@/db/schemas");
	return {
		db: {
			select: () => ({
				from: (table: unknown) => ({
					innerJoin: () => ({
						where: () => ({
							limit: async () => (table === patientImagingFile ? rows.imaging : rows.lab),
						}),
					}),
				}),
			}),
		},
	};
});
const request = (query = "") =>
	GET(new Request(`http://localhost/api/shared-record-files/access-1/lab/f1${query}`), {
		params: Promise.resolve({ accessId: "access-1", fileId: "f1" }),
	});

describe("shared clinical report access", () => {
	afterEach(() => vi.unstubAllGlobals());
	beforeEach(() => {
		hasVerifiedSession.mockResolvedValue(true);
		sharedRecord.mockResolvedValue({
			patientId: "patient-1",
			organizationId: "hospital-1",
			selectedRecordIds: [{ section: "lab-tests", recordId: "LAB-1" }],
		});
		rows.lab = [{ name: "Full blood count.pdf", type: "application/pdf" }];
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
	test("streams a shared report from the sharing hospital's storage", async () => {
		const response = await request();

		expect(response.status).toBe(200);
		expect(await response.text()).toBe("%PDF-1.4");
		expect(response.headers.get("Content-Disposition")).toBe(
			"inline; filename*=UTF-8''Full%20blood%20count.pdf",
		);
		expect(response.headers.get("Cache-Control")).toBe("private, no-store");
		expect(signedUrl).toHaveBeenCalledWith("hospital-1/record-files/f1.pdf", 60);
	});
	test("downloads a shared report under its saved name", async () => {
		const response = await request("?download");

		expect(response.headers.get("Content-Disposition")).toBe(
			"attachment; filename*=UTF-8''Full%20blood%20count.pdf",
		);
	});
	test("opens a shared imaging report from the imaging route", async () => {
		rows.lab = [];
		rows.imaging = [{ name: "Chest.png", type: "image/png" }];

		const response = await getImagingFile(
			new Request("http://localhost/api/shared-record-files/access-1/imaging/f1"),
			{ params: Promise.resolve({ accessId: "access-1", fileId: "f1" }) },
		);

		expect(response.status).toBe(200);
		expect(response.headers.get("Content-Type")).toBe("image/png");
		expect(signedUrl).toHaveBeenCalledWith("hospital-1/record-files/f1.png", 60);
	});
	test("refuses a report whose record the link did not share without signing access", async () => {
		expect((await request()).status).toBe(200);
		signedUrl.mockClear();
		rows.lab = [];

		expect((await request()).status).toBe(404);
		expect(signedUrl).not.toHaveBeenCalled();
	});
	test("refuses a viewer without a verified session for the link", async () => {
		hasVerifiedSession.mockResolvedValue(false);

		const response = await request();

		expect(response.status).toBe(401);
		expect(hasVerifiedSession).toHaveBeenCalledWith("access-1");
		expect(sharedRecord).not.toHaveBeenCalled();
		expect(signedUrl).not.toHaveBeenCalled();
	});
	test("refuses an expired or revoked link without signing access", async () => {
		sharedRecord.mockResolvedValue(null);

		expect((await request()).status).toBe(404);
		expect(signedUrl).not.toHaveBeenCalled();
	});
});
