// @vitest-environment node

import path from "node:path";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { createPatientLabTestAction } from "./create-patient-lab-test-action";

const { getSessionDataMock, getOrganizationIdMock, updateTagMock, database, disk } = vi.hoisted(
	() => ({
		getSessionDataMock: vi.fn(),
		getOrganizationIdMock: vi.fn(),
		updateTagMock: vi.fn(),
		database: {
			patients: [] as { id: string }[],
			encounters: [] as { id: string }[],
			labTests: [] as Record<string, unknown>[],
			files: [] as Record<string, unknown>[],
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
	const { patientEncounter, patientLabTestFile } = await import("@/db/schemas");

	return {
		db: {
			select: () => ({
				from: (table: unknown) => ({
					where: () => ({
						limit: async () =>
							table === patientEncounter ? database.encounters : database.patients,
					}),
				}),
			}),
			transaction: async (write: (tx: object) => Promise<void>) => {
				if (database.failWrites) throw new Error("connection lost");

				await write({
					insert: (table: unknown) => ({
						values: async (rows: Record<string, unknown> | Record<string, unknown>[]) => {
							(table === patientLabTestFile ? database.files : database.labTests).push(
								...[rows].flat(),
							);
						},
					}),
				});
			},
		},
	};
});

const labTestFolders = path.resolve("patient-uploads", "hospital-1", "record-files");
const cbcReport = new File(["%PDF-1.4 full blood count"], "cbc-report.pdf", {
	type: "application/pdf",
});
const completedLabTest = { status: "Completed", result: "Hb 9.8 g/dL", flag: "Low" };

function labTestForm(overrides: Record<string, string> = {}, files: File[] = []) {
	const formData = new FormData();
	for (const [field, value] of Object.entries({
		testName: "Full blood count",
		status: "Pending",
		flag: "",
		referenceRange: "",
		orderedBy: "Dr. Ada Obi",
		orderedAt: "2026-10-14",
		specimen: "Venous blood",
		result: "",
		interpretation: "",
		clinicalNote: "",
		...overrides,
	}))
		formData.set(field, value);
	for (const file of files) formData.append("files", file);
	return formData;
}

describe("adding a patient lab test", () => {
	beforeEach(() => {
		vi.useFakeTimers({ now: new Date("2026-10-15T10:00:00Z"), toFake: ["Date"] });
		database.patients = [{ id: "patient-1" }];
		database.encounters = [{ id: "ENC-1" }];
		database.labTests = [];
		database.files = [];
		database.failWrites = false;
		disk.files.clear();
		disk.writes = [];
		getSessionDataMock.mockResolvedValue({
			user: { id: "member-1", name: "Ada Obi", emailVerified: true },
		});
		getOrganizationIdMock.mockResolvedValue("hospital-1");
	});

	test("a verified hospital member can order a pending lab test without a report", async () => {
		const result = await createPatientLabTestAction("patient-1", labTestForm());

		expect(result).toEqual({ status: "success", labTestId: expect.stringMatching(/^LAB-/) });
		expect(database.labTests).toEqual([
			{
				id: result.status === "success" ? result.labTestId : "",
				patientId: "patient-1",
				encounterId: null,
				testName: "Full blood count",
				status: "Pending",
				flag: null,
				referenceRange: null,
				orderedBy: "Dr. Ada Obi",
				orderedAt: new Date("2026-10-14"),
				specimen: "Venous blood",
				result: null,
				interpretation: null,
				clinicalNote: null,
				createdBy: "Ada Obi",
				updatedBy: "Ada Obi",
			},
		]);
		expect(database.files).toEqual([]);
		expect(disk.files.size).toBe(0);
		expect(updateTagMock).toHaveBeenCalledWith("patient-lab-tests-hospital-1-patient-1");
	});

	test("links the lab test to the patient's encounter it was ordered from", async () => {
		await createPatientLabTestAction("patient-1", labTestForm({ encounterId: "ENC-1" }));

		expect(database.labTests).toEqual([expect.objectContaining({ encounterId: "ENC-1" })]);
	});

	test("stores each attached report in the lab test's folder and lists it with a viewer link", async () => {
		const bloodFilm = new File([new Uint8Array(1.5 * 1024 * 1024)], "blood-film.jpg", {
			type: "image/jpeg",
		});

		const result = await createPatientLabTestAction(
			"patient-1",
			labTestForm(completedLabTest, [cbcReport, bloodFilm]),
		);

		expect(result).toEqual({ status: "success", labTestId: expect.stringMatching(/^LAB-/) });
		const labTestId = result.status === "success" ? result.labTestId : "";
		const [savedReport, savedFilm] = database.files as { id: string }[];
		expect(database.labTests).toEqual([
			expect.objectContaining({
				id: labTestId,
				status: "Completed",
				result: "Hb 9.8 g/dL",
				flag: "Low",
			}),
		]);
		expect(database.files).toEqual([
			{
				id: savedReport.id,
				parentRecordId: labTestId,
				name: "cbc-report.pdf",
				url: `/api/patient-record-files/${savedReport.id}`,
				type: "application/pdf",
				size: "1 KB",
				uploadedBy: "Ada Obi",
			},
			{
				id: savedFilm.id,
				parentRecordId: labTestId,
				name: "blood-film.jpg",
				url: `/api/patient-record-files/${savedFilm.id}`,
				type: "image/jpeg",
				size: "1.5 MB",
				uploadedBy: "Ada Obi",
			},
		]);
		expect(disk.files.size).toBe(2);
		expect(
			disk.files.get(path.join(labTestFolders, labTestId, `${savedReport.id}.pdf`))?.toString(),
		).toBe("%PDF-1.4 full blood count");
		expect(
			disk.files.get(path.join(labTestFolders, labTestId, `${savedFilm.id}.jpg`)),
		).toHaveLength(1.5 * 1024 * 1024);
	});

	test.each([
		{
			missing: "result",
			overrides: { ...completedLabTest, result: "  " },
			files: [cbcReport],
			error: "Enter the result of a completed lab test.",
		},
		{
			missing: "flag",
			overrides: { ...completedLabTest, flag: "" },
			files: [cbcReport],
			error: "Select a flag for a completed lab test.",
		},
		{
			missing: "report",
			overrides: completedLabTest,
			files: [],
			error: "Attach the report for a completed lab test.",
		},
	])(
		"a completed lab test without its $missing is rejected without saving or storing files",
		async ({ overrides, files, error }) => {
			expect(await createPatientLabTestAction("patient-1", labTestForm(overrides, files))).toEqual({
				status: "failed",
				error,
			});
			expect(database.labTests).toEqual([]);
			expect(database.files).toEqual([]);
			expect(disk.files.size).toBe(0);
		},
	);

	test("rejects a report that is not a PDF, PNG or JPG without storing any file", async () => {
		const notes = new File(["lab notes"], "notes.docx", {
			type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
		});

		expect(
			await createPatientLabTestAction(
				"patient-1",
				labTestForm(completedLabTest, [cbcReport, notes]),
			),
		).toEqual({ status: "failed", error: "Files must be PDF, PNG or JPG." });
		expect(database.labTests).toEqual([]);
		expect(disk.files.size).toBe(0);
	});

	test("removes the stored reports and shows a plain message when the save fails", async () => {
		database.failWrites = true;
		vi.spyOn(console, "error").mockImplementation(() => {});

		expect(
			await createPatientLabTestAction("patient-1", labTestForm(completedLabTest, [cbcReport])),
		).toEqual({ status: "failed", error: "We couldn’t add this lab test. Please try again." });
		expect(disk.writes).toEqual([expect.stringContaining(path.join(labTestFolders, "LAB-"))]);
		expect(disk.files.size).toBe(0);
		expect(updateTagMock).not.toHaveBeenCalled();
	});

	test("asks a signed-out user to sign in again without saving", async () => {
		getSessionDataMock.mockResolvedValue(null);

		expect(
			await createPatientLabTestAction("patient-1", labTestForm(completedLabTest, [cbcReport])),
		).toEqual({ status: "unauthorized", error: "You must be signed in to add lab tests." });
		expect(database.labTests).toEqual([]);
		expect(disk.files.size).toBe(0);
	});

	test.each([
		{
			scenario: "their email is unverified",
			setup: () =>
				getSessionDataMock.mockResolvedValue({
					user: { id: "member-1", name: "Ada Obi", emailVerified: false },
				}),
			error: "Verify your email before adding lab tests.",
		},
		{
			scenario: "their hospital is unverified",
			setup: () => getOrganizationIdMock.mockResolvedValue(null),
			error: "Your hospital must be verified before you can add lab tests.",
		},
		{
			scenario: "the patient belongs to another hospital",
			setup: () => {
				database.patients = [];
			},
			error: "Patient could not be found.",
		},
		{
			scenario: "the encounter belongs to another patient",
			setup: () => {
				database.encounters = [];
			},
			error: "This encounter could not be found for the patient.",
		},
	])("cannot add a lab test when $scenario", async ({ setup, error }) => {
		setup();

		expect(
			await createPatientLabTestAction(
				"patient-1",
				labTestForm({ ...completedLabTest, encounterId: "ENC-1" }, [cbcReport]),
			),
		).toEqual({ status: "failed", error });
		expect(database.labTests).toEqual([]);
		expect(database.files).toEqual([]);
		expect(disk.files.size).toBe(0);
	});
});
