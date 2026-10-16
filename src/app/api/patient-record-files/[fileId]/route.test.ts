// @vitest-environment node

import path from "node:path";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { GET } from "./route";

const { getSessionDataMock, getOrganizationIdMock, database, disk } = vi.hoisted(() => ({
	getSessionDataMock: vi.fn(),
	getOrganizationIdMock: vi.fn(),
	database: {
		labTestFiles: [] as { name: string; type: string; recordId: string }[],
		imagingFiles: [] as { name: string; type: string; recordId: string }[],
	},
	disk: new Map<string, Buffer>(),
}));

vi.mock("@/lib/api/get-session-data", () => ({ getSessionData: getSessionDataMock }));
vi.mock("@/lib/api/get-organization-id", () => ({ getOrganizationId: getOrganizationIdMock }));
vi.mock("node:fs/promises", () => ({
	readFile: async (file: string) => {
		const contents = disk.get(file);
		if (!contents) throw new Error(`ENOENT: ${file}`);
		return contents;
	},
}));
vi.mock("@/lib/better-auth/auth", async () => {
	const { patientImagingFile } = await import("@/db/schemas");

	return {
		db: {
			select: () => ({
				from: (table: unknown) => ({
					innerJoin: () => ({
						innerJoin: () => ({
							where: () => ({
								limit: async () =>
									table === patientImagingFile ? database.imagingFiles : database.labTestFiles,
							}),
						}),
					}),
				}),
			}),
		},
	};
});

const recordFiles = path.resolve("patient-uploads", "hospital-1", "record-files");

function requestFile(query = "") {
	return GET(new Request(`http://localhost/api/patient-record-files/f1${query}`), {
		params: Promise.resolve({ fileId: "f1" }),
	});
}

describe("viewing a patient record file", () => {
	beforeEach(() => {
		database.labTestFiles = [
			{ name: "Full blood count – March.pdf", type: "application/pdf", recordId: "LAB-1" },
		];
		database.imagingFiles = [];
		disk.clear();
		disk.set(path.join(recordFiles, "LAB-1", "f1.pdf"), Buffer.from("%PDF-1.4 cbc"));
		getSessionDataMock.mockResolvedValue({ user: { id: "member-1", emailVerified: true } });
		getOrganizationIdMock.mockResolvedValue("hospital-1");
	});

	test("shows a lab test report inline without letting it be cached", async () => {
		const response = await requestFile();

		expect(response.status).toBe(200);
		expect(response.headers.get("Content-Type")).toBe("application/pdf");
		expect(response.headers.get("Content-Disposition")).toBe(
			"inline; filename*=UTF-8''Full%20blood%20count%20%E2%80%93%20March.pdf",
		);
		expect(response.headers.get("Cache-Control")).toBe("private, no-store");
		expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
		expect(await response.text()).toBe("%PDF-1.4 cbc");
	});

	test("downloads the report as an attachment when asked", async () => {
		const response = await requestFile("?download");

		expect(response.status).toBe(200);
		expect(response.headers.get("Content-Disposition")).toBe(
			"attachment; filename*=UTF-8''Full%20blood%20count%20%E2%80%93%20March.pdf",
		);
		expect(await response.text()).toBe("%PDF-1.4 cbc");
	});

	test("shows an imaging file when the id belongs to an imaging study", async () => {
		database.labTestFiles = [];
		database.imagingFiles = [{ name: "chest-pa.png", type: "image/png", recordId: "IMG-1" }];
		disk.set(path.join(recordFiles, "IMG-1", "f1.png"), Buffer.from("png chest film"));

		const response = await requestFile();

		expect(response.status).toBe(200);
		expect(response.headers.get("Content-Type")).toBe("image/png");
		expect(response.headers.get("Content-Disposition")).toBe(
			"inline; filename*=UTF-8''chest-pa.png",
		);
		expect(await response.text()).toBe("png chest film");
	});

	test("does not serve a file that belongs to another hospital", async () => {
		database.labTestFiles = [];

		const response = await requestFile();

		expect(response.status).toBe(404);
		expect(await response.json()).toEqual({ status: "failed", error: "File not found." });
	});

	test("does not serve a stored file whose type is not a PDF, PNG or JPG", async () => {
		database.labTestFiles = [{ name: "report.html", type: "text/html", recordId: "LAB-1" }];
		disk.set(path.join(recordFiles, "LAB-1", "f1.html"), Buffer.from("<script></script>"));

		const response = await requestFile();

		expect(response.status).toBe(404);
		expect(await response.json()).toEqual({ status: "failed", error: "File not found." });
	});

	test("returns not found when the stored file is missing from disk", async () => {
		vi.spyOn(console, "error").mockImplementation(() => {});
		disk.clear();

		const response = await requestFile();

		expect(response.status).toBe(404);
		expect(await response.json()).toEqual({ status: "failed", error: "File not found." });
	});

	test("asks a signed-out user to sign in", async () => {
		getSessionDataMock.mockResolvedValue(null);

		const response = await requestFile();

		expect(response.status).toBe(401);
		expect(await response.json()).toEqual({
			status: "failed",
			error: "Sign in to view patient files.",
		});
	});

	test.each([
		{
			scenario: "their email is unverified",
			setup: () =>
				getSessionDataMock.mockResolvedValue({ user: { id: "member-1", emailVerified: false } }),
			error: "Verify your email before you can view patient files.",
		},
		{
			scenario: "their hospital is unverified",
			setup: () => getOrganizationIdMock.mockResolvedValue(null),
			error: "Your hospital must be verified before you can view patient files.",
		},
	])("refuses the file when $scenario", async ({ setup, error }) => {
		setup();

		const response = await requestFile();

		expect(response.status).toBe(403);
		expect(await response.json()).toEqual({ status: "failed", error });
	});
});
