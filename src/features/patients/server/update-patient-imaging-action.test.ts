// @vitest-environment node

import path from "node:path";
import type { SQL } from "drizzle-orm";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { updatePatientImagingAction } from "./update-patient-imaging-action";

const { getSessionDataMock, getOrganizationIdMock, updateTagMock, database, disk } = vi.hoisted(
	() => ({
		getSessionDataMock: vi.fn(),
		getOrganizationIdMock: vi.fn(),
		updateTagMock: vi.fn(),
		database: {
			imaging: [] as Record<string, unknown>[],
			files: [] as Record<string, unknown>[],
			updates: [] as Record<string, unknown>[],
			history: [] as Record<string, unknown>[],
			failWrites: false,
		},
		disk: { files: new Map<string, Buffer>(), writes: [] as string[] },
	}),
);

vi.mock("@/lib/api/get-session-data", () => ({ getSessionData: getSessionDataMock }));
vi.mock("@/lib/api/get-organization-id", () => ({ getOrganizationId: getOrganizationIdMock }));
vi.mock("next/cache", () => ({ updateTag: updateTagMock }));
vi.mock("node:fs/promises", async () => {
	const { sep } = await import("node:path");

	return {
		mkdir: async () => {},
		writeFile: async (file: string, contents: Buffer) => {
			disk.files.set(file, contents);
			disk.writes.push(file);
		},
		rm: async (target: string, options: { recursive?: boolean }) => {
			for (const file of disk.files.keys())
				if (file === target || (options.recursive && file.startsWith(`${target}${sep}`)))
					disk.files.delete(file);
		},
	};
});
vi.mock("@/lib/better-auth/auth", async () => {
	const { PgDialect } = await import("drizzle-orm/pg-core");
	const { patientImagingFile } = await import("@/db/schemas");

	return {
		db: {
			select: () => ({
				from: () => ({
					innerJoin: () => ({ where: () => ({ limit: async () => database.imaging }) }),
					where: async () => database.files,
				}),
			}),
			transaction: async (write: (tx: object) => Promise<void>) => {
				if (database.failWrites) throw new Error("connection lost");

				await write({
					update: () => ({
						set: (values: Record<string, unknown>) => ({
							where: async () => {
								database.updates.push(values);
							},
						}),
					}),
					delete: () => ({
						where: async (condition: SQL) => {
							const { params } = new PgDialect().sqlToQuery(condition);
							database.files = database.files.filter((file) => !params.includes(file.id));
						},
					}),
					insert: (table: unknown) => ({
						values: async (rows: Record<string, unknown>[]) => {
							(table === patientImagingFile ? database.files : database.history).push(...rows);
						},
					}),
				});
			},
		},
	};
});

const imagingFolder = path.resolve("patient-uploads", "hospital-1", "record-files", "IMG-1");
const savedFrontalPath = path.join(imagingFolder, "file-frontal.png");
const savedLateralPath = path.join(imagingFolder, "file-lateral.jpg");
const savedImaging = {
	patientId: "patient-1",
	study: "Chest X-ray",
	region: "Chest",
	modality: "X-ray",
	orderedAt: new Date("2026-02-20"),
	orderedBy: "Dr. Ada Obi",
	status: "Pending",
	impression: null,
	clinicalNote: "Persistent cough.",
};
const savedFiles = [
	{ id: "file-frontal", parentRecordId: "IMG-1", name: "chest-pa.png", type: "image/png" },
	{ id: "file-lateral", parentRecordId: "IMG-1", name: "chest-lateral.jpg", type: "image/jpeg" },
];
const completedStudy = { status: "Completed", impression: "No focal consolidation." };
const ctReport = new File(["%PDF-1.4 chest ct"], "chest-ct.pdf", { type: "application/pdf" });

function imagingForm(
	overrides: Record<string, string> = {},
	files: File[] = [],
	removedFileIds: string[] = [],
) {
	const formData = new FormData();
	for (const [field, value] of Object.entries({
		study: "Chest X-ray",
		region: "Chest",
		modality: "X-ray",
		orderedAt: "2026-02-20",
		orderedBy: "Dr. Ada Obi",
		status: "Pending",
		impression: "",
		clinicalNote: "Persistent cough.",
		...overrides,
	}))
		formData.set(field, value);
	for (const file of files) formData.append("files", file);
	for (const fileId of removedFileIds) formData.append("removedFileIds", fileId);
	return formData;
}

