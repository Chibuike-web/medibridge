// @vitest-environment node

import path from "node:path";
import type { SQL } from "drizzle-orm";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { updatePatientLabTestAction } from "./update-patient-lab-test-action";

const { getSessionDataMock, getOrganizationIdMock, updateTagMock, database, disk } = vi.hoisted(
	() => ({
		getSessionDataMock: vi.fn(),
		getOrganizationIdMock: vi.fn(),
		updateTagMock: vi.fn(),
		database: {
			labTests: [] as Record<string, unknown>[],
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
	const { patientLabTestFile } = await import("@/db/schemas");

	return {
		db: {
			select: () => ({
				from: () => ({
					innerJoin: () => ({ where: () => ({ limit: async () => database.labTests }) }),
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
							(table === patientLabTestFile ? database.files : database.history).push(...rows);
						},
					}),
				});
			},
		},
	};
});

const labTestFolder = path.resolve("patient-uploads", "hospital-1", "record-files", "LAB-1");
const savedCbcPath = path.join(labTestFolder, "file-cbc.pdf");
const savedFilmPath = path.join(labTestFolder, "file-film.png");
const savedLabTest = {
	patientId: "patient-1",
	updatedAt: new Date("2026-10-14T09:00:00.000Z"),
	testName: "Full blood count",
	status: "Pending",
	flag: null,
	referenceRange: "Hb 12.0–15.5 g/dL",
	orderedBy: "Dr. Ada Obi",
	orderedAt: new Date("2026-02-20"),
	specimen: "Venous blood",
	result: null,
	interpretation: null,
	clinicalNote: "Fasting sample.",
};
const savedFiles = [
	{ id: "file-cbc", parentRecordId: "LAB-1", name: "cbc-march.pdf", type: "application/pdf" },
	{ id: "file-film", parentRecordId: "LAB-1", name: "blood-film.png", type: "image/png" },
];
const completedLabTest = { status: "Completed", result: "Hb 9.8 g/dL", flag: "Low" };
const repeatCbc = new File(["%PDF-1.4 repeat cbc"], "cbc-repeat.pdf", { type: "application/pdf" });

function labTestForm(
	overrides: Record<string, string> = {},
	files: File[] = [],
	removedFileIds: string[] = [],
) {
	const formData = new FormData();
	for (const [field, value] of Object.entries({
		testName: "Full blood count",
		status: "Pending",
		flag: "",
		referenceRange: "Hb 12.0–15.5 g/dL",
		orderedBy: "Dr. Ada Obi",
		orderedAt: "2026-02-20",
		specimen: "Venous blood",
		result: "",
		interpretation: "",
		clinicalNote: "Fasting sample.",
		updatedAt: "2026-10-14T09:00:00.000Z",
		...overrides,
	}))
		formData.set(field, value);
	for (const file of files) formData.append("files", file);
	for (const fileId of removedFileIds) formData.append("removedFileIds", fileId);
	return formData;
}

