// @vitest-environment node

import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { cleanupUnreferencedUploadsService } from "./cleanup-unreferenced-uploads-service";

const { env, unreferencedFiles, removeAccreditationMock, removePatientFileMock } = vi.hoisted(
	() => ({
		env: { DATABASE_URL: "" },
		unreferencedFiles: [] as { bucket_id: string; name: string }[],
		removeAccreditationMock: vi.fn(),
		removePatientFileMock: vi.fn(),
	}),
);

vi.mock("@/lib/utils/env", () => ({ ENV: env }));
vi.mock("@/lib/better-auth/auth", () => ({
	db: { execute: async () => unreferencedFiles },
}));
vi.mock("@/lib/storage/client", () => ({
	hospitalUploads: { remove: removeAccreditationMock },
	patientUploads: { remove: removePatientFileMock },
}));

describe("cleaning up unreferenced uploads", () => {
	beforeEach(() => {
		vi.stubEnv("SUPABASE_URL", "https://projectref.supabase.co");
		env.DATABASE_URL =
			"postgresql://postgres.projectref:secret@aws-1-eu-north-1.pooler.supabase.com:5432/postgres";
		unreferencedFiles.length = 0;
		unreferencedFiles.push(
			{ bucket_id: "hospital-uploads", name: "owner-1/old.pdf" },
			{ bucket_id: "patient-uploads", name: "hospital-1/record-files/file-1.pdf" },
		);
		removeAccreditationMock.mockReset();
		removeAccreditationMock.mockResolvedValue({ data: [], error: null });
		removePatientFileMock.mockReset();
		removePatientFileMock.mockResolvedValue({ data: [], error: null });
		vi.spyOn(console, "error").mockImplementation(() => undefined);
	});

	afterEach(() => vi.unstubAllEnvs());

	test("removes each unreferenced file from its own bucket", async () => {
		expect(await cleanupUnreferencedUploadsService()).toEqual({
			status: "success",
			removedCount: 2,
		});
		expect(removeAccreditationMock).toHaveBeenCalledWith(["owner-1/old.pdf"]);
		expect(removePatientFileMock).toHaveBeenCalledWith(["hospital-1/record-files/file-1.pdf"]);
	});

	test("accepts Supabase's direct database connection", async () => {
		env.DATABASE_URL = "postgresql://postgres:secret@db.projectref.supabase.co:5432/postgres";

		expect(await cleanupUnreferencedUploadsService()).toMatchObject({ status: "success" });
	});

	test.each([
		["another project", "postgresql://postgres.other:secret@aws-1.pooler.supabase.com:5432/db"],
		["a look-alike host", "postgresql://postgres.projectref:secret@evilsupabase.com:5432/db"],
		["a local database", "postgresql://postgres:secret@localhost:5432/medibridge"],
	])("deletes nothing when the database is %s", async (_label, databaseUrl) => {
		env.DATABASE_URL = databaseUrl;

		expect(await cleanupUnreferencedUploadsService()).toMatchObject({ status: "failed" });
		expect(removeAccreditationMock).not.toHaveBeenCalled();
		expect(removePatientFileMock).not.toHaveBeenCalled();
	});

	test("reports a storage failure", async () => {
		removePatientFileMock.mockResolvedValue({ data: null, error: new Error("Private detail") });

		expect(await cleanupUnreferencedUploadsService()).toEqual({
			status: "failed",
			error: "We couldn’t clean up unreferenced uploads.",
		});
	});
});