describe("editing a patient imaging study", () => {
	beforeEach(() => {
		vi.useFakeTimers({ now: new Date("2026-10-15T10:00:00Z"), toFake: ["Date"] });
		database.imaging = [savedImaging];
		database.files = savedFiles.map((file) => ({ ...file }));
		database.updates = [];
		database.history = [];
		database.failWrites = false;
		disk.files.clear();
		disk.files.set(savedFrontalPath, Buffer.from("frontal film"));
		disk.files.set(savedLateralPath, Buffer.from("lateral film"));
		disk.writes = [];
		getSessionDataMock.mockResolvedValue({
			user: { id: "member-1", name: "Ada Obi", emailVerified: true },
		});
		getOrganizationIdMock.mockResolvedValue("hospital-1");
	});

	test("saves the changes and records each changed field once, with its old and new value", async () => {
		const result = await updatePatientImagingAction(
			"IMG-1",
			imagingForm({ ...completedStudy, modality: "CT", orderedAt: "2026-03-01" }),
		);

		expect(result).toEqual({ status: "success" });
		expect(database.updates).toEqual([
			expect.objectContaining({
				study: "Chest X-ray",
				modality: "CT",
				status: "Completed",
				impression: "No focal consolidation.",
				orderedAt: new Date("2026-03-01"),
				updatedBy: "Ada Obi",
			}),
		]);
		expect(database.history).toHaveLength(4);
		expect(database.history).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					imagingId: "IMG-1",
					fieldName: "modality",
					oldValue: "X-ray",
					newValue: "CT",
					updatedBy: "Ada Obi",
				}),
				expect.objectContaining({
					imagingId: "IMG-1",
					fieldName: "ordered_at",
					oldValue: "20th February 2026",
					newValue: "1st March 2026",
					updatedBy: "Ada Obi",
				}),
				expect.objectContaining({
					imagingId: "IMG-1",
					fieldName: "status",
					oldValue: "Pending",
					newValue: "Completed",
					updatedBy: "Ada Obi",
				}),
				expect.objectContaining({
					imagingId: "IMG-1",
					fieldName: "impression",
					oldValue: null,
					newValue: "No focal consolidation.",
					updatedBy: "Ada Obi",
				}),
			]),
		);
		expect(database.files).toEqual(savedFiles);
		expect(updateTagMock).toHaveBeenCalledWith("patient-imaging-hospital-1-patient-1");
	});

	test("replacing an image records one files change, deletes the removed image and stores the new one", async () => {
		const result = await updatePatientImagingAction(
			"IMG-1",
			imagingForm({}, [ctReport], ["file-lateral"]),
		);

		expect(result).toEqual({ status: "success" });
		const addedFile = database.files.find((file) => file.name === "chest-ct.pdf");
		const addedFileId = String(addedFile?.id);
		expect(database.files).toEqual([
			savedFiles[0],
			{
				id: addedFileId,
				parentRecordId: "IMG-1",
				name: "chest-ct.pdf",
				url: `/api/patient-record-files/${addedFileId}`,
				type: "application/pdf",
				size: "1 KB",
				uploadedBy: "Ada Obi",
			},
		]);
		expect(database.history).toEqual([
			expect.objectContaining({
				imagingId: "IMG-1",
				fieldName: "files",
				oldValue: "chest-pa.png, chest-lateral.jpg",
				newValue: "chest-pa.png, chest-ct.pdf",
				updatedBy: "Ada Obi",
			}),
		]);
		expect(database.updates).toEqual([expect.objectContaining({ updatedBy: "Ada Obi" })]);
		expect(new Set(disk.files.keys())).toEqual(
			new Set([savedFrontalPath, path.join(imagingFolder, `${addedFileId}.pdf`)]),
		);
		expect(disk.files.get(path.join(imagingFolder, `${addedFileId}.pdf`))?.toString()).toBe(
			"%PDF-1.4 chest ct",
		);
		expect(updateTagMock).toHaveBeenCalledWith("patient-imaging-hospital-1-patient-1");
	});

	test("a completed study can have all of its images removed", async () => {
		database.imaging = [{ ...savedImaging, ...completedStudy }];

		expect(
			await updatePatientImagingAction(
				"IMG-1",
				imagingForm(completedStudy, [], ["file-frontal", "file-lateral"]),
			),
		).toEqual({ status: "success" });
		expect(database.files).toEqual([]);
		expect(database.history).toEqual([
			expect.objectContaining({
				fieldName: "files",
				oldValue: "chest-pa.png, chest-lateral.jpg",
				newValue: null,
			}),
		]);
		expect(disk.files.size).toBe(0);
	});

	test("a completed study without an impression is rejected without saving", async () => {
		expect(
			await updatePatientImagingAction(
				"IMG-1",
				imagingForm({ ...completedStudy, impression: " " }, [ctReport]),
			),
		).toEqual({ status: "failed", error: "Enter the impression of a completed study." });
		expect(database.updates).toEqual([]);
		expect(disk.writes).toEqual([]);
	});

	test("saving without any change writes nothing to the record, its images or its history", async () => {
		expect(await updatePatientImagingAction("IMG-1", imagingForm())).toEqual({
			status: "success",
		});
		expect(database.updates).toEqual([]);
		expect(database.history).toEqual([]);
		expect(database.files).toEqual(savedFiles);
		expect(disk.writes).toEqual([]);
		expect(updateTagMock).not.toHaveBeenCalled();
	});

	test("asks a signed-out user to sign in again without saving", async () => {
		getSessionDataMock.mockResolvedValue(null);

		expect(
			await updatePatientImagingAction("IMG-1", imagingForm(completedStudy, [ctReport])),
		).toEqual({ status: "unauthorized", error: "You must be signed in to edit imaging." });
		expect(database.updates).toEqual([]);
		expect(disk.writes).toEqual([]);
	});

	test("cannot edit a study that belongs to another hospital", async () => {
		database.imaging = [];

		expect(
			await updatePatientImagingAction(
				"IMG-1",
				imagingForm(completedStudy, [ctReport], ["file-lateral"]),
			),
		).toEqual({ status: "failed", error: "Imaging study could not be found." });
		expect(database.updates).toEqual([]);
		expect(database.files).toEqual(savedFiles);
		expect(disk.writes).toEqual([]);
	});

	test("keeps the saved images, removes only the new one and shows a plain message when the save fails", async () => {
		database.failWrites = true;
		vi.spyOn(console, "error").mockImplementation(() => {});

		expect(
			await updatePatientImagingAction(
				"IMG-1",
				imagingForm(completedStudy, [ctReport], ["file-lateral"]),
			),
		).toEqual({ status: "failed", error: "We couldn’t save these changes. Please try again." });
		expect(disk.writes).toEqual([expect.stringContaining(imagingFolder)]);
		expect(new Set(disk.files.keys())).toEqual(new Set([savedFrontalPath, savedLateralPath]));
		expect(database.files).toEqual(savedFiles);
		expect(updateTagMock).not.toHaveBeenCalled();
	});
});