describe("editing a patient lab test", () => {
	beforeEach(() => {
		vi.useFakeTimers({ now: new Date("2026-10-15T10:00:00Z"), toFake: ["Date"] });
		database.labTests = [savedLabTest];
		database.files = savedFiles.map((file) => ({ ...file }));
		database.updates = [];
		database.history = [];
		database.failWrites = false;
		disk.files.clear();
		disk.files.set(savedCbcPath, Buffer.from("%PDF-1.4 march cbc"));
		disk.files.set(savedFilmPath, Buffer.from("blood film"));
		disk.writes = [];
		getSessionDataMock.mockResolvedValue({
			user: { id: "member-1", name: "Ada Obi", emailVerified: true },
		});
		getOrganizationIdMock.mockResolvedValue("hospital-1");
	});

	test("saves the changes and records each changed field once, with its old and new value", async () => {
		const result = await updatePatientLabTestAction(
			"LAB-1",
			labTestForm({ ...completedLabTest, orderedAt: "2026-03-01" }),
		);

		expect(result).toEqual({ status: "success" });
		expect(database.updates).toEqual([
			expect.objectContaining({
				testName: "Full blood count",
				status: "Completed",
				result: "Hb 9.8 g/dL",
				flag: "Low",
				orderedAt: new Date("2026-03-01"),
				updatedBy: "Ada Obi",
			}),
		]);
		expect(database.history).toHaveLength(4);
		expect(database.history).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					labTestId: "LAB-1",
					fieldName: "status",
					oldValue: "Pending",
					newValue: "Completed",
					updatedBy: "Ada Obi",
				}),
				expect.objectContaining({
					labTestId: "LAB-1",
					fieldName: "ordered_at",
					oldValue: "20th February 2026",
					newValue: "1st March 2026",
					updatedBy: "Ada Obi",
				}),
				expect.objectContaining({
					labTestId: "LAB-1",
					fieldName: "flag",
					oldValue: null,
					newValue: "Low",
					updatedBy: "Ada Obi",
				}),
				expect.objectContaining({
					labTestId: "LAB-1",
					fieldName: "result",
					oldValue: null,
					newValue: "Hb 9.8 g/dL",
					updatedBy: "Ada Obi",
				}),
			]),
		);
		expect(database.files).toEqual(savedFiles);
		expect(updateTagMock).toHaveBeenCalledWith("patient-lab-tests-hospital-1-patient-1");
	});

	test("replacing a report records one files change, deletes the removed report and stores the new one", async () => {
		const result = await updatePatientLabTestAction(
			"LAB-1",
			labTestForm({}, [repeatCbc], ["file-film"]),
		);

		expect(result).toEqual({ status: "success" });
		const addedFile = database.files.find((file) => file.name === "cbc-repeat.pdf");
		const addedFileId = String(addedFile?.id);
		expect(database.files).toEqual([
			savedFiles[0],
			{
				id: addedFileId,
				parentRecordId: "LAB-1",
				name: "cbc-repeat.pdf",
				url: `/api/patient-record-files/${addedFileId}`,
				type: "application/pdf",
				size: "1 KB",
				uploadedBy: "Ada Obi",
			},
		]);
		expect(database.history).toEqual([
			expect.objectContaining({
				labTestId: "LAB-1",
				fieldName: "files",
				oldValue: "cbc-march.pdf, blood-film.png",
				newValue: "cbc-march.pdf, cbc-repeat.pdf",
				updatedBy: "Ada Obi",
			}),
		]);
		expect(database.updates).toEqual([expect.objectContaining({ updatedBy: "Ada Obi" })]);
		expect(new Set(disk.files.keys())).toEqual(
			new Set([savedCbcPath, path.join(labTestFolder, `${addedFileId}.pdf`)]),
		);
		expect(disk.files.get(path.join(labTestFolder, `${addedFileId}.pdf`))?.toString()).toBe(
			"%PDF-1.4 repeat cbc",
		);
		expect(updateTagMock).toHaveBeenCalledWith("patient-lab-tests-hospital-1-patient-1");
	});

	test("a completed lab test cannot be left without a report", async () => {
		database.labTests = [{ ...savedLabTest, ...completedLabTest }];

		expect(
			await updatePatientLabTestAction(
				"LAB-1",
				labTestForm(completedLabTest, [], ["file-cbc", "file-film"]),
			),
		).toEqual({ status: "failed", error: "Attach the report for a completed lab test." });
		expect(database.files).toEqual(savedFiles);
		expect(database.updates).toEqual([]);
		expect(new Set(disk.files.keys())).toEqual(new Set([savedCbcPath, savedFilmPath]));
	});

	test("saving without any change writes nothing to the record, its files or its history", async () => {
		expect(await updatePatientLabTestAction("LAB-1", labTestForm())).toEqual({
			status: "success",
		});
		expect(database.updates).toEqual([]);
		expect(database.history).toEqual([]);
		expect(database.files).toEqual(savedFiles);
		expect(disk.writes).toEqual([]);
		expect(updateTagMock).not.toHaveBeenCalled();
	});

	test("ignores a request to remove a file that is not attached to this lab test", async () => {
		expect(
			await updatePatientLabTestAction("LAB-1", labTestForm({}, [], ["file-from-another-test"])),
		).toEqual({ status: "success" });
		expect(database.files).toEqual(savedFiles);
		expect(database.history).toEqual([]);
		expect(new Set(disk.files.keys())).toEqual(new Set([savedCbcPath, savedFilmPath]));
	});

	test("asks a signed-out user to sign in again without saving", async () => {
		getSessionDataMock.mockResolvedValue(null);

		expect(
			await updatePatientLabTestAction("LAB-1", labTestForm(completedLabTest, [repeatCbc])),
		).toEqual({ status: "unauthorized", error: "You must be signed in to edit lab tests." });
		expect(database.updates).toEqual([]);
		expect(disk.writes).toEqual([]);
	});

	test("cannot edit a lab test that belongs to another hospital", async () => {
		database.labTests = [];

		expect(
			await updatePatientLabTestAction(
				"LAB-1",
				labTestForm(completedLabTest, [repeatCbc], ["file-film"]),
			),
		).toEqual({ status: "failed", error: "Lab test could not be found." });
		expect(database.updates).toEqual([]);
		expect(database.files).toEqual(savedFiles);
		expect(disk.writes).toEqual([]);
	});

	test("keeps the saved reports, removes only the new one and shows a plain message when the save fails", async () => {
		database.failWrites = true;
		vi.spyOn(console, "error").mockImplementation(() => {});

		expect(
			await updatePatientLabTestAction(
				"LAB-1",
				labTestForm(completedLabTest, [repeatCbc], ["file-film"]),
			),
		).toEqual({ status: "failed", error: "We couldn’t save these changes. Please try again." });
		expect(disk.writes).toEqual([expect.stringContaining(labTestFolder)]);
		expect(new Set(disk.files.keys())).toEqual(new Set([savedCbcPath, savedFilmPath]));
		expect(database.files).toEqual(savedFiles);
		expect(updateTagMock).not.toHaveBeenCalled();
	});
	test("refuses to save over changes made after the form was opened", async () => {
		const result = await updatePatientLabTestAction(
			"LAB-1",
			labTestForm({
				updatedAt: "2026-10-13T09:00:00.000Z",
				clinicalNote: "Changed in an old tab.",
			}),
		);

		expect(result).toEqual({
			status: "failed",
			error:
				"This lab test was changed after you opened it. Close it and open it again to see the latest version.",
		});
		expect(database.updates).toEqual([]);
		expect(database.history).toEqual([]);
	});
});
