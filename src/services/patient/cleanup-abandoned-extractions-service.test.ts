// @vitest-environment node

import { beforeEach, describe, expect, test, vi } from "vitest";
import { cleanupAbandonedExtractionsService } from "./cleanup-abandoned-extractions-service";

const { rows, removeMock, revalidateTagMock } = vi.hoisted(() => ({
	rows: new Map<
		string,
		{ organizationId: string; createdBy: string; extractedData: { documentId: string }[] }
	>(),
	removeMock: vi.fn(),
	revalidateTagMock: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidateTag: revalidateTagMock }));
vi.mock("@/lib/storage/client", () => ({ patientUploads: { remove: removeMock } }));
vi.mock("drizzle-orm", async (importOriginal) => ({
	...(await importOriginal<typeof import("drizzle-orm")>()),
	eq: (_column: unknown, id: string) => id,
}));
vi.mock("@/lib/better-auth/auth", () => ({
	db: {
		select: () => ({
			from: () => ({ where: async () => [...rows.keys()].map((id) => ({ id })) }),
		}),
		transaction: async (remove: (tx: unknown) => Promise<unknown>) =>
			remove({
				select: () => ({
					from: () => ({
						where: (id: string) => ({
							for: async () => (rows.has(id) ? [rows.get(id)] : []),
						}),
					}),
				}),
				delete: () => ({ where: async (id: string) => rows.delete(id) }),
			}),
	},
}));

describe("cleaning up abandoned patient reviews", () => {
	beforeEach(() => {
		rows.clear();
		vi.clearAllMocks();
		removeMock.mockResolvedValue({ data: [], error: null });
		rows.set("extraction-1", {
			organizationId: "hospital-1",
			createdBy: "member-1",
			extractedData: [{ documentId: "a.pdf" }, { documentId: "b.pdf" }],
		});
	});

	test("removes the review, its files and its cached copy", async () => {
		expect(await cleanupAbandonedExtractionsService()).toEqual({
			status: "success",
			removedCount: 1,
		});
		expect(rows.size).toBe(0);
		expect(removeMock).toHaveBeenCalledWith([
			"hospital-1/member-1/a.pdf",
			"hospital-1/member-1/b.pdf",
		]);
		expect(revalidateTagMock).toHaveBeenCalledWith("patient-extraction-hospital-1-extraction-1", {
			expire: 0,
		});
	});

	test("never builds a storage key outside the uploader's folder", async () => {
		rows.get("extraction-1")!.extractedData = [{ documentId: "../member-2/a.pdf" }];

		await cleanupAbandonedExtractionsService();

		expect(removeMock).not.toHaveBeenCalled();
	});

	test("still removes the review when a file can't be deleted", async () => {
		const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
		removeMock.mockResolvedValue({ data: null, error: new Error("Private storage detail") });

		expect(await cleanupAbandonedExtractionsService()).toEqual({
			status: "success",
			removedCount: 1,
		});
		expect(rows.size).toBe(0);
		expect(consoleError).toHaveBeenCalled();
	});
});
