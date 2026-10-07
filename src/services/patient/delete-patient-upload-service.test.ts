// @vitest-environment node

import path from "node:path";
import { beforeEach, describe, expect, test, vi } from "vitest";

const { files, getSessionDataMock, getOrganizationIdMock, unlinkMock } = vi.hoisted(() => {
	const files = new Set<string>();
	return {
		files,
		getSessionDataMock: vi.fn(),
		getOrganizationIdMock: vi.fn(),
		unlinkMock: vi.fn((file: string) => files.delete(file)),
	};
});

vi.mock("@/lib/api/get-session-data", () => ({ getSessionData: getSessionDataMock }));
vi.mock("@/lib/api/get-organization-id", () => ({ getOrganizationId: getOrganizationIdMock }));
vi.mock("node:fs", () => ({
	existsSync: (file: string) => files.has(file),
	unlinkSync: unlinkMock,
}));

import { deletePatientUploadService } from "./delete-patient-upload-service";

describe("Patient upload deletion", () => {
	beforeEach(() => {
		files.clear();
		getSessionDataMock.mockResolvedValue({ user: { id: "member-1" } });
		getOrganizationIdMock.mockResolvedValue("hospital-1");
		unlinkMock.mockImplementation((file: string) => files.delete(file));
	});

	test("an approved hospital member can delete their own upload", async () => {
		const file = `patient-uploads/hospital-1/member-1/${crypto.randomUUID()}.pdf`;
		files.add(path.resolve(file));
		expect(files.has(path.resolve(file))).toBe(true);
		expect(await deletePatientUploadService(file)).toEqual({ status: "success" });
		expect(files.has(path.resolve(file))).toBe(false);
	});

	test.each([
		"patient-uploads/hospital-1/member-2/intake.pdf",
		"patient-uploads/hospital-2/member-1/intake.pdf",
		"patient-uploads/intake.pdf",
		"private.pdf",
	])("cannot delete an existing upload outside their own folder: %s", async (file) => {
		files.add(path.resolve(file));
		expect(files.has(path.resolve(file))).toBe(true);
		expect((await deletePatientUploadService(file)).status).toBe("failed");
		expect(files.has(path.resolve(file))).toBe(true);
	});

	test("signed-out and unapproved users cannot delete an existing upload", async () => {
		const file = "patient-uploads/hospital-1/member-1/intake.pdf";
		files.add(path.resolve(file));
		getSessionDataMock.mockResolvedValue(null);
		expect((await deletePatientUploadService(file)).status).toBe("failed");
		getSessionDataMock.mockResolvedValue({ user: { id: "member-1" } });
		getOrganizationIdMock.mockResolvedValue(null);
		expect((await deletePatientUploadService(file)).status).toBe("failed");
		expect(files.has(path.resolve(file))).toBe(true);
	});

	test("storage failures return plain text without exposing internal details", async () => {
		const file = "patient-uploads/hospital-1/member-1/intake.pdf";
		files.add(path.resolve(file));
		unlinkMock.mockImplementation(() => {
			throw new Error("private storage path");
		});
		const errorLog = vi.spyOn(console, "error").mockImplementation(() => undefined);
		expect(await deletePatientUploadService(file)).toEqual({
			status: "failed",
			error: "We couldn’t delete this upload. Please try again.",
		});
		errorLog.mockRestore();
	});
});
