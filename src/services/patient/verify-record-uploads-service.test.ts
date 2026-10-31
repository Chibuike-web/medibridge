// @vitest-environment node

import { SignJWT } from "jose";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { verifyRecordUploadsService } from "./verify-record-uploads-service";

const { storedObjects, savedFileIds } = vi.hoisted(() => ({
	storedObjects: new Map<string, { size: number; contentType: string }>(),
	savedFileIds: [] as string[],
}));

vi.mock("@/lib/utils/env", () => ({ ENV: { BETTER_AUTH_SECRET: "storage-test-secret" } }));
vi.mock("@/lib/storage/client", () => ({
	patientUploads: {
		info: async (key: string) => {
			const object = storedObjects.get(key);
			return object
				? { data: object, error: null }
				: { data: null, error: new Error("Object not found") };
		},
	},
}));
vi.mock("@/lib/better-auth/auth", () => ({
	db: {
		select: () => ({
			from: () => ({
				where: async () => savedFileIds.map((id) => ({ id })),
			}),
		}),
	},
}));

const expected = {
	organizationId: "hospital-1",
	userId: "member-1",
	patientId: "patient-1",
	recordType: "lab" as const,
};

function createFile(overrides: Record<string, unknown> = {}) {
	return {
		id: crypto.randomUUID(),
		name: "cbc.pdf",
		type: "application/pdf",
		size: 100,
		patientId: "patient-1",
		organizationId: "hospital-1",
		userId: "member-1",
		recordType: "lab",
		...overrides,
	};
}

function signReceipt(file: Record<string, unknown>, secret = "storage-test-secret") {
	return new SignJWT(file)
		.setProtectedHeader({ alg: "HS256" })
		.setAudience("patient-record-upload")
		.setExpirationTime("2h")
		.sign(new TextEncoder().encode(secret));
}

function storeFile(file: ReturnType<typeof createFile>) {
	storedObjects.set(`hospital-1/record-files/${file.id}.pdf`, {
		size: file.size as number,
		contentType: file.type as string,
	});
}

describe("verifying report upload receipts", () => {
	beforeEach(() => {
		storedObjects.clear();
		savedFileIds.length = 0;
		vi.spyOn(console, "error").mockImplementation(() => undefined);
	});

	test("accepts a report the member uploaded for this patient", async () => {
		const file = createFile();
		storeFile(file);

		const result = await verifyRecordUploadsService([await signReceipt(file)], expected);

		expect(result).toEqual({
			status: "success",
			files: [expect.objectContaining({ id: file.id })],
		});
	});

	test("rejects a receipt signed with another secret", async () => {
		const file = createFile();
		storeFile(file);

		const result = await verifyRecordUploadsService([await signReceipt(file, "forged")], expected);

		expect(result).toEqual({
			status: "failed",
			error: "We couldn’t verify these uploads. Upload the reports again.",
		});
	});

	test.each([
		{ organizationId: "hospital-2" },
		{ userId: "member-2" },
		{ patientId: "patient-2" },
		{ recordType: "imaging" },
	])("rejects a receipt issued for different details: %o", async (overrides) => {
		const file = createFile(overrides);
		storeFile(file);

		const result = await verifyRecordUploadsService([await signReceipt(file)], expected);

		expect(result).toEqual({
			status: "failed",
			error: "This report does not belong to this patient.",
		});
	});

	test.each([
		["size", { size: 99, contentType: "application/pdf" }],
		["type", { size: 100, contentType: "text/html" }],
	])("rejects a stored file with a different %s", async (_field, stored) => {
		const file = createFile();
		storedObjects.set(`hospital-1/record-files/${file.id}.pdf`, stored);

		const result = await verifyRecordUploadsService([await signReceipt(file)], expected);

		expect(result).toEqual({
			status: "failed",
			error: "Upload the complete report before saving.",
		});
	});

	test("rejects a report that never finished uploading", async () => {
		const result = await verifyRecordUploadsService([await signReceipt(createFile())], expected);

		expect(result).toEqual({
			status: "failed",
			error: "Upload the complete report before saving.",
		});
	});

	test("does not accept a receipt for a report already saved on a record", async () => {
		const file = createFile();
		storeFile(file);
		savedFileIds.push(file.id);

		const result = await verifyRecordUploadsService([await signReceipt(file)], expected);

		expect(result).toEqual({
			status: "failed",
			error: "This report was already saved. Upload it again.",
		});
	});

	test("does not accept the same receipt twice in one save", async () => {
		const file = createFile();
		storeFile(file);
		const receipt = await signReceipt(file);

		const result = await verifyRecordUploadsService([receipt, receipt], expected);

		expect(result).toEqual({ status: "failed", error: "Each report can only be attached once." });
	});

	test("rejects reports that add up to more than 100 MB", async () => {
		const files = [
			createFile({ size: 50 * 1024 * 1024 }),
			createFile({ size: 50 * 1024 * 1024 }),
			createFile({ size: 1 }),
		];
		files.forEach(storeFile);

		const result = await verifyRecordUploadsService(
			await Promise.all(files.map((file) => signReceipt(file))),
			expected,
		);

		expect(result).toEqual({ status: "failed", error: "Files can add up to 100 MB per save." });
	});

	test("rejects a file sent in place of a receipt", async () => {
		const result = await verifyRecordUploadsService([new File(["report"], "cbc.pdf")], expected);

		expect(result).toEqual({ status: "failed", error: "Upload each report before saving." });
	});
});
